import './polyfills';
import './buffer-polyfill';
import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import './App.css'

// Import extension error handler to suppress Chrome extension warnings
import { initializeAllExtensionHandlers } from '@/utils/extensionErrorHandler'

// Import both apps for easy switching
import App from './App'
import ModularApp from './modules/App'

// Initialize extension error handlers before app loads
// This prevents "Unchecked runtime.lastError" warnings from browser extensions
const cleanupConsoleFilter = initializeAllExtensionHandlers();

// Use modular app by default, but keep old app available
const AppToRender = ModularApp;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppToRender />
  </React.StrictMode>,
)

// Cleanup console filter on page unload if needed
if (cleanupConsoleFilter) {
  window.addEventListener('beforeunload', () => {
    cleanupConsoleFilter();
  });
}