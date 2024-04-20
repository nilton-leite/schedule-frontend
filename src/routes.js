import React, { Suspense, Fragment, lazy } from 'react';
import { Switch, Redirect, Route } from 'react-router-dom';

import Loader from './components/Loader/Loader';
import AdminLayout from './layouts/AdminLayout';

import GuestGuard from './components/Auth/GuestGuard';
import AuthGuard from './components/Auth/AuthGuard';

import { BASE_URL } from './config/constant';

export const renderRoutes = (routes = []) => (
  <Suspense fallback={<Loader />}>
    <Switch>
      {routes.map((route, i) => {
        const Guard = route.guard || Fragment;
        const Layout = route.layout || Fragment;
        const Component = route.component;

        return (
          <Route
            key={i}
            path={route.path}
            exact={route.exact}
            render={(props) => (
              <Guard>
                <Layout>{route.routes ? renderRoutes(route.routes) : <Component {...props} />}</Layout>
              </Guard>
            )}
          />
        );
      })}
    </Switch>
  </Suspense>
);

const routes = [
  {
    exact: true,
    guard: GuestGuard,
    path: '/',
    component: lazy(() => import('./views/auth/signin/SignIn'))
  },
  {
    exact: true,
    guard: GuestGuard,
    path: '/confirmacao',
    component: lazy(() => import('./views/confirmation/Confirmation'))
  },
  {
    exact: true,
    path: '/404',
    component: lazy(() => import('./views/errors/NotFound404'))
  },
  {
    path: '*',
    layout: AdminLayout,
    guard: AuthGuard,
    routes: [
      {
        exact: true,
        path: '/medicos',
        component: lazy(() => import('./views/doctors/Doctors'))
      },
      {
        exact: true,
        path: '/pacientes',
        component: lazy(() => import('./views/patients/Patients'))
      },
      {
        exact: true,
        path: '/parametros/especialidades',
        component: lazy(() => import('./views/parameters/Specialties'))
      },
      {
        exact: true,
        path: '/consultas',
        component: lazy(() => import('./views/schedule/Schedule'))
      },
      {
        exact: true,
        path: '/parametros/planos',
        component: lazy(() => import('./views/parameters/HI'))
      },
      {
        exact: true,
        path: '/parametros/usuarios',
        component: lazy(() => import('./views/parameters/Users'))
      },
      {
        exact: true,
        path: '/agenda',
        component: lazy(() => import('./views/extensions/FullEventCalendar'))
      },
      {
        path: '*',
        exact: true,
        component: () => <Redirect to={BASE_URL} />
      }
    ]
  }
];

export default routes;
