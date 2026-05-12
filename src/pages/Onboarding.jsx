// Onboarding — styled as JBIQ "Your Assistants" companion picker
// Two circular cards with ring borders, name below (matches home screen pattern)

const personas = [
  {
    id: 'Mukund',
    initials: 'Mu',
    bg: 'var(--jds-surface-bold)',      // #3900ad
    desc: 'Finances aur planning',
  },
  {
    id: 'Meera',
    initials: 'Me',
    bg: 'var(--jds-sparkle-50)',         // #1eccb0
    desc: 'Savings aur guidance',
  },
];

export default function Onboarding({ onSelect }) {
  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--jds-surface-default)',
      display: 'flex',
      flexDirection: 'column',
      padding: '0',
    }}>
      {/* ── Mock app header ── */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px 12px',
        borderBottom: '1px solid var(--jds-stroke-subtle)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Hamburger */}
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
            <path d="M3 6h18M3 12h18M3 18h18" stroke="var(--jds-text-high)" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          {/* JioDot brand mark */}
          <svg width="36" height="36" viewBox="0 0 48 48" fill="var(--jds-primary-50)">
            <ellipse cx="24" cy="14" rx="9" ry="13" />
            <ellipse cx="34" cy="24" rx="13" ry="9" />
            <ellipse cx="24" cy="34" rx="9" ry="13" />
            <ellipse cx="14" cy="24" rx="13" ry="9" />
          </svg>
        </div>
        {/* User avatar placeholder */}
        <div style={{
          width: '36px', height: '36px',
          borderRadius: '50%',
          background: 'var(--jds-surface-ghost)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'JioType', sans-serif",
          fontWeight: 700, fontSize: '13px',
          color: 'var(--jds-text-high)',
        }}>
          HD
        </div>
      </header>

      {/* ── Content ── */}
      <div style={{ padding: '24px 20px', flex: 1 }}>
        {/* Section heading */}
        <h2 style={{
          margin: '0 0 20px',
          fontFamily: "'JioType', sans-serif",
          fontWeight: 900,
          fontSize: '22px',
          letterSpacing: '-0.02em',
          color: 'var(--jds-text-high)',
        }}>
          Your Assistants
        </h2>

        {/* Companion row — matches JBIQ horizontal scroll of circular cards */}
        <div style={{
          display: 'flex',
          gap: '24px',
          flexWrap: 'wrap',
        }}>
          {personas.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                padding: '4px',
              }}
            >
              {/* Circle avatar with purple ring — matches app pattern */}
              <div style={{
                padding: '3px',
                borderRadius: '50%',
                border: '2.5px solid var(--jds-primary-50)',
              }}>
                <div style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  background: p.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: "'JioType', sans-serif",
                  fontWeight: 700,
                  fontSize: '22px',
                  color: '#fff',
                }}>
                  {p.initials}
                </div>
              </div>
              {/* Name */}
              <p style={{
                margin: 0,
                fontFamily: "'JioType', sans-serif",
                fontWeight: 700,
                fontSize: '13px',
                color: 'var(--jds-text-high)',
                textAlign: 'center',
              }}>
                {p.id}
              </p>
              <p style={{
                margin: 0,
                fontFamily: "'JioType', sans-serif",
                fontWeight: 400,
                fontSize: '11px',
                color: 'var(--jds-text-low)',
                textAlign: 'center',
              }}>
                {p.desc}
              </p>
            </button>
          ))}
        </div>

        {/* Divider */}
        <div style={{
          margin: '28px 0',
          height: '1px',
          background: 'var(--jds-stroke-subtle)',
        }} />

        {/* Money Mitra intro card */}
        <div style={{
          background: 'var(--jds-surface-minimal)',
          borderRadius: '16px',
          padding: '20px',
        }}>
          <p style={{
            margin: '0 0 4px',
            fontFamily: "'JioType', sans-serif",
            fontWeight: 700,
            fontSize: '11px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--jds-primary-50)',
          }}>
            Money Mitra
          </p>
          <p style={{
            margin: '0 0 8px',
            fontFamily: "'JioType', sans-serif",
            fontWeight: 900,
            fontSize: '18px',
            letterSpacing: '-0.02em',
            color: 'var(--jds-text-high)',
          }}>
            Aapka personal finance companion
          </p>
          <p style={{
            margin: 0,
            fontFamily: "'JioType', sans-serif",
            fontWeight: 400,
            fontSize: '14px',
            color: 'var(--jds-text-low)',
            lineHeight: 1.5,
          }}>
            SIP, insurance, fraud se bachao — seedha baat, koi sales pitch nahi.
          </p>
        </div>
      </div>
    </div>
  );
}
