export default function Onboarding({ onSelect }) {
  const personas = [
    {
      id: 'Mukund',
      initials: 'M',
      desc: 'Male • Mid-30s • Calm & analytical',
    },
    {
      id: 'Meera',
      initials: 'Me',
      desc: 'Female • Mid-30s • Warm & encouraging',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
         style={{ background: '#FAF7F2' }}>
      <p className="text-xs tracking-widest uppercase mb-3"
         style={{ color: '#8B2C2C', fontFamily: 'serif' }}>
        Money Mitra
      </p>
      <h1 className="text-2xl sm:text-3xl font-semibold text-center mb-2"
          style={{ color: '#1F1F1F', fontFamily: 'Georgia, serif', lineHeight: 1.3 }}>
        Namaste! Aap kaisi advisor se<br className="hidden sm:block" /> baat karna chahenge?
      </h1>
      <p className="text-sm text-center mb-10" style={{ color: '#6B6560' }}>
        Apna financial companion chunein
      </p>

      <div className="flex flex-col sm:flex-row gap-5 w-full max-w-md">
        {personas.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelect(p.id)}
            className="flex-1 flex flex-col items-center gap-3 rounded-2xl p-7 border-2 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus:ring-2"
            style={{
              background: '#FFFFFF',
              borderColor: '#E8E0D5',
              '--tw-ring-color': '#8B2C2C',
            }}
          >
            {/* Avatar circle */}
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-semibold"
              style={{ background: '#F0EBE3', color: '#8B2C2C' }}
            >
              {p.initials}
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold" style={{ color: '#1F1F1F' }}>
                {p.id}
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#6B6560' }}>
                {p.desc}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
