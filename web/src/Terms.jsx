import React from 'react';
import { Link } from 'react-router-dom';
import Nav from './Nav.jsx';
import Footer from './Footer.jsx';

const INTRO = 'New Era helps people discover businesses, explore products and services, and communicate directly with businesses. These Terms of Use explain the rules that apply when you use the New Era website, app, storefronts, listings, and messaging features.';

const SECTIONS = [
  ['1. Using New Era', [
    'New Era provides tools for discovering businesses, viewing products and services, creating business storefronts, publishing listings, and communicating with other users.',
    'You are responsible for your account, the information you provide, and the activities you carry out through the platform.',
    'You must use New Era lawfully, honestly, and in a way that respects other users.',
  ]],
  ['2. Business Listings and Honest Information', [
    'Businesses must provide accurate and up to date information about the products and services they offer.',
    'Listings should clearly describe the product or service, its price where applicable, its availability, and any important conditions. Images and descriptions must not mislead customers about what is being offered.',
    'Businesses must not advertise products or services they do not genuinely offer, make false claims, misrepresent their identity, or conceal important information from customers.',
    'Businesses are responsible for complying with applicable laws and for honouring the offers and commitments they make to customers.',
  ]],
  ['3. Prohibited Items and Conduct', [
    'New Era must not be used to facilitate unlawful activity, fraud, scams, or the sale or promotion of prohibited goods and services.',
    'You must not: publish false, deceptive, or misleading listings; sell stolen, counterfeit, or unlawful goods; impersonate another person or business; harass, threaten, exploit, or defraud other users; publish private information without a lawful basis; infringe another person\u2019s intellectual property rights; send spam, distribute malicious software, or interfere with the platform; or manipulate listings or misuse platform features to deceive other users.',
    'New Era may remove content, restrict features, suspend accounts, or terminate access where there is a reasonable basis to believe these terms have been violated, where required by law, or where action is necessary to protect users or the platform.',
  ]],
  ['4. Buying and Selling', [
    'New Era helps customers find businesses and communicate with them. It does not ordinarily act as the seller or buyer in transactions arranged between users.',
    'Unless New Era expressly provides a separate service for a particular transaction, customers and businesses are responsible for agreeing directly on prices, payment methods, delivery or collection, availability, returns, refunds, warranties, and other transaction details.',
    'Businesses are responsible for the products and services they offer and for fulfilling their obligations to customers. Customers should assess listings carefully and take reasonable precautions before making payments or sharing sensitive information.',
    'New Era may take action against reported misconduct, but it does not guarantee the identity, reliability, conduct, or performance of every user or business, nor the successful completion of every transaction.',
    'Nothing in these terms excludes or limits any responsibility or consumer right that cannot lawfully be excluded or limited.',
  ]],
  ['5. Your Content', [
    'You are responsible for the content you publish or send through New Era, including business information, product descriptions, photographs, and messages.',
    'You must have the necessary rights or permissions to use the content you publish.',
    'You retain ownership of content you own. By submitting content, you permit New Era to host, display, reproduce, and use it as reasonably necessary to operate and provide the platform, including displaying your listings to potential customers.',
    'You must not publish content that is unlawful, deceptive, abusive, or in violation of another person\u2019s rights.',
  ]],
  ['6. Reporting and Account Restrictions', [
    'Users may report suspicious listings, inappropriate content, or conduct that appears to violate these terms.',
    'New Era may review reports and take reasonable action, including removing listings or content, restricting features, suspending accounts, or closing accounts.',
    'Where appropriate, a user may contact support to ask about a restriction or raise a concern.',
  ]],
  ['7. Platform Availability and Changes', [
    'New Era aims to provide a reliable service, but access may be interrupted by maintenance, technical issues, security incidents, or circumstances outside its reasonable control.',
    'Features and services may change as New Era develops. Where a change materially affects users\u2019 rights or use of the platform, New Era will handle it in accordance with applicable law.',
  ]],
  ['8. Intellectual Property', [
    'New Era\u2019s name, branding, interface, and original platform materials are protected by applicable intellectual property laws.',
    'You may not copy, reproduce, distribute, or commercially exploit protected New Era materials without permission, except where permitted by law.',
  ]],
  ['9. Responsibility and Disputes', [
    'New Era provides discovery and communication tools. It does not guarantee that every listing is accurate, every business is genuine, or every product or service will meet a customer\u2019s expectations.',
    'Disputes arising from transactions arranged directly between customers and businesses should ordinarily be addressed by the parties involved. New Era may assist with platform reports or take action under these terms, but does not guarantee that it can resolve private transaction disputes.',
    'This section does not remove any legal responsibility that applies to New Era itself or any rights that users have under applicable law.',
  ]],
  ['10. Changes to These Terms', [
    'New Era may update these terms to reflect changes to the platform, its services, or applicable law. The latest version will be published through the website or app.',
  ]],
  ['11. Applicable Law', [
    'These terms are subject to applicable law. Nigerian law applies where relevant, without excluding mandatory legal protections that may apply to users in other jurisdictions.',
  ]],
  ['12. Contact', [
    'For questions about these terms, listings, account restrictions, or use of New Era, contact support@getneweraapp.com.',
  ]],
];

export default function Terms() {
  return (
    <div>
      <Nav />
      <div className="page" style={{ maxWidth: 720 }}>
        <h1>Terms of Use</h1>
        <p style={{ color: 'var(--color-body-text)' }}>{INTRO}</p>
        {SECTIONS.map(([h, ps]) => (
          <section key={h}>
            <h2>{h}</h2>
            {ps.map((t, j) => (
              <p key={j} style={{ color: 'var(--color-body-text)' }}>{t}</p>
            ))}
          </section>
        ))}
        <p style={{ color: 'var(--color-body-text)' }}>
          See also the <Link to="/prohibited">prohibited list</Link> and{' '}
          <Link to="/safety">safety guidance</Link>.
        </p>
      </div>
      <Footer />
    </div>
  );
}
