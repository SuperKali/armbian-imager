import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Disable context menu in production
if (import.meta.env.PROD) {
  document.addEventListener('contextmenu', (e) => e.preventDefault());
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
