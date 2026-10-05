import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { API } from './lib.js';

// Step 2 UI: code sign-in + explicit country (ACC-1..ACC-2). Password
// accounts get a 2nd step with forgot/reset, mirroring the app.
export default function Auth() {
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
  const contactBody = () => (to.includes('@') ? { email: to.trim() } : { phone: to.trim() });

  const done = (j) => {
    localStorage.setItem('accountId', j.account.id);
    navigate(next, { replace: true });
  };

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

  return (
    <div className="card" style={{ margin: 24, maxWidth: 420 }}>
      <h2>Sign in</h2>
      {stage === 'contact' && (
        <>
          <input className="input" placeholder="email or phone" value={to} onChange={(e) => setTo(e.target.value)} style={{ width: '100%' }} />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button className="btn" onClick={request}>Send code</button>
          </div>
          <label>Country (explicit, never inferred)</label>
          <select value={country} onChange={(e) => setCountry(e.target.value)} style={{ width: '100%', height: 48 }}>
            <option value="NG">Nigeria</option>
            <option value="GH">Ghana</option>
            <option value="KE">Kenya</option>
          </select>
        </>
      )}
      {stage === 'code' && (
        <>
          <p style={{ color: 'var(--color-body-text)' }}>Code sent to {to.trim()}.</p>
          <input className="input" placeholder="6-digit code" value={code} onChange={(e) => setCode(e.target.value)} style={{ width: '100%' }} />
          <div style={{ marginTop: 8 }}><button className="btn" onClick={verify}>Verify</button></div>
        </>
      )}
      {stage === 'password' && (
        <>
          <p style={{ color: 'var(--color-body-text)' }}>This account has a password.</p>
          <input className="input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%' }} />
          <div style={{ marginTop: 8 }}><button className="btn" onClick={submitPassword}>Sign in</button></div>
          <p><button className="btn btn-secondary" onClick={forgot}>Forgot password? Reset with a code</button></p>
        </>
      )}
      {stage === 'reset' && (
        <>
          <input className="input" placeholder="Reset code" value={resetCode} onChange={(e) => setResetCode(e.target.value)} style={{ width: '100%' }} />
          <input className="input" type="password" placeholder="New password (8+ characters)" value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)} style={{ width: '100%', marginTop: 8 }} />
          <div style={{ marginTop: 8 }}><button className="btn" onClick={submitReset}>Reset & sign in</button></div>
        </>
      )}
    </div>
  );
}
