import React from 'react';
import { Link } from 'react-router-dom';
import Nav from './Nav.jsx';
import Footer from './Footer.jsx';

const STEPS = [
  ['Discover', 'Search for businesses, products, and services.'],
  ['Explore', 'See what a business offers and learn more about them.'],
  ['Chat', 'Start a conversation directly from a product or business.'],
  ['Stay connected', 'Keep your conversations in one place.'],
];

export default function HowItWorks() {
  return (
    <div>
      <Nav />
      <div className="page">
        <h1>Find. Ask. Connect.</h1>
        <p style={{ color: 'var(--color-body-text)' }}>
          New Era works the way meeting a good business should work.
        </p>
        <div className="steps" style={{ marginTop: 32 }}>
          {STEPS.map(([t, d], j) => (
            <div className="card" key={t}>
              <div className="step-num">{j + 1}</div>
              <h3>{t}</h3>
              <p style={{ color: 'var(--color-body-text)', fontSize: 14 }}>{d}</p>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 32, flexWrap: 'wrap' }}>
          <Link to="/discover" className="btn">Start Exploring</Link>
          <Link to="/chat" className="btn btn-secondary">Start a Chat</Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
