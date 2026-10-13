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

// Change email: code goes to the NEW address; the old one gets a notice.
function EmailCard() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const send = async () => {
    setMsg('');
    if (!/.+@.+\..+/.test(email.trim())) { setMsg('Enter a valid email address.'); return; }
    setBusy(true);
    try {
      const r = await api('/me/email/request', {
        method: 'POST', body: JSON.stringify({ email: email.trim() }),
      });
      setSent(true);
      setMsg(r.devCode ? `Dev code: ${r.devCode}` : 'Code sent — check your new inbox.');
    } catch (e) {
      setMsg(String(e.message).includes('409') ? 'That email is already in use.' : 'Could not send — retry.');
    } finally { setBusy(false); }
  };
  const confirm = async () => {
    setMsg('');
    setBusy(true);
    try {
      await api('/me/email/confirm', {
        method: 'POST', body: JSON.stringify({ email: email.trim(), code }),
      });
      setMsg('Email changed — future codes go to the new address. Your old address got a notice.');
      setEmail('');
      setCode('');
      setSent(false);
    } catch {
      setMsg('Invalid or expired code — send a fresh one.');
    } finally { setBusy(false); }
  };
  return (
    <div className="card" style={{ marginTop: 8 }}>
      <h3 style={{ marginTop: 0 }}>Email address</h3>
      <p style={{ fontSize: 13, color: 'var(--color-body-text)', marginTop: 0 }}>
        Codes go here. Changing it notifies the old address too.
      </p>
      <input className="input" placeholder="New email address" value={email}
        onChange={(e) => setEmail(e.target.value)} style={{ width: '100%' }} />
      {!sent ? (
        <div style={{ marginTop: 8 }}>
          <button className="btn" onClick={send} disabled={busy}>{busy ? 'Sending…' : 'Send code'}</button>
        </div>
      ) : (
        <>
          <input className="input" placeholder="6-digit code" value={code}
            onChange={(e) => setCode(e.target.value)} style={{ width: '100%', marginTop: 8 }} />
          <div style={{ marginTop: 8 }}>
            <button className="btn" onClick={confirm} disabled={busy}>{busy ? 'Saving…' : 'Confirm new email'}</button>
          </div>
        </>
      )}
      {msg ? <p style={{ fontSize: 13, color: 'var(--color-body-text)', marginBottom: 0 }}>{msg}</p> : null}
    </div>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const [bye, setBye] = useState(false);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState(localStorage.getItem('theme') || 'system');
  const pick = (m) => { localStorage.setItem('theme', m); setMode(m); initTheme(); };
  return (
    <div>
      <Nav />
      <div className="page" style={{ maxWidth: 720 }}>
        <Back />
        <h1>Settings</h1>
        {accountId() ? <PasswordCard /> : null}
        {accountId() ? <EmailCard /> : null}
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
        {accountId() ? (
        <div className="card" style={{ marginTop: 8 }}>
          <h3 style={{ marginTop: 0 }}>Take a break</h3>
          <p style={{ fontSize: 13, color: 'var(--color-body-text)', marginTop: 0 }}>
            Hibernating hides your customer profile — and your storefront if you have one —
            pauses chats, and signs every device out. Nothing is deleted — reopen anytime.
          </p>
          <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => setBye(true)}>Deactivate my account</button>
        </div>
        ) : null}
        {bye ? (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          }}>
            <div className="card" style={{ maxWidth: 420, width: '100%', textAlign: 'center' }}>
              <h2 style={{ marginTop: 0 }}>Hibernate your account?</h2>
              <p style={{ color: 'var(--color-body-text)', fontSize: 14 }}>
                Your customer profile and storefront (if you have one) hide today, and every
                device signs out. Nothing is deleted — reopen anytime. After 90 days
                hibernating, you can delete permanently.
              </p>
              <button className="btn" style={{ width: '100%' }} disabled={busy} onClick={async () => {
                setBusy(true);
                try {
                  await api('/me/deactivate', { method: 'POST' });
                  setBye(false);
                  signOut(navigate);
                } catch {
                  alert('Could not deactivate — retry.');
                } finally { setBusy(false); }
              }}>{busy ? 'Working…' : 'Yes, deactivate'}</button>
              <div style={{ height: 8 }} />
              <button className="btn btn-secondary" style={{ width: '100%' }} disabled={busy} onClick={() => setBye(false)}>Cancel</button>
            </div>
          </div>
        ) : null}
        <div className="card" style={{ marginTop: 8 }}>
          <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => signOut(navigate)}>Sign out</button>
        </div>
        <p style={{ textAlign: 'center', color: 'var(--color-body-text)', fontSize: 12 }}>New Era · MVP beta · v1.0.0</p>
      </div>
    </div>
  );
}
