// EditEntrySheet — "सही करें" bottom sheet for correcting a decoded entry.
// Edits the three things the model gets wrong and that change the math:
//   amount · direction (आया/गया) · उधार (borrowed). No category/title edit.
// Mirrors the localhost (Next) edit flow so the experience is uniform.
// Points are NEVER re-awarded — only the entry's fields change.
// JDS (a2ui MCP): FieldLabel §11.62, jdsBtn §6, §12.0a scrim/sheet — tokens only.

import { useEffect, useState } from 'react';
import { FieldLabel, jdsBtn } from './jds';

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
    <div className="fixed inset-0 z-[600] flex items-end justify-center">
      {/* Scrim */}
      <button aria-label="बंद करें" onClick={onClose} className="absolute inset-0 border-0 bg-[rgba(12,13,16,0.45)] backdrop-blur-md" />
      {/* Sheet */}
      <div className="toast-animate bg-surface relative w-full max-w-[420px] rounded-t-2xl px-5 pt-5" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom,0px) + 20px)' }}>
        <div className="bg-ink-disabled mx-auto mb-4 h-1 w-10 rounded-full" />
        <p className="font-deva text-ink mb-0.5 text-base font-black">सही करें</p>
        <p className="font-deva text-neutral mb-4 overflow-hidden text-xs text-ellipsis whitespace-nowrap">{title}</p>

        {/* Amount */}
        <FieldLabel>रकम</FieldLabel>
        <div className="bg-surface-minimal mt-1.5 mb-4 flex items-center gap-2 rounded-lg px-4 py-3">
          <span className="font-deva text-ink text-lg font-black">₹</span>
          <input inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0"
            className="font-deva text-ink w-full border-0 bg-transparent text-lg font-black outline-none" />
        </div>

        {/* Direction toggle */}
        <FieldLabel>यह पैसा</FieldLabel>
        <div className="bg-surface-minimal mt-1.5 mb-4 flex gap-1 rounded-lg p-1">
          <button onClick={() => setDir('in')} className={`font-deva flex-1 rounded-md px-0 py-2.5 text-sm font-bold ${dir === 'in' ? 'bg-success text-white' : 'text-neutral bg-transparent'}`}>आया · कमाई</button>
          <button onClick={() => setDir('out')} className={`font-deva flex-1 rounded-md px-0 py-2.5 text-sm font-bold ${dir === 'out' ? 'bg-primary-50 text-white' : 'text-neutral bg-transparent'}`}>गया · खर्च</button>
        </div>

        {/* उधार toggle */}
        <button onClick={() => setBorrowed((b) => !b)} className="bg-surface-minimal mb-5 flex w-full items-center justify-between rounded-lg px-4 py-3">
          <span className="text-left">
            <span className="font-deva text-ink block text-sm font-bold">उधार / ऋण है</span>
            <span className="font-deva text-neutral block text-xs">वापस करना है — आया में नहीं गिनेंगे</span>
          </span>
          <span className={`relative h-6.5 w-11 shrink-0 rounded-full transition-colors duration-150 ${borrowed ? 'bg-warning' : 'bg-gray-300'}`}>
            <span className="absolute top-[3px] size-5 rounded-full bg-white transition-[left] duration-150" style={{ left: borrowed ? 21 : 3 }} />
          </span>
        </button>

        {/* Actions */}
        <button onClick={save} className={`${jdsBtn('primary')} w-full`}>हो गया</button>
        {onDelete && (
          <button onClick={onDelete} className="font-deva text-error mt-2 w-full rounded-full bg-transparent py-3 text-sm font-bold">भूल जाओ</button>
        )}
      </div>
    </div>
  );
}
