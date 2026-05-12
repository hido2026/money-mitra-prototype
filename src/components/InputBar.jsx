import { useState } from 'react';

export default function InputBar({ persona, onSend, disabled }) {
  const [text, setText] = useState('');
  const placeholder = persona === 'Mukund' ? 'Mukund se baat karein...' : 'Meera se baat karein...';

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      className="sticky bottom-0 px-4 py-3 border-t"
      style={{ background: '#FAF7F2', borderColor: '#E8E0D5' }}
    >
      <div
        className="flex items-center gap-2 rounded-2xl border px-4 py-2.5 max-w-2xl mx-auto"
        style={{ background: '#FFFFFF', borderColor: '#E8E0D5' }}
      >
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
          style={{ color: '#1F1F1F' }}
        />

        {/* Voice button — disabled, tooltip */}
        <div className="relative group">
          <button
            disabled
            className="w-8 h-8 flex items-center justify-center rounded-full opacity-30 cursor-not-allowed"
            style={{ color: '#6B6560' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>
          <span className="absolute bottom-10 right-0 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Voice coming soon
          </span>
        </div>

        {/* Send button */}
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || disabled}
          className="w-8 h-8 flex items-center justify-center rounded-full transition-opacity disabled:opacity-30"
          style={{ background: '#8B2C2C', color: '#FFFFFF' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  );
}
