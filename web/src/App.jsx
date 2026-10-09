import React, { useEffect, useState } from 'react';
import { BrowserRouter, Link, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import './tokens.css';
import Auth from './Auth.jsx';
import Discover from './Discover.jsx';
import Chats from './Chats.jsx';
import Thread from './Thread.jsx';
import Home from './Home.jsx';
import HowItWorks from './HowItWorks.jsx';
import ForBusinesses from './ForBusinesses.jsx';
import Install from './Install.jsx';
import Privacy from './Privacy.jsx';
import Terms from './Terms.jsx';
import Safety from './Safety.jsx';
import About from './About.jsx';
import Faq from './Faq.jsx';
import Profile from './Profile.jsx';
import Settings from './Settings.jsx';
import Support from './Support.jsx';
import Prohibited from './Prohibited.jsx';
import Admin from './Admin.jsx';
import Nav from './Nav.jsx';
import Back from './Back.jsx';
import ReportForm from './ReportForm.jsx';
import { ChatIcon } from './icons.jsx';
import { initTheme, restoreSession, startThread } from './lib.js';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const img = (k) => (/^https?:\/\//.test(k) ? k : `${API}/img/${k}`);
const AVAIL = {
  in_stock: ['In stock', '#0A6B62'],
  limited: ['Limited', '#8A5A12'],
  sold_out: ['Sold out', '#B0362C'],
  made_to_order: ['Made to order', '#5B5F6B'],
};
const symFor = (c) => ({ NGN: '₦', GHS: 'GH₵', KES: 'KSh' }[c] ?? '');

function MessageButton({ businessId, listingId, label }) {
  const navigate = useNavigate();
  const go = async () => {
    try {
      await startThread(navigate, businessId, listingId);
    } catch (e) {
      alert(String(e.message || '').includes('400') ? 'This is your own store — open it in the app instead.' : 'Could not open chat — retry.');
    }
  };
  return (
    <button className="btn msg-btn" onClick={go}>
      <ChatIcon size={18} color="#fff" />
      {label || 'Message'}
    </button>
  );
}

function Storefront() {
  const { slug } = useParams();
  const [sf, setSf] = useState(null);
  const [failed, setFailed] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reported, setReported] = useState(false);

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
      <Nav />
      <div className="page">
        <Back />
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
            {b.bio ? (
              <p style={{ color: 'var(--color-ink)', fontSize: 14, margin: '8px 0 0' }}>{b.bio}</p>
            ) : null}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
          <MessageButton businessId={b.id} />
          <button className="btn" style={{ background: 'var(--color-surface)', color: 'var(--color-primary)', border: '1px solid var(--color-primary)' }}
            onClick={() => navigator.clipboard?.writeText(window.location.href).then(() => alert('Link copied.'))}>Share</button>
          <button className="btn btn-secondary" onClick={() => setReporting(!reporting)}>Report</button>
        </div>
        {reported ? (
          <p style={{ fontSize: 13, color: 'var(--color-body-text)' }}>Thanks — our team will review this storefront.</p>
        ) : null}
        {reporting && !reported ? (
          <ReportForm targetType="profile" targetId={b.id} title="this storefront"
            onDone={(sent) => { setReporting(false); if (sent) setReported(true); }} />
        ) : null}
        <h2>Listings</h2>
        <div className="grid">
          {sf.listings.map(l => (
            <Link to={`/l/${l.id}`} key={l.id} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="lcard">
                {l.photos[0] ? <img src={img(l.photos[0])} alt={l.title} /> : null}
                <h3>{l.title}</h3>
                {l.description ? <p className="ldesc">{l.description}</p> : null}
                <p>{l.price ? `${symFor(l.currency)}${l.price}` : 'Price on request'} · <span style={{ color: AVAIL[l.availability][1] }}>{AVAIL[l.availability][0]}</span></p>
                <span onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  style={{ display: 'block', marginTop: 8 }}>
                  <MessageButton businessId={b.id} listingId={l.id} label="Message" />
                </span>
              </div>
            </Link>
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
        <p style={{ textAlign: 'center', color: 'var(--color-body-text)', fontSize: 12 }}>
          <Link to="/discover">Discover more businesses on New Era</Link>
        </p>
      </div>
    </div>
  );
}

function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [l, setL] = useState(null);
  const [idx, setIdx] = useState(0);
  const [reporting, setReporting] = useState(false);
  const [reported, setReported] = useState(false);
  useEffect(() => {
    fetch(`${API}/listings/${id}`).then((r) => {
      if (!r.ok) throw new Error('bad status');
      return r.json();
    }).then(setL).catch(() => setL(false));
  }, [id]);
  if (l === null) return (<div><Nav /><div className="card" style={{ margin: 24 }}>Loading…</div></div>);
  if (l === false) return (<div><Nav /><div className="card" style={{ margin: 24 }}>Listing not found.</div></div>);
  const n = l.photos.length;
  const at = n === 0 ? 0 : ((idx % n) + n) % n;
  return (
    <div>
      <Nav />
      <div className="page" style={{ maxWidth: 720 }}>
        <button className="btn btn-secondary" style={{ height: 40 }} onClick={() => navigate(-1)}>‹ Back</button>
        {n > 0 ? (
          <div className="gal">
            <img src={img(l.photos[at])} alt={l.title} className="detail-img" style={{ marginTop: 16 }} />
            {n > 1 ? (
              <>
                <button className="gal-arrow left" onClick={() => setIdx(at - 1)} aria-label="Previous photo">‹</button>
                <button className="gal-arrow right" onClick={() => setIdx(at + 1)} aria-label="Next photo">›</button>
                <div className="gal-dots">
                  {l.photos.map((_, j) => (
                    <button key={j} className={`gal-dot ${j === at ? 'on' : ''}`} onClick={() => setIdx(j)} aria-label={`Photo ${j + 1}`} />
                  ))}
                </div>
              </>
            ) : null}
          </div>
        ) : null}
        <h1>{l.title}</h1>
      <p>{l.price ? `${symFor(l.currency)}${l.price}` : 'Price on request'} · {AVAIL[l.availability][0]}</p>
      {l.description ? <p style={{ color: 'var(--color-ink)' }}>{l.description}</p> : null}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <MessageButton businessId={l.businessId} listingId={l.id} label="Message about this" />
        <button className="btn btn-secondary" onClick={() => setReporting(!reporting)}>Report</button>
      </div>
      {reported ? (
        <p style={{ fontSize: 13, color: 'var(--color-body-text)' }}>Thanks — our team will review this listing.</p>
      ) : null}
      {reporting && !reported ? (
        <ReportForm targetType="listing" targetId={l.id} title="this listing"
          onDone={(sent) => { setReporting(false); if (sent) setReported(true); }} />
      ) : null}
      </div>
    </div>
  );
}

export default function App() {
  useEffect(() => { initTheme(); restoreSession(); }, []);
  const [paused, setPaused] = useState(null);
  useEffect(() => {
    fetch(`${API}/status`).then((r) => r.json()).then(setPaused).catch(() => setPaused({ maintenance: false }));
  }, []);
  return (
    <BrowserRouter>
      <Shell paused={paused} />
    </BrowserRouter>
  );
}

function Shell({ paused }) {
  const { pathname } = useLocation();
  // Kill-switch gate: paused app + web show the notice (team keeps /admin).
  if (paused?.maintenance && pathname !== '/admin') {
    return (
      <div className="page">
        <div className="card" style={{ maxWidth: 480, margin: '48px auto', textAlign: 'center' }}>
          <h2>Paused for maintenance</h2>
          <p style={{ color: 'var(--color-body-text)' }}>{paused.message || 'Back soon — thanks for waiting.'}</p>
        </div>
      </div>
    );
  }
  return (
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/discover" element={<Discover />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/for-businesses" element={<ForBusinesses />} />
        <Route path="/install" element={<Install />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/safety" element={<Safety />} />
        <Route path="/about" element={<About />} />
        <Route path="/faq" element={<Faq />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/support" element={<Support />} />
        <Route path="/prohibited" element={<Prohibited />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/s/:slug" element={<Storefront />} />
        <Route path="/l/:id" element={<ListingDetail />} />
        <Route path="/chat" element={<Chats />} />
        <Route path="/chat/:threadId" element={<Thread />} />
      </Routes>
  );
}
