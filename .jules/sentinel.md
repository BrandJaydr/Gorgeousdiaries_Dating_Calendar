## 2026-02-25 - Role Escalation via Incomplete RLS Policies
**Vulnerability:** Authenticated users could promote themselves to 'admin' or change their 'subscription_tier' by directly updating their row in the `users` table, as the RLS `UPDATE` policy lacked column-level restrictions.
**Learning:** Supabase RLS policies (e.g., `auth.uid() = id`) grant full update permissions on all columns of matching rows by default. While frontend UI might restrict these changes, the API remains exposed.
**Prevention:** Supplement identity-based RLS policies with `BEFORE UPDATE` database triggers to enforce column-level security for sensitive fields like roles, permissions, and identity markers. Always use `SECURITY DEFINER` and `SET search_path = public` for these triggers to ensure they run with elevated privileges while remaining secure against search path hijacking.
## 2026-02-25 - Unauthorized Role Escalation Prevention
**Vulnerability:** Overly permissive RLS on the `users` table allowed authenticated users to update their own `role` and `subscription_tier` columns, enabling self-promotion to the `admin` role.
**Learning:** Row Level Security (RLS) in Supabase/PostgreSQL is row-level by default. While you can restrict updates to a row based on ownership, RLS doesn't natively restrict specific columns based on the value change (old vs new) without using more complex `CHECK` expressions or triggers.
**Prevention:** Use a `BEFORE UPDATE` database trigger to enforce column-level security and validate state transitions. Always combine RLS with triggers for "Defense in Depth" when sensitive state transitions are involved. Ensure `SECURITY DEFINER` functions have a fixed `search_path` to prevent hijacking.
## 2025-05-15 - Hardening SECURITY DEFINER functions
**Vulnerability:** Search path hijacking in PostgreSQL `SECURITY DEFINER` functions.
**Learning:** Functions defined with `SECURITY DEFINER` execute with the privileges of the owner (postgres). If `search_path` is not explicitly set, a malicious user can create a shadow table in their own schema to intercept or manipulate the function's behavior.
**Prevention:** Always include `SET search_path = public` (or the specific required schemas) when defining `SECURITY DEFINER` functions to ensure they only access intended objects.
## 2026-03-08 - Privilege Escalation via Column Updates
**Vulnerability:** Supabase RLS 'UPDATE' policies do not provide column-level restrictions, allowing users to modify sensitive fields like 'role' or 'subscription_tier' if they have update access to their own record.
**Learning:** Even with robust identity-based RLS, users can promote themselves to 'admin' by updating their own profile unless prevented by a 'BEFORE UPDATE' database trigger.
**Prevention:** Implement 'BEFORE UPDATE' triggers on tables with sensitive columns to enforce field-level permissions, explicitly allowing exceptions for admins and system roles (null auth.uid()).
