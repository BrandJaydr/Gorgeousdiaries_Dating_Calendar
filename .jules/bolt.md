## 2025-03-02 - Derived State Optimization
**Learning:** Moving derived state filtering from `useEffect` to `useMemo` eliminates a redundant render cycle. In a component with many child elements (like a calendar), this measurably improves UI responsiveness.
**Action:** Always prefer `useMemo` for derived state calculation over `useEffect` + `useState`.

## 2025-03-02 - React.memo with Callback Dependencies
**Learning:** `React.memo` is only effective if props are stable. Passing inline functions or non-memoized callbacks to memoized children breaks the optimization.
**Action:** Use `useCallback` for all event handlers passed to memoized components.
