import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Search, X } from 'lucide-react';
import Nav from './Nav.jsx';
import Back from './Back.jsx';
import Footer from './Footer.jsx';
import { api, API, recordEvent } from './lib.js';
import { COUNTRIES } from './countries.js';

const CATEGORIES = ['Fashion', 'Beauty', 'Food', 'Home', 'Electronics', 'Services'];
const img = (k) => (!k ? null : (/^https?:\/\//.test(k) ? k : `${API}/img/${k}`));

// Public Discover mirrors the app: static header (title + location pill +
// search), filter sheet (query, city, country, tags), stacked business
// cards. Blue actions, never orange.
export default function Discover() {
  const [country, setCountry] = useState('NG');
  const [city, setCity] = useState('');
  const [q, setQ] = useState('');
  const [cats, setCats] = useState([]);
  const [items, setItems] = useState(null);
  const [failed, setFailed] = useState(false);
  const [nearby, setNearby] = useState(null);
  const [seenCats, setSeenCats] = useState([]);
  const [seenCities, setSeenCities] = useState([]);
  const [sheet, setSheet] = useState(false);
  const [dQ, setDQ] = useState('');
  const [dCity, setDCity] = useState('');
  const [dCountry, setDCountry] = useState('NG');
  const [dCats, setDCats] = useState([]);
  const [countryQ, setCountryQ] = useState('');
  const [countryOpen, setCountryOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);

  const growCats = (rows, prev) => {
    const next = [...prev];
    for (const b of rows) {
      if (b.category && !CATEGORIES.includes(b.category) && !next.includes(b.category)) next.push(b.category);
    }
    return next;
  };
  const growCities = (rows, prev) => {
    const next = [...prev];
    for (const b of rows) {
      if (b.city && !next.includes(b.city)) next.push(b.city);
    }
    return next.slice(0, 8);
  };
  const runLoad = async (scope) => {
    setNearby(null);
    try {
      const wanted = (scope.cats || []).filter(Boolean);
      const queries = wanted.length > 0 ? wanted : [undefined];
      const batches = await Promise.all(queries.map((cat) => {
        const params = new URLSearchParams({ country: scope.country });
        if (scope.city) params.set('city', scope.city);
        if (scope.q) params.set('q', scope.q);
        if (cat) params.set('category', cat);
        return api(`/discover?${params}`);
      }));
      const seen = new Map();
      for (const rows of batches) for (const b of rows) seen.set(b.id, b);
      const rows = [...seen.values()];
      setItems(rows);
      setFailed(false);
      setSeenCats((prev) => growCats(rows, prev));
      setSeenCities((prev) => growCities(rows, prev));
      if (scope.city && rows.length === 0) {
        try {
          const nearBatches = await Promise.all(queries.map((cat) => {
            const params = new URLSearchParams({ country: scope.country });
            if (scope.q) params.set('q', scope.q);
            if (cat) params.set('category', cat);
            return api(`/discover?${params}`);
          }));
          const nearSeen = new Map();
          for (const list of nearBatches) for (const b of list) nearSeen.set(b.id, b);
          const near = [...nearSeen.values()];
          setNearby(near);
          setSeenCats((prev) => growCats(near, prev));
          setSeenCities((prev) => growCities(near, prev));
        } catch { setNearby([]); }
      } else {
        setNearby([]);
      }
      recordEvent('search', {
        country: scope.country,
        ...(scope.city ? { city: scope.city } : {}),
        ...(scope.q ? { q: scope.q } : {}),
        ...(wanted.length > 0 ? { category: wanted.join(',') } : {}),
      });
    } catch {
      setItems([]);
      setNearby([]);
      setFailed(true);
    }
  };
  const load = () => {
    runLoad({
      country,
      ...(city ? { city } : {}), ...(q ? { q } : {}), ...(cats.length > 0 ? { cats } : {}),
    });
  };
  useEffect(() => { load(); }, []);

  // Real location first: browser GPS → city + country. Silent fallback.
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const r = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&localityLanguage=en`,
        );
        const g = await r.json();
        if (g?.countryCode && COUNTRIES.some((c) => c.code === g.countryCode)) {
          setCountry(g.countryCode);
          setDCountry(g.countryCode);
        }
        const detected = g?.city || '';
        if (detected) {
          setCity(detected);
          setDCity(detected);
          load();
        }
      } catch { /* keep defaults */ }
    }, () => {}, { timeout: 8000 });
  }, []);

  const openSheet = () => {
    setDQ(q);
    setDCity(city);
    setDCountry(country);
    setDCats(cats);
    setCountryQ('');
    setCountryOpen(false);
    setCityOpen(false);
    setSheet(true);
  };
  const applySheet = () => {
    setQ(dQ);
    setCity(dCity);
    setCountry(dCountry);
    setCats(dCats);
    setCountryOpen(false);
    setCityOpen(false);
    setSheet(false);
    runLoad({
      country: dCountry,
      ...(dCity ? { city: dCity } : {}), ...(dQ ? { q: dQ } : {}), ...(dCats.length > 0 ? { cats: dCats } : {}),
    });
  };
  const clearFilters = () => {
    setQ('');
    setCats([]);
    setSheet(false);
    runLoad({ country, ...(city ? { city } : {}) });
  };

  const countryName = COUNTRIES.find((c) => c.code === country)?.name ?? country;
  const draftCountryName = COUNTRIES.find((c) => c.code === dCountry)?.name ?? dCountry;
  const countryMatches = COUNTRIES.filter((c) =>
    c.name.toLowerCase().includes(countryQ.trim().toLowerCase()),
  ).slice(0, 8);
  const cityMatches = seenCities.filter((c) =>
    c.toLowerCase().includes(dCity.trim().toLowerCase()),
  ).slice(0, 8);
  const here = (b) => city && b.city && b.city.toLowerCase() === city.toLowerCase();

  const bizCard = (b) => (
    <div key={b.id}>
      <Link to={`/s/${b.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="card">
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {b.logoKey ? (
              <img src={img(b.logoKey)} alt="" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
            ) : (
              <div className="avatar" style={{ width: 48, height: 48, fontSize: 20, flexShrink: 0, margin: 0 }}>
                {(b.name || '?').slice(0, 1).toUpperCase()}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ margin: '0 0 4px' }}>{b.name}</h3>
              <p style={{ fontSize: 13, color: 'var(--color-body-text)', margin: 0 }}>
                {b.category} · {b.city}, {b.country}
              </p>
              {here(b) ? (
                <p style={{ fontSize: 12, color: 'var(--color-primary)', fontWeight: 700, margin: '2px 0 0' }}>
                  In {b.city}
                </p>
              ) : null}
              {(b.matchedListings?.length ?? 0) > 0 ? (
                <p style={{ fontSize: 13, color: 'var(--color-body-text)', margin: '4px 0 0' }}>
                  Matches: {b.matchedListings.join(' · ')}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </Link>
      {(b.previewPhotos?.length ?? 0) > 0 ? (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginTop: 8, paddingBottom: 4 }}>
          {b.previewPhotos.slice(0, 5).map((u) => (
            <Link key={u} to={`/s/${b.slug}`} style={{ flexShrink: 0 }}>
              <img src={img(u)} alt="" style={{ width: 120, height: 120, borderRadius: 12, objectFit: 'cover' }} />
            </Link>
          ))}
          <Link to={`/s/${b.slug}`} style={{
            flexShrink: 0, width: 96, height: 120,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8,
            color: 'var(--color-primary)', fontWeight: 700, fontSize: 14, textAlign: 'center',
            textDecoration: 'underline', textUnderlineOffset: 3,
          }}>
            See more ›
          </Link>
        </div>
      ) : null}
    </div>
  );
  const emptyCard = (
    <div className="card">
      <p style={{ textAlign: 'center', color: 'var(--color-body-text)' }}>
        No matches here — try widening the city or clearing tags.
      </p>
      <button className="btn btn-blue" onClick={clearFilters}>Clear filters</button>
    </div>
  );

  return (
    <div>
      <Nav />
      <div className="page">
        <Back />
        <div className="disc-head">
          <h1>Discover</h1>
          <button className="pill-text" onClick={openSheet}>
            <MapPin size={14} /> {city ? `${city}, ` : ''}{countryName}
          </button>
        </div>
        <button className="searchbar" onClick={openSheet}>
          <span className="searchbar-icon"><Search size={16} color="#fff" /></span>
          <span className="searchbar-hint">
            {q || (cats.length > 0 ? `${cats.join(' + ')} near ${city || countryName}` : 'Search businesses…')}
          </span>
        </button>
        {items === null ? (
          <div className="card">Loading…</div>
        ) : failed ? (
          <div className="card">
            <p style={{ textAlign: 'center', color: 'var(--color-body-text)' }}>Couldn&apos;t load — check your connection.</p>
            <button className="btn btn-blue" onClick={() => load()}>Retry</button>
          </div>
        ) : city && items.length === 0 ? (
          nearby === null ? (
            <div className="card">Loading…</div>
          ) : nearby.length > 0 ? (
            <div>
              <h2>Nothing in {city} yet</h2>
              <p style={{ color: 'var(--color-body-text)', fontSize: 14, marginTop: 0 }}>Nearby stores instead.</p>
              {nearby.map((b) => bizCard(b))}
            </div>
          ) : (
            emptyCard
          )
        ) : items.length === 0 ? (
          emptyCard
        ) : (
          <div className="disc-list">{items.map((b) => bizCard(b))}</div>
        )}
      </div>
      {sheet ? (
        <div className="sheet-scrim" onClick={() => setSheet(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-head">
              <h2>Find businesses</h2>
              <button className="sheet-x" onClick={() => setSheet(false)} aria-label="Close">
                <X size={20} />
              </button>
            </div>
            <input className="input" placeholder="What are you looking for?" value={dQ}
              onChange={(e) => setDQ(e.target.value)} autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') applySheet(); }} style={{ width: '100%' }} />
            <label className="lbl">City</label>
            <input className="input" placeholder="Search by city" value={dCity}
              onFocus={() => setCityOpen(true)}
              onChange={(e) => { setDCity(e.target.value); setCityOpen(true); }}
              style={{ width: '100%' }} />
            {cityOpen ? (
              <div className="drop">
                {dCity.trim() ? (
                  <button key="__use" className="drop-item" onClick={() => setCityOpen(false)}>
                    Use “{dCity.trim()}”
                  </button>
                ) : null}
                {cityMatches.filter((c) => c.toLowerCase() !== dCity.trim().toLowerCase()).map((c) => (
                  <button key={c} className="drop-item" onClick={() => { setDCity(c); setCityOpen(false); }}>{c}</button>
                ))}
                {dCity.trim() === '' && cityMatches.length === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--color-body-text)', padding: '8px 16px', margin: 0 }}>
                    Saved cities appear here — or just type it.
                  </p>
                ) : null}
              </div>
            ) : null}
            <label className="lbl">Country</label>
            <input className="input" placeholder={draftCountryName} value={countryQ}
              onFocus={() => { setCountryQ(''); setCountryOpen(true); }}
              onChange={(e) => { setCountryQ(e.target.value); setCountryOpen(true); }}
              style={{ width: '100%' }} />
            {countryOpen ? (
              <div className="drop">
                {countryMatches.map((c) => (
                  <button key={c.code} className={`drop-item ${dCountry === c.code ? 'on' : ''}`}
                    onClick={() => { setDCountry(c.code); setCountryQ(''); setCountryOpen(false); }}>
                    {dCountry === c.code ? '✓ ' : ''}{c.name}
                  </button>
                ))}
                {countryMatches.length === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--color-body-text)', padding: '8px 16px', margin: 0 }}>
                    No match — try another spelling.
                  </p>
                ) : null}
              </div>
            ) : null}
            <h3>Categories <span className="subtle">— pick as many as you like</span></h3>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['', ...CATEGORIES, ...seenCats.filter((c) => !CATEGORIES.includes(c))].map((c) => {
                const on = c === '' ? dCats.length === 0 : dCats.includes(c);
                return (
                  <button key={c || 'all'} className={`fchip ${on ? 'on' : ''}`}
                    onClick={() => {
                      if (c === '') setDCats([]);
                      else setDCats(on ? dCats.filter((x) => x !== c) : [...dCats, c]);
                    }}>
                    {c || 'All'}
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 20, marginBottom: 8 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setSheet(false)}>Cancel</button>
              <button className="btn" style={{ flex: 2 }} onClick={applySheet}>Apply</button>
            </div>
          </div>
        </div>
      ) : null}
      <Footer />
    </div>
  );
}
