import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { radius, shadow, space, type } from '../theme';
import { Button } from './Button';
import { Palette, useTheme } from '../useTheme';

// App copy of the platform Terms + Privacy Policy (TRU legal).
// Source of truth is the user-drafted text (Oct 2026); the marketing
// site's /terms + /privacy pages carry the short-form version.
export type LegalSection = { h: string; ps: string[] };

export const TERMS_INTRO = 'New Era helps people discover businesses, explore products and services, and communicate directly with businesses. These Terms of Use explain the rules that apply when you use the New Era website, app, storefronts, listings, and messaging features.';

export const TERMS: LegalSection[] = [
  {
    h: '1. Using New Era',
    ps: [
      'New Era provides tools for discovering businesses, viewing products and services, creating business storefronts, publishing listings, and communicating with other users.',
      'You are responsible for your account, the information you provide, and the activities you carry out through the platform.',
      'You must use New Era lawfully, honestly, and in a way that respects other users.',
    ],
  },
  {
    h: '2. Business Listings and Honest Information',
    ps: [
      'Businesses must provide accurate and up to date information about the products and services they offer.',
      'Listings should clearly describe the product or service, its price where applicable, its availability, and any important conditions. Images and descriptions must not mislead customers about what is being offered.',
      'Businesses must not advertise products or services they do not genuinely offer, make false claims, misrepresent their identity, or conceal important information from customers.',
      'Businesses are responsible for complying with applicable laws and for honouring the offers and commitments they make to customers.',
    ],
  },
  {
    h: '3. Prohibited Items and Conduct',
    ps: [
      'New Era must not be used to facilitate unlawful activity, fraud, scams, or the sale or promotion of prohibited goods and services.',
      'You must not: publish false, deceptive, or misleading listings; sell stolen, counterfeit, or unlawful goods; impersonate another person or business; harass, threaten, exploit, or defraud other users; publish private information without a lawful basis; infringe another person\u2019s intellectual property rights; send spam, distribute malicious software, or interfere with the platform; or manipulate listings or misuse platform features to deceive other users.',
      'New Era may remove content, restrict features, suspend accounts, or terminate access where there is a reasonable basis to believe these terms have been violated, where required by law, or where action is necessary to protect users or the platform.',
    ],
  },
  {
    h: '4. Buying and Selling',
    ps: [
      'New Era helps customers find businesses and communicate with them. It does not ordinarily act as the seller or buyer in transactions arranged between users.',
      'Unless New Era expressly provides a separate service for a particular transaction, customers and businesses are responsible for agreeing directly on prices, payment methods, delivery or collection, availability, returns, refunds, warranties, and other transaction details.',
      'Businesses are responsible for the products and services they offer and for fulfilling their obligations to customers. Customers should assess listings carefully and take reasonable precautions before making payments or sharing sensitive information.',
      'New Era may take action against reported misconduct, but it does not guarantee the identity, reliability, conduct, or performance of every user or business, nor the successful completion of every transaction.',
      'Nothing in these terms excludes or limits any responsibility or consumer right that cannot lawfully be excluded or limited.',
    ],
  },
  {
    h: '5. Your Content',
    ps: [
      'You are responsible for the content you publish or send through New Era, including business information, product descriptions, photographs, and messages.',
      'You must have the necessary rights or permissions to use the content you publish.',
      'You retain ownership of content you own. By submitting content, you permit New Era to host, display, reproduce, and use it as reasonably necessary to operate and provide the platform, including displaying your listings to potential customers.',
      'You must not publish content that is unlawful, deceptive, abusive, or in violation of another person\u2019s rights.',
    ],
  },
  {
    h: '6. Reporting and Account Restrictions',
    ps: [
      'Users may report suspicious listings, inappropriate content, or conduct that appears to violate these terms.',
      'New Era may review reports and take reasonable action, including removing listings or content, restricting features, suspending accounts, or closing accounts.',
      'Where appropriate, a user may contact support to ask about a restriction or raise a concern.',
    ],
  },
  {
    h: '7. Platform Availability and Changes',
    ps: [
      'New Era aims to provide a reliable service, but access may be interrupted by maintenance, technical issues, security incidents, or circumstances outside its reasonable control.',
      'Features and services may change as New Era develops. Where a change materially affects users\u2019 rights or use of the platform, New Era will handle it in accordance with applicable law.',
    ],
  },
  {
    h: '8. Intellectual Property',
    ps: [
      'New Era\u2019s name, branding, interface, and original platform materials are protected by applicable intellectual property laws.',
      'You may not copy, reproduce, distribute, or commercially exploit protected New Era materials without permission, except where permitted by law.',
    ],
  },
  {
    h: '9. Responsibility and Disputes',
    ps: [
      'New Era provides discovery and communication tools. It does not guarantee that every listing is accurate, every business is genuine, or every product or service will meet a customer\u2019s expectations.',
      'Disputes arising from transactions arranged directly between customers and businesses should ordinarily be addressed by the parties involved. New Era may assist with platform reports or take action under these terms, but does not guarantee that it can resolve private transaction disputes.',
      'This section does not remove any legal responsibility that applies to New Era itself or any rights that users have under applicable law.',
    ],
  },
  {
    h: '10. Changes to These Terms',
    ps: [
      'New Era may update these terms to reflect changes to the platform, its services, or applicable law. The latest version will be published through the website or app.',
    ],
  },
  {
    h: '11. Applicable Law',
    ps: [
      'These terms are subject to applicable law. Nigerian law applies where relevant, without excluding mandatory legal protections that may apply to users in other jurisdictions.',
    ],
  },
  {
    h: '12. Contact',
    ps: [
      'For questions about these terms, listings, account restrictions, or use of New Era, contact support@newera.shop.',
    ],
  },
];

export const PRIVACY_INTRO = 'New Era recognises the importance of privacy. This policy explains the personal information that may be collected when you use New Era, how that information is used and shared, and the rights you may have regarding your information.';

export const PRIVACY: LegalSection[] = [
  {
    h: '1. Information We Collect',
    ps: [
      'The information we collect depends on how you use New Era.',
      'Account and contact information: we may collect information you provide when creating or managing an account, such as your name, email address, phone number, and other account details.',
      'Business and listing information: if you create a business storefront, we may collect your business name, category, general location, product or service descriptions, photographs, prices, availability, and other information you choose to publish.',
      'Messages and communications: we process messages, images, and other content sent through New Era, along with information needed to deliver conversations, provide support, and address reports or complaints.',
      'Usage and technical information: we may collect basic information about how the platform is used, such as searches, listings viewed, interactions, device or browser information, technical logs, and information used to diagnose errors or maintain security.',
      'Support and safety information: if you contact support, report a listing, or raise a safety concern, we may process the information you provide and information relevant to handling the issue.',
    ],
  },
  {
    h: '2. How We Use Information',
    ps: [
      'New Era uses personal information for purposes connected with providing and maintaining the platform, including to: create and manage user accounts; display storefronts, products, and services; help customers discover relevant businesses and listings; enable conversations between customers and businesses; respond to enquiries, complaints, and support requests; investigate suspected fraud, abuse, or violations of platform rules; maintain security, diagnose technical problems, and improve the service; and comply with applicable legal obligations.',
      'Personal information is processed in accordance with applicable data protection law and for legitimate, specified purposes.',
    ],
  },
  {
    h: '3. Public and Private Information',
    ps: [
      'Business names, storefront details, listings, photographs, and other information published on a storefront may be visible to people using New Era.',
      'Messages sent through New Era are intended for the participants in the conversation and are not public listings. Users should nevertheless exercise care when sharing sensitive personal or financial information in messages.',
      'New Era\u2019s intended discovery experience uses general area information rather than publicly displaying a user\u2019s exact residential address. If you choose to include an exact address or other private details in a public listing or message, those details may be visible to people who can access that content.',
      'You are responsible for considering what information you choose to publish or share.',
    ],
  },
  {
    h: '4. How Information Is Shared',
    ps: [
      'New Era may share information where reasonably necessary to provide and protect the service, including: with the person or business you contact, where needed to enable communication; with service providers that support the operation, maintenance, or security of New Era; where necessary to investigate fraud, protect users, or address security incidents; where disclosure is required or permitted by applicable law; and in connection with a business transfer or restructuring, subject to applicable legal protections.',
      'Information is shared only for relevant purposes and in accordance with applicable law.',
    ],
  },
  {
    h: '5. Data Retention',
    ps: [
      'New Era retains personal information for as long as reasonably necessary for the purposes described in this policy, including providing the service, maintaining appropriate records, addressing disputes or security issues, and complying with legal obligations.',
      'Where information is no longer needed, it may be deleted or otherwise handled in accordance with applicable law. Some information may need to be retained where a legal obligation or other lawful reason applies.',
    ],
  },
  {
    h: '6. Information Security',
    ps: [
      'New Era takes reasonable steps to protect personal information against unauthorised access, loss, misuse, alteration, or disclosure.',
      'No online service can guarantee absolute security. Users should protect their account details and contact New Era if they believe their account or information has been compromised.',
    ],
  },
  {
    h: '7. Your Privacy Rights',
    ps: [
      'Depending on applicable law and the circumstances, you may have the right to: request information about how your personal data is processed; request access to personal data held about you; request a copy of your personal data; ask for inaccurate or incomplete information to be corrected; request deletion of personal data where applicable; object to or request restrictions on certain processing; request transfer of personal data where the law provides that right; and raise a complaint with the relevant data protection authority.',
      'To make a privacy request, email support@newera.shop and explain what you need. You may use a subject such as \u201cPrivacy Request: Access\u201d or \u201cPrivacy Request: Deletion\u201d.',
      'New Era may need to verify your identity before responding. Requests will be handled in accordance with applicable law. Some information may be retained where legally required or where another lawful ground applies.',
      'Deleting the app from your device does not necessarily delete your account or information held by New Era. To request account or data deletion, contact support.',
    ],
  },
  {
    h: '8. Children\u2019s Privacy',
    ps: [
      'New Era is not intended to be used in a way that violates laws protecting children\u2019s personal information. Information relating to children will be handled in accordance with applicable law.',
      'If you believe a child\u2019s personal information has been provided to New Era inappropriately, contact support@newera.shop.',
    ],
  },
  {
    h: '9. External Websites and Services',
    ps: [
      'New Era may contain links to external websites or services that it does not operate. Those services may have their own privacy policies, and their handling of personal information is governed by their own practices and applicable law.',
    ],
  },
  {
    h: '10. Changes to This Policy',
    ps: [
      'New Era may update this policy as the platform develops or legal requirements change. The latest version will be made available through the website or app.',
    ],
  },
  {
    h: '11. Contact and Complaints',
    ps: [
      'For questions about this policy, requests concerning your personal information, or privacy concerns, contact support@getneweraapp.com.',
      'You may also have the right to raise a complaint with the relevant data protection authority under applicable law.',
    ],
  },
];

export function LegalReader({ doc, onClose }: { doc: 'terms' | 'privacy'; onClose: () => void }) {
  const { p } = useTheme();
  const s = themed(p);
  const title = doc === 'terms' ? 'Terms of Use' : 'Privacy Policy';
  const intro = doc === 'terms' ? TERMS_INTRO : PRIVACY_INTRO;
  const sections = doc === 'terms' ? TERMS : PRIVACY;
  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <ScrollView style={s.root} contentContainerStyle={s.colWrap}>
        <View style={s.col}>
          <Text style={s.h1}>{title}</Text>
          <Text style={s.micro}>{intro}</Text>
          {sections.map(sec => (
            <View key={sec.h} style={s.card}>
              <Text style={s.t}>{sec.h}</Text>
              {sec.ps.map((t, j) => (
                <Text key={j} style={s.answer}>{t}</Text>
              ))}
            </View>
          ))}
          <View style={{ height: space.s4 }} />
          <Button title="Close" variant="secondary" onPress={onClose} />
        </View>
      </ScrollView>
    </Modal>
  );
}

const themed = (p: Palette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: p.background },
  colWrap: { flexGrow: 1, alignItems: 'center' },
  col: { width: '100%', maxWidth: 720, padding: space.s5 },
  h1: { ...type.h1, color: p.ink, marginBottom: space.s2 },
  micro: { ...type.bodySm, color: p.bodyText, marginBottom: space.s3 },
  card: { backgroundColor: p.surface, borderRadius: radius.lg, padding: space.s4, marginBottom: space.s2, ...shadow.md },
  t: { ...type.body, color: p.ink, fontWeight: '600' },
  answer: { ...type.bodySm, color: p.bodyText, marginTop: space.s2 },
});
