import React from 'react';
import { Link } from 'react-router-dom';
import Nav from './Nav.jsx';
import Footer from './Footer.jsx';

export default function Install() {
  const apk = import.meta.env.VITE_APK_URL || '#';
  return (
    <div>
      <Nav />
      <div className="page" style={{ maxWidth: 720 }}>
        <h1>Take New Era with you</h1>
        <p style={{ color: 'var(--color-body-text)' }}>
          New Era works right from your browser. You can also install it on your
          phone and use it like an app.
        </p>
        <div className="card" style={{ marginBottom: 8 }}>
          <h3 style={{ marginTop: 0 }}>iPhone</h3>
          <p style={{ color: 'var(--color-body-text)' }}>Install New Era</p>
          <ol style={{ color: 'var(--color-body-text)', fontSize: 14 }}>
            <li>Open New Era in Safari.</li>
            <li>Tap the Share button.</li>
            <li>Select Add to Home Screen.</li>
            <li>Tap Add.</li>
          </ol>
        </div>
        <div className="card" style={{ marginBottom: 8 }}>
          <h3 style={{ marginTop: 0 }}>Android</h3>
          <p style={{ color: 'var(--color-body-text)' }}>Download New Era directly to your Android phone.</p>
          <a href={apk} className="btn">Download APK</a>
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Browser</h3>
          <p style={{ color: 'var(--color-body-text)' }}>
            You can always use New Era directly from your browser.
            No installation is required to discover businesses and explore storefronts.
          </p>
          <Link to="/discover" className="btn btn-secondary">Open New Era</Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
