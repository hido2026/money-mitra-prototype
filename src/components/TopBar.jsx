import { useState } from 'react';

export default function TopBar({ persona, onTogglePersona, onClearConversation }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const otherPersona = persona === 'Mukund' ? 'Meera' : 'Mukund';

  return (
    <>
      <header
        className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b"
        style={{ background: '#FAF7F2', borderColor: '#E8E0D5' }}
      >
        {/* App name */}
        <span
          className="text-lg font-semibold tracking-tight"
          style={{ color: '#8B2C2C', fontFamily: 'Georgia, serif' }}
        >
          Money Mitra
        </span>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          {/* Persona toggle */}
          <button
            onClick={onTogglePersona}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm transition-colors hover:bg-white"
            style={{ borderColor: '#E8E0D5', color: '#1F1F1F' }}
            title={`Switch to ${otherPersona}`}
          >
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold"
              style={{ background: '#F0EBE3', color: '#8B2C2C' }}
            >
              {persona === 'Mukund' ? 'M' : 'Me'}
            </span>
            <span>{persona}</span>
            <svg className="w-3 h-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
            </svg>
          </button>

          {/* Clear / trash */}
          <button
            onClick={() => setShowConfirm(true)}
            className="w-8 h-8 flex items-center justify-center rounded-full transition-colors hover:bg-red-50"
            style={{ color: '#6B6560' }}
            title="Clear conversation"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* Confirm dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="rounded-2xl p-6 max-w-xs w-full shadow-xl"
               style={{ background: '#FAF7F2' }}>
            <p className="text-base font-medium mb-1" style={{ color: '#1F1F1F' }}>
              Conversation clear karein?
            </p>
            <p className="text-sm mb-5" style={{ color: '#6B6560' }}>
              Yeh action undo nahi hogi.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2 rounded-xl border text-sm font-medium"
                style={{ borderColor: '#E8E0D5', color: '#1F1F1F' }}
              >
                Raho
              </button>
              <button
                onClick={() => { onClearConversation(); setShowConfirm(false); }}
                className="flex-1 py-2 rounded-xl text-sm font-medium text-white"
                style={{ background: '#8B2C2C' }}
              >
                Haan, clear karein
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
