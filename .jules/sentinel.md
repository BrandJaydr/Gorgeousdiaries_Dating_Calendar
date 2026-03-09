## 2025-05-15 - Hardening SECURITY DEFINER functions
**Vulnerability:** Search path hijacking in PostgreSQL `SECURITY DEFINER` functions.
**Learning:** Functions defined with `SECURITY DEFINER` execute with the privileges of the owner (postgres). If `search_path` is not explicitly set, a malicious user can create a shadow table in their own schema to intercept or manipulate the function's behavior.
**Prevention:** Always include `SET search_path = public` (or the specific required schemas) when defining `SECURITY DEFINER` functions to ensure they only access intended objects.
## 2026-03-08 - Privilege Escalation via Column Updates
**Vulnerability:** Supabase RLS 'UPDATE' policies do not provide column-level restrictions, allowing users to modify sensitive fields like 'role' or 'subscription_tier' if they have update access to their own record.
**Learning:** Even with robust identity-based RLS, users can promote themselves to 'admin' by updating their own profile unless prevented by a 'BEFORE UPDATE' database trigger.
**Prevention:** Implement 'BEFORE UPDATE' triggers on tables with sensitive columns to enforce field-level permissions, explicitly allowing exceptions for admins and system roles (null auth.uid()).
