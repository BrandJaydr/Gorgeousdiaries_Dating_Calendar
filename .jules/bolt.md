## 2025-05-14 - React Performance Patterns in Calendar Apps

**Learning:** In highly interactive applications like calendars, moving derived data (e.g., filtered lists) from 'useState' + 'useEffect' to 'useMemo' eliminates redundant render cycles. Furthermore, memoizing expensive data transformation functions like date generation and event grouping is critical for maintaining 60fps when navigating between views.

**Action:** Always prefer 'useMemo' for derived state over 'useEffect' + 'useState'. Ensure that child components rendered in large lists (like 'EventCard') are wrapped in 'React.memo' to prevent re-render cascades.
