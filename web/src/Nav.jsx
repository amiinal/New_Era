import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { accountId, api, getMode, setMode, signOut } from './lib.js';
import { ChatIcon, HelpIcon, LogoutIcon, MenuIcon, SettingsIcon, ShieldIcon, SwitchIcon, UserIcon } from './icons.jsx';

// Shared topnav: Discover · How It Works · For Businesses · About · FAQ.
// Signed out: Log In + Start Your Store. Signed in: hamburger menu.
// The Admin entry only renders for ADMIN_EMAILS.
const PAGES = [
  ['/discover', 'Discover'],
  ['/how-it-works', 'How It Works'],
  ['/for-businesses', 'For Businesses'],
  ['/about', 'About'],
  ['/faq', 'FAQ'],
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [mode, setModeState] = useState(getMode());
  const [admin, setAdmin] = useState(false);
  const [unread, setUnread] = useState(0);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const signed = !!accountId();
  const active = (to) => pathname === to || (to !== '/' && pathname.startsWith(to + '/'));

  useEffect(() => {
    if (!signed) return;
    api('/admin/maintenance').then(() => setAdmin(true)).catch(() => {});
    const checkUnread = () => {
      api('/me/threads').then((rows) => setUnread(rows.reduce((n, t) => n + (t.unread > 0 ? 1 : 0), 0))).catch(() => {});
    };
    checkUnread();
    const t = setInterval(checkUnread, 30000);
    return () => clearInterval(t);
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
  // Re-check on open too, so a stale first probe can never hide the entry.
  const toggle = () => {
    setOpen(!open);
    if (!open && signed) api('/admin/maintenance').then(() => setAdmin(true)).catch(() => setAdmin(false));
  };

  return (
    <div className="topnav">
      <Link to="/" className="logo" style={{ textDecoration: 'none' }}>New Era</Link>
      <span className="links">
        {PAGES.map(([to, label]) => (
          <Link key={to} to={to} className={`nav-link ${active(to) ? 'on' : ''}`}>{label}</Link>
        ))}
        {signed ? (
          <Link to="/chat" className={`nav-link ${active('/chat') ? 'on' : ''}`}>
            Chats{unread > 0 ? <span className="nav-badge">{unread > 9 ? '9+' : unread}</span> : null}
          </Link>
        ) : null}
      </span>
      <span className="sp"></span>
      {!signed ? (
        <span className="nav-cta">
          <Link to="/auth" className="nav-login">Log In</Link>
          <Link to="/for-businesses" className="btn" style={{ height: 36, lineHeight: '36px', padding: '0 14px', fontSize: 13 }}>Start Your Store</Link>
        </span>
      ) : (
        <div className="menu-wrap">
          <button className="menu-btn" onClick={toggle} aria-label="Menu">
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
      <div className="menu-wrap mobile-only">
        <button className="menu-btn" onClick={() => setMenu(!menu)} aria-label="Pages">
          <MenuIcon size={22} color="var(--color-primary)" />
        </button>
        {menu && (
          <div className="menu-panel" onClick={() => setMenu(false)}>
            {PAGES.map(([to, label]) => <Link key={to} to={to}>{label}</Link>)}
            {!signed ? (
              <>
                <Link to="/chat">Chats</Link>
                <Link to="/auth">Log In</Link>
                <Link to="/for-businesses">Start Your Store</Link>
              </>
            ) : (
              <Link to="/chat">My chats</Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
