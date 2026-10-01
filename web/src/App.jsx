import React, { useEffect, useState } from 'react';
import { BrowserRouter, Link, Route, Routes, useParams } from 'react-router-dom';
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
    <>
      <div className="topnav">
        <span className="logo">New Era</span>
        <span className="links"><span>Discover</span><span>Pricing</span><span>About</span></span>
        <span className="sp"></span>
        <Link to="/auth" className="btn" style={{ height: 32, lineHeight: '32px', padding: '0 12px', fontSize: 12 }}>Open app</Link>
      </div>
      <div className="page">
        {sf.listings[0]?.photos[0] && (
          <img src={img(sf.listings[0].photos[0])} alt="" className="hero-img" />
        )}
        <div className="card bizcard">
          <div className="avatar">{b.name.slice(0, 1)}</div>
          <div>
            <h1 style={{ margin: 0 }}>{b.name}</h1>
            <p style={{ color: 'var(--color-body-text)', fontSize: 12, margin: '4px 0 0' }}>
              {b.category} · {b.area ? `${b.area}, ` : ''}{b.city}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <Link to="/auth" className="btn">Message</Link>
          <button className="btn" style={{ background: 'var(--color-surface)', color: 'var(--color-primary)', border: '1px solid var(--color-primary)' }}>Share</button>
        </div>
        <h2>Listings</h2>
        <div className="grid">
          {sf.listings.map(l => (
            <div className="card" key={l.id}>
              {l.photos[0] && <img src={img(l.photos[0])} alt={l.title} />}
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
    </>
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
