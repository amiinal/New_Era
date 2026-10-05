import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Nav from './Nav.jsx';
import { accountId, api, getMode, setMode, signOut } from './lib.js';

// Your contact + tagline + mode, private to the account. Business view
// lists your storefronts (selling tools live in the app).
export default function Profile() {
  const navigate = useNavigate();
  const [acc, setAcc] = useState(null);
  const [tagline, setTagline] = useState('');
  const [mode, setModeState] = useState(getMode());
  const [biz, setBiz] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!accountId()) return;
    api('/me').then((a) => {
      setAcc(a);
      setTagline(a.tagline || '');
      setModeState(a.lastMode || getMode());
      localStorage.setItem('mode', a.lastMode || 'customer');
      if ((a.lastMode || 'customer') === 'business') {
        api('/me/businesses').then(setBiz).catch(() => setBiz([]));
      }
    }).catch(() => setAcc(false));
  }, []);

  if (!accountId()) {
    return (
      <div className="page">
        <div className="card" style={{ maxWidth: 480 }}>
          <h2>Sign in to see your profile</h2>
          <Link to="/auth?next=/profile" className="btn">Sign in</Link>
        </div>
      </div>
    );
  }
  if (acc === null) return <div className="page"><div className="card">Loading…</div></div>;
  if (acc === false) return <div className="page"><div className="card">Couldn&apos;t load your profile.</div></div>;

  const save = async () => {
    setBusy(true);
    try {
      const updated = await api('/me/profile', { method: 'PATCH', body: JSON.stringify({ tagline: tagline.trim().slice(0, 120) }) });
      setAcc(updated);
      alert('Saved.');
    } catch {
      alert('Could not save — retry.');
    } finally { setBusy(false); }
  };
  const flip = async () => {
    const next = mode === 'business' ? 'customer' : 'business';
    try {
      const updated = await setMode(next);
      setModeState(updated.lastMode);
      setAcc(updated);
      if (updated.lastMode === 'business') {
        api('/me/businesses').then(setBiz).catch(() => setBiz([]));
      } else setBiz(null);
    } catch {
      alert('Could not switch — retry.');
    }
  };

  return (
    <div>
      <Nav />
      <div className="page" style={{ maxWidth: 720 }}>
        <div className="card">
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div className="avatar" style={{ margin: 0, width: 72, height: 72, fontSize: 28 }}>
              {(acc.email || acc.phone || '?').slice(0, 1).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ margin: 0, fontSize: 22 }}>{acc.email || acc.phone}</h1>
              {acc.email && acc.phone ? <p style={{ margin: '4px 0 0', color: 'var(--color-body-text)' }}>{acc.phone}</p> : null}
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-body-text)' }}>
                {acc.country} · Using as {mode === 'business' ? 'Business' : 'Customer'}
              </p>
            </div>
            <button className="btn btn-secondary" onClick={flip}>
              {mode === 'business' ? 'Customer view' : 'Business view'}
            </button>
          </div>
          <label className="lbl">Short tagline</label>
          <input className="input" placeholder="e.g. Cake lover in Ikeja" value={tagline}
            onChange={(e) => setTagline(e.target.value)} maxLength={120} style={{ width: '100%' }} />
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <button className="btn" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
            <button className="btn btn-secondary" onClick={() => signOut(navigate)}>Sign out</button>
          </div>
        </div>
        {mode === 'business' ? (
          <div className="card" style={{ marginTop: 8 }}>
            <h3 style={{ marginTop: 0 }}>My businesses</h3>
            {biz === null ? <p>Loading…</p> : biz.length === 0 ? (
              <p style={{ color: 'var(--color-body-text)' }}>
                No storefront yet — create one in the app in about 5 minutes.
              </p>
            ) : biz.map((b) => (
              <p key={b.id}><Link to={`/s/${b.slug}`}>{b.name}</Link> · {b.city}</p>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
