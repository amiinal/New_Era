import React from 'react';
import { Link } from 'react-router-dom';
import Nav from './Nav.jsx';

export default function Support() {
  return (
    <div>
      <Nav />
      <div className="page" style={{ maxWidth: 720 }}>
        <div className="card">
          <h1>Customer support</h1>
          <p style={{ color: 'var(--color-body-text)' }}>
            Support hours: Mon–Fri, 9:00–17:00 WAT. Typical reply within one business day.
          </p>
          <p style={{ color: 'var(--color-body-text)' }}>
            For bugs or anything the FAQ doesn&apos;t cover: support@newera.shop
          </p>
          <Link to="/faq" className="btn btn-secondary">Check the FAQ first</Link>
        </div>
      </div>
    </div>
  );
}
