import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';

// ── Pages ──────────────────────────────────────────────────────────────────────
import Home from './pages/Home';
import Chat from './pages/Chat';
import Decoder from './pages/Decoder';
import Passbook from './pages/Passbook';
import Products from './pages/Products';
import PaisaGyaan from './pages/PaisaGyaan';
import CorridorEntry from './pages/CorridorEntry';
import ConversationShowcase from './pages/ConversationShowcase';

// ── Data ───────────────────────────────────────────────────────────────────────
import { samjhoCorridor, bachaoCorridor, aageBadhoCorridor } from './data/corridors';
import {
  samjhaoPriya, bachaoRavi, aageBadhoRavi,
  samjhaoSchemeStatus, samjhaoPaisaKata, samjhaoBinaBataye, samjhaoBeti,
} from './data/conversations';

// ── No registration gate ───────────────────────────────────────────────────────
// The validation factory already captures email/name/phone, so the app boots
// straight to Home — no name/phone landing screen. AppProvider wraps everything
// so Decoder + Passbook share session state.

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          {/* ── Primary — home is the scoped-cards working chat (no gamified onboarding) ── */}
          <Route path="/"                   element={<Home />} />
          <Route path="/chat"               element={<Chat />} />
          <Route path="/decoder"            element={<Decoder />} />
          <Route path="/passbook"           element={<Passbook />} />
          <Route path="/products"           element={<Products />} />
          <Route path="/paisa-gyaan"        element={<PaisaGyaan />} />

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
