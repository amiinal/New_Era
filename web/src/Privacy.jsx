import React from 'react';
import Nav from './Nav.jsx';
import Footer from './Footer.jsx';

export default function Privacy() {
  return (
    <div>
      <Nav />
      <div className="page" style={{ maxWidth: 720 }}>
        <h1>Privacy</h1>
        <p style={{ color: 'var(--color-body-text)' }}>
          New Era collects only what it needs to run: your account contact,
          your listings and messages, and basic usage events that help owners see
          private storefront views and chats.
        </p>
        <p style={{ color: 'var(--color-body-text)' }}>
          Your exact address is never shown. Business locations appear at area
          level. Public counts, followers, and likes do not exist here.
        </p>
        <p style={{ color: 'var(--color-body-text)' }}>
          You can ask for a copy of your data or for your account to be removed
          at support@newera.shop.
        </p>
      </div>
      <Footer />
    </div>
  );
}
