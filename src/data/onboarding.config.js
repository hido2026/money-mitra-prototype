// onboarding.config.js — Day-0 onboarding numbers in ONE place.
// PROVISIONAL — these will change after the Wizard-of-Oz retention test (§F).
// This is DISPLAY ONLY — it is not the points economy / rewards engine.

export const ONBOARDING = {
  // Welcome bonus — granted on first open, NOT gated on consent/permission/PII.
  WELCOME_BONUS: 50,

  // Day-0 mission steps (display values)
  STEP_FIRST_DOC: 100, // पहला कागज़
  STEP_SECOND: 100, // एक और (कागज़ या बोलकर)
  STEP_ASK: 50, // मुकुंद से कुछ पूछो
  MISSION_BONUS: 200, // मिशन पूरा बोनस

  // Unlock today: completing all three → ₹5 (= 500 अंक)
  UNLOCK_RUPEES: 5,
  UNLOCK_POINTS: 500,

  // Daily cap (provisional; engine not built — display/guard only)
  DAILY_CAP: 500,

  // ₹10 is shown ONLY as a journey, never "₹10 आज ही"
  JOURNEY_LABEL: '₹10 तक का सफ़र',
};

// Total points a fully-completed Day-0 mission DISPLAYS (welcome + 3 steps + bonus).
export const ONBOARDING_TOTAL =
  ONBOARDING.WELCOME_BONUS +
  ONBOARDING.STEP_FIRST_DOC +
  ONBOARDING.STEP_SECOND +
  ONBOARDING.STEP_ASK +
  ONBOARDING.MISSION_BONUS;
