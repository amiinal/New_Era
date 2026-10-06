import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Nav from './Nav.jsx';
import Back from './Back.jsx';
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
      <div className="page" style={{ maxWidth: 560 }}>
        <Back />
        <h1 style={{ textAlign: 'center', marginBottom: 4 }}>Customer support</h1>
        <p style={{ color: 'var(--color-body-text)', textAlign: 'center', fontSize: 13, marginTop: 0 }}>
          Mon–Fri, 9:00–17:00 WAT · replies within one business day.
        </p>
        <div className="card">
          <p style={{ color: 'var(--color-body-text)', fontSize: 14, marginTop: 0 }}>
            For bugs or anything the FAQ doesn&apos;t cover: support@newera.shop ·{' '}
            <Link to="/faq">Check the FAQ first</Link>
          </p>
        </div>
        <div className="card" style={{ marginTop: 8, minHeight: 320, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginTop: 0, textAlign: 'center' }}>Message support</h3>
          {!accountId() ? (
            <div style={{ textAlign: 'center' }}>
              <Link to="/auth?next=/support" className="btn">Sign in to message</Link>
            </div>
          ) : (
            <>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                {msgs === null ? <p>Loading…</p> : msgs.length === 0 ? (
                  <p style={{ color: 'var(--color-body-text)', textAlign: 'center', fontSize: 14 }}>
                    No messages yet — tell us what you need help with.
                  </p>
                ) : msgs.map((m) => (
                  <div key={m.id} className={`msg ${m.fromAdmin ? 'msg-them' : 'msg-me'}`}
                    style={{ alignSelf: m.fromAdmin ? 'flex-start' : 'flex-end' }}>{m.body}</div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
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
