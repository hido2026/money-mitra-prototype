// AppContext — in-memory session state. Reload resets everything.
// Per brief: no localStorage, no backend, no network for user data.
// API keys (Groq, ElevenLabs, Sarvam) are build-time constants — not user data.
//
// State:
//   entries        [{id, type, amount, category, timestamp, source?, bill_type?}]
//   balance        number (recomputed on every entry mutation)
//   goals          [{id, name, target, priority}]
//   sessionDecodes [{bill_type, amount}]   — decoded bills this session
//   insightFired   bool                    — max one insight per session
//   lastInputModality 'voice'|'tap'|'text' — drives voice I/O matching

import { createContext, useContext, useReducer } from 'react';

const AppContext = createContext(null);

function calcBalance(entries) {
  return entries.reduce((s, e) => s + (e.type === 'in' ? e.amount : -e.amount), 0);
}

const INIT = {
  entries:           [],
  balance:           0,
  goals:             [],
  sessionDecodes:    [],
  insightFired:      false,
  lastInputModality: 'tap',
};

function reducer(state, action) {
  switch (action.type) {
    // ── Entries ──────────────────────────────────────────────────────────────
    case 'ADD_ENTRY': {
      const entries = [action.payload, ...state.entries];
      return { ...state, entries, balance: calcBalance(entries) };
    }
    case 'UPDATE_ENTRY': {
      const { id, amount, category } = action.payload;
      const entries = state.entries.map(e => e.id === id ? { ...e, amount, category } : e);
      return { ...state, entries, balance: calcBalance(entries) };
    }
    case 'DELETE_ENTRY': {
      const entries = state.entries.filter(e => e.id !== action.payload);
      return { ...state, entries, balance: calcBalance(entries) };
    }

    // ── Goals ─────────────────────────────────────────────────────────────────
    case 'ADD_GOAL':
      return { ...state, goals: [...state.goals, action.payload] };
    case 'UPDATE_GOAL':
      return { ...state, goals: state.goals.map(g => g.id === action.payload.id ? { ...g, ...action.payload } : g) };
    case 'DELETE_GOAL':
      return { ...state, goals: state.goals.filter(g => g.id !== action.payload) };

    // Legacy single-goal shim (some callers still use SET_GOAL)
    case 'SET_GOAL': {
      const g = action.payload;
      if (!g) return { ...state, goals: [] };
      if (state.goals.length > 0) {
        const goals = state.goals.map((x, i) => i === 0 ? { ...x, name: g.label ?? g.name, target: g.target } : x);
        return { ...state, goals };
      }
      return { ...state, goals: [{ id: Date.now().toString(), name: g.label ?? g.name, target: g.target, priority: 1 }] };
    }
    case 'CLEAR_GOAL':
      return { ...state, goals: [] };

    // ── Decoder ───────────────────────────────────────────────────────────────
    case 'ADD_DECODE':
      return { ...state, sessionDecodes: [...state.sessionDecodes, action.payload] };

    // ── Insight gate ──────────────────────────────────────────────────────────
    case 'MARK_INSIGHT_FIRED':
      return { ...state, insightFired: true };

    // ── Voice I/O tracking ────────────────────────────────────────────────────
    case 'SET_INPUT_MODALITY':
      return { ...state, lastInputModality: action.payload };

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
