import React from 'react';
import { Redirect } from 'react-router-dom';

import useAuth from '../../hooks/useAuth';
import Loader from '../Loader/Loader';

const AuthGuard = ({ children }) => {
  const { isLoggedIn, isInitialised } = useAuth();

  // Espera a sessão ser lida do navegador antes de decidir. Antes, no primeiro instante "não logado"
  // mandava para o login, e de lá para a agenda: F5 ou link direto em qualquer tela voltava à agenda (QA-014).
  if (!isInitialised) {
    return <Loader />;
  }

  if (!isLoggedIn) {
    return <Redirect to="/" />;
  }

  return <React.Fragment>{children}</React.Fragment>;
};

export default AuthGuard;
