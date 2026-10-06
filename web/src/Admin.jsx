import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { accountId, api } from './lib.js';
import {
  ChartIcon, InboxIcon, PanelLeftIcon, PowerIcon, SearchIcon, ShieldIcon,
} from './icons.jsx';

// Internal control center (TRU-1 + ops): reports, support inbox, lookup,
// analytics, kill switch. Guarded by ADMIN_EMAILS — never in the public nav.
const TABS = [
  { key: 'reports', label: 'Reports', Icon: ShieldIcon },
  { key: 'support', label: 'Support', Icon: InboxIcon },
  { key: 'lookup', label: 'Stores & accounts', Icon: SearchIcon },
  { key: 'analytics', label: 'Analytics', Icon: ChartIcon },
  { key: 'control', label: 'Shutdown', Icon: PowerIcon },
];

function ReportsPane() {
  const [rows, setRows] = useState(null);
  const load = () => api('/admin/reports').then(setRows).catch(() => setRows([]));
  useEffect(() => { load(); }, []);
  const resolve = async (id, action, confirmText) => {
    if (confirmText && !window.confirm(confirmText)) return;
    try {
      await api(`/admin/reports/${id}/resolve`, { method: 'POST', body: JSON.stringify({ action }) });
      load();
    } catch (e) {
      alert(String(e.message).includes('400') ? 'That action fits the other kind — dismiss instead.' : 'Could not resolve — retry.');
    }
  };
  const isStore = (t) => t === 'business' || t === 'profile';
  if (rows === null) return <div className="card">Loading…</div>;
  if (rows.length === 0) return <div className="card">Queue clear — nothing open.</div>;
  return rows.map((r) => (
    <div className="card" key={r.id} style={{ marginBottom: 8 }}>
      <strong>{r.label}</strong>
      <p style={{ fontSize: 13, color: 'var(--color-body-text)', margin: '4px 0' }}>
        {r.targetType} · “{r.reason}” · reported by {r.reporter} · reach out: {r.reachOut}
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {r.link ? <Link to={r.link} className="btn btn-secondary" style={{ height: 36 }}>View</Link> : null}
        <button className="btn btn-secondary" style={{ height: 36 }} onClick={() => resolve(r.id, 'dismiss')}>Dismiss</button>
        {r.targetType === 'listing' ? (
          <button className="btn" style={{ height: 36 }} onClick={() => resolve(r.id, 'hide', 'Hide this listing everywhere?')}>Hide</button>
        ) : null}
        {isStore(r.targetType) ? (
          <button className="btn" style={{ height: 36 }} onClick={() => resolve(r.id, 'suspend', 'Suspend this whole store?')}>Suspend store</button>
        ) : null}
      </div>
    </div>
  ));
}

function SupportPane() {
  const [threads, setThreads] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [msgs, setMsgs] = useState(null);
  const [draft, setDraft] = useState('');
  const load = () => api('/admin/support').then(setThreads).catch(() => setThreads([]));
  useEffect(() => { load(); const t = setInterval(load, 10000); return () => clearInterval(t); }, []);
  const open = async (id) => {
    setOpenId(id);
    setMsgs(await api(`/admin/support/${id}`).catch(() => []));
  };
  const reply = async () => {
    if (!draft.trim()) return;
    await api(`/admin/support/${openId}/reply`, { method: 'POST', body: JSON.stringify({ body: draft.trim() }) });
    setDraft('');
    open(openId);
    load();
  };
  if (threads === null) return <div className="card">Loading…</div>;
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      <div style={{ flex: '1 1 240px' }}>
        {threads.length === 0 ? <div className="card">No messages.</div> : threads.map((t) => (
          <div className="card" key={t.accountId} style={{ marginBottom: 8, border: openId === t.accountId ? '2px solid var(--color-primary)' : undefined }}>
            <strong>{t.contact}</strong>{t.unread > 0 ? <span> · {t.unread} new</span> : null}
            <p style={{ fontSize: 13, color: 'var(--color-body-text)', margin: '4px 0' }}>{t.last}</p>
            <button className="btn btn-secondary" style={{ height: 36 }} onClick={() => open(t.accountId)}>Open</button>
          </div>
        ))}
      </div>
      <div style={{ flex: '2 1 320px' }}>
        {!openId ? <div className="card">Pick a conversation.</div>
          : msgs === null ? <div className="card">Loading…</div> : (
            <div className="card">
              {msgs.map((m) => (
                <div key={m.id} className={`msg ${m.fromAdmin ? 'msg-me' : 'msg-them'}`} style={{ marginBottom: 6 }}>{m.body}</div>
              ))}
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <input className="input" placeholder="Reply as New Era support…" value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') reply(); }} style={{ flex: 1 }} />
                <button className="btn" onClick={reply}>Send</button>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}

function LookupPane() {
  const [q, setQ] = useState('');
  const [found, setFound] = useState(null);
  const search = async () => {
    if (!q.trim()) return;
    const params = new URLSearchParams({ q: q.trim() });
    try {
      const [accounts, businesses] = await Promise.all([
        api(`/admin/accounts?${params}`),
        api(`/admin/businesses?${params}`),
      ]);
      setFound({ accounts, businesses });
    } catch {
      setFound({ accounts: [], businesses: [] });
    }
  };
  const suspend = async (id, off) => {
    if (off && !window.confirm('Suspend this store? It vanishes everywhere.')) return;
    await api(`/admin/businesses/${id}/suspend`, { method: 'POST', body: JSON.stringify({ suspended: off }) });
    search();
  };
  const bizRow = (b) => (
    <p key={b.id || b.slug} style={{ margin: '4px 0' }}>
      <Link to={`/s/${b.slug}`}>{b.name}</Link>
      {b.hidden ? ' · HIDDEN' : ''}{b.suspended ? ' · SUSPENDED' : ''}
      {' · '}<button className="linklike" onClick={() => suspend(b.id, !b.suspended)}>
        {b.suspended ? 'Unsuspend' : 'Suspend'}
      </button>
    </p>
  );
  return (
    <>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input className="input" placeholder="email, phone, name, or city…" value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') search(); }} style={{ flex: 1 }} />
        <button className="btn" onClick={search}>Search</button>
      </div>
      {found ? (
        <>
          {found.accounts.map((a) => (
            <div className="card" key={a.id} style={{ marginBottom: 8 }}>
              <strong>{a.email || a.phone}</strong>
              <p style={{ fontSize: 13, color: 'var(--color-body-text)', margin: '4px 0' }}>
                {a.country} · {a.lastMode} mode · {a.businesses.length} {a.businesses.length === 1 ? 'business' : 'businesses'}
              </p>
              {a.businesses.map(bizRow)}
            </div>
          ))}
          {found.businesses.map((b) => (
            <div className="card" key={`b-${b.id}`} style={{ marginBottom: 8 }}>
              <Link to={`/s/${b.slug}`}><strong>{b.name}</strong></Link>
              <p style={{ fontSize: 13, color: 'var(--color-body-text)', margin: '4px 0' }}>
                {b.category} · {b.city}, {b.country}{b.hidden ? ' · HIDDEN' : ''}{b.suspended ? ' · SUSPENDED' : ''}
                {' · '}<button className="linklike" onClick={() => suspend(b.id, !b.suspended)}>
                  {b.suspended ? 'Unsuspend' : 'Suspend'}
                </button>
              </p>
            </div>
          ))}
          {found.accounts.length === 0 && found.businesses.length === 0 ? <div className="card">No matches.</div> : null}
        </>
      ) : null}
    </>
  );
}

function AnalyticsPane() {
  const [s, setS] = useState(null);
  useEffect(() => { api('/admin/stats').then(setS).catch(() => setS(false)); }, []);
  if (s === null) return <div className="card">Loading…</div>;
  if (s === false) return <div className="card">Couldn&apos;t load stats.</div>;
  const max = Math.max(1, ...s.signupsByDay.map((d) => d.n));
  const cards = [
    ['Signups', s.accounts], ['Businesses', s.businesses], ['Listings', s.listings],
    ['Chats', s.threads], ['Messages', s.messages],
    ['Open reports', s.reportsOpen], ['Unread support', s.supportUnread],
  ];
  return (
    <>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {cards.map(([label, n]) => (
          <div className="card" key={label}>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{n}</div>
            <div style={{ fontSize: 13, color: 'var(--color-body-text)' }}>{label}</div>
          </div>
        ))}
      </div>
      <h2>Signups — last 14 days</h2>
      <div className="card">
        {s.signupsByDay.map((d) => (
          <div key={d.day} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ width: 44, fontSize: 12, color: 'var(--color-body-text)' }}>{d.day}</span>
            <div style={{
              height: 16, borderRadius: 4, background: 'var(--color-primary)',
              width: `${Math.max(2, (d.n / max) * 100)}%`, minWidth: d.n > 0 ? 8 : 2, opacity: d.n > 0 ? 1 : 0.2,
            }} />
            <span style={{ fontSize: 12 }}>{d.n}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function ControlPane({ onChanged }) {
  const [on, setOn] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => {
    api('/admin/maintenance').then((m) => { setOn(m.on); setMessage(m.message); }).catch(() => {});
  }, []);
  const save = async (next) => {
    await api('/admin/maintenance', { method: 'POST', body: JSON.stringify({ on: next, message }) });
    setOn(next);
    onChanged(next);
  };
  return (
    <>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Temporary shutdown</h3>
        <p style={{ color: 'var(--color-body-text)', fontSize: 14 }}>
          When on: app + web show a “paused” notice and all writes stop. Reads stay up.
          Status now: <strong>{on ? 'PAUSED' : 'LIVE'}</strong>
        </p>
        <label className="lbl">Notice shown to users</label>
        <input className="input" value={message} onChange={(e) => setMessage(e.target.value)}
          placeholder="e.g. Back in an hour — upgrading." style={{ width: '100%' }} />
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          {!on
            ? <button className="btn" onClick={() => save(true)}>Pause app + web</button>
            : <button className="btn" onClick={() => save(false)}>Resume</button>}
        </div>
      </div>
      <p style={{ fontSize: 13, color: 'var(--color-body-text)' }}>
        The message saves together with the switch — edit it before pausing.
      </p>
    </>
  );
}

export default function Admin() {
  const [denied, setDenied] = useState(false);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState('reports');
  const [shut, setShut] = useState(() => localStorage.getItem('adminNav') !== 'shut');
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!accountId()) return;
    api('/admin/reports').then(() => setReady(true)).catch((e) => {
      if (String(e.message).startsWith('403')) setDenied(true);
      else setReady(true);
    });
    api('/admin/maintenance').then((m) => setPaused(m.on)).catch(() => {});
  }, []);

  const toggleNav = () => {
    const next = !shut;
    setShut(next);
    localStorage.setItem('adminNav', next ? 'open' : 'shut');
  };

  if (!accountId()) {
    return (
      <div className="page">
        <div className="card" style={{ maxWidth: 480 }}>
          <h2>Team only</h2>
          <p style={{ color: 'var(--color-body-text)' }}>Sign in with your team email to open moderation.</p>
          <Link to="/auth?next=/admin" className="btn">Sign in</Link>
        </div>
      </div>
    );
  }
  if (denied) {
    return (
      <div className="page">
        <div className="card" style={{ maxWidth: 480 }}>
          <h2>Not authorized</h2>
          <p style={{ color: 'var(--color-body-text)' }}>Your email isn&apos;t in ADMIN_EMAILS — ask to be added, then reload.</p>
        </div>
      </div>
    );
  }
  if (!ready) return <div className="page"><div className="card">Loading…</div></div>;

  return (
    <div className="admin-shell">
      <aside className={`admin-side ${shut ? '' : 'shut'}`}>
        <div className="admin-brand">
          <button className="menu-btn" onClick={toggleNav} aria-label="Toggle menu"><PanelLeftIcon size={22} /></button>
          {shut ? <strong>Control</strong> : null}
        </div>
        {shut ? TABS.map(({ key, label, Icon }) => (
          <button key={key} className={`admin-tab ${tab === key ? 'on' : ''}`} onClick={() => setTab(key)}>
            <Icon />{label}
          </button>
        )) : null}
        {shut ? <Link to="/" className="admin-back">← Back to site</Link> : null}
      </aside>
      <main className="admin-main">
        <h1>
          {TABS.find((t) => t.key === tab).label}
          {paused ? <span style={{ fontSize: 13, color: 'var(--color-error)' }}> · PAUSED</span> : ''}
        </h1>
        {tab === 'reports' ? <ReportsPane /> : null}
        {tab === 'support' ? <SupportPane /> : null}
        {tab === 'lookup' ? <LookupPane /> : null}
        {tab === 'analytics' ? <AnalyticsPane /> : null}
        {tab === 'control' ? <ControlPane onChanged={setPaused} /> : null}
      </main>
    </div>
  );
}

