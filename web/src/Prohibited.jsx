import React from 'react';
import Nav from './Nav.jsx';
import Back from './Back.jsx';

// TRU-2: prohibited items + conduct. Static policy, day one.
// Keep in step with app/src/components/Prohibited.tsx.
const ITEMS = [
  ['Drugs and controlled substances', 'Illegal drugs, and medicines that need a prescription sold without one.'],
  ['Weapons and explosives', 'Guns, ammunition, explosives, and anything made to harm.'],
  ['Counterfeit and stolen goods', 'Fakes, counterfeit currency or documents, and anything stolen.'],
  ['Money schemes', 'Pyramid and Ponzi schemes, guaranteed-return forex or crypto trading, and unlicensed lending. Never send money to recover winnings or unlock a loan.'],
  ['Fake cures', 'Remedies or devices claimed to cure serious illness without approval.'],
  ['Adult and exploitative services', 'Sexual services, human trafficking, and exploitative labour of any kind.'],
  ['Protected wildlife', 'Ivory, skins, and other products from protected animals.'],
  ['Scams and harassment', 'Advance-fee fraud, impersonation, threats, hate, and spam. Meet in public places where you can, and report anything suspicious.'],
];

export default function Prohibited() {
  return (
    <div>
      <Nav />
      <div className="page" style={{ maxWidth: 720 }}>
        <Back />
        <h1>Prohibited items & conduct</h1>
        <p style={{ color: 'var(--color-body-text)' }}>
          These are never allowed on New Era. Listings that break the rules are
          removed, and accounts behind scams are suspended.
        </p>
        {ITEMS.map(([t, d], j) => (
          <div className="card" key={j} style={{ marginBottom: 8 }}>
            <strong>{t}</strong>
            <p style={{ color: 'var(--color-body-text)', margin: '4px 0 0' }}>{d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
