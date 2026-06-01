// AppContext — shared in-memory state for the insight engine.
// Reload resets everything (no localStorage — by design).
//
// Holds:
//   sessionDecodes  written by Decoder when a bill resolves
//   entries         written by Passbook on every add_in / add_out
//   goal            written by Passbook on goal-set
//   balance         derived from entries
//   insightFired    true after the first insight fires this session

import { createContext, useContext, useReducer } from 'react';

const AppContext = createContext(null);

const init = {
  sessionDecodes: [],   // [{ bill_type, labelHi, amount, recurring, saveable, monthly_saving, annual_plan_cost }]
  entries:        [],   // [{ type:'in'|'out', amt, label, src, time, id }]
  goal:           null, // { label, target, saved } | null
  balance:        0,
  insightFired:   false,
};

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_DECODE':
      return { ...state, sessionDecodes: [...state.sessionDecodes, action.payload] };

    case 'ADD_ENTRY': {
      const e = action.payload;
      const delta = e.type === 'in' ? e.amt : -e.amt;
      // If we have a goal and user logged income, increment goal.saved
      const goal = state.goal && e.type === 'in'
        ? { ...state.goal, saved: Math.min(state.goal.target, state.goal.saved + e.amt) }
        : state.goal;
      return {
        ...state,
        entries: [e, ...state.entries],
        balance: state.balance + delta,
        goal,
      };
    }

    case 'SET_GOAL':
      return { ...state, goal: action.payload };

    case 'MARK_INSIGHT_FIRED':
      return { ...state, insightFired: true };

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, init);
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
