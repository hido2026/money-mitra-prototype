// instrumentation.js — in-memory event log + Google Sheet relay.
//
// Base props on every event:
//   {user_id, session_id, ts_ms, flow, locale, input_modality, is_moderated}
//
// NORTH STAR: Weekly Trusted Money Actions (passbook_log_saved + decoder_money_point_reached).
// DO NOT optimise for DAU / session-length — longer = struggling.
//
// Dev panel: tap Mukund portrait 5× on home to show last 20 events.
// Guardrail events (guardrail_disclosure_skipped etc.) must be ~0 — stop-ship if not.

import { SHEET_WEBHOOK } from '../utils/analytics.js';

const SESSION_ID  = `s_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
const LOCALE      = navigator?.language ?? 'hi-IN';

// Mutable in-memory log — intentionally module-level so it persists across re-renders
export const EVENT_LOG = [];

function getUser() {
  try { return JSON.parse(localStorage.getItem('user') ?? '{}'); }
  catch { return {}; }
}

/**
 * logEvent — fire-and-forget. Never throws. Never awaited.
 *
 * @param {string} eventName  snake_case identifier from the spec
 * @param {object} [props]    additional event-specific properties
 */
export function logEvent(eventName, props = {}) {
  const user  = getUser();
  const event = {
    user_id:        user.phone || user.name || 'anon',
    session_id:     SESSION_ID,
    ts_ms:          Date.now(),
    event:          eventName,
    locale:         LOCALE,
    is_moderated:   false,
    ...props,
  };

  EVENT_LOG.push(event);

  // Relay to Google Sheet (no-cors, fire-and-forget)
  try {
    if (SHEET_WEBHOOK && !SHEET_WEBHOOK.includes('REPLACE')) {
      fetch(SHEET_WEBHOOK, {
        method:  'POST',
        mode:    'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          name:      user.name  ?? 'unknown',
          phone:     user.phone ?? 'unknown',
          event:     eventName,
          ...props,
          timestamp: new Date().toISOString(),
        }),
      });
    }
  } catch { /* intentionally silent */ }
}

// ── Typed event helpers (keeps callsites readable) ────────────────────────────

export const Events = {
  // Passbook
  passbookLogStarted:   (p = {}) => logEvent('passbook_log_started',   { flow: 'passbook', ...p }),
  passbookLogSaved:     (p = {}) => logEvent('passbook_log_saved',     { flow: 'passbook', ...p }),
  passbookLogAbandoned: (p = {}) => logEvent('passbook_log_abandoned', { flow: 'passbook', ...p }),
  passbookReturn:       (p = {}) => logEvent('passbook_return_session',{ flow: 'passbook', ...p }),

  // Decoder
  decoderStarted:       (p = {}) => logEvent('decoder_session_started',    { flow: 'decoder', ...p }),
  decoderExplainPlayed: (p = {}) => logEvent('decoder_explain_played',     { flow: 'decoder', ...p }),
  decoderReplay:        (p = {}) => logEvent('decoder_replay',             { flow: 'decoder', ...p }),
  decoderMoneyPoint:    (p = {}) => logEvent('decoder_money_point_reached',{ flow: 'decoder', ...p }),
  decoderSelfReport:    (p = {}) => logEvent('decoder_self_report',        { flow: 'decoder', ...p }),

  // Insights
  insightShown:         (p = {}) => logEvent('insight_shown',  { flow: 'insight', ...p }),
  insightActed:         (p = {}) => logEvent('insight_acted',  { flow: 'insight', ...p }),

  // Products
  productsDiscoveryShown:      (p = {}) => logEvent('products_discovery_shown',      { flow: 'products', ...p }),
  productsDisclosureStarted:   (p = {}) => logEvent('products_disclosure_started',   { flow: 'products', ...p }),
  productsDisclosureHeard:     (p = {}) => logEvent('products_disclosure_heard',     { flow: 'products', ...p }),
  productsIntentExpressed:     (p = {}) => logEvent('products_intent_expressed',     { flow: 'products', ...p }),
  productsHandoffInitiated:    (p = {}) => logEvent('products_handoff_initiated',    { flow: 'products', ...p }),
  productsHandoffReturned:     (p = {}) => logEvent('products_handoff_returned',     { flow: 'products', ...p }),

  // Guardrails (any of these > 0 = investigate; disclosure_skipped = stop-ship)
  guardrailDisclosureSkipped: (p = {}) => logEvent('guardrail_disclosure_skipped', { is_moderated: true, ...p }),
  guardrailConfused:          (p = {}) => logEvent('guardrail_confused',           { is_moderated: true, ...p }),
  guardrailAbandoned:         (p = {}) => logEvent('guardrail_abandoned',          { is_moderated: true, ...p }),
  guardrailOptout:            (p = {}) => logEvent('guardrail_optout',             { is_moderated: true, ...p }),
  guardrailAsrGiveup:         (p = {}) => logEvent('guardrail_asr_giveup',         { is_moderated: true, ...p }),

  // App lifecycle
  appOpened:            (p = {}) => logEvent('app_opened',    p),
  summarySeen:          (p = {}) => logEvent('summary_seen',  p),
  goalSet:              (p = {}) => logEvent('goal_set',       p),
};
