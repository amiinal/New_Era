import React from 'react';
import { Link } from 'react-router-dom';
import Nav from './Nav.jsx';

export default function About() {
  return (
    <div>
      <Nav />
      <div className="page" style={{ maxWidth: 720 }}>
        <div className="card">
          <h1>About New Era</h1>
          <p style={{ color: 'var(--color-body-text)' }}>
            New Era helps small businesses go digital: list products and services,
            get found by new customers, and receive real chat inquiries.
          </p>
          <p style={{ color: 'var(--color-body-text)' }}>
            The loop we prove is simple — <strong>a business lists itself, gets found,
            receives real chat inquiries.</strong> No follows, no likes, no popularity
            contests: fair ranking across every shop.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
            <Link to="/discover" className="btn">Discover businesses</Link>
            <Link to="/auth" className="btn btn-secondary">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
