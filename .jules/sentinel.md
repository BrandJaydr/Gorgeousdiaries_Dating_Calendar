## 2025-05-15 - Hardening SECURITY DEFINER functions
**Vulnerability:** Search path hijacking in PostgreSQL `SECURITY DEFINER` functions.
**Learning:** Functions defined with `SECURITY DEFINER` execute with the privileges of the owner (postgres). If `search_path` is not explicitly set, a malicious user can create a shadow table in their own schema to intercept or manipulate the function's behavior.
**Prevention:** Always include `SET search_path = public` (or the specific required schemas) when defining `SECURITY DEFINER` functions to ensure they only access intended objects.
