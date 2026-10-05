import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Nav from './Nav.jsx';
import { initTheme, signOut } from './lib.js';

// Website settings: appearance, help, sign out. Mirrors the app Settings.
export default function Settings() {
  const navigate = useNavigate();
  const [mode, setMode] = useState(localStorage.getItem('theme') || 'system');
  const pick = (m) => { localStorage.setItem('theme', m); setMode(m); initTheme(); };
  return (
    <div>
      <Nav />
      <div className="page" style={{ maxWidth: 720 }}>
        <h1>Settings</h1>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Appearance</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['system', 'light', 'dark']).map((m) => (
              <button key={m} className={`btn ${mode === m ? '' : 'btn-secondary'}`} onClick={() => pick(m)}>
                {m[0].toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="card" style={{ marginTop: 8 }}>
          <h3 style={{ marginTop: 0 }}>Help</h3>
          <Link to="/faq" className="btn btn-secondary">Help center & FAQ</Link>
          <span style={{ width: 8, display: 'inline-block' }} />
          <Link to="/support" className="btn btn-secondary">Contact support</Link>
        </div>
        <div style={{ marginTop: 16 }}>
          <button className="btn btn-secondary" onClick={() => signOut(navigate)}>Sign out</button>
        </div>
        <p style={{ textAlign: 'center', color: 'var(--color-body-text)', fontSize: 12 }}>New Era · MVP beta · v1.0.0</p>
      </div>
    </div>
  );
}
