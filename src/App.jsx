import { HashRouter, Routes, Route } from 'react-router-dom';

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

// ── Route map ──────────────────────────────────────────────────────────────────
// /                     → Home v12 (Decoder + Passbook + Products)
// /chat                 → Live Mukund Groq chat
// /decoder              → Document Decoder (simulated OCR)
// /passbook             → Money Passbook (in-memory in/out/balance)
// /products             → JFS Products grid
//
// Legacy corridors (reachable via /#/samjho-entry etc., not on home):
// /samjho-entry         → Samjho cold-entry corridor
// /bachao-entry         → Bachao cold-entry corridor
// /aage-badho-entry     → Aage Badho cold-entry corridor
//
// Scripted showcases — DO NOT TOUCH:
// /samjhao-priya        → MSSC scripted flow (deck showcase)
// /bachao-ravi          → UPI fraud scripted flow (deck showcase)
// /aage-badho-ravi      → SIP goal scripted flow (deck showcase)

export default function App() {
  return (
    <HashRouter>
      <Routes>
        {/* ── Primary routes ── */}
        <Route path="/"                   element={<Home />} />
        <Route path="/chat"               element={<Chat />} />
        <Route path="/decoder"            element={<Decoder />} />
        <Route path="/passbook"           element={<Passbook />} />
        <Route path="/products"           element={<Products />} />

        {/* ── Legacy corridors ── */}
        <Route path="/samjho-entry"       element={<CorridorEntry corridor={samjhoCorridor} />} />
        <Route path="/bachao-entry"       element={<CorridorEntry corridor={bachaoCorridor} />} />
        <Route path="/aage-badho-entry"   element={<CorridorEntry corridor={aageBadhoCorridor} />} />

        {/* ── Scripted deck showcases — unchanged ── */}
        <Route path="/samjhao-priya"      element={<ConversationShowcase conversation={samjhaoPriya} />} />
        <Route path="/bachao-ravi"        element={<ConversationShowcase conversation={bachaoRavi} />} />
        <Route path="/aage-badho-ravi"    element={<ConversationShowcase conversation={aageBadhoRavi} />} />
      </Routes>
    </HashRouter>
  );
}
