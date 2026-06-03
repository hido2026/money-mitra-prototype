// DevPanel — tap Mukund portrait 5× on home to reveal.
// Shows last 20 events, North Star metric, guardrail counts.
// In-memory only — clears on reload. Never shown in production.

import { EVENT_LOG } from '../engine/instrumentation';

const NORTH_STAR_EVENTS = new Set(['passbook_log_saved', 'decoder_money_point_reached']);
const GUARDRAIL_EVENTS  = new Set([
  'guardrail_disclosure_skipped',
  'guardrail_confused',
  'guardrail_abandoned',
  'guardrail_optout',
  'guardrail_asr_giveup',
]);

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function DevPanel({ onClose }) {
  const last20      = [...EVENT_LOG].reverse().slice(0, 20);
  const northStar   = EVENT_LOG.filter(e => NORTH_STAR_EVENTS.has(e.event)).length;
  const guardrailHits = EVENT_LOG.filter(e => GUARDRAIL_EVENTS.has(e.event));
  const disclosureSkips = guardrailHits.filter(e => e.event === 'guardrail_disclosure_skipped').length;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      zIndex: 999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '420px',
          background: '#1a1a2e', color: '#e0e0e0',
          borderRadius: '20px 20px 0 0',
          padding: '16px 16px 32px',
          maxHeight: '80vh', overflowY: 'auto',
          fontFamily: 'monospace', fontSize: '11px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
          <span style={{ color: '#7eb8f7', fontWeight: 700, fontSize: '13px' }}>🛠 Dev Panel</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '16px' }}>✕</button>
        </div>

        {/* North Star */}
        <div style={{ background: '#0d3b66', borderRadius: '8px', padding: '10px 12px', marginBottom: '10px' }}>
          <div style={{ color: '#7eb8f7', fontWeight: 700, marginBottom: '4px' }}>NORTH STAR — Trusted Money Actions</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: northStar > 0 ? '#4ade80' : '#888' }}>{northStar}</div>
          <div style={{ color: '#888', fontSize: '10px' }}>passbook_log_saved + decoder_money_point_reached</div>
        </div>

        {/* Guardrail alert */}
        {disclosureSkips > 0 && (
          <div style={{ background: '#6b0f0f', borderRadius: '8px', padding: '8px 12px', marginBottom: '10px', color: '#fca5a5' }}>
            ⛔ STOP-SHIP: disclosure_skipped = {disclosureSkips}
          </div>
        )}
        {guardrailHits.length > 0 && disclosureSkips === 0 && (
          <div style={{ background: '#3b2a0f', borderRadius: '8px', padding: '8px 12px', marginBottom: '10px', color: '#fcd34d' }}>
            ⚠ Guardrail hits: {guardrailHits.length} ({guardrailHits.map(e => e.event.replace('guardrail_', '')).join(', ')})
          </div>
        )}

        {/* Session info */}
        <div style={{ color: '#888', marginBottom: '8px' }}>
          Session: {EVENT_LOG[0]?.session_id ?? '—'} · {EVENT_LOG.length} events
        </div>

        {/* Event list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {last20.map((e, i) => (
            <div key={i} style={{
              background: GUARDRAIL_EVENTS.has(e.event) ? '#3b1c1c' :
                          NORTH_STAR_EVENTS.has(e.event) ? '#1a3b1a' : '#1e1e2e',
              borderRadius: '6px', padding: '6px 10px',
              display: 'flex', gap: '8px', alignItems: 'baseline',
            }}>
              <span style={{ color: '#666', minWidth: '60px', flexShrink: 0 }}>{formatTime(e.ts_ms)}</span>
              <span style={{
                color: GUARDRAIL_EVENTS.has(e.event) ? '#fca5a5' :
                       NORTH_STAR_EVENTS.has(e.event) ? '#4ade80' : '#a5b4fc',
                fontWeight: NORTH_STAR_EVENTS.has(e.event) ? 700 : 400,
              }}>{e.event}</span>
              {e.flow && <span style={{ color: '#555' }}>[{e.flow}]</span>}
              {e.input_modality && <span style={{ color: '#555' }}>{e.input_modality}</span>}
              {e.savings_amount != null && <span style={{ color: '#4ade80' }}>₹{e.savings_amount}</span>}
            </div>
          ))}
        </div>

        {EVENT_LOG.length === 0 && (
          <div style={{ color: '#555', textAlign: 'center', padding: '20px' }}>No events yet this session.</div>
        )}
      </div>
    </div>
  );
}
