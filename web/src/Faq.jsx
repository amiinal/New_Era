import React from 'react';
import { Link } from 'react-router-dom';
import Nav from './Nav.jsx';
import Back from './Back.jsx';
import Footer from './Footer.jsx';
import { ChevronDownIcon } from './icons.jsx';

const FAQ = [
  ['What is New Era?', 'New Era helps you discover businesses, products, and services and talk to businesses directly.'],
  ['Do I need the app to browse?', 'No. You can browse businesses and storefronts on the web. You only need an account when you want to start a chat.'],
  ['Can I create a store for my business?', 'Yes. You can create your storefront, add your products or services, and share your store with customers.'],
  ['Can customers contact me without installing New Era?', 'Yes. Customers who visit your shared storefront can start a chat on the web.'],
  ['Do I need a business registration document?', 'No. A business does not need business documents to go live.'],
  ['Is New Era only for products?', 'No. Businesses can list both products and services.'],
  ['Can I share my store?', 'Yes. Every business gets a shareable storefront link.'],
  ['Can I take a break without losing everything?', 'Yes — deactivate your account from Settings. Your storefront hides, chats pause, and every device signs out, but nothing is deleted. Sign back in and reopen in one tap — everything comes back exactly as you left it.'],
  ['Can I permanently delete my account?', 'After 90 days hibernating, customers without a storefront can delete permanently from the reopen screen — listings, messages, and the account itself are removed for good. Business accounts cannot be deleted here: stores stay accountable so open orders are always protected — talk to support if you need help closing one.'],
  ['What size should my cover photo be?', 'Cover photos fill the wide banner edge-to-edge. Use a wide photo — about 3:2 landscape (for example 1500 × 1000 pixels or larger). Keep faces and text in the middle: phones trim the edges to fit, so centered content is never cut.'],
  ['How does New Era choose which businesses appear in Discover?', 'New Era focuses on relevance, location, freshness, availability, completeness, and responsiveness. Popularity metrics such as followers and likes are not used.'],
];

export default function Faq() {
  return (
    <div>
      <Nav />
      <div className="page" style={{ maxWidth: 720 }}>
        <Back />
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
      <Footer />
    </div>
  );
}
