import React, { useState } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// Step 2 UI: code sign-in + explicit country + mode switch (ACC-1..ACC-3)
export default function Auth() {
  const [to, setTo] = useState('');
  const [code, setCode] = useState('');
  const [country, setCountry] = useState('NG');
  const [mode, setMode] = useState(localStorage.getItem('mode') || 'customer');

  const request = async () => {
    const body = to.includes('@') ? { email: to } : { phone: to };
    const r = await fetch(`${API}/auth/request-code`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    const j = await r.json().catch(() => ({}));
    alert(r.ok ? (j.devCode ? `Your code: ${j.devCode}` : 'Code sent (check the API terminal)') : 'Rate-limited, wait a minute');
  };

  const verify = async () => {
    const body = to.includes('@')
      ? { email: to, code, country }
      : { phone: to, code, country };
    const r = await fetch(`${API}/auth/verify`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    const j = await r.json();
    if (j.token) {
      localStorage.setItem('accountId', j.account.id);
      localStorage.setItem('mode', mode);
      alert(`Verified as ${j.account.id} (${country}, ${mode})`);
    } else alert(j.error);
  };

  return (
    <div className="card" style={{ margin: 24, maxWidth: 420 }}>
      <h2>Sign in</h2>
      <input placeholder="email or phone" value={to} onChange={(e) => setTo(e.target.value)} style={{ width: '100%', height: 48 }} />
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button className="btn" onClick={request}>Send code</button>
      </div>
      <input placeholder="code" value={code} onChange={(e) => setCode(e.target.value)} style={{ width: '100%', height: 48, marginTop: 8 }} />
      <label>Country (explicit, never inferred)</label>
      <select value={country} onChange={(e) => setCountry(e.target.value)} style={{ width: '100%', height: 48 }}>
        <option value="NG">Nigeria</option>
        <option value="GH">Ghana</option>
        <option value="KE">Kenya</option>
      </select>
      <label>Mode</label>
      <select value={mode} onChange={(e) => { setMode(e.target.value); localStorage.setItem('mode', e.target.value); }} style={{ width: '100%', height: 48 }}>
        <option value="customer">Customer</option>
        <option value="business">Business</option>
      </select>
      <div style={{ marginTop: 8 }}><button className="btn" onClick={verify}>Verify</button></div>
    </div>
  );
}
