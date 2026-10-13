import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Nav from './Nav.jsx';
import { api, signOut } from './lib.js';

const DAY = 24 * 3600 * 1000;

// Hibernating account gate: reopen restores everything; permanent delete
// unlocks after 90 days, customers only (stores stay accountable).
export default function Hibernate({ since, onChange }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const days = since ? Math.max(0, Math.floor((Date.now() - new Date(since).getTime()) / DAY)) : 0;
  const deletable = !!since && Date.now() - new Date(since).getTime() >= 90 * DAY;

  const reopen = async () => {
    setBusy(true);
    setErr('');
    try {
      await api('/me/reactivate', { method: 'POST' });
      await onChange();
    } catch {
      setErr('Could not reopen — retry.');
    } finally { setBusy(false); }
  };
  const destroy = async () => {
    if (!window.confirm('Delete permanently? This removes your listings, messages, and account for good.')) return;
    setBusy(true);
    setErr('');
    try {
      await api('/me/account', { method: 'DELETE' });
      signOut(navigate);
    } catch (e) {
      setErr(String(e.message || 'Could not delete — retry.'));
    } finally { setBusy(false); }
  };
  return (
    <div>
      <Nav />
      <div className="page" style={{ maxWidth: 560 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <h1>Taking a break?</h1>
          <p style={{ color: 'var(--color-body-text)' }}>
            Your account is hibernating. Your storefront is hidden, chats are paused, and nothing is
            deleted — reopen anytime and everything comes back exactly as you left it.
          </p>
          <button className="btn" style={{ width: '100%' }} onClick={reopen} disabled={busy}>
            {busy ? 'Working…' : 'Reopen my account'}
          </button>
          <div style={{ height: 12 }} />
          {deletable ? (
            <>
              <p style={{ fontSize: 13, color: 'var(--color-body-text)' }}>
                Hibernating {days} days — permanent delete is unlocked. Business accounts
                can&apos;t be deleted here; talk to support so open orders stay protected.
              </p>
              <button className="btn btn-secondary" style={{ width: '100%' }} onClick={destroy} disabled={busy}>
                Delete permanently
              </button>
              <div style={{ height: 8 }} />
            </>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--color-body-text)' }}>
              {since
                ? `Hibernating ${days} of 90 days — permanent delete unlocks after 90 days.`
                : 'Permanent delete unlocks after 90 days hibernating.'}
            </p>
          )}
          {err ? <p style={{ color: '#B0362C', fontSize: 14 }}>{err}</p> : null}
          <p>
            <button className="linklike" onClick={() => signOut(navigate)}>Sign out</button>
          </p>
        </div>
      </div>
    </div>
  );
}
