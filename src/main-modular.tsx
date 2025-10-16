/**
 * New Modular Main Entry Point
 * Entry point for the new modular architecture
 */

import './polyfills';
import './buffer-polyfill';
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './App.css';
import ModularApp from './modules/App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ModularApp />
  </React.StrictMode>,
);
