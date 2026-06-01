// AppContext — shared in-memory + localStorage state.
//
// Entry shape (v2):
//   { id, type:'in'|'out', amount, category, timestamp (ISO), time (display), src }
//
// Persisted to localStorage key "money_mitra_data": entries, balance, goal.
// Session-only (not persisted): sessionDecodes, insightFired.

import { createContext, useContext, useReducer } from 'react';

const AppContext = createContext(null);
const STORAGE_KEY = 'money_mitra_data';

// ── Helpers ───────────────────────────────────────────────────────────────────

function calcBalance(entries) {
  return entries.reduce((s, e) => s + (e.type === 'in' ? e.amount : -e.amount), 0);
}

function saveToStorage(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      entries: state.entries,
      balance: state.balance,
      goal:    state.goal,
    }));
  } catch { /* storage full / unavailable — ignore */ }
}

// ── Initial state (loads from localStorage if available) ──────────────────────

const DEFAULT_STATE = {
  entries:            [],
  balance:            0,
  goal:               null,
  sessionDecodes:     [],
  insightFired:       false,
  restoredFromStorage: false,
};

function getInitialState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const saved = JSON.parse(raw);
    const entries = saved.entries ?? [];
    const hasData = entries.length > 0 || saved.goal != null;
    return {
      ...DEFAULT_STATE,
      entries,
      balance: saved.balance ?? calcBalance(entries),
      goal:    saved.goal ?? null,
      restoredFromStorage: hasData,
    };
  } catch {
    return DEFAULT_STATE;
  }
}

// ── Reducer ───────────────────────────────────────────────────────────────────

function reducer(state, action) {
  let next;

  switch (action.type) {
    // ── Decoder ──────────────────────────────────────────────────────────────
    case 'ADD_DECODE':
      return { ...state, sessionDecodes: [...state.sessionDecodes, action.payload] };

    // ── Passbook: add entry ───────────────────────────────────────────────────
    case 'ADD_ENTRY': {
      const e = action.payload;
      const delta = e.type === 'in' ? e.amount : -e.amount;
      const newGoal = state.goal && e.type === 'in'
        ? { ...state.goal, saved: Math.min(state.goal.target, state.goal.saved + e.amount) }
        : state.goal;
      next = {
        ...state,
        entries: [e, ...state.entries],
        balance: state.balance + delta,
        goal: newGoal,
      };
      saveToStorage(next);
      return next;
    }

    // ── Passbook: edit entry ──────────────────────────────────────────────────
    case 'UPDATE_ENTRY': {
      const { id, amount, category } = action.payload;
      const newEntries = state.entries.map(e =>
        e.id === id ? { ...e, amount, category } : e
      );
      const newBalance = calcBalance(newEntries);
      next = { ...state, entries: newEntries, balance: newBalance };
      saveToStorage(next);
      return next;
    }

    // ── Passbook: delete entry ────────────────────────────────────────────────
    case 'DELETE_ENTRY': {
      const newEntries = state.entries.filter(e => e.id !== action.payload);
      const newBalance = calcBalance(newEntries);
      next = { ...state, entries: newEntries, balance: newBalance };
      saveToStorage(next);
      return next;
    }

    // ── Goal ──────────────────────────────────────────────────────────────────
    case 'SET_GOAL':
      next = { ...state, goal: action.payload };
      saveToStorage(next);
      return next;

    case 'CLEAR_GOAL':
      next = { ...state, goal: null };
      saveToStorage(next);
      return next;

    // ── Insight engine ────────────────────────────────────────────────────────
    case 'MARK_INSIGHT_FIRED':
      return { ...state, insightFired: true };

    // ── Utility ───────────────────────────────────────────────────────────────
    case 'CLEAR_RESTORED_FLAG':
      return { ...state, restoredFromStorage: false };

    default:
      return state;
  }
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, getInitialState);
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
