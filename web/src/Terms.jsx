import React from 'react';
import { Link } from 'react-router-dom';
import Nav from './Nav.jsx';
import Footer from './Footer.jsx';

export default function Terms() {
  return (
    <div>
      <Nav />
      <div className="page" style={{ maxWidth: 720 }}>
        <h1>Terms</h1>
        <p style={{ color: 'var(--color-body-text)' }}>
          By using New Era you agree to use it honestly: list only what you can
          stand behind, describe items truthfully, and treat the people you talk
          to with respect.
        </p>
        <p style={{ color: 'var(--color-body-text)' }}>
          Items and conduct on the <Link to="/prohibited">prohibited list</Link> lead
          to removal and, for scams, suspension.
        </p>
        <p style={{ color: 'var(--color-body-text)' }}>
          New Era hosts storefronts and conversations but is not a party to any
          sale. Agree on price, delivery, and payment directly with each other,
          and follow the <Link to="/safety">safety guidance</Link> before you pay anyone.
        </p>
      </div>
      <Footer />
    </div>
  );
}
