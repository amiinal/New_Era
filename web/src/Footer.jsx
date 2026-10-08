import React from 'react';
import { Link } from 'react-router-dom';

// Site footer: Explore · Help · Legal · Use New Era.
export default function Footer() {
  const apk = import.meta.env.VITE_APK_URL || '#';
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div>
          <div className="logo">New Era</div>
          <p>Found. Not just online.</p>
        </div>
        <div>
          <h4>Explore</h4>
          <Link to="/discover">Discover</Link>
          <Link to="/how-it-works">How It Works</Link>
          <Link to="/for-businesses">For Businesses</Link>
          <Link to="/about">About</Link>
          <Link to="/faq">FAQ</Link>
        </div>
        <div>
          <h4>Help</h4>
          <Link to="/faq">Help Center</Link>
          <Link to="/support">Contact Support</Link>
        </div>
        <div>
          <h4>Legal</h4>
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/safety">Safety</Link>
          <Link to="/prohibited">Prohibited Items</Link>
        </div>
        <div>
          <h4>Use New Era</h4>
          <Link to="/install">iPhone — Install New Era</Link>
          <a href={apk}>Android — Download APK</a>
          <Link to="/discover">Browser — Open New Era</Link>
        </div>
      </div>
    </footer>
  );
}
