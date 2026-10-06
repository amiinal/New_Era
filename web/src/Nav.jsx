import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { accountId, api, getMode, setMode, signOut } from './lib.js';
import { ChatIcon, HelpIcon, LogoutIcon, MenuIcon, SettingsIcon, ShieldIcon, SwitchIcon, UserIcon } from './icons.jsx';

// Shared topnav: Discover · About · FAQ centered, plus a hamburger once
// signed in (mode switch, Profile, Settings, Customer support, My chats).
// The Admin entry only renders for ADMIN_EMAILS — everyone else never
// sees it (and the API 403s them anyway).
export default function Nav() {
  const [open, setOpen] = useState(false);
  const [mode, setModeState] = useState(getMode());
  const [admin, setAdmin] = useState(false);
  const navigate = useNavigate();
  const signed = !!accountId();
  useEffect(() => {
    if (signed) api('/admin/maintenance').then(() => setAdmin(true)).catch(() => {});
  }, []);
  const flip = async () => {
    const next = mode === 'business' ? 'customer' : 'business';
    try {
      await setMode(next);
      setModeState(next);
    } catch {
      alert('Could not switch — retry.');
    }
  };
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
          <button className="menu-btn" onClick={() => setOpen(!open)} aria-label="Menu">
            <MenuIcon size={22} color="var(--color-primary)" />
          </button>
          {open && (
            <div className="menu-panel" onClick={() => setOpen(false)}>
              {admin ? <Link to="/admin"><ShieldIcon />Admin</Link> : null}
              <button onClick={(e) => { e.stopPropagation(); flip(); }}>
                <SwitchIcon />{mode === 'business' ? 'Switch to Customer view' : 'Switch to Business view'}
              </button>
              <Link to="/profile"><UserIcon />Profile</Link>
              <Link to="/settings"><SettingsIcon />Settings</Link>
              <Link to="/support"><HelpIcon />Customer support</Link>
              <Link to="/chat"><ChatIcon />My chats</Link>
              <button onClick={() => signOut(navigate)}><LogoutIcon />Sign out</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
