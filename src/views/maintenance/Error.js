import React from 'react';
import { NavLink } from 'react-router-dom';
import Breadcrumb from '../../layouts/AdminLayout/Breadcrumb';

const Error = () => {
  return (
    <React.Fragment>
      <Breadcrumb />
      <div className="auth-wrapper offline">
        <div className="text-center">
          <h1 className="mb-4">ERROR 404</h1>
          <h5 className="text-muted mb-4">Página não existente.</h5>
          <NavLink to="/" className="btn btn-primary mb-4">
            <i className="feather icon-home" />
            Voltar
          </NavLink>
        </div>
      </div>
    </React.Fragment>
  );
};

export default Error;
