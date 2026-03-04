## 2024-05-22 - [Visual Feedback for Async Actions]
**Learning:** Background actions like file downloads (iCal export) need immediate visual confirmation in the UI because the browser's download notification is often subtle or delayed.
**Action:** Implement a temporary "Success!" state (e.g., changing button text/color for 2 seconds) for all non-navigational background actions. Use `useRef` to manage the timeout to prevent state updates on unmounted components.
