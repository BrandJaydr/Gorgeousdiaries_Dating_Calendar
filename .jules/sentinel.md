## 2026-03-08 - Privilege Escalation via Column Updates
**Vulnerability:** Supabase RLS 'UPDATE' policies do not provide column-level restrictions, allowing users to modify sensitive fields like 'role' or 'subscription_tier' if they have update access to their own record.
**Learning:** Even with robust identity-based RLS, users can promote themselves to 'admin' by updating their own profile unless prevented by a 'BEFORE UPDATE' database trigger.
**Prevention:** Implement 'BEFORE UPDATE' triggers on tables with sensitive columns to enforce field-level permissions, explicitly allowing exceptions for admins and system roles (null auth.uid()).
