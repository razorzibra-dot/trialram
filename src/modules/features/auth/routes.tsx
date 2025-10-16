/**
 * Auth Module Routes
 * Defines routing for authentication-related pages
 */

import { lazy } from 'react';

// Lazy load auth pages
const LoginPage = lazy(() => import('./views/LoginPage').then(m => ({ default: m.LoginPage })));
const NotFoundPage = lazy(() => import('./views/NotFoundPage').then(m => ({ default: m.NotFoundPage })));
const DemoAccountsPage = lazy(() => import('./views/DemoAccountsPage').then(m => ({ default: m.DemoAccountsPage })));

export const authRoutes = [
  {
    path: 'login',
    element: <LoginPage />
  },
  {
    path: 'demo-accounts',
    element: <DemoAccountsPage />
  },
  {
    path: '404',
    element: <NotFoundPage />
  }
];
