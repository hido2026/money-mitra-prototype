// AppContext — shared in-memory + localStorage state.
//
// Entry shape (v2): { id, type, amount, category, timestamp, time, src, source?, bill_type? }
// Goals shape (v2): [{ id, name, target, priority }]  ← replaces single goal object
//   Progress is computed from balance (goals.js) — NOT stored as goal.saved.
//
// Persisted: entries, balance, goals
// Session-only: sessionDecodes, insightFired

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
      goals:   state.goals,
    }));
  } catch { /* storage full — ignore */ }
}

// ── Initial state (loads + migrates from localStorage) ────────────────────────

const DEFAULT_STATE = {
  entries:             [],
  balance:             0,
  goals:               [],   // replaces goal: null
  sessionDecodes:      [],
  insightFired:        false,
  restoredFromStorage: false,
};

function getInitialState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const saved = JSON.parse(raw);

    // ── Migrate old single-goal format → goals[] ──────────────────────────────
    let goals = saved.goals ?? [];
    if (!goals.length && saved.goal) {
      goals = [{
        id:       'g1',
        name:     saved.goal.label ?? saved.goal.name ?? 'लक्ष्य',
        target:   saved.goal.target ?? 0,
        priority: 1,
      }];
    }

    const entries = saved.entries ?? [];
    const hasData = entries.length > 0 || goals.length > 0;
    return {
      ...DEFAULT_STATE,
      entries,
      balance: saved.balance ?? calcBalance(entries),
      goals,
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

    // ── Entries ───────────────────────────────────────────────────────────────
    case 'ADD_ENTRY': {
      const e     = action.payload;
      const delta = e.type === 'in' ? e.amount : -e.amount;
      // NOTE: Do NOT update goal.saved here — progress is computed from balance
      next = {
        ...state,
        entries: [e, ...state.entries],
        balance: state.balance + delta,
      };
      saveToStorage(next);
      return next;
    }

    case 'UPDATE_ENTRY': {
      const { id, amount, category } = action.payload;
      const newEntries = state.entries.map(e => e.id === id ? { ...e, amount, category } : e);
      next = { ...state, entries: newEntries, balance: calcBalance(newEntries) };
      saveToStorage(next);
      return next;
    }

    case 'DELETE_ENTRY': {
      const newEntries = state.entries.filter(e => e.id !== action.payload);
      next = { ...state, entries: newEntries, balance: calcBalance(newEntries) };
      saveToStorage(next);
      return next;
    }

    // ── Goals (multiple) ──────────────────────────────────────────────────────
    case 'ADD_GOAL': {
      next = { ...state, goals: [...state.goals, action.payload] };
      saveToStorage(next);
      return next;
    }

    case 'UPDATE_GOAL': {
      const newGoals = state.goals.map(g =>
        g.id === action.payload.id ? { ...g, ...action.payload } : g
      );
      next = { ...state, goals: newGoals };
      saveToStorage(next);
      return next;
    }

    case 'DELETE_GOAL': {
      next = { ...state, goals: state.goals.filter(g => g.id !== action.payload) };
      saveToStorage(next);
      return next;
    }

    // ── Legacy single-goal shim (used by some callers) ────────────────────────
    // Converts to ADD_GOAL or UPDATE_GOAL[0] for backward compat
    case 'SET_GOAL': {
      const g = action.payload;
      if (!g) {
        next = { ...state, goals: [] };
        saveToStorage(next);
        return next;
      }
      // If we already have goals, update first; otherwise add
      if (state.goals.length > 0) {
        const newGoals = state.goals.map((existing, i) =>
          i === 0 ? { ...existing, name: g.label ?? g.name, target: g.target } : existing
        );
        next = { ...state, goals: newGoals };
      } else {
        next = { ...state, goals: [{ id: Date.now().toString(), name: g.label ?? g.name, target: g.target, priority: 1 }] };
      }
      saveToStorage(next);
      return next;
    }

    case 'CLEAR_GOAL': {
      next = { ...state, goals: [] };
      saveToStorage(next);
      return next;
    }

    // ── Insight ───────────────────────────────────────────────────────────────
    case 'MARK_INSIGHT_FIRED':
      return { ...state, insightFired: true };

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
