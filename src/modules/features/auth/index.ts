/**
 * Auth Module
 * Handles authentication, login, and demo accounts
 */

export { LoginPage } from './views/LoginPage';
export { NotFoundPage } from './views/NotFoundPage';
export { DemoAccountsPage } from './views/DemoAccountsPage';

export const authModule = {
  name: 'auth',
  path: '/auth',
  services: [],
  dependencies: ['core'],
  routes: [
    {
      path: '/login',
      element: 'LoginPage',
      lazy: true
    },
    {
      path: '/demo-accounts',
      element: 'DemoAccountsPage',
      lazy: true
    },
    {
      path: '/404',
      element: 'NotFoundPage',
      lazy: true
    }
  ],
  
  async initialize() {
    // Auth module initialization
    console.log('Auth module initialized');
  },
};
