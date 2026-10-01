import React, { useEffect, useState } from 'react';
import { BrowserRouter, Link, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import './tokens.css';
import Auth from './Auth.jsx';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const img = (k) => (/^https?:\/\//.test(k) ? k : `${API}/img/${k}`);
const AVAIL = {
  in_stock: ['In stock', '#0A6B62'],
  limited: ['Limited', '#8A5A12'],
  sold_out: ['Sold out', '#B0362C'],
  made_to_order: ['Made to order', '#5B5F6B'],
};
const symFor = (c) => ({ NGN: '₦', GHS: 'GH₵', KES: 'KSh' }[c] ?? '');

function Storefront() {
  const { slug } = useParams();
  const [sf, setSf] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch(`${API}/storefront/${slug}`).then((r) => {
      if (!r.ok) throw new Error('bad status');
      return r.json();
    }).then(setSf).catch(() => setFailed(true));
  }, [slug]);

  if (failed) {
    return <div className="card" style={{ margin: 24 }}>Couldn&apos;t load this shop.</div>;
  }
  if (!sf) {
    return <div className="card" style={{ margin: 24 }}>Loading…</div>;
  }

  const b = sf.business;
  return (
    <div>
      <div className="topnav">
        <span className="logo">New Era</span>
        <span className="links"><span>Discover</span><span>Pricing</span><span>About</span></span>
        <span className="sp"></span>
        <Link to="/auth" className="btn" style={{ height: 32, lineHeight: '32px', padding: '0 12px', fontSize: 12 }}>Open app</Link>
      </div>
      <div className="page">
        {sf.listings[0] && sf.listings[0].photos[0] ? (
          <img src={img(sf.listings[0].photos[0])} alt="" className="hero-img" />
        ) : null}
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
            <Link to={`/l/${l.id}`} key={l.id} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="lcard">
                {l.photos[0] ? <img src={img(l.photos[0])} alt={l.title} /> : null}
                <h3>{l.title}</h3>
                <p>{l.price ? `${symFor(l.currency)}${l.price}` : 'Price on request'} · <span style={{ color: AVAIL[l.availability][1] }}>{AVAIL[l.availability][0]}</span></p>
              </div>
            </Link>
          ))}
        </div>
          ))}
        </div>
        {sf.certificates.length > 0 ? (
          <div>
            <h2>Certificates</h2>
            {sf.certificates.map((c) => (
              <div className="card" key={c.id}>
                <strong>{c.title}</strong>
                <p style={{ fontSize: 12, color: 'var(--color-body-text)' }}>
                  {[c.issuer, c.year].filter(Boolean).join(' · ')} · <i>Self-reported — not verified by New Era</i>
                </p>
              </div>
            ))}
          </div>
        ) : null}
        <p style={{ textAlign: 'center', color: 'var(--color-body-text)', fontSize: 12 }}>Discover more businesses on New Era</p>
      </div>
    </div>
  );
}

function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [l, setL] = useState(null);
  useEffect(() => {
    fetch(`${API}/listings/${id}`).then((r) => {
      if (!r.ok) throw new Error('bad status');
      return r.json();
    }).then(setL).catch(() => setL(false));
  }, [id]);
  if (l === null) return <div className="card" style={{ margin: 24 }}>Loading…</div>;
  if (l === false) return <div className="card" style={{ margin: 24 }}>Listing not found.</div>;
  return (
    <div className="page" style={{ maxWidth: 720 }}>
      <button className="btn btn-secondary" style={{ height: 40 }} onClick={() => navigate(-1)}>‹ Back</button>
      {l.photos[0] ? <img src={img(l.photos[0])} alt={l.title} className="detail-img" /> : null}
      <h1>{l.title}</h1>
      <p>{l.price ? `${symFor(l.currency)}${l.price}` : 'Price on request'} · {AVAIL[l.availability][0]}</p>
      <div style={{ display: 'flex', gap: 8 }}>
        <Link to="/auth" className="btn">Message about this</Link>
      </div>
    </div>
  );
}

function Home() {
  return (
    <div className="card" style={{ margin: 24 }}>
      <h1>New Era</h1>
      <Link to="/auth">Sign in</Link><br />
      <Link to="/s/mamas-kitchen">Mama&apos;s Kitchen storefront</Link>
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
        <Route path="/l/:id" element={<ListingDetail />} />
        <Route path="/chat" element={<div style={{ margin: 24 }}>Web chat lands in Step 6.</div>} />
      </Routes>
    </BrowserRouter>
  );
}
