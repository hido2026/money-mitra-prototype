// AppContext — passbook/goals persisted to localStorage; session state in-memory.
//
// Persisted (survives reload — needed for Day 2/3 user testing):
//   entries, balance, goals
// Session-only (resets on reload):
//   sessionDecodes, insightFired, lastInputModality

import { createContext, useContext, useReducer } from 'react';

const AppContext = createContext(null);
const STORAGE_KEY = 'money_mitra_data'; // same key as before — preserves existing data

function calcBalance(entries) {
  return entries.reduce((s, e) => s + (e.type === 'in' ? e.amount : -e.amount), 0);
}

function save(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      entries: state.entries,
      balance: state.balance,
      goals:   state.goals,
    }));
  } catch {}
}

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw);
    // Migrate old single-goal format → goals[]
    if (data.goal && !data.goals) {
      data.goals = [{ id: 'g1', name: data.goal.label ?? data.goal.name ?? 'लक्ष्य', target: data.goal.target ?? 0, priority: 1 }];
    }
    return data;
  } catch { return {}; }
}

const saved = loadSaved();
const INIT = {
  entries:           saved.entries  ?? [],
  balance:           saved.balance  ?? calcBalance(saved.entries ?? []),
  goals:             saved.goals    ?? [],
  sessionDecodes:    [],
  insightFired:      false,
  lastInputModality: 'tap',
  // Decoded-document feed for the हिसाब — REAL decodes only, in memory only
  // (no storage, resets on reload). We keep the READING (amount/who/category/in-out),
  // never the photo. Starts empty and accumulates from actual extractions.
  docs:              [],
  // Day-0 onboarding mission — DISPLAY ONLY (not the points engine). Tracks the
  // 3 mission steps + a display points tally so progress survives navigating into
  // the Decoder/Chat and back. Resets on reload (prototype).
  onboarding:        { points: 0, steps: { firstDoc: false, secondEntry: false, askedMukund: false } },
};

function reducer(state, action) {
  switch (action.type) {
    // ── Entries ──────────────────────────────────────────────────────────────
    case 'ADD_ENTRY': {
      const entries = [action.payload, ...state.entries];
      const next = { ...state, entries, balance: calcBalance(entries) };
      save(next); return next;
    }
    case 'UPDATE_ENTRY': {
      const { id, amount, category } = action.payload;
      const entries = state.entries.map(e => e.id === id ? { ...e, amount, category } : e);
      const next = { ...state, entries, balance: calcBalance(entries) };
      save(next); return next;
    }
    case 'DELETE_ENTRY': {
      const entries = state.entries.filter(e => e.id !== action.payload);
      const next = { ...state, entries, balance: calcBalance(entries) };
      save(next); return next;
    }

    // ── Goals ─────────────────────────────────────────────────────────────────
    case 'ADD_GOAL': {
      const next = { ...state, goals: [...state.goals, action.payload] };
      save(next); return next;
    }
    case 'UPDATE_GOAL': {
      const next = { ...state, goals: state.goals.map(g => g.id === action.payload.id ? { ...g, ...action.payload } : g) };
      save(next); return next;
    }
    case 'DELETE_GOAL': {
      const next = { ...state, goals: state.goals.filter(g => g.id !== action.payload) };
      save(next); return next;
    }

    // Legacy single-goal shim (some callers still use SET_GOAL)
    case 'SET_GOAL': {
      const g = action.payload;
      let next;
      if (!g) { next = { ...state, goals: [] }; }
      else if (state.goals.length > 0) {
        next = { ...state, goals: state.goals.map((x, i) => i === 0 ? { ...x, name: g.label ?? g.name, target: g.target } : x) };
      } else {
        next = { ...state, goals: [{ id: Date.now().toString(), name: g.label ?? g.name, target: g.target, priority: 1 }] };
      }
      save(next); return next;
    }
    case 'CLEAR_GOAL': {
      const next = { ...state, goals: [] };
      save(next); return next;
    }

    // ── Seed data (DevPanel only, gated to authorised phone) ─────────────────
    case 'SEED_DATA': {
      const { entries, goals } = action.payload;
      const balance = calcBalance(entries);
      const next = { ...state, entries, goals, balance, sessionDecodes: [], insightFired: false };
      save(next);
      return next;
    }

    // ── Decoder ───────────────────────────────────────────────────────────────
    case 'ADD_DECODE':
      return { ...state, sessionDecodes: [...state.sessionDecodes, action.payload] };

    // ── हिसाब feed (decoded docs, in-memory only — never persisted) ────────────
    case 'ADD_DOC':
      return { ...state, docs: [action.payload, ...state.docs] };
    case 'FORGET_DOC':
      return { ...state, docs: state.docs.filter(d => d.id !== action.payload) };

    // ── Insight gate ──────────────────────────────────────────────────────────
    case 'MARK_INSIGHT_FIRED':
      return { ...state, insightFired: true };

    // ── Voice I/O tracking ────────────────────────────────────────────────────
    case 'SET_INPUT_MODALITY':
      return { ...state, lastInputModality: action.payload };

    // ── Day-0 onboarding (display-only mission state; not persisted) ────────────
    case 'ONBOARDING_AWARD': // payload: points to add to the display tally
      return { ...state, onboarding: { ...state.onboarding, points: state.onboarding.points + action.payload } };
    case 'ONBOARDING_STEP': // payload: 'firstDoc' | 'secondEntry' | 'askedMukund'
      if (state.onboarding.steps[action.payload]) return state; // already done — no double-count
      return { ...state, onboarding: { ...state.onboarding, steps: { ...state.onboarding.steps, [action.payload]: true } } };

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, INIT);
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}
