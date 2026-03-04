## 2025-05-14 - [PostgreSQL Security Hardening]
**Vulnerability:** Search path hijacking in SECURITY DEFINER functions and unauthorized role/tier escalation on the users table.
**Learning:** SECURITY DEFINER functions run with the privileges of the owner and are vulnerable to search path hijacking if the search path is not explicitly set. Additionally, identity-based RLS policies (e.g., `auth.uid() = id`) do not provide column-level protection, meaning a user can update their own role unless a BEFORE UPDATE trigger is present.
**Prevention:** Always include `SET search_path = public` in SECURITY DEFINER functions and use BEFORE UPDATE triggers to protect sensitive columns from unauthorized modification by the owner of the row.
