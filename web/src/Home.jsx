import React from 'react';
import { Link } from 'react-router-dom';
import Nav from './Nav.jsx';
import Footer from './Footer.jsx';

export default function Home() {
  return (
    <div>
      <Nav />
      <div className="page">
        <div className="hero">
          <h1>Found. Not just online.</h1>
          <p>Find businesses you will love, discover what they offer, and talk to them directly.</p>
          <div className="hero-cta">
            <Link to="/discover" className="btn">Start Exploring</Link>
            <Link to="/for-businesses" className="btn btn-secondary">Start Your Store</Link>
          </div>
        </div>
      </div>
      <div className="section alt">
        <div className="page" style={{ maxWidth: 720 }}>
          <h2>Looking for something? Start here.</h2>
          <p style={{ color: 'var(--color-body-text)' }}>
            Search for products, services, and businesses around you.
            Find something you like and start a conversation.
          </p>
          <Link to="/discover" className="btn">Discover Businesses</Link>
        </div>
      </div>
      <div className="section">
        <div className="page split">
          <div>
            <h2>Your business deserves to be found.</h2>
            <p style={{ color: 'var(--color-body-text)' }}>
              Put your products and services in one simple place.
              Share your store, meet new customers, and talk to them directly.
            </p>
            <Link to="/for-businesses" className="btn">Start Your Store</Link>
          </div>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>How it works for you</h3>
            <p style={{ color: 'var(--color-body-text)' }}>Create Store → Add Listings → Share Store → Get Found → Chat With Customers</p>
            <Link to="/how-it-works">See how it works</Link>
          </div>
        </div>
      </div>
      <div className="section alt">
        <div className="page" style={{ maxWidth: 720 }}>
          <h2>See something you like? Talk to the person behind it.</h2>
          <p style={{ color: 'var(--color-body-text)' }}>
            Ask a question, check availability, learn more, and have a real
            conversation before you decide.
          </p>
          <Link to="/chat" className="btn">Start a Chat</Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
