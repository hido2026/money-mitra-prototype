// EditEntrySheet — "सही करें" bottom sheet for correcting a decoded entry.
// Edits the three things the model gets wrong and that change the math:
//   amount · direction (आया/गया) · उधार (borrowed). No category/title edit.
// Mirrors the localhost (Next) edit flow so the experience is uniform.
// Points are NEVER re-awarded — only the entry's fields change.

import { useEffect, useState } from 'react';

const DEVA = "'Noto Sans Devanagari','JioType',sans-serif";
const PURPLE = '#534AB7';
const GREEN = '#1a7d4b';
const AMBER = '#d97706';
const INK = '#2C2C2A';

export default function EditEntrySheet({ open, initial, title, onSave, onDelete, onClose }) {
  const [amount, setAmount] = useState('');
  const [dir, setDir] = useState('out');
  const [borrowed, setBorrowed] = useState(false);

  useEffect(() => {
    if (open && initial) {
      setAmount(String(initial.amount || ''));
      setDir(initial.dir === 'in' ? 'in' : 'out');
      setBorrowed(initial.borrowed === true);
    }
  }, [open, initial]);

  if (!open) return null;

  const save = () => {
    const n = Math.max(0, Math.round(Number(String(amount).replace(/[^0-9.]/g, '')) || 0));
    onSave({ amount: n, dir, borrowed });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 600, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      {/* Scrim */}
      <button aria-label="बंद करें" onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', border: 'none', cursor: 'pointer' }} />
      {/* Sheet */}
      <div className="toast-animate" style={{ position: 'relative', width: '100%', maxWidth: 420, background: '#fff', borderRadius: '20px 20px 0 0', padding: '20px 20px calc(env(safe-area-inset-bottom,0px) + 20px)' }}>
        <div style={{ width: 40, height: 4, borderRadius: 999, background: '#d8d5e0', margin: '0 auto 16px' }} />
        <p style={{ fontFamily: DEVA, fontSize: '16px', fontWeight: 900, color: INK, margin: '0 0 2px' }}>सही करें</p>
        <p style={{ fontFamily: DEVA, fontSize: '12px', color: '#888780', margin: '0 0 16px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</p>

        {/* Amount */}
        <label style={{ display: 'block', fontFamily: DEVA, fontSize: '12px', fontWeight: 700, color: '#888780', marginBottom: 6 }}>रकम</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F5F4FA', borderRadius: 12, padding: '12px 16px', marginBottom: 16 }}>
          <span style={{ fontFamily: DEVA, fontSize: 18, fontWeight: 900, color: INK }}>₹</span>
          <input inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0"
            style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontFamily: DEVA, fontSize: 18, fontWeight: 900, color: INK }} />
        </div>

        {/* Direction toggle */}
        <label style={{ display: 'block', fontFamily: DEVA, fontSize: '12px', fontWeight: 700, color: '#888780', marginBottom: 6 }}>यह पैसा</label>
        <div style={{ display: 'flex', gap: 4, background: '#F5F4FA', borderRadius: 12, padding: 4, marginBottom: 16 }}>
          <button onClick={() => setDir('in')} style={{ flex: 1, border: 'none', borderRadius: 8, padding: '10px', cursor: 'pointer', fontFamily: DEVA, fontSize: 14, fontWeight: 700, background: dir === 'in' ? GREEN : 'transparent', color: dir === 'in' ? '#fff' : '#888780' }}>आया · कमाई</button>
          <button onClick={() => setDir('out')} style={{ flex: 1, border: 'none', borderRadius: 8, padding: '10px', cursor: 'pointer', fontFamily: DEVA, fontSize: 14, fontWeight: 700, background: dir === 'out' ? PURPLE : 'transparent', color: dir === 'out' ? '#fff' : '#888780' }}>गया · खर्च</button>
        </div>

        {/* उधार toggle */}
        <button onClick={() => setBorrowed((b) => !b)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: '#F5F4FA', border: 'none', borderRadius: 12, padding: '12px 16px', marginBottom: 20, cursor: 'pointer' }}>
          <span style={{ textAlign: 'left' }}>
            <span style={{ display: 'block', fontFamily: DEVA, fontSize: 14, fontWeight: 700, color: INK }}>उधार / ऋण है</span>
            <span style={{ display: 'block', fontFamily: DEVA, fontSize: 12, color: '#888780' }}>वापस करना है — आया में नहीं गिनेंगे</span>
          </span>
          <span style={{ position: 'relative', width: 44, height: 26, borderRadius: 999, flexShrink: 0, background: borrowed ? AMBER : '#cbcbcb', transition: 'background 150ms' }}>
            <span style={{ position: 'absolute', top: 3, left: borrowed ? 21 : 3, width: 20, height: 20, borderRadius: 999, background: '#fff', transition: 'left 150ms' }} />
          </span>
        </button>

        {/* Actions */}
        <button onClick={save} style={{ width: '100%', background: PURPLE, border: 'none', borderRadius: 999, padding: '14px', cursor: 'pointer', fontFamily: DEVA, fontSize: 16, fontWeight: 800, color: '#fff' }}>हो गया</button>
        {onDelete && (
          <button onClick={onDelete} style={{ width: '100%', background: 'none', border: 'none', borderRadius: 999, padding: '12px', marginTop: 8, cursor: 'pointer', fontFamily: DEVA, fontSize: 14, fontWeight: 700, color: '#c0392b' }}>भूल जाओ</button>
        )}
      </div>
    </div>
  );
}
