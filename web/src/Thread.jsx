import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { accountId, api, API } from './lib.js';
import { DotsIcon } from './icons.jsx';

const img = (k) => (!k ? null : (/^https?:\/\//.test(k) ? k : `${API}/img/${k}`));

function PeerAvatar({ peer, size }) {
  const s = size || 36;
  const logo = peer?.kind === 'business' ? img(peer.logoKey) : null;
  const inner = logo
    ? <img src={logo} alt="" style={{ width: s, height: s, borderRadius: '50%', objectFit: 'cover' }} />
    : <span className="chat-avatar" style={{ width: s, height: s, fontSize: s * 0.45 }}>{(peer?.name || '?').slice(0, 1).toUpperCase()}</span>;
  const body = peer?.kind === 'business' && peer.slug
    ? <Link to={`/s/${peer.slug}`} style={{ display: 'inline-flex' }}>{inner}</Link>
    : inner;
  return (
    <span className="avatar-dot" style={{ width: s, height: s }}>
      {body}
      {peer?.online ? <span className="presence" /> : null}
    </span>
  );
}

// One thread (CHT-1..4, text): same history as the app, polled.
// ⋯ on a message copies/deletes; header ⋯ deletes the conversation.
export default function Thread() {
  const { threadId } = useParams();
  const navigate = useNavigate();
  const [msgs, setMsgs] = useState(null);
  const [peer, setPeer] = useState(null);
  const [draft, setDraft] = useState('');
  const [menuId, setMenuId] = useState(null);
  const [headMenu, setHeadMenu] = useState(false);
  const me = accountId();

  const load = async () => {
    try {
      const [m, t] = await Promise.all([
        api(`/threads/${threadId}/messages`),
        api(`/threads/${threadId}`),
      ]);
      setMsgs(m);
      setPeer(t.peer);
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
  const copy = async (m) => {
    if (m.body) await navigator.clipboard?.writeText(m.body);
    setMenuId(null);
  };
  const delMsg = async (m) => {
    setMenuId(null);
    try {
      await api(`/threads/${threadId}/messages/${m.id}`, { method: 'DELETE' });
      load();
    } catch {
      alert('Could not delete — retry.');
    }
  };
  const delChat = async () => {
    setHeadMenu(false);
    if (!window.confirm('Delete this conversation? Gone for both sides.')) return;
    try {
      await api(`/threads/${threadId}`, { method: 'DELETE' });
      navigate('/chat', { replace: true });
    } catch {
      alert('Could not delete — retry.');
    }
  };

  return (
    <div>
      <div className="topnav">
        <Link to="/chat" style={{ textDecoration: 'none', color: 'inherit' }}>‹ Chats</Link>
        <span className="chat-peer">
          <PeerAvatar peer={peer} />
          {peer?.name || 'Chat'}
          {peer?.online ? <span className="online-word"> · online</span> : null}
        </span>
        <span className="sp"></span>
        <div className="menu-wrap">
          <button className="menu-btn" style={{ width: 36, height: 36 }} onClick={() => setHeadMenu(!headMenu)} aria-label="Chat options">
            <DotsIcon size={20} color="var(--color-primary)" />
          </button>
          {headMenu && (
            <div className="menu-panel" onClick={() => setHeadMenu(false)}>
              <button onClick={delChat} style={{ color: 'var(--color-error)' }}>Delete conversation</button>
            </div>
          )}
        </div>
      </div>
      <div className="chat-wrap">
        <div className="chat-list">
          {msgs === null ? (
            <div className="card">Loading…</div>
          ) : msgs.length === 0 ? (
            <div className="card">No messages yet — say hello.</div>
          ) : msgs.map((m) => {
            const mine = m.senderId === me;
            const showDots = !!m.body || mine;
            return (
              <div key={m.id} className={`msg-row ${mine ? 'me' : ''}`}>
                {!mine ? <PeerAvatar peer={peer} size={28} /> : null}
                <div className={`msg ${mine ? 'msg-me' : 'msg-them'}`}>
                  {m.body || 'Photo'}
                </div>
                {showDots ? (
                <div className="menu-wrap">
                  <button className="msg-dots" onClick={() => setMenuId(menuId === m.id ? null : m.id)} aria-label="Message options">
                    <DotsIcon size={18} color="var(--color-body-text)" />
                  </button>
                  {menuId === m.id && (
                    <div className="menu-panel pop" onClick={() => setMenuId(null)}>
                      {m.body ? <button onClick={() => copy(m)}>Copy text</button> : null}
                      {mine ? <button onClick={() => delMsg(m)} style={{ color: 'var(--color-error)' }}>Delete message</button> : null}
                    </div>
                  )}
                </div>
                ) : null}
              </div>
            );
          })}
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
