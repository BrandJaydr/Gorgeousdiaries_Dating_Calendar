## 2025-03-02 - Derived State Optimization
**Learning:** Moving derived state filtering from `useEffect` to `useMemo` eliminates a redundant render cycle. In a component with many child elements (like a calendar), this measurably improves UI responsiveness.
**Action:** Always prefer `useMemo` for derived state calculation over `useEffect` + `useState`.

## 2025-03-02 - React.memo with Callback Dependencies
**Learning:** `React.memo` is only effective if props are stable. Passing inline functions or non-memoized callbacks to memoized children breaks the optimization.
**Action:** Use `useCallback` for all event handlers passed to memoized components.
## 2025-05-14 - React Performance Patterns in Calendar Apps

**Learning:** In highly interactive applications like calendars, moving derived data (e.g., filtered lists) from 'useState' + 'useEffect' to 'useMemo' eliminates redundant render cycles. Furthermore, memoizing expensive data transformation functions like date generation and event grouping is critical for maintaining 60fps when navigating between views.

**Action:** Always prefer 'useMemo' for derived state over 'useEffect' + 'useState'. Ensure that child components rendered in large lists (like 'EventCard') are wrapped in 'React.memo' to prevent re-render cascades.
## 2025-05-15 - [Initial Performance Audit]
**Learning:** The calendar views (Month, Week, Rolling) perform expensive calculations (date generation, event grouping) on every render. Since `CalendarPage` frequently re-renders due to hover states and filter updates, these calculations and the subsequent re-rendering of many `EventCard` components create a noticeable lag.
**Action:** Apply `React.memo` to view components and `EventCard`, and use `useMemo` for heavy data transformations. Add lazy loading to images to improve initial load and scroll performance.
## 2025-02-25 - Focused Derived State Optimization
**Learning:** In a React application, deriving state using 'useEffect' is an anti-pattern that causes unnecessary re-renders (initial render with empty/stale state followed by a second render after 'useEffect' updates it). Converting these to 'useMemo' ensures the value is calculated during the render phase and only when dependencies change, leading to a measurably smoother experience, especially when expensive calculations like geolocation-based distance filtering are involved.
**Action:** Always prioritize 'useMemo' for derived state over the 'useState' + 'useEffect' pattern. Strictly adhere to the 'ONE small improvement' (< 50 lines) rule to ensure PRs are focused and reviewable, as scope creep can lead to regressions or rejection during review.
