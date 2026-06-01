// InsightBubble — Mukund's connect-the-dots message.
// Shows inline in the conversation after a natural seam (post-log or post-decode).
// Never a modal or banner — it's part of the chat flow.
//
// Props:
//   payload   InsightPayload from computeInsight()
//   onAction  (action: 'set_goal'|'add_to_bahi'|null) => void
//   onDismiss () => void  (optional — hides the bubble)

import PortraitAvatar from './PortraitAvatar';

const ACTION_LABEL = {
  set_goal:    'Goal सेट करें →',
  add_to_bahi: 'बही में डालें →',
};

const TIER_ACCENT = {
  0: '#888780',
  1: '#534AB7',
  2: '#3B6D11',
  3: '#534AB7',
};

export default function InsightBubble({ payload, onAction, onDismiss }) {
  if (!payload) return null;

  const accent = TIER_ACCENT[payload.tier] ?? '#534AB7';

  return (
    <div
      className="animate-fade-in"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '8px',
        maxWidth: '92%',
        margin: '8px 0',
      }}
    >
      <div style={{ marginTop: '2px' }}>
        <PortraitAvatar size={28} online={false} ringed={false} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Tier badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          background: accent + '18',
          border: `1px solid ${accent}28`,
          borderRadius: '999px',
          padding: '2px 8px',
          marginBottom: '6px',
        }}>
          <span style={{ fontSize: '9px' }}>✦</span>
          <span style={{
            fontFamily: "'JioType',sans-serif",
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.4px',
            color: accent,
            textTransform: 'uppercase',
          }}>
            {payload.tier === 3 ? 'Full Picture' :
             payload.tier === 2 ? 'On Track' :
             payload.tier === 1 ? 'Pattern' : 'Getting Started'}
          </span>
        </div>

        {/* Bubble */}
        <div style={{
          background: accent + '12',
          border: `1.5px solid ${accent}22`,
          borderRadius: '4px 16px 16px 16px',
          padding: '11px 14px',
          fontFamily: "'Noto Sans Devanagari','JioType',sans-serif",
          fontSize: '14px',
          lineHeight: 1.6,
          color: '#1F1F1F',
        }}>
          {payload.text}

          {/* Action button */}
          {payload.action && onAction && (
            <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: `1px solid ${accent}20` }}>
              <button
                onClick={() => onAction(payload.action)}
                style={{
                  background: accent,
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '9px 16px',
                  fontFamily: "'Noto Sans Devanagari','JioType',sans-serif",
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginRight: '8px',
                }}
              >
                {ACTION_LABEL[payload.action]}
              </button>
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  style={{
                    background: 'transparent',
                    color: '#888780',
                    border: 'none',
                    padding: '9px 4px',
                    fontFamily: "'JioType',sans-serif",
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  ठीक है
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
