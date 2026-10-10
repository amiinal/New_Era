import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { Boundary, initSentry } from './sentry.js';

initSentry();

ReactDOM.createRoot(document.getElementById('root')).render(
  <Boundary fallback={
    <div className="page">
      <div className="card" style={{ maxWidth: 480, margin: '48px auto', textAlign: 'center' }}>
        <h2>Something broke</h2>
        <p style={{ color: 'var(--color-body-text)' }}>Reload the page — the team has been notified.</p>
      </div>
    </div>
  }>
    <App />
  </Boundary>,
);
