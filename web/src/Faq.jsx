import React from 'react';
import { Link } from 'react-router-dom';
import Nav from './Nav.jsx';
import { ChevronDownIcon } from './icons.jsx';

const FAQ = [
  ['How do I appear in Discover?', 'Publish 3 or more items with photos, plus a category and location. New businesses get a fair-rotation boost.'],
  ['How do chats work?', 'Customers message you from your storefront or listings. Reply fast — responsiveness lifts ranking.'],
  ['What do the availability states mean?', 'In stock, Limited, Sold out, or Made to order. Keep them accurate; stale states sink ranking.'],
  ['What are statuses?', 'Photo or text updates that expire after 24 hours — 5 per day. No likes, no counts.'],
  ['What are certificates?', 'Optional self-reported credentials on your storefront, labeled “not verified”. The verified badge with document review arrives in Phase 2.'],
  ['Is my data public?', 'Only your business profile, listings, statuses, and area-level location. Exact addresses stay private unless you share them.'],
];

export default function Faq() {
  return (
    <div>
      <Nav />
      <div className="page" style={{ maxWidth: 720 }}>
        <h1>FAQ</h1>
        {FAQ.map(([q, a], j) => (
          <details className="card faq" key={j} style={{ marginBottom: 8 }}>
            <summary>
              <span style={{ flex: 1 }}>{q}</span>
              <ChevronDownIcon color="var(--color-body-text)" />
            </summary>
            <p style={{ color: 'var(--color-body-text)' }}>{a}</p>
          </details>
        ))}
        <div className="card" style={{ marginTop: 8 }}>
          <strong>What can&apos;t be listed?</strong>
          <p style={{ color: 'var(--color-body-text)', margin: '4px 0 8px' }}>
            Drugs, weapons, counterfeits, money schemes, and more.
          </p>
          <Link to="/prohibited" className="btn btn-secondary">Prohibited items & conduct</Link>
        </div>
      </div>
    </div>
  );
}
