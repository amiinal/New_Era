import React from 'react';
import { Link } from 'react-router-dom';
import Nav from './Nav.jsx';
import Footer from './Footer.jsx';

export default function ForBusinesses() {
  return (
    <div>
      <Nav />
      <div className="page">
        <h1>You have something to offer. Let people find you.</h1>
        <p style={{ color: 'var(--color-body-text)' }}>
          Create your store, add what you sell, share your link, and start talking to customers.
        </p>
        <p style={{ color: 'var(--color-body-text)' }}>
          You do not need a big following to be discovered.
          New Era gives every business a fair chance to be found.
        </p>
        <div className="card" style={{ marginTop: 24 }}>
          <h3 style={{ marginTop: 0 }}>How it works</h3>
          <p style={{ color: 'var(--color-body-text)' }}>
            Sign in, then create your store in the app. Add listings, share your
            link anywhere, and reply when customers message you.
          </p>
          <Link to="/auth?next=/profile" className="btn">Start Your Store</Link>
          <p style={{ color: 'var(--color-body-text)', fontSize: 13 }}>
            Takes about 5 minutes. No documents needed to go live.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
