import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';

import { JWTProvider } from './contexts/JWTContext';
import { LoadingProvider } from './contexts/LoadingContext';
import { useAxiosLoader } from './utils/intercepts';
import FloatingButton from './views/floatingBtn/floatingButton';

import routes, { renderRoutes } from './routes';
import { BASENAME } from './config/constant';

const App = () => {
  useAxiosLoader();
  return (
    <LoadingProvider>
      <React.Fragment>
        <Router basename={BASENAME}>
          <JWTProvider>{renderRoutes(routes)}</JWTProvider>
          {localStorage.getItem('access_token') ? <FloatingButton /> : ''}
        </Router>
      </React.Fragment>
    </LoadingProvider>
  );
};

export default App;
