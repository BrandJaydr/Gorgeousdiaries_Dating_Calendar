## 2025-05-15 - [Initial Performance Audit]
**Learning:** The calendar views (Month, Week, Rolling) perform expensive calculations (date generation, event grouping) on every render. Since `CalendarPage` frequently re-renders due to hover states and filter updates, these calculations and the subsequent re-rendering of many `EventCard` components create a noticeable lag.
**Action:** Apply `React.memo` to view components and `EventCard`, and use `useMemo` for heavy data transformations. Add lazy loading to images to improve initial load and scroll performance.
