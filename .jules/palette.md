## 2025-05-15 - Feedback for download actions
**Learning:** UX improvements for background actions (like downloads) that don't trigger a page navigation should provide temporary visual feedback to confirm success.
**Action:** Use a temporary state change (e.g., 2 seconds) on the triggering element, switching text and icons (e.g., from 'Download' to 'Check') and use 'aria-live="polite"' for accessibility.
