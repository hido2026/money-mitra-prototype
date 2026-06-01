import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';

// ── Pages ──────────────────────────────────────────────────────────────────────
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

// ── Routes ─────────────────────────────────────────────────────────────────────
// AppProvider wraps everything so Decoder and Passbook share session state
// (entries, sessionDecodes, goal) for the insight engine.
// Reload resets all state — by design, no localStorage.

export default function App() {
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

          {/* ── Legacy corridors ── */}
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
