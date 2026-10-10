import React from 'react';
import Nav from './Nav.jsx';
import Footer from './Footer.jsx';

const INTRO = 'New Era recognises the importance of privacy. This policy explains the personal information that may be collected when you use New Era, how that information is used and shared, and the rights you may have regarding your information.';

const SECTIONS = [
  ['1. Information We Collect', [
    'The information we collect depends on how you use New Era.',
    'Account and contact information: we may collect information you provide when creating or managing an account, such as your name, email address, phone number, and other account details.',
    'Business and listing information: if you create a business storefront, we may collect your business name, category, general location, product or service descriptions, photographs, prices, availability, and other information you choose to publish.',
    'Messages and communications: we process messages, images, and other content sent through New Era, along with information needed to deliver conversations, provide support, and address reports or complaints.',
    'Usage and technical information: we may collect basic information about how the platform is used, such as searches, listings viewed, interactions, device or browser information, technical logs, and information used to diagnose errors or maintain security.',
    'Support and safety information: if you contact support, report a listing, or raise a safety concern, we may process the information you provide and information relevant to handling the issue.',
  ]],
  ['2. How We Use Information', [
    'New Era uses personal information for purposes connected with providing and maintaining the platform, including to: create and manage user accounts; display storefronts, products, and services; help customers discover relevant businesses and listings; enable conversations between customers and businesses; respond to enquiries, complaints, and support requests; investigate suspected fraud, abuse, or violations of platform rules; maintain security, diagnose technical problems, and improve the service; and comply with applicable legal obligations.',
    'Personal information is processed in accordance with applicable data protection law and for legitimate, specified purposes.',
  ]],
  ['3. Public and Private Information', [
    'Business names, storefront details, listings, photographs, and other information published on a storefront may be visible to people using New Era.',
    'Messages sent through New Era are intended for the participants in the conversation and are not public listings. Users should nevertheless exercise care when sharing sensitive personal or financial information in messages.',
    'New Era\u2019s intended discovery experience uses general area information rather than publicly displaying a user\u2019s exact residential address. If you choose to include an exact address or other private details in a public listing or message, those details may be visible to people who can access that content.',
    'You are responsible for considering what information you choose to publish or share.',
  ]],
  ['4. How Information Is Shared', [
    'New Era may share information where reasonably necessary to provide and protect the service, including: with the person or business you contact, where needed to enable communication; with service providers that support the operation, maintenance, or security of New Era; where necessary to investigate fraud, protect users, or address security incidents; where disclosure is required or permitted by applicable law; and in connection with a business transfer or restructuring, subject to applicable legal protections.',
    'Information is shared only for relevant purposes and in accordance with applicable law.',
  ]],
  ['5. Data Retention', [
    'New Era retains personal information for as long as reasonably necessary for the purposes described in this policy, including providing the service, maintaining appropriate records, addressing disputes or security issues, and complying with legal obligations.',
    'Where information is no longer needed, it may be deleted or otherwise handled in accordance with applicable law. Some information may need to be retained where a legal obligation or other lawful reason applies.',
  ]],
  ['6. Information Security', [
    'New Era takes reasonable steps to protect personal information against unauthorised access, loss, misuse, alteration, or disclosure.',
    'No online service can guarantee absolute security. Users should protect their account details and contact New Era if they believe their account or information has been compromised.',
  ]],
  ['7. Your Privacy Rights', [
    'Depending on applicable law and the circumstances, you may have the right to: request information about how your personal data is processed; request access to personal data held about you; request a copy of your personal data; ask for inaccurate or incomplete information to be corrected; request deletion of personal data where applicable; object to or request restrictions on certain processing; request transfer of personal data where the law provides that right; and raise a complaint with the relevant data protection authority.',
    'To make a privacy request, email support@getneweraapp.com and explain what you need. You may use a subject such as \u201cPrivacy Request: Access\u201d or \u201cPrivacy Request: Deletion\u201d.',
    'New Era may need to verify your identity before responding. Requests will be handled in accordance with applicable law. Some information may be retained where legally required or where another lawful ground applies.',
    'Deleting the app from your device does not necessarily delete your account or information held by New Era. To request account or data deletion, contact support.',
  ]],
  ['8. Children\u2019s Privacy', [
    'New Era is not intended to be used in a way that violates laws protecting children\u2019s personal information. Information relating to children will be handled in accordance with applicable law.',
    'If you believe a child\u2019s personal information has been provided to New Era inappropriately, contact support@getneweraapp.com.',
  ]],
  ['9. External Websites and Services', [
    'New Era may contain links to external websites or services that it does not operate. Those services may have their own privacy policies, and their handling of personal information is governed by their own practices and applicable law.',
  ]],
  ['10. Changes to This Policy', [
    'New Era may update this policy as the platform develops or legal requirements change. The latest version will be made available through the website or app.',
  ]],
  ['11. Contact and Complaints', [
    'For questions about this policy, requests concerning your personal information, or privacy concerns, contact support@getneweraapp.com.',
    'You may also have the right to raise a complaint with the relevant data protection authority under applicable law.',
  ]],
];

export default function Privacy() {
  return (
    <div>
      <Nav />
      <div className="page" style={{ maxWidth: 720 }}>
        <h1>Privacy Policy</h1>
        <p style={{ color: 'var(--color-body-text)' }}>{INTRO}</p>
        {SECTIONS.map(([h, ps]) => (
          <section key={h}>
            <h2>{h}</h2>
            {ps.map((t, j) => (
              <p key={j} style={{ color: 'var(--color-body-text)' }}>{t}</p>
            ))}
          </section>
        ))}
      </div>
      <Footer />
    </div>
  );
}
