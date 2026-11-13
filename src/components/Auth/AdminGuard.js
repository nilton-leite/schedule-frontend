import React from 'react';
import { Redirect } from 'react-router-dom';

import useAuth from '../../hooks/useAuth';
import { isAdmin } from '../../config/roles';
import { BASE_URL } from '../../config/constant';

// Telas só de administrador (Parâmetros). A API também bloqueia (403); aqui só evita abrir uma tela que não funcionaria.
const AdminGuard = ({ children }) => {
  const { isInitialised, user } = useAuth();

  if (!isInitialised) {
    return null;
  }
  if (!isAdmin(user)) {
    return <Redirect to={BASE_URL} />;
  }
  return <React.Fragment>{children}</React.Fragment>;
};

export default AdminGuard;
