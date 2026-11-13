import { ACCOUNT_INITIALISE, LOGIN, LOGOUT, USER_REFRESH } from './actions';

const accountReducer = (state, action) => {
  switch (action.type) {
    case ACCOUNT_INITIALISE: {
      const { isLoggedIn, user } = action.payload;
      return {
        ...state,
        isLoggedIn,
        isInitialised: true,
        user
      };
    }
    case LOGIN: {
      const { user } = action.payload;
      return {
        ...state,
        isLoggedIn: true,
        user
      };
    }
    case USER_REFRESH: {
      // Dados do usuário relidos da API (ex.: perfil alterado), sem mexer no login.
      const { user } = action.payload;
      return {
        ...state,
        user
      };
    }
    case LOGOUT: {
      return {
        ...state,
        isLoggedIn: false,
        user: null
      };
    }
    default: {
      return { ...state };
    }
  }
};

export default accountReducer;
