import { HashRouter, Routes, Route } from 'react-router-dom';
import Chat from './pages/Chat';
import ConversationShowcase from './pages/ConversationShowcase';
import { samjhaoPriya, bachaoRavi, aageBadhoRavi } from './data/conversations';

// Routes:
//   /                       → Live Mukund chat
//   /#/samjhao-priya        → Scripted showcase 1
//   /#/bachao-ravi          → Scripted showcase 2
//   /#/aage-badho-ravi      → Scripted showcase 3
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/"                  element={<Chat />} />
        <Route path="/samjhao-priya"     element={<ConversationShowcase conversation={samjhaoPriya} />} />
        <Route path="/bachao-ravi"       element={<ConversationShowcase conversation={bachaoRavi} />} />
        <Route path="/aage-badho-ravi"   element={<ConversationShowcase conversation={aageBadhoRavi} />} />
      </Routes>
    </HashRouter>
  );
}
