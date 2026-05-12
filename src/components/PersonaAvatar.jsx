// JDS Avatar — kind: initials, sizes per JDS spec
// Mukund → surface-bold (#3900ad)  Meera → sparkle-50 (#1eccb0)

const SIZE = {
  sm: { box: '32px', font: '13px' },
  md: { box: '56px', font: '20px' },
  lg: { box: '80px', font: '28px' },
};

export default function PersonaAvatar({ persona, size = 'md' }) {
  const { box, font } = SIZE[size] ?? SIZE.md;
  const bg = persona === 'Mukund' ? 'var(--jds-surface-bold)' : 'var(--jds-sparkle-50)';

  return (
    <div
      style={{
        width: box,
        height: box,
        minWidth: box,
        borderRadius: '50%',
        background: bg,
        color: 'var(--jds-text-on-bold)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'JioType', sans-serif",
        fontWeight: 700,
        fontSize: font,
        userSelect: 'none',
      }}
    >
      {persona === 'Mukund' ? 'Mu' : 'Me'}
    </div>
  );
}
