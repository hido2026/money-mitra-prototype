import PersonaAvatar from '../components/PersonaAvatar';

const personas = [
  {
    id: 'Mukund',
    tagline: 'Male · Mid-30s · Direct & analytical',
    desc: 'Seedha baat karne wala — family ka woh bada bhai jo har finance document ka fine print padh chuka hai.',
  },
  {
    id: 'Meera',
    tagline: 'Female · Mid-30s · Warm & equally honest',
    desc: 'Knowledgeable older sister — jisne apne half the relatives ko SIP, insurance aur loans explain kiye hain.',
  },
];

export default function Onboarding({ onSelect }) {
  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--jds-surface-default)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 16px',
    }}>
      {/* Brand label */}
      <p style={{
        margin: '0 0 16px',
        fontFamily: "'JioType', sans-serif",
        fontWeight: 700,
        fontSize: '11px',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--jds-primary-50)',
      }}>
        Money Mitra · JBIQ
      </p>

      {/* Headline */}
      <h1 style={{
        margin: '0 0 8px',
        fontFamily: "'JioType', sans-serif",
        fontWeight: 900,
        fontSize: 'clamp(24px, 6vw, 32px)',
        letterSpacing: '-0.03em',
        color: 'var(--jds-text-high)',
        textAlign: 'center',
        maxWidth: '400px',
        lineHeight: 1.2,
      }}>
        Aap kaun se companion se baat karna chahenge?
      </h1>
      <p style={{
        margin: '0 0 40px',
        fontFamily: "'JioType', sans-serif",
        fontWeight: 400,
        fontSize: '15px',
        color: 'var(--jds-text-low)',
        textAlign: 'center',
      }}>
        Apna financial companion chunein
      </p>

      {/* Persona cards */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        width: '100%',
        maxWidth: '400px',
      }}>
        {personas.map((p) => {
          const hoverBg = p.id === 'Mukund'
            ? 'var(--jds-primary-20)'
            : 'var(--jds-sparkle-20)';

          return (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              onMouseEnter={(e) => { e.currentTarget.style.background = hoverBg; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--jds-surface-default)'; }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '20px',
                borderRadius: '20px',
                border: '1px solid var(--jds-stroke-subtle)',
                background: 'var(--jds-surface-default)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.18s',
              }}
            >
              <PersonaAvatar persona={p.id} size="lg" />
              <div>
                <p style={{
                  margin: '0 0 2px',
                  fontFamily: "'JioType', sans-serif",
                  fontWeight: 700,
                  fontSize: '18px',
                  color: 'var(--jds-text-high)',
                }}>
                  {p.id}
                </p>
                <p style={{
                  margin: '0 0 6px',
                  fontFamily: "'JioType', sans-serif",
                  fontWeight: 500,
                  fontSize: '12px',
                  color: 'var(--jds-text-low)',
                }}>
                  {p.tagline}
                </p>
                <p style={{
                  margin: 0,
                  fontFamily: "'JioType', sans-serif",
                  fontWeight: 400,
                  fontSize: '13px',
                  color: 'var(--jds-text-low)',
                  lineHeight: 1.4,
                }}>
                  {p.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer note */}
      <p style={{
        marginTop: '32px',
        fontFamily: "'JioType', sans-serif",
        fontSize: '12px',
        color: 'var(--jds-text-disabled)',
        textAlign: 'center',
      }}>
        Baad mein switch kar sakte hain — koi restriction nahi
      </p>
    </div>
  );
}
