import { useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';

// ── Pages ──────────────────────────────────────────────────────────────────────
import Registration from './pages/Registration';
import Home from './pages/Home';
import Chat from './pages/Chat';
import Decoder from './pages/Decoder';
import Passbook from './pages/Passbook';
import Products from './pages/Products';
import CorridorEntry from './pages/CorridorEntry';
import ConversationShowcase from './pages/ConversationShowcase';

// ── Data ───────────────────────────────────────────────────────────────────────
import { samjhoCorridor, bachaoCorridor, aageBadhoCorridor } from './data/corridors';
import { samjhaoPriya, bachaoRavi, aageBadhoRavi } from './data/conversations';

// ── Registration gate ─────────────────────────────────────────────────────────
// On every load: check localStorage for "user" key.
// If absent → show Registration once. On submit → normal app.
// AppProvider wraps everything so Decoder + Passbook share session state.

export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); }
    catch { return null; }
  });

  if (!user) {
    return <Registration onComplete={(u) => setUser(u)} />;
  }

  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          {/* ── Primary ── */}
          <Route path="/"                   element={<Home />} />
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
        </Routes>
      </HashRouter>
    </AppProvider>
  );
}
