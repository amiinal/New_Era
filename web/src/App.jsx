import React from 'react';
import { BrowserRouter, Routes, Route, Link, useParams } from 'react-router-dom';
import './tokens.css';

function Home() {
  return (
    <div className="card" style={{ margin: 24 }}>
      <h1>New Era — Step 0</h1>
      <p>Vite + React. API: {import.meta.env.VITE_API_URL || 'http://localhost:4000'}</p>
      <Link to="/s/mama-cakes">Example storefront /s/mama-cakes</Link><br />
      <Link to="/chat">Web chat</Link><br />
      <Link to="/admin">Admin</Link>
    </div>
  );
}

function Storefront() {
  const { slug } = useParams();
  return <div className="card" style={{ margin: 24 }}><h2>{slug}</h2><p>Public, no login. Full SSR meta via worker/og-tags.js in prod.</p></div>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/s/:slug" element={<Storefront />} />
        <Route path="/chat" element={<div style={{ margin: 24 }}>Web chat stub (Step 6)</div>} />
        <Route path="/admin" element={<div style={{ margin: 24 }}>Admin stub (Step 9)</div>} />
      </Routes>
    </BrowserRouter>
  );
}
