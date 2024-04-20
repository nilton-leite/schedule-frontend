import React from 'react';
import { Card } from 'react-bootstrap';

import Breadcrumb from '../../../layouts/AdminLayout/Breadcrumb';
import Brand from '../../../assets/images/brand_blue.png';
import Login from './JWTLogin';

const Signin1 = () => {
  return (
    <React.Fragment>
      <Breadcrumb />
      <div className="auth-wrapper">
        <div className="auth-content">
          <div className="auth-bg">
            <span className="r" />
            <span className="r s" />
            <span className="r s" />
            <span className="r" />
          </div>
          <Card className="borderless text-center">
            <Card.Body>
              <div className="mb-4">
                <img src={Brand} alt="Wambier" />
                <hr className="mt-4" />
                <i className="feather icon-unlock auth-icon" />
              </div>
              <Login />
            </Card.Body>
          </Card>
        </div>
      </div>
    </React.Fragment>
  );
};

export default Signin1;
