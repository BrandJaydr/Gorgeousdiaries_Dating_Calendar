## 2025-05-21 - Calendar Optimization Learnings
**Learning:** In a data-heavy calendar application, the `useState` + `useEffect` pattern for filtering causes a mandatory double-render (initial render with stale/empty filtered data, then a second render after `useEffect` sets the filtered state). Switching to `useMemo` for derived state eliminates this extra render cycle entirely.

**Action:** Always prefer `useMemo` over `useEffect` for deriving state from props or other state variables.

**Learning:** When memoizing data based on the current time (e.g., `new Date()`), using an empty dependency array `[]` in `useMemo` will cause the data to become stale if the component stays mounted across date boundaries.

**Action:** For time-sensitive calculations that are relatively inexpensive, it's safer to avoid `useMemo` or ensure the component itself is correctly throttled/memoized at a higher level.
