import { HashRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Chat from './pages/Chat';
import CorridorEntry from './pages/CorridorEntry';
import ConversationShowcase from './pages/ConversationShowcase';
import { samjhoCorridor, bachaoCorridor, aageBadhoCorridor } from './data/corridors';
import { samjhaoPriya, bachaoRavi, aageBadhoRavi } from './data/conversations';

// Routes:
//   /                       → Hindi-first home v11
//   /chat                   → Live Mukund chat (Groq, free-text fallback)
//   /samjho-entry           → Cold-entry corridor (purple)
//   /bachao-entry           → Cold-entry corridor (coral)
//   /aage-badho-entry       → Cold-entry corridor (green)
//   /samjhao-priya          → Existing scripted showcase (DO NOT TOUCH)
//   /bachao-ravi            → Existing scripted showcase (DO NOT TOUCH)
//   /aage-badho-ravi        → Existing scripted showcase (DO NOT TOUCH)
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/"                     element={<Home />} />
        <Route path="/chat"                 element={<Chat />} />

        <Route path="/samjho-entry"         element={<CorridorEntry corridor={samjhoCorridor} />} />
        <Route path="/bachao-entry"         element={<CorridorEntry corridor={bachaoCorridor} />} />
        <Route path="/aage-badho-entry"     element={<CorridorEntry corridor={aageBadhoCorridor} />} />

        <Route path="/samjhao-priya"        element={<ConversationShowcase conversation={samjhaoPriya} />} />
        <Route path="/bachao-ravi"          element={<ConversationShowcase conversation={bachaoRavi} />} />
        <Route path="/aage-badho-ravi"      element={<ConversationShowcase conversation={aageBadhoRavi} />} />
      </Routes>
    </HashRouter>
  );
}
