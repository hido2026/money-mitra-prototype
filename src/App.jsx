import { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';

// ── Pages ──────────────────────────────────────────────────────────────────────
import Registration from './pages/Registration';
import Onboarding from './pages/Onboarding';
import Home from './pages/Home';
import Chat from './pages/Chat';
import Decoder from './pages/Decoder';
import Passbook from './pages/Passbook';
import Products from './pages/Products';
import CorridorEntry from './pages/CorridorEntry';
import ConversationShowcase from './pages/ConversationShowcase';

// ── Data ───────────────────────────────────────────────────────────────────────
import { samjhoCorridor, bachaoCorridor, aageBadhoCorridor } from './data/corridors';
import {
  samjhaoPriya, bachaoRavi, aageBadhoRavi,
  samjhaoSchemeStatus, samjhaoPaisaKata, samjhaoBinaBataye, samjhaoBeti,
} from './data/conversations';

// ── Registration gate ─────────────────────────────────────────────────────────
// On every load: check localStorage for "user" key.
// If absent → show Registration once. On submit → normal app.
// AppProvider wraps everything so Decoder + Passbook share session state.

export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); }
    catch { return null; }
  });

  // First-run onboarding flag — shown once after registration, then never again.
  const [onboarded, setOnboarded] = useState(() => localStorage.getItem('mm_onboarded') === '1');

  if (!user) {
    return <Registration onComplete={(u) => setUser(u)} />;
  }

  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          {/* ── First-run onboarding gate: land on /onboarding until completed ── */}
          <Route path="/onboarding"         element={<Onboarding onDone={() => setOnboarded(true)} />} />

          {/* ── Primary ── */}
          <Route path="/"                   element={onboarded ? <Home /> : <Navigate to="/onboarding" replace />} />
          <Route path="/chat"               element={<Chat />} />
          <Route path="/decoder"            element={<Decoder />} />
          <Route path="/passbook"           element={<Passbook />} />
          <Route path="/products"           element={<Products />} />

          {/* ── Legacy corridors (still reachable, not on home) ── */}
          <Route path="/samjho-entry"       element={<CorridorEntry corridor={samjhoCorridor} />} />
          <Route path="/bachao-entry"       element={<CorridorEntry corridor={bachaoCorridor} />} />
          <Route path="/aage-badho-entry"   element={<CorridorEntry corridor={aageBadhoCorridor} />} />

          {/* ── Scripted deck showcases — DO NOT TOUCH ── */}
          <Route path="/samjhao-priya"      element={<ConversationShowcase conversation={samjhaoPriya} />} />
          <Route path="/bachao-ravi"        element={<ConversationShowcase conversation={bachaoRavi} />} />
          <Route path="/aage-badho-ravi"    element={<ConversationShowcase conversation={aageBadhoRavi} />} />

          {/* ── Samjhao seed cards v2 — compliance-checked (Jun 2026) ── */}
          <Route path="/samjhao-scheme-status" element={<ConversationShowcase conversation={samjhaoSchemeStatus} />} />
          <Route path="/samjhao-paisa-kata"    element={<ConversationShowcase conversation={samjhaoPaisaKata} />} />
          <Route path="/samjhao-bina-bataye"   element={<ConversationShowcase conversation={samjhaoBinaBataye} />} />
          <Route path="/samjhao-beti"          element={<ConversationShowcase conversation={samjhaoBeti} />} />
        </Routes>
      </HashRouter>
    </AppProvider>
  );
}
