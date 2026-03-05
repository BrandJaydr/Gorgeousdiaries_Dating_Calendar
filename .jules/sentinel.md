## 2025-05-15 - Privilege Escalation via Identity-Based RLS
**Vulnerability:** Identity-based Supabase RLS policies (e.g., `auth.uid() = id`) allow users to update any column in their own row, including sensitive fields like `role` and `subscription_tier`.
**Learning:** RLS does not provide column-level security natively for `UPDATE` operations without complex `WITH CHECK` conditions that can be bypassable or prone to recursion.
**Prevention:** Use `BEFORE UPDATE` database triggers with `SECURITY DEFINER` and `SET search_path = public` to selectively protect sensitive columns by reverting unauthorized changes to their `OLD` values.
