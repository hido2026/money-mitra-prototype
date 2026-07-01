// PersonaAvatar — real portrait with purple-circle fallback
// Props:
//   persona    "Mukund" | "Meera"
//   size       "sm" (32px) | "md" (56px) | "lg" (80px) | "xl" (120px)
//   isTyping   bool — pulses avatar border while Mukund is responding
// JDS: no shadows (Hard Rule §9) — flat, tokens only.

import { useState } from 'react';

const SIZE = {
  sm: { box: 'size-8', font: 'text-[13px]' },
  md: { box: 'size-14', font: 'text-xl' },
  lg: { box: 'size-20', font: 'text-[28px]' },
  xl: { box: 'size-30', font: 'text-[38px]' },
};

// Resolve portrait path relative to Vite base (works on both dev and GitHub Pages)
const PORTRAIT_SRC = `${import.meta.env.BASE_URL}mukund.jpg`;

export default function PersonaAvatar({ persona, size = 'md', isTyping = false }) {
  const [imgError, setImgError] = useState(false);
  const { box, font } = SIZE[size] ?? SIZE.md;

  const bgClass = persona === 'Mukund' ? 'bg-primary-50' : 'bg-[var(--jds-sparkle-50)]';
  const initials = persona === 'Mukund' ? 'Mu' : 'Me';

  // Only Mukund has a portrait right now
  const showImage = persona === 'Mukund' && !imgError;

  return (
    <div
      className={`${box} relative shrink-0 overflow-hidden rounded-full`}
      style={{ animation: isTyping ? 'avatar-typing-pulse 1.4s ease-in-out infinite' : undefined }}
    >
      {showImage ? (
        <img
          src={PORTRAIT_SRC}
          alt="Mukund"
          loading="eager"
          fetchpriority="high"
          onError={() => setImgError(true)}
          className="block size-full object-cover object-top"
        />
      ) : (
        // Fallback: original purple circle with initials
        <div className={`${bgClass} font-jio flex size-full items-center justify-center font-bold text-white select-none ${font}`}>
          {initials}
        </div>
      )}
    </div>
  );
}
