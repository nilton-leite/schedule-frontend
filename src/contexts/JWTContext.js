import React, { createContext, useEffect, useReducer } from 'react';

import { ACCOUNT_INITIALISE, LOGIN, LOGOUT } from '../store/actions';
import axios from 'axios';
import accountReducer from '../store/accountReducer';
import Loader from '../components/Loader/Loader';
import { ENDPOINT } from '../config/constant';

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
  logout: () => Promise.resolve()
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

  useEffect(() => {
    const init = async () => {
      try {
        const access_token = window.localStorage.getItem('access_token');

        if (access_token) {
          const usernew = await axios.get(`${ENDPOINT.api}users/${window.localStorage.getItem('userId')}`, ENDPOINT.config);
          const updatedUser = usernew.data.response;
          await setSession(access_token, updatedUser);

          dispatch({
            type: ACCOUNT_INITIALISE,
            payload: {
              isLoggedIn: true,
              updatedUser
            }
          });
        } else {
          dispatch({
            type: ACCOUNT_INITIALISE,
            payload: {
              isLoggedIn: false,
              updatedUser: null
            }
          });
        }
      } catch (err) {
        console.error(err);
        dispatch({
          type: ACCOUNT_INITIALISE,
          payload: {
            isLoggedIn: false,
            updatedUser: null
          }
        });
      }
    };

    init();
  }, []);

  // if (!state.isInitialised) {
  //   return <Loader />;
  // }

  return <JWTContext.Provider value={{ ...state, login, logout }}>{children}</JWTContext.Provider>;
};

export default JWTContext;
