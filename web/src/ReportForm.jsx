import React, { useEffect, useRef, useState } from 'react';
import { accountId, api } from './lib.js';

// Keep in step with app/src/components/ReportDialog.tsx.
export const REPORT_REASONS = [
  'Scam or fraud',
  'Prohibited item',
  'Wrong or misleading info',
  'Fake certificate',
  'Harassment or abuse',
  'Something else',
];

// TRU-1: pick a reason + leave a contact so the team can follow up.
export default function ReportForm({ targetType, targetId, title, onDone }) {
  const [reason, setReason] = useState('');
  const [detail, setDetail] = useState('');
  const [contact, setContact] = useState('');
  const [busy, setBusy] = useState(false);
  const boxRef = useRef(null);

  // Inline card (no scrim): clicking anywhere outside it cancels, like a popup.
  useEffect(() => {
    const onDown = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) onDone(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [onDone]);

  const send = async () => {
    if (!reason) { alert('Pick a reason so the team can act.'); return; }
    if (reason === 'Something else' && !detail.trim()) {
      alert('Tell us what it is so the team can act.');
      return;
    }
    if (!accountId()) { alert('Sign in first, then report.'); return; }
    setBusy(true);
    try {
      await api('/reports', {
        method: 'POST',
        body: JSON.stringify({
          targetType, targetId,
          reason: reason === 'Something else' ? `Something else — ${detail.trim()}` : reason,
          ...(contact.trim() ? { contact: contact.trim() } : {}),
        }),
      });
      onDone(true);
    } catch {
      alert('Could not send — sign in first, then retry.');
    } finally { setBusy(false); }
  };

  return (
    <div className="card" ref={boxRef} style={{ marginTop: 8 }}>
      <h3 style={{ marginTop: 0 }}>Report {title}</h3>
      <label className="lbl">What&apos;s wrong?</label>
      {REPORT_REASONS.map((r) => (
        <label key={r} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 0', cursor: 'pointer' }}>
          <input type="radio" name={`reason-${targetId}`} checked={reason === r} onChange={() => setReason(r)} />
          {r}
        </label>
      ))}
      {reason === 'Something else' ? (
        <>
          <label className="lbl">Tell us what it is</label>
          <textarea className="input" placeholder="Describe the issue…" value={detail}
            onChange={(e) => setDetail(e.target.value)} maxLength={400}
            style={{ width: '100%', height: 'auto', minHeight: 84, paddingTop: 12, resize: 'vertical' }} />
        </>
      ) : null}
      <label className="lbl">Your email or phone (for follow-up)</label>
      <input className="input" placeholder="How can we reach you?" value={contact}
        onChange={(e) => setContact(e.target.value)} style={{ width: '100%' }} />
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button className="btn" onClick={send} disabled={busy}>{busy ? 'Sending…' : 'Send report'}</button>
        <button className="btn btn-secondary" onClick={() => onDone(false)}>Cancel</button>
      </div>
    </div>
  );
}
