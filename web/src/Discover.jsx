import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Nav from './Nav.jsx';
import Back from './Back.jsx';
import Footer from './Footer.jsx';
import { api } from './lib.js';
import { COUNTRIES } from './countries.js';

const CATEGORIES = ['Fashion', 'Beauty', 'Food', 'Home', 'Electronics', 'Services'];

// Public Discover (DIS-1..8, CUS-9): country boundary + city filter,
// no account needed — the login wall sits at first chat.
export default function Discover() {
  const [country, setCountry] = useState('NG');
  const [city, setCity] = useState('');
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [items, setItems] = useState(null);

  const load = async (withCat) => {
    const cat = withCat !== undefined ? withCat : category;
    try {
      const params = new URLSearchParams({ country });
      if (city.trim()) params.set('city', city.trim());
      if (q.trim()) params.set('q', q.trim());
      if (cat) params.set('category', cat);
      setItems(await api(`/discover?${params}`));
    } catch {
      setItems([]);
    }
  };
  useEffect(() => { load(); }, []);

  return (
    <div>
      <Nav />
      <div className="page">
        <Back />
        <h1>What are you looking for?</h1>
        <p style={{ color: 'var(--color-body-text)' }}>
          Find products, services, and businesses near you.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          <select className="input" value={country} onChange={(e) => setCountry(e.target.value)} style={{ width: 160 }}>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
          <input className="input" placeholder="City (optional)" value={city} onChange={(e) => setCity(e.target.value)} style={{ width: 180 }} />
          <input className="input" placeholder="What are you looking for?" value={q} onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') load(); }} style={{ flex: 1, minWidth: 180 }} />
          <button className="btn" onClick={() => load()}>Search</button>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          <button className={`btn ${category === '' ? '' : 'btn-secondary'}`} style={{ height: 36 }} onClick={() => { setCategory(''); load(''); }}>All</button>
          {CATEGORIES.map((c) => (
            <button key={c} className={`btn ${category === c ? '' : 'btn-secondary'}`} style={{ height: 36 }} onClick={() => { setCategory(c); load(c); }}>{c}</button>
          ))}
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
                  {(b.matchedListings?.length ?? 0) > 0 ? (
                    <p style={{ fontSize: 13, color: 'var(--color-body-text)', margin: '4px 0 0' }}>
                      Matches: {b.matchedListings.join(' · ')}
                    </p>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
