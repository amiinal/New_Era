import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { accountId, api } from './lib.js';

// One thread (CHT-1..4, text): same history as the app, polled.
export default function Thread() {
  const { threadId } = useParams();
  const [msgs, setMsgs] = useState(null);
  const [peer, setPeer] = useState('');
  const [draft, setDraft] = useState('');
  const me = accountId();

  const load = async () => {
    try {
      const [m, t] = await Promise.all([
        api(`/threads/${threadId}/messages`),
        api(`/threads/${threadId}`),
      ]);
      setMsgs(m);
      setPeer(t.peer.name);
    } catch {
      setMsgs([]);
    }
  };
  useEffect(() => {
    if (!me) return;
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [threadId]);

  if (!me) {
    return (
      <div className="page">
        <div className="card" style={{ maxWidth: 480 }}>
          <h2>Sign in to chat</h2>
          <Link to={`/auth?next=/chat/${threadId}`} className="btn">Sign in</Link>
        </div>
      </div>
    );
  }

  const send = async () => {
    const body = draft.trim();
    if (!body) return;
    setDraft('');
    try {
      await api(`/threads/${threadId}/messages`, { method: 'POST', body: JSON.stringify({ body }) });
      load();
    } catch {
      alert('Could not send — check the API is running, then retry.');
    }
  };

  return (
    <div>
      <div className="topnav">
        <Link to="/chat" style={{ textDecoration: 'none', color: 'inherit' }}>‹ Chats</Link>
        <span style={{ marginLeft: 16, fontWeight: 600 }}>{peer}</span>
        <span className="sp"></span>
      </div>
      <div className="chat-wrap">
        <div className="chat-list">
          {msgs === null ? (
            <div className="card">Loading…</div>
          ) : msgs.length === 0 ? (
            <div className="card">No messages yet — say hello.</div>
          ) : msgs.map((m) => (
            <div key={m.id} className={`msg ${m.senderId === me ? 'msg-me' : 'msg-them'}`}>
              {m.body || 'Photo'}
            </div>
          ))}
        </div>
        <div className="chat-box">
          <input className="input" placeholder="Type a message…" value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') send(); }} style={{ flex: 1 }} />
          <button className="btn" onClick={send}>Send</button>
        </div>
      </div>
    </div>
  );
}
