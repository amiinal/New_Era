import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { accountId, signOut } from './lib.js';

// Shared topnav: Discover · About · FAQ, plus a hamburger once signed in
// (Profile, Settings, Customer support, My chats, Sign out).
export default function Nav() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const signed = !!accountId();
  return (
    <div className="topnav">
      <Link to="/" className="logo" style={{ textDecoration: 'none' }}>New Era</Link>
      <span className="links">
        <Link to="/discover" style={{ textDecoration: 'none', color: 'inherit' }}>Discover</Link>
        <Link to="/about" style={{ textDecoration: 'none', color: 'inherit' }}>About</Link>
        <Link to="/faq" style={{ textDecoration: 'none', color: 'inherit' }}>FAQ</Link>
      </span>
      <span className="sp"></span>
      {!signed ? (
        <Link to="/auth" className="btn" style={{ height: 32, lineHeight: '32px', padding: '0 12px', fontSize: 12 }}>Sign in</Link>
      ) : (
        <div className="menu-wrap">
          <button className="menu-btn" onClick={() => setOpen(!open)} aria-label="Menu">☰</button>
          {open && (
            <div className="menu-panel" onClick={() => setOpen(false)}>
              <Link to="/profile">Profile</Link>
              <Link to="/settings">Settings</Link>
              <Link to="/support">Customer support</Link>
              <Link to="/chat">My chats</Link>
              <button onClick={() => signOut(navigate)}>Sign out</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
