## 2025-05-14 - Derived State: useMemo vs useEffect
**Learning:** Using `useState` + `useEffect` to derive state from other state/props causes an unnecessary extra render cycle. The component renders once with stale derived state, the effect runs, and then it renders again with updated state.
**Action:** Always prefer `useMemo` for derived state to ensure the value is calculated during the render phase, eliminating redundant re-renders and improving UI responsiveness.
