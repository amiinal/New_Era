import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { accountId, api, API } from './lib.js';
import { DotsIcon, SendIcon } from './icons.jsx';

const img = (k) => (!k ? null : (/^https?:\/\//.test(k) ? k : `${API}/img/${k}`));

const fmtTime = (iso) => {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
};

function PeerAvatar({ peer, size }) {
  const s = size || 44;
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
  const [nudge, setNudge] = useState(false);
  const [caution, setCaution] = useState(null);
  const [peerCard, setPeerCard] = useState(false);
  const me = accountId();

  const load = async () => {
    try {
      const [m, t, self] = await Promise.all([
        api(`/threads/${threadId}/messages`),
        api(`/threads/${threadId}`),
        api('/me'),
      ]);
      setMsgs(m);
      setPeer(t.peer);
      // TRU-6: once a reply lands, ask privately — once per thread.
      if (t.peer.kind === 'business' && m.some((x) => x.senderId !== me)) {
        if (!localStorage.getItem(`nudge:${threadId}`)) setNudge(true);
      }
      // TRU-7: first chat across a border, or a remote service.
      if (t.peer.kind === 'business') {
        const b = await api(`/businesses/${t.thread.businessId}`).catch(() => null);
        if (b) {
          const cross = b.country !== self.country;
          const remote = /nation/i.test(b.deliveryArea || '');
          if ((cross || remote) && !localStorage.getItem(`caution:${b.id}`)) {
            setCaution({ biz: b, cross });
          }
        }
      }
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
  const attach = (file) => {
    if (!file) return;
    const fr = new FileReader();
    fr.onload = async () => {
      try {
        const base64 = String(fr.result).split(',')[1] || '';
        const { key } = await api('/uploads/inline', {
          method: 'POST', body: JSON.stringify({ name: file.name || 'photo.jpg', data: base64 }),
        });
        await api(`/threads/${threadId}/messages`, { method: 'POST', body: JSON.stringify({ imageKey: key }) });
        load();
      } catch {
        alert('Could not send photo — retry.');
      }
    };
    fr.readAsDataURL(file);
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
  const answer = async (yes) => {
    setNudge(false);
    localStorage.setItem(`nudge:${threadId}`, '1');
    api('/events', { method: 'POST', body: JSON.stringify({ name: 'nudge_reply', props: { threadId, answer: yes ? 'yes' : 'no' } }) }).catch(() => {});
  };

  const ackCaution = () => {
    if (caution) localStorage.setItem(`caution:${caution.biz.id}`, '1');
    setCaution(null);
  };

  return (
    <div>
      <div className="topnav">
        <Link to="/chat" style={{ textDecoration: 'none', color: 'inherit' }}>‹ Chats</Link>
        <span className="chat-peer">
          <PeerAvatar peer={peer} />
          {peer?.kind === 'customer' ? (
            <span className="menu-wrap">
              <button className="linklike" style={{ fontWeight: 600, fontSize: 15 }} onClick={() => setPeerCard(!peerCard)}>
                {peer?.name || 'Chat'}
              </button>
              {peerCard ? (
                <div className="menu-panel pop" onClick={() => setPeerCard(false)}>
                  <div style={{ padding: 12, minWidth: 200 }}>
                    <strong>{peer.name}</strong>
                    <p style={{ fontSize: 13, color: 'var(--color-body-text)', margin: '4px 0' }}>
                      {peer.tagline || 'No bio yet.'}
                    </p>
                    <p style={{ fontSize: 13, color: 'var(--color-body-text)', margin: '4px 0' }}>
                      {peer.contact ? `Reach: ${peer.contact}` : 'Contact private.'}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--color-body-text)', margin: '4px 0 0' }}>
                      {peer.online ? 'Online now' : 'Offline'}
                    </p>
                  </div>
                </div>
              ) : null}
            </span>
          ) : (
            <span>
              <span style={{ display: 'block' }}>{peer?.name || 'Chat'}</span>
              {peer?.online ? <span className="online-word">online</span> : null}
            </span>
          )}
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
        {caution ? (
          <div className="card" style={{
            background: 'rgba(232,166,57,.15)', border: '1px solid var(--color-warning-tint)',
          }}>
            <h2 style={{ marginTop: 0 }}>Stay safe</h2>
            <p>{caution.cross
              ? `This business is in ${caution.biz.country} — a different country from yours.`
              : 'This is a remote service — you may never meet this seller in person.'}</p>
            <ul style={{ paddingLeft: 20 }}>
              <li>Don’t pay in full upfront to a seller you don’t know.</li>
              <li>Never share bank details, card numbers, or OTP codes.</li>
              <li>Meet in a public place for in-person exchange where you can.</li>
              <li>Report anything suspicious straight from this chat.</li>
            </ul>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn" onClick={ackCaution}>I understand — continue</button>
              <button className="btn btn-secondary" onClick={() => navigate('/chat')}>Go back</button>
            </div>
          </div>
        ) : null}
        <div className="chat-list" style={caution ? { display: 'none' } : undefined}>
          {msgs === null ? (
            <div className="card">Loading…</div>
          ) : msgs.length === 0 ? (
            <div className="card">No messages yet — say hello.</div>
          ) : msgs.map((m) => {
            const mine = m.senderId === me;
            const showDots = !!m.body || mine;
            return (
              <div key={m.id} className={`msg-row ${mine ? 'me' : ''}`}>
                {!mine ? <PeerAvatar peer={peer} size={36} /> : null}
                <div className="msg-col">
                  {m.imageKey ? (
                    <img src={img(m.imageKey)} alt="" className="msg-img" />
                  ) : null}
                  {m.body ? (
                    <div className={`msg ${mine ? 'msg-me' : 'msg-them'}`}>{m.body}</div>
                  ) : !m.imageKey ? (
                    <div className={`msg ${mine ? 'msg-me' : 'msg-them'}`}>Photo</div>
                  ) : null}
                  <div className="msg-stamp">{fmtTime(m.createdAt)}</div>
                </div>
                {showDots ? (
                <div className="menu-wrap">
                  <button className="msg-dots" onClick={() => setMenuId(menuId === m.id ? null : m.id)} aria-label="Message options">
                    <DotsIcon size={18} color="var(--color-body-text)" />
                  </button>
                  {menuId === m.id && (
                    <div className={`menu-panel pop ${mine ? '' : 'pop-left'}`} onClick={() => setMenuId(null)}>
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
        <div className="chat-box" style={caution ? { display: 'none' } : undefined}>
          <label className="plus-btn" title="Attach photo">
            +
            <input type="file" accept="image/*" hidden
              onChange={(e) => { attach(e.target.files?.[0]); e.target.value = ''; }} />
          </label>
          <input className="input" placeholder="Type a message…" value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') send(); }} style={{ flex: 1 }} />
          <button className="send-btn" onClick={send} aria-label="Send">
            <SendIcon size={20} color="#fff" />
          </button>
        </div>
        {nudge ? (
          <div className="card" style={{ textAlign: 'center', marginBottom: 8 }}>
            <strong>Did you get a reply?</strong>
            <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginTop: 8 }}>
              <button className="linklike" onClick={() => answer(true)}>Yes</button>
              <button className="linklike" onClick={() => answer(false)}>Not yet</button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
