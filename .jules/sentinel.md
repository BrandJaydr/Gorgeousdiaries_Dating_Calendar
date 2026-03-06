## 2026-03-06 - Secure SECURITY DEFINER Functions

**Vulnerability:** Search path hijacking in PostgreSQL `SECURITY DEFINER` functions.
**Learning:** Functions defined with `SECURITY DEFINER` execute with the privileges of the user who created them (usually `postgres` or a high-privilege service role). If the `search_path` is not explicitly set, a malicious user could create a table or function with the same name in a schema they control, which might be searched before the intended `public` schema, leading to privilege escalation or unintended behavior.
**Prevention:** Always include `SET search_path = public` in the definition of `SECURITY DEFINER` functions and use explicit schema qualifiers (e.g., `public.users`) for table and function references within the function body.
