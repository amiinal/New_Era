import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { accountId, api } from './lib.js';

// Internal moderation (TRU-1): report queue with dismiss / take-down, plus
// account + business lookup. Guarded by ADMIN_EMAILS on the API — never
// linked in the public nav, the team opens /admin directly.
export default function Admin() {
  const [rows, setRows] = useState(null);
  const [denied, setDenied] = useState(false);
  const [q, setQ] = useState('');
  const [found, setFound] = useState(null);

  const load = async () => {
    try {
      setRows(await api('/admin/reports'));
    } catch (e) {
      if (String(e.message).startsWith('403')) setDenied(true);
      else setRows([]);
    }
  };
  useEffect(() => { if (accountId()) load(); }, []);

  const resolve = async (id, action) => {
    if (action === 'hide' && !window.confirm('Hide this from Discover + storefronts?')) return;
    try {
      await api(`/admin/reports/${id}/resolve`, { method: 'POST', body: JSON.stringify({ action }) });
      load();
    } catch (e) {
      alert(String(e.message).includes('400') ? 'Hide applies to listings + businesses only — dismiss this one instead.' : 'Could not resolve — retry.');
    }
  };

  const search = async () => {
    if (!q.trim()) return;
    const params = new URLSearchParams({ q: q.trim() });
    try {
      const [accounts, businesses] = await Promise.all([
        api(`/admin/accounts?${params}`),
        api(`/admin/businesses?${params}`),
      ]);
      setFound({ accounts, businesses });
    } catch {
      setFound({ accounts: [], businesses: [] });
    }
  };

  if (!accountId()) {
    return (
      <div className="page">
        <div className="card" style={{ maxWidth: 480 }}>
          <h2>Team only</h2>
          <p style={{ color: 'var(--color-body-text)' }}>Sign in with your team email to open moderation.</p>
          <Link to="/auth?next=/admin" className="btn">Sign in</Link>
        </div>
      </div>
    );
  }
  if (denied) {
    return (
      <div className="page">
        <div className="card" style={{ maxWidth: 480 }}>
          <h2>Not authorized</h2>
          <p style={{ color: 'var(--color-body-text)' }}>Your email isn&apos;t in ADMIN_EMAILS — ask to be added, then reload.</p>
        </div>
      </div>
    );
  }

  const canHide = (t) => t === 'listing' || t === 'business' || t === 'profile';

  return (
    <div className="page" style={{ maxWidth: 900 }}>
      <h1>Moderation</h1>
      <h2>Reports</h2>
      {rows === null ? <div className="card">Loading…</div>
        : rows.length === 0 ? <div className="card">Queue clear — nothing open.</div>
        : rows.map((r) => (
          <div className="card" key={r.id} style={{ marginBottom: 8 }}>
            <strong>{r.label}</strong>
            <p style={{ fontSize: 13, color: 'var(--color-body-text)', margin: '4px 0' }}>
              {r.targetType} · “{r.reason}” · reported by {r.reporter}
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {r.link ? <Link to={r.link} className="btn btn-secondary" style={{ height: 36 }}>View</Link> : null}
              <button className="btn btn-secondary" style={{ height: 36 }} onClick={() => resolve(r.id, 'dismiss')}>Dismiss</button>
              {canHide(r.targetType) ? (
                <button className="btn" style={{ height: 36 }} onClick={() => resolve(r.id, 'hide')}>Hide</button>
              ) : null}
            </div>
          </div>
        ))}
      <h2 style={{ marginTop: 24 }}>Lookup</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input className="input" placeholder="email, phone, name, or city…" value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') search(); }} style={{ flex: 1 }} />
        <button className="btn" onClick={search}>Search</button>
      </div>
      {found ? (
        <>
          {found.accounts.map((a) => (
            <div className="card" key={a.id} style={{ marginBottom: 8 }}>
              <strong>{a.email || a.phone}</strong>
              <p style={{ fontSize: 13, color: 'var(--color-body-text)', margin: '4px 0' }}>
                {a.country} · {a.lastMode} mode · {a.businesses.length} {a.businesses.length === 1 ? 'business' : 'businesses'}
              </p>
              {a.businesses.map((b) => (
                <p key={b.id} style={{ margin: '4px 0' }}>
                  <Link to={`/s/${b.slug}`}>{b.name}</Link>{b.hidden ? ' · HIDDEN' : ''}
                </p>
              ))}
            </div>
          ))}
          {found.businesses.map((b) => (
            <div className="card" key={`b-${b.id}`} style={{ marginBottom: 8 }}>
              <Link to={`/s/${b.slug}`}><strong>{b.name}</strong></Link>
              <p style={{ fontSize: 13, color: 'var(--color-body-text)', margin: '4px 0' }}>
                {b.category} · {b.city}, {b.country}{b.hidden ? ' · HIDDEN' : ''}
              </p>
            </div>
          ))}
          {found.accounts.length === 0 && found.businesses.length === 0 ? (
            <div className="card">No matches.</div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
