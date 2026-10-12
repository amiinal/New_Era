import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const KEY = 'ne-install-banner';
const COOLDOWN = 7 * 24 * 3600 * 1000; // dismissed stays dismissed for 7 days
const DELAY = 6000; // let visitors explore first (UX guide §2)

function dismissed() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || 'null');
    return !!(v && Date.now() - v.at < COOLDOWN);
  } catch {
    return false;
  }
}

// Sticky install nudge (UX guide §2): compact, never blocking, never on
// /install itself, never when already running as the installed PWA.
// "Not now" and × both dismiss for a week.
export default function InstallBanner() {
  const [show, setShow] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => {
    if (pathname === '/install' || dismissed()) return;
    if (window.matchMedia?.('(display-mode: standalone)').matches) return;
    const t = setTimeout(() => setShow(true), DELAY);
    return () => clearTimeout(t);
  }, [pathname]);
  if (!show) return null;
  const hide = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ at: Date.now() }));
    } catch {
      // private mode — just hide for this visit
    }
    setShow(false);
  };
  return (
    <div className="install-banner" role="dialog" aria-label="Get the New Era app">
      <img src="/favicon.svg" alt="" className="install-mark" />
      <div className="install-text">
        <strong>Take New Era with you</strong>
        <span>Discover businesses and connect on the go with our mobile app.</span>
      </div>
      <Link to="/install" className="btn install-go">Get the app</Link>
      <button className="install-later" onClick={hide}>Not now</button>
      <button className="install-x" onClick={hide} aria-label="Dismiss">×</button>
    </div>
  );
}
