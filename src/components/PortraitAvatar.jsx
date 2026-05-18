// PortraitAvatar — circular Mukund portrait with optional online dot.
// Sizes shipped by spec: 28 (message bubble), 40 (chat header), 44 (home).
//
// Falls back to plain init circle if the image can't load (offline / 404).

import { useState } from 'react';

const PORTRAIT = `${import.meta.env.BASE_URL}assets/mukund-portrait.png`;

export default function PortraitAvatar({
  size = 44,
  online = false,
  ringed = true,       // light purple bg ring (44px home variant)
}) {
  const [err, setErr] = useState(false);
  const ring = ringed && size >= 40;
  const padding = ring ? 2 : 0;
  const innerSize = size - padding * 2;

  // Online dot dimensions — scale with avatar
  const dotSize = size >= 44 ? 12 : 11;
  const dotBorder = 2.5;

  return (
    <div style={{
      position: 'relative',
      width: size,
      height: size,
      flexShrink: 0,
    }}>
      <div style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: ring ? '#EEEDFE' : 'transparent',
        border: ring ? '1.5px solid rgba(83, 74, 183, 0.3)' : 'none',
        boxSizing: 'border-box',
        padding: `${padding}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          width: innerSize,
          height: innerSize,
          borderRadius: '50%',
          overflow: 'hidden',
          background: '#534AB7',
        }}>
          {err ? (
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: size * 0.36,
              fontFamily: "'JioType', sans-serif",
            }}>Mu</div>
          ) : (
            <img
              src={PORTRAIT}
              alt="Mukund"
              loading="eager"
              fetchpriority="high"
              onError={() => setErr(true)}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center top',
                display: 'block',
              }}
            />
          )}
        </div>
      </div>
      {online && (
        <div style={{
          position: 'absolute',
          bottom: size >= 44 ? 1 : 0,
          right:  size >= 44 ? 1 : 0,
          width:  dotSize,
          height: dotSize,
          borderRadius: '50%',
          background: '#3B6D11',
          border: `${dotBorder}px solid #FFFFFF`,
          boxSizing: 'border-box',
          zIndex: 2,
        }} />
      )}
    </div>
  );
}
