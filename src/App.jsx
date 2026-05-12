import { useState, useEffect } from 'react';
import Onboarding from './pages/Onboarding';
import Chat from './pages/Chat';

export default function App() {
  const [persona, setPersona] = useState(
    () => localStorage.getItem('money_mitra_persona')
  );

  const handleSelect = (p) => {
    localStorage.setItem('money_mitra_persona', p);
    setPersona(p);
  };

  const handleBack = () => {
    localStorage.removeItem('money_mitra_persona');
    setPersona(null);
  };

  useEffect(() => {
    if (!persona) localStorage.removeItem('money_mitra_persona');
  }, [persona]);

  if (!persona) {
    return <Onboarding onSelect={handleSelect} />;
  }

  return (
    <Chat
      persona={persona}
      onPersonaChange={handleSelect}
      onBack={handleBack}
    />
  );
}
