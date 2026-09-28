import React, { useEffect, useState } from 'react';
import { BrowserRouter, Link, Routes, useParams } from 'react-router-dom';
import './tokens.css';
import Auth from './Auth.jsx';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const img = (k) => (/^https?:\/\//.test(k) ? k : `${API}/img/${k}`);
const AVAIL = { in_stock: ['In stock', '#0A6B62'], limited: ['Limited', '#8A5A12'], sold_out: ['Sold out', '#B0362C'], made_to_order: ['Made to order', '#5B5F6B'] };

function Storefront() {
  const { slug } = useParams();
  const [sf, setSf] = useState(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    fetch(`${API}/storefront/${slug}`).then(r => {
      if (!r.ok) throw 0;
      return r.json();
    }).then(setSf).catch(() => setFailed(true));
  }, [slug]);
  if (failed) return <div className="card" style={{ margin: 24 }}>Couldn't load this shop.</div>;
  if (!sf) return <div className="card" style={{ margin: 24 }}>Loading…</div>;
  const b = sf.business;
  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: 16 }}>
      {sf.listings[0]?.photos[0] && (
        <img src={img(sf.listings[0].photos[0])} alt="" style={{ width: '100%', height: 220, objectFit: 'cover', borderRadius: 16 }} />
      )}
      <div className="card" style={{ marginTop: 16 }}>
        <h1 style={{ margin: 0 }}>{b.name}</h1>
        <p style={{ color: 'var(--color-body-text)', fontSize: 12 }}>
          {b.category} · {b.area ? `${b.area}, ` : ''}{b.city}
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/auth" className="btn">Message</Link>
          <button className="btn" style={{ background: 'var(--color-surface)', color: 'var(--color-primary)', border: '1px solid var(--color-primary)' }}>Share</button>
        </div>
      </div>
      <h2>Listings</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 16 }}>
        {sf.listings.map(l => (
          <div className="card" key={l.id}>
            {l.photos[0] && <img src={img(l.photos[0])} alt={l.title} style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: 8 }} />}
            <h3>{l.title}</h3>
            <p>{l.price ?? 'Price on request'} · <span style={{ color: AVAIL[l.availability][1] }}>{AVAIL[l.availability][0]}</span></p>
          </div>
        ))}
      </div>
      {sf.certificates.length > 0 && (
        <>
          <h2>Certificates</h2>
          {sf.certificates.map(c => (
            <div className="card" key={c.id}>
              <strong>{c.title}</strong>
              <p style={{ fontSize: 12, color: 'var(--color-body-text)' }}>
                {[c.issuer, c.year].filter(Boolean).join(' · ')} · <i>Self-reported — not verified by New Era</i>
              </p>
            </div>
          ))}
        </>
      )}
      <p style={{ textAlign: 'center', color: 'var(--color-body-text)', fontSize: 12 }}>Discover more businesses on New Era</p>
    </div>
  );
}

function Home() {
  return (
    <div className="card" style={{ margin: 24 }}>
      <h1>New Era</h1>
      <Link to="/auth">Sign in</Link><br />
      <Link to="/s/mamas-kitchen">Mama's Kitchen storefront</Link>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/s/:slug" element={<Storefront />} />
        <Route path="/chat" element={<div style={{ margin: 24 }}>Web chat lands in Step 6.</div>} />
      </Routes>
    </BrowserRouter>
  );
}
