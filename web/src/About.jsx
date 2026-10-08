import React from 'react';
import Nav from './Nav.jsx';
import Back from './Back.jsx';
import Footer from './Footer.jsx';

export default function About() {
  return (
    <div>
      <Nav />
      <div className="page" style={{ maxWidth: 720 }}>
        <Back />
        <h1>About New Era</h1>
        <p style={{ color: 'var(--color-body-text)' }}>
          New Era is a place where businesses can be found and people can connect with them.
        </p>
        <p style={{ color: 'var(--color-body-text)' }}>
          We built New Era for the businesses that make things, sell things,
          create things, and provide services every day.
        </p>
        <p style={{ color: 'var(--color-body-text)' }}>
          A business should not need thousands of followers to reach the right
          customer. And finding a good business should not depend on already
          knowing where to look.
        </p>
        <p style={{ color: 'var(--color-body-text)' }}>
          With New Era, businesses can create a simple online store, showcase
          what they offer, share their store with others, and talk directly
          with customers.
        </p>
        <p style={{ color: 'var(--color-body-text)' }}>
          Customers can discover businesses they did not know about, explore
          what they offer, and start a conversation when something catches
          their attention.
        </p>
        <p style={{ color: 'var(--color-body-text)' }}>
          We believe good businesses deserve a fair chance to be found.
        </p>
        <p>That is what New Era is here to do.</p>
      </div>
      <Footer />
    </div>
  );
}
