import React from 'react';
import { Link } from 'react-router-dom';
import Nav from './Nav.jsx';
import Footer from './Footer.jsx';

export default function Safety() {
  return (
    <div>
      <Nav />
      <div className="page" style={{ maxWidth: 720 }}>
        <h1>Safety</h1>
        <p style={{ color: 'var(--color-body-text)' }}>
          Most people on New Era are genuine. A few habits keep it that way.
        </p>
        <div className="card">
          <ul style={{ paddingLeft: 20, color: 'var(--color-body-text)' }}>
            <li>Do not pay in full upfront to a seller you do not know.</li>
            <li>Never share bank details, card numbers, or OTP codes.</li>
            <li>Meet in a public place for in person exchange where you can.</li>
            <li>Report anything suspicious straight from the chat.</li>
          </ul>
        </div>
        <p style={{ color: 'var(--color-body-text)' }}>
          Take extra care across borders and with remote services. Read what can
          never be listed on the <Link to="/prohibited">prohibited items</Link> page.
        </p>
      </div>
      <Footer />
    </div>
  );
}
