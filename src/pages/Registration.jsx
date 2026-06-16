// Registration.jsx — one-time registration screen.
// Shown only when localStorage has no "user" key.
// On submit: writes {name, phone} to localStorage and calls onComplete().

import { useState } from 'react';
import PortraitAvatar from '../components/PortraitAvatar';

export default function Registration({ onComplete }) {
  const [name,  setName]  = useState('');
  const [phone, setPhone] = useState('');

  const valid = name.trim().length > 0 && /^\d{10}$/.test(phone.trim());

  const submit = () => {
    if (!valid) return;
    const user = { name: name.trim(), phone: phone.trim() };
    localStorage.setItem('user', JSON.stringify(user));
    onComplete(user);
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100dvh',
      background: '#FFFFFF', padding: '32px 24px',
      maxWidth: '420px', margin: '0 auto',
    }}>
      {/* Avatar */}
      <PortraitAvatar size={80} online={false} ringed />

      {/* Heading */}
      <p style={{
        fontFamily: "'Noto Sans Devanagari','JioType',sans-serif",
        fontSize: '18px', fontWeight: 600, color: '#2C2C2A',
        textAlign: 'center', lineHeight: 1.5,
        margin: '20px 0 28px',
      }}>
        नमस्ते! मैं मुकुंद।<br />शुरू करने से पहले —
      </p>

      {/* Inputs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
        <input
          type="text"
          placeholder="आपका नाम"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && document.getElementById('phone-input')?.focus()}
          style={inputStyle}
        />
        <input
          id="phone-input"
          type="tel"
          inputMode="numeric"
          maxLength={10}
          placeholder="मोबाइल नंबर"
          value={phone}
          onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
          onKeyDown={e => e.key === 'Enter' && valid && submit()}
          style={inputStyle}
        />
      </div>

      {/* Consent */}
      <p style={{
        fontFamily: "'Noto Sans Devanagari','JioType',sans-serif",
        fontSize: '11.5px', color: '#888780', textAlign: 'center',
        margin: '14px 0 20px', lineHeight: 1.5,
      }}>
        कोई फ़ॉर्म नहीं · पैसा नहीं माँगेंगे · आपकी जानकारी सुरक्षित
      </p>

      {/* Submit */}
      <button
        onClick={submit}
        disabled={!valid}
        style={{
          width: '100%', padding: '15px',
          borderRadius: '14px', border: 'none',
          background: valid ? '#534AB7' : '#D8D7D4',
          color: '#FFFFFF',
          fontFamily: "'Noto Sans Devanagari','JioType',sans-serif",
          fontSize: '16px', fontWeight: 700,
          cursor: valid ? 'pointer' : 'not-allowed',
          transition: 'background 0.2s',
        }}
      >
        शुरू करें
      </button>
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '14px 16px',
  borderRadius: '12px',
  border: '1.5px solid #EEEDFE',
  background: '#FAFAFA',
  fontFamily: "'Noto Sans Devanagari','JioType',sans-serif",
  fontSize: '15px', color: '#2C2C2A',
  outline: 'none', boxSizing: 'border-box',
};
