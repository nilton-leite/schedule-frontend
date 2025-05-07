import React from 'react';
import './LoaderText.css'; // Importa o CSS que vamos criar


const Loader = () => {
  return (
    <React.Fragment>
       <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        color: "#052248"
      }}>
        Carregando...<span className="dots">...</span>
      </div>
    </React.Fragment>
  );
};

export default Loader;
