import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Nav from './Nav.jsx';
import { accountId, api } from './lib.js';

// Message the team (lands in /admin), read replies here.
export default function Support() {
  const [msgs, setMsgs] = useState(null);
  const [draft, setDraft] = useState('');

  const load = () => {
    if (!accountId()) return;
    api('/support/mine').then(setMsgs).catch(() => setMsgs([]));
  };
  useEffect(() => { load(); const t = setInterval(load, 10000); return () => clearInterval(t); }, []);

  const send = async () => {
    if (!draft.trim()) return;
    try {
      await api('/support/messages', { method: 'POST', body: JSON.stringify({ body: draft.trim() }) });
      setDraft('');
      load();
    } catch {
      alert('Could not send — retry.');
    }
  };

  return (
    <div>
      <Nav />
      <div className="page" style={{ maxWidth: 720 }}>
        <div className="card">
          <h1>Customer support</h1>
          <p style={{ color: 'var(--color-body-text)' }}>
            Support hours: Mon–Fri, 9:00–17:00 WAT. Typical reply within one business day.
          </p>
          <p style={{ color: 'var(--color-body-text)' }}>
            For bugs or anything the FAQ doesn&apos;t cover: support@newera.shop
          </p>
          <Link to="/faq" className="btn btn-secondary">Check the FAQ first</Link>
        </div>
        <div className="card" style={{ marginTop: 8 }}>
          <h3 style={{ marginTop: 0 }}>Message support</h3>
          {!accountId() ? (
            <Link to="/auth?next=/support" className="btn">Sign in to message</Link>
          ) : (
            <>
              {msgs === null ? <p>Loading…</p> : msgs.map((m) => (
                <div key={m.id} className={`msg ${m.fromAdmin ? 'msg-them' : 'msg-me'}`} style={{ marginBottom: 6 }}>{m.body}</div>
              ))}
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <input className="input" placeholder="What do you need help with?" value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') send(); }} style={{ flex: 1 }} />
                <button className="btn" onClick={send}>Send</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
