import React from 'react';
import { Card } from 'react-bootstrap';
import Brand from '../../assets/images/brand_blue.png';

// Moldura das páginas públicas de confirmação (o paciente abre pelo link do WhatsApp, sem login).
const ConfirmationLayout = ({ children }) => (
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
          <img src={Brand} alt="Clínica Wambier" style={{ maxWidth: '100%' }} />
          <hr className="mt-4" />
          {children}
        </Card.Body>
      </Card>
    </div>
  </div>
);

export default ConfirmationLayout;
