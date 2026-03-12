# Palette's Journal - Critical UX Learnings

## 2025-05-15 - [Visual Feedback for Background Actions]
**Learning:** Actions that don't result in a visible navigation or UI change (like downloading an iCal file) leave users wondering if anything happened. Providing immediate, temporary visual feedback (e.g., changing button text/icon) significantly improves perceived reliability.
**Action:** Always implement a brief "success" state for download or background export buttons.

## 2025-05-15 - [Accessibility & Focus Visibility]
**Learning:** Icon-only buttons and interactive cards often lack proper focus indicators and ARIA labels, making them difficult for keyboard and screen reader users to navigate.
**Action:** Ensure all interactive elements have `focus-visible` styles and descriptive `aria-label` attributes.

## 2026-03-12 - [Empty States with Actionable Recovery]
**Learning:** When filters or searches return zero results, a blank screen creates a "dead end" user experience. Providing a clear "No results" message along with an immediate way to reset filters (e.g., a "Clear all filters" button) keeps the user in the flow and reduces frustration.
**Action:** Always implement an actionable empty state for searchable or filterable lists.
