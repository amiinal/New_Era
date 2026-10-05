import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { API, api } from './lib.js';

// Public Discover (DIS-1..8, CUS-9): country boundary + city filter,
// no account needed — the login wall sits at first chat.
export default function Discover() {
  const [country, setCountry] = useState('NG');
  const [city, setCity] = useState('');
  const [q, setQ] = useState('');
  const [items, setItems] = useState(null);

  const load = async () => {
    try {
      const params = new URLSearchParams({ country });
      if (city.trim()) params.set('city', city.trim());
      if (q.trim()) params.set('q', q.trim());
      setItems(await api(`/discover?${params}`));
    } catch {
      setItems([]);
    }
  };
  useEffect(() => { load(); }, []);

  return (
    <div>
      <div className="topnav">
        <Link to="/" className="logo" style={{ textDecoration: 'none' }}>New Era</Link>
        <span className="links"><span>Discover</span></span>
        <span className="sp"></span>
        <Link to="/auth" className="btn" style={{ height: 32, lineHeight: '32px', padding: '0 12px', fontSize: 12 }}>Sign in</Link>
      </div>
      <div className="page">
        <h1>Discover businesses</h1>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          <select className="input" value={country} onChange={(e) => setCountry(e.target.value)} style={{ width: 160 }}>
            <option value="NG">Nigeria</option>
            <option value="GH">Ghana</option>
            <option value="KE">Kenya</option>
          </select>
          <input className="input" placeholder="City (optional)" value={city} onChange={(e) => setCity(e.target.value)} style={{ width: 180 }} />
          <input className="input" placeholder="Search businesses…" value={q} onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') load(); }} style={{ flex: 1, minWidth: 180 }} />
          <button className="btn" onClick={load}>Search</button>
        </div>
        {items === null ? (
          <div className="card">Loading…</div>
        ) : items.length === 0 ? (
          <div className="card">No businesses yet — try widening the city.</div>
        ) : (
          <div className="grid">
            {items.map((b) => (
              <Link to={`/s/${b.slug}`} key={b.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="card">
                  <h3 style={{ margin: '0 0 4px' }}>{b.name}</h3>
                  <p style={{ fontSize: 13, color: 'var(--color-body-text)', margin: 0 }}>
                    {b.category} · {b.city}, {b.country}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
