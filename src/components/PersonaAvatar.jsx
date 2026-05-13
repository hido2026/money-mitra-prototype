// PersonaAvatar — real portrait with purple-circle fallback
// Props:
//   persona    "Mukund" | "Meera"
//   size       "sm" (32px) | "md" (56px) | "lg" (80px) | "xl" (120px)
//   isTyping   bool — pulses avatar border while Mukund is responding
//   shadow     bool — soft drop shadow (welcome screen only)

import { useState } from 'react';

const SIZE = {
  sm: { box: '32px', font: '13px' },
  md: { box: '56px', font: '20px' },
  lg: { box: '80px', font: '28px' },
  xl: { box: '120px', font: '38px' },
};

// Resolve portrait path relative to Vite base (works on both dev and GitHub Pages)
const PORTRAIT_SRC = `${import.meta.env.BASE_URL}mukund.jpg`;

export default function PersonaAvatar({ persona, size = 'md', isTyping = false, shadow = false }) {
  const [imgError, setImgError] = useState(false);
  const { box, font } = SIZE[size] ?? SIZE.md;

  const bg = persona === 'Mukund' ? 'var(--jds-surface-bold)' : 'var(--jds-sparkle-50)';
  const initials = persona === 'Mukund' ? 'Mu' : 'Me';

  // Only Mukund has a portrait right now
  const showImage = persona === 'Mukund' && !imgError;

  const containerStyle = {
    width: box,
    height: box,
    minWidth: box,
    borderRadius: '50%',
    overflow: 'hidden',
    flexShrink: 0,
    // Typing pulse — subtle indigo ring glow
    animation: isTyping ? 'avatar-typing-pulse 1.4s ease-in-out infinite' : undefined,
    // Welcome-screen depth shadow
    boxShadow: shadow
      ? '0 8px 28px rgba(57, 0, 173, 0.18), 0 2px 8px rgba(0,0,0,0.10)'
      : undefined,
    position: 'relative',
  };

  return (
    <div style={containerStyle}>
      {showImage ? (
        <img
          src={PORTRAIT_SRC}
          alt="Mukund"
          loading="eager"
          fetchpriority="high"
          onError={() => setImgError(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center top',
            display: 'block',
          }}
        />
      ) : (
        // Fallback: original purple circle with initials
        <div style={{
          width: '100%',
          height: '100%',
          background: bg,
          color: 'var(--jds-text-on-bold)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'JioType', sans-serif",
          fontWeight: 700,
          fontSize: font,
          userSelect: 'none',
        }}>
          {initials}
        </div>
      )}
    </div>
  );
}
