import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Nav from './Nav.jsx';
import Back from './Back.jsx';
import { accountId, api, initTheme, setTokens, signOut } from './lib.js';

// Website settings: password, appearance, help, sign out.
function PasswordCard() {
  const [has, setHas] = useState(null);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    api('/me').then((a) => setHas(!!a.hasPassword)).catch(() => setHas(false));
  }, []);
  const save = async () => {
    if (next.length < 8) { alert('Use 8 or more characters.'); return; }
    setBusy(true);
    try {
      const r = await api('/me/password', {
        method: 'POST',
        body: JSON.stringify({ password: next, ...(has ? { current } : {}) }),
      });
      setTokens(r.token, r.refreshToken);
      setHas(r.account.hasPassword);
      setCurrent('');
      setNext('');
      alert('Saved — sign-in will ask for it after the code.');
    } catch (e) {
      alert(String(e.message).includes('401') ? 'Current password is wrong.' : 'Could not save — retry.');
    } finally { setBusy(false); }
  };
  if (has === null) return null;
  return (
    <div className="card" style={{ marginTop: 8 }}>
      <h3 style={{ marginTop: 0 }}>Password</h3>
      <p style={{ fontSize: 13, color: 'var(--color-body-text)', marginTop: 0 }}>
        {has ? 'On — sign-in asks for it after the code.' : 'Off — code only. Add one as a 2nd step.'}
      </p>
      {has ? (
        <input className="input" type="password" placeholder="Current password" value={current}
          onChange={(e) => setCurrent(e.target.value)} style={{ width: '100%' }} />
      ) : null}
      <input className="input" type="password" placeholder="New password (8+ characters)" value={next}
        onChange={(e) => setNext(e.target.value)} style={{ width: '100%', marginTop: 8 }} />
      <div style={{ marginTop: 8 }}>
        <button className="btn" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save password'}</button>
      </div>
    </div>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const [mode, setMode] = useState(localStorage.getItem('theme') || 'system');
  const pick = (m) => { localStorage.setItem('theme', m); setMode(m); initTheme(); };
  return (
    <div>
      <Nav />
      <div className="page" style={{ maxWidth: 720 }}>
        <Back />
        <h1>Settings</h1>
        {accountId() ? <PasswordCard /> : null}
        <div className="card" style={{ marginTop: 8 }}>
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
        <div className="card" style={{ marginTop: 8 }}>
          <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => signOut(navigate)}>Sign out</button>
        </div>
        <p style={{ textAlign: 'center', color: 'var(--color-body-text)', fontSize: 12 }}>New Era · MVP beta · v1.0.0</p>
      </div>
    </div>
  );
}
