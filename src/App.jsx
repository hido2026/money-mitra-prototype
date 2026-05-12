import { useState, useEffect } from 'react';
import Onboarding from './pages/Onboarding';
import Chat from './pages/Chat';

export default function App() {
  const [persona, setPersona] = useState(() => localStorage.getItem('money_mitra_persona'));

  useEffect(() => {
    if (persona) localStorage.setItem('money_mitra_persona', persona);
  }, [persona]);

  if (!persona) {
    return <Onboarding onSelect={setPersona} />;
  }

  return <Chat persona={persona} onPersonaChange={setPersona} />;
}
