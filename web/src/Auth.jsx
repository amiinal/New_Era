import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Nav from './Nav.jsx';
import { API } from './lib.js';
import { bgForSite } from './lib.js';
import { COUNTRIES } from './countries.js';

// Code sign-in + explicit country, mirroring the app: fresh visitors see
// Sign up first, returning visitors see Sign in. Password accounts get a
// 2nd step with forgot/reset.
export default function Auth() {
  const [tab, setTab] = useState(localStorage.getItem('returning') ? 'signin' : 'signup');
  const [to, setTo] = useState('');
  const [code, setCode] = useState('');
  const [country, setCountry] = useState('NG');
  const [stage, setStage] = useState('contact');
  const [pendingId, setPendingId] = useState('');
  const [password, setPassword] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const next = params.get('next') || '/discover';
  const fresh = tab === 'signup';
  const contactBody = () => (to.includes('@') ? { email: to.trim() } : { phone: to.trim() });

  const done = (j) => {
    localStorage.setItem('accountId', j.account.id);
    localStorage.setItem('returning', '1');
    localStorage.setItem('mode', j.account.lastMode || 'customer');
    navigate(next, { replace: true });
  };
  const startOver = () => { setCode(''); setStage('contact'); };

  const request = async () => {
    try {
      const r = await fetch(`${API}/auth/request-code`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify(contactBody()),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { alert('Rate-limited, wait a minute'); return; }
      setStage('code');
      alert(j.devCode ? `Your code: ${j.devCode}` : 'Code sent (check the API terminal)');
    } catch {
      alert('Could not reach the API — is terminal 1 (node src/index.js) still running?');
    }
  };

  const verify = async () => {
    const r = await fetch(`${API}/auth/verify`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...contactBody(), code, country }),
    });
    const j = await r.json().catch(() => ({}));
    if (j.token) done(j);
    else if (j.needsPassword) { setPendingId(j.accountId); setStage('password'); }
    else alert(j.error || 'Invalid or expired code');
  };

  const submitPassword = async () => {
    const r = await fetch(`${API}/auth/password`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ accountId: pendingId, password }),
    });
    const j = await r.json().catch(() => ({}));
    if (j.token) done(j);
    else alert('Wrong password — try again, or reset it below.');
  };

  const forgot = async () => {
    const r = await fetch(`${API}/auth/password/forgot`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify(contactBody()),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { alert('Could not send — retry in a minute.'); return; }
    setStage('reset');
    alert(j.devCode ? `Your code: ${j.devCode}` : 'Reset code sent.');
  };

  const submitReset = async () => {
    if (newPassword.length < 8) { alert('Use 8 or more characters.'); return; }
    const r = await fetch(`${API}/auth/password/reset`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...contactBody(), code: resetCode, password: newPassword }),
    });
    const j = await r.json().catch(() => ({}));
    if (j.token) done(j);
    else alert('Invalid or expired code — request a fresh one.');
  };

  const title = stage === 'password' ? 'Enter password'
    : stage === 'reset' ? 'Reset password'
    : stage === 'code' ? 'Enter code'
    : fresh ? 'Create Account' : 'Welcome back';

  return (
    <div>
      <Nav />
      <div className="auth-bg" style={{ backgroundImage: `url(${bgForSite()})` }}>
      <div className="auth-wrap">
      <div className="card auth-card">
        <h2 style={{ textAlign: 'center', marginBottom: 4 }}>{title}</h2>
        <p style={{ color: 'var(--color-body-text)', textAlign: 'center', fontSize: 14 }}>
          {stage === 'code' ? `We sent a 6-digit code to ${to.trim()}.`
            : stage === 'password' ? 'This account has a password — enter it to finish signing in.'
            : stage === 'reset' ? `We sent a reset code to ${to.trim()}.`
            : fresh ? 'Join New Era to list your business and chat with customers.'
            : 'Sign in to your New Era account.'}
        </p>
        {stage === 'contact' && (
          <>
            <input className="input" placeholder="email or phone" value={to} onChange={(e) => setTo(e.target.value)} style={{ width: '100%' }} />
            <label className="lbl">Country (explicit, never inferred)</label>
            <select className="input" value={country} onChange={(e) => setCountry(e.target.value)} style={{ width: '100%' }}>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
            <div style={{ marginTop: 8 }}><button className="btn" style={{ width: '100%' }} onClick={request}>Send code</button></div>
            <p style={{ textAlign: 'center', fontSize: 14 }}>
              {fresh ? 'Already have an account? ' : "Don't have an account? "}
              <button className="linklike" onClick={() => { setTab(fresh ? 'signin' : 'signup'); startOver(); }}>
                {fresh ? 'Sign in here' : 'Sign up'}
              </button>
            </p>
          </>
        )}
        {stage === 'code' && (
          <>
            <input className="input" placeholder="6-digit code" value={code} onChange={(e) => setCode(e.target.value)} style={{ width: '100%' }} />
            <div style={{ marginTop: 8 }}><button className="btn" style={{ width: '100%' }} onClick={verify}>Verify</button></div>
            <p style={{ textAlign: 'center', fontSize: 14 }}>
              Wrong address? <button className="linklike" onClick={startOver}>Start over</button>
            </p>
          </>
        )}
        {stage === 'password' && (
          <>
            <input className="input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%' }} />
            <div style={{ marginTop: 8 }}><button className="btn" style={{ width: '100%' }} onClick={submitPassword}>Sign in</button></div>
            <p style={{ textAlign: 'center', fontSize: 14 }}>
              Forgot password? <button className="linklike" onClick={forgot}>Reset with a code</button>
            </p>
          </>
        )}
        {stage === 'reset' && (
          <>
            <input className="input" placeholder="Reset code" value={resetCode} onChange={(e) => setResetCode(e.target.value)} style={{ width: '100%' }} />
            <input className="input" type="password" placeholder="New password (8+ characters)" value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)} style={{ width: '100%', marginTop: 8 }} />
            <div style={{ marginTop: 8 }}><button className="btn" style={{ width: '100%' }} onClick={submitReset}>Reset & sign in</button></div>
          </>
        )}
      </div>
      </div>
      </div>
    </div>
  );
}
