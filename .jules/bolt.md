## 2025-05-22 - [Optimizing Calendar Rendering]
**Learning:** In complex views like a calendar with many events, the 'useState' + 'useEffect' pattern for filtering data causes an extra render cycle that can be felt by the user during high-frequency interactions (like hovering). Using 'useMemo' for this derived state ensures synchronization in a single render. Additionally, 'React.memo' is only effective if combined with 'useCallback' for event handlers passed as props, as stable references are required to skip re-renders.

**Action:** Prefer 'useMemo' for derived state over 'useEffect'. Always pair 'React.memo' with 'useCallback' for callbacks to ensure prop stability.
