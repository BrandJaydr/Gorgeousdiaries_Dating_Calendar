## 2026-02-25 - [Privilege Escalation via RLS]
**Vulnerability:** Authenticated users could escalate their own privileges by updating the 'role' or 'subscription_tier' columns in the 'users' table because RLS only checked for ownership, not column-level permissions.
**Learning:** Supabase RLS policies are row-based and do not provide native column-level security for updates. Row ownership does not imply permission to modify all columns within that row.
**Prevention:** Use 'BEFORE UPDATE' database triggers to protect sensitive columns from unauthorized modification, ensuring that security-critical fields can only be changed by authorized roles (e.g., admins).
