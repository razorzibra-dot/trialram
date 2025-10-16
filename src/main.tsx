import './polyfills';
import './buffer-polyfill';
import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import './App.css'

// Import both apps for easy switching
import App from './App'
import ModularApp from './modules/App'

// Use modular app by default, but keep old app available
const AppToRender = ModularApp;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppToRender />
  </React.StrictMode>,
)