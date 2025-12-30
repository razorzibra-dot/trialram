/**
 * Auth Module
 * Handles authentication, login, and demo accounts
 */

// Views are lazy-loaded; avoid static re-exports to preserve chunking

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
      path: '/register',
      element: 'RegistrationPage',
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
