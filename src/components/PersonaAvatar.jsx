export default function PersonaAvatar({ persona, size = 'md' }) {
  const sizes = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-14 h-14 text-xl',
    lg: 'w-20 h-20 text-2xl',
  };

  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center font-semibold flex-shrink-0`}
      style={{ background: '#F0EBE3', color: '#8B2C2C' }}
    >
      {persona === 'Mukund' ? 'M' : 'Me'}
    </div>
  );
}
