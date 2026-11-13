import React, { createContext, useCallback, useEffect, useReducer } from 'react';

import { ACCOUNT_INITIALISE, LOGIN, LOGOUT, USER_REFRESH } from '../store/actions';
import axios from 'axios';
import accountReducer from '../store/accountReducer';
import Loader from '../components/Loader/Loader';
import { ENDPOINT } from '../config/constant';
import { installEncaixeInterceptor } from '../config/encaixe';

const initialState = {
  isLoggedIn: false,
  isInitialised: false,
  user: null
};

const setSession = (access_token, userNow) => {
  const currentToken = localStorage.getItem('access_token');

  if (access_token !== currentToken) {
    if (access_token) {
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('userId', userNow.userId);
      localStorage.setItem('name', userNow.name);
      axios.defaults.headers.common.Authorization = `Bearer ${access_token}`;

      window.location.reload();
    } else {
      localStorage.removeItem('access_token');
      localStorage.removeItem('userId');
      localStorage.removeItem('name');
      delete axios.defaults.headers.common.Authorization;
    }
  }
};

const JWTContext = createContext({
  ...initialState,
  login: () => Promise.resolve(),
  logout: () => Promise.resolve(),
  refreshUser: () => Promise.resolve()
});

export const JWTProvider = ({ children }) => {
  const [state, dispatch] = useReducer(accountReducer, initialState);
  const login = async (document, password) => {
    const response = await axios.post(`${ENDPOINT.api}auth`, { username: document, password: password });

    const { access_token, user } = response.data;

    await setSession(access_token, user);

    dispatch({
      type: LOGIN,
      payload: {
        user
      }
    });
  };

  const logout = () => {
    setSession(null);
    dispatch({ type: LOGOUT });
  };

  // Relê o usuário logado na API (perfil atualizado). O menu e as telas de admin se ajustam sem recarregar a página.
  const refreshUser = useCallback(async () => {
    const userId = window.localStorage.getItem('userId');
    if (!userId || !window.localStorage.getItem('access_token')) return;
    try {
      const response = await axios.get(`${ENDPOINT.api}users/${userId}`, ENDPOINT.config);
      dispatch({ type: USER_REFRESH, payload: { user: response.data.response } });
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const access_token = window.localStorage.getItem('access_token');

        if (access_token) {
          const usernew = await axios.get(`${ENDPOINT.api}users/${window.localStorage.getItem('userId')}`, ENDPOINT.config);
          const updatedUser = usernew.data.response;
          await setSession(access_token, updatedUser);

          // O reducer lê "user" (antes ia como "updatedUser" e o usuário ficava vazio após recarregar a página).
          // O perfil (role) vem daqui, relido da API a cada carregamento.
          dispatch({
            type: ACCOUNT_INITIALISE,
            payload: {
              isLoggedIn: true,
              user: updatedUser
            }
          });
        } else {
          dispatch({
            type: ACCOUNT_INITIALISE,
            payload: {
              isLoggedIn: false,
              user: null
            }
          });
        }
      } catch (err) {
        console.error(err);
        // Token inválido ou expirado: limpa a sessão guardada para voltar ao login.
        setSession(null);
        dispatch({
          type: ACCOUNT_INITIALISE,
          payload: {
            isLoggedIn: false,
            user: null
          }
        });
      }
    };

    init();
  }, []);

  // Quando a API responde 401 (token expirado ou inválido), encerra a sessão e volta ao login.
  // O token agora expira (JWT_EXPIRES_IN na API); antes valia para sempre.
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        const status = error && error.response && error.response.status;
        const url = (error && error.config && error.config.url) || '';
        const isLoginRequest = url.endsWith('/auth') || url.endsWith('auth');
        if (status === 401 && !isLoginRequest && window.localStorage.getItem('access_token')) {
          setSession(null);
          dispatch({ type: LOGOUT });
        }
        // 403 = o perfil não permite a ação (ex.: outro admin mudou o perfil deste usuário): relê o perfil
        // para o menu deixar de oferecer o que não é mais permitido.
        if (status === 403 && !url.includes('/users/')) {
          refreshUser();
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, [refreshUser]);

  // Pergunta de encaixe quando o horário do médico está cheio (QA-004).
  useEffect(() => {
    const id = installEncaixeInterceptor();
    return () => axios.interceptors.response.eject(id);
  }, []);

  // if (!state.isInitialised) {
  //   return <Loader />;
  // }

  return <JWTContext.Provider value={{ ...state, login, logout, refreshUser }}>{children}</JWTContext.Provider>;
};

export default JWTContext;
