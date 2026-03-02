## 2026-02-25 - [Privilege Escalation via RLS Column Updates]
**Vulnerability:** Identity-based Supabase RLS policies (e.g., 'auth.uid() = id') allowed users to update any column in their own record, including 'role' and 'subscription_tier'.
**Learning:** RLS 'UPDATE' policies typically grant row-level access but do not inherently provide column-level restrictions. Users can maliciously escalate their own privileges if sensitive columns are in the same table.
**Prevention:** Use PostgreSQL 'BEFORE UPDATE' triggers with 'SECURITY DEFINER' to validate and restrict changes to sensitive columns, or move sensitive attributes to a separate table with more restrictive RLS.
