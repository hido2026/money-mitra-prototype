// app-config.js — single source of truth for feature flags and voice persona.
// Swap VOICE_CONFIG to A/B test male vs female persona without a rebuild —
// only voice_id and persona_name change; all logic stays identical.

export const VOICE_CONFIG = {
  persona_name: 'Mukund',
  voice_id:     'DQuoFsZ3oda1diTerwpq', // Aaditya Kapur — Calm Conversational Hindi (ElevenLabs)
  gender:       'male',
  // ── A/B female variant ──────────────────────────────────────────────────
  // persona_name: 'Didi',
  // voice_id:     'FEMALE_VOICE_ID_HERE',
  // gender:       'female',
};

export const FLAGS = {
  PRODUCTS_ON_HOME:       false,                  // reveal only after habit forms (inside goal flow)
  SMS_PARSE:              'simulated_demo_only',  // not a primary path; one demo card, default OFF
  VOICE_VARIANT:          'mukund',               // 'mukund' | 'didi'
};

export const COMPLIANCE = {
  GOLD_DISCLOSURE_REQUIRED: true,   // STOP-SHIP if bypassable — checked in Products gate
  MAX_INSIGHT_PER_SESSION:  1,      // one proactive insight per session max
  MAX_MUKUND_WORDS:         80,     // spoken reply limit keeps audio short
};
