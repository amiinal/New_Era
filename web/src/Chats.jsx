import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Nav from './Nav.jsx';
import Back from './Back.jsx';
import { accountId, api } from './lib.js';

// Customer chat list (CHT-4): same threads as the app. A storefront
// "Message" tap while signed out lands here to resume its pending chat.
export default function Chats() {
  const navigate = useNavigate();
  const [rows, setRows] = useState(null);

  useEffect(() => {
    if (!accountId()) { setRows([]); return; }
    const pending = sessionStorage.getItem('pendingChat');
    if (pending) {
      sessionStorage.removeItem('pendingChat');
      const { businessId, listingId } = JSON.parse(pending);
      api('/threads', {
        method: 'POST',
        body: JSON.stringify({ businessId, ...(listingId ? { listingId } : {}) }),
      }).then((t) => navigate(`/chat/${t.id}`, { replace: true }))
        .catch(() => alert('Could not open that chat — it may be your own store.'));
      return;
    }
    api('/me/threads').then(setRows).catch(() => setRows([]));
  }, []);

  if (!accountId()) {
    return (
      <div className="page">
        <div className="card" style={{ maxWidth: 480 }}>
          <h2>Sign in to chat</h2>
          <p style={{ color: 'var(--color-body-text)' }}>Chat with businesses without installing the app.</p>
          <Link to="/auth?next=/chat" className="btn">Sign in</Link>
        </div>
      </div>
    );
  }
  return (
    <div>
      <Nav />
      <div className="page" style={{ maxWidth: 720 }}>
        <Back />
        <h1>Chats</h1>
        {rows === null ? (
          <div className="card">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="card">
            No chats yet. <Link to="/discover">Discover businesses</Link> and say hello.
          </div>
        ) : rows.map((t) => (
          <Link to={`/chat/${t.id}`} key={t.id} className="thread-row">
            <div className={`card ${t.unread > 0 ? 'thread-new' : ''}`} style={{ marginBottom: 8, display: 'flex', gap: 12, alignItems: 'center' }}>
              <span className="avatar-dot" style={{ width: 44, height: 44 }}>
                <span className="chat-avatar" style={{ width: 44, height: 44, fontSize: 20 }}>{t.business.name.slice(0, 1)}</span>
                {t.online ? <span className="presence" /> : null}
              </span>
              <span style={{ flex: 1 }}>
                <strong>{t.business.name}</strong>
                {t.messages[0] ? (
                  <p style={{ fontSize: 13, color: 'var(--color-body-text)', margin: '4px 0 0' }}>
                    {t.messages[0].body || 'Photo'}
                  </p>
                ) : null}
              </span>
              {t.unread > 0 ? <span className="unread-badge">{t.unread}</span> : null}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
