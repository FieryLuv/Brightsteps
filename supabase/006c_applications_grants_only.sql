-- =============================================================================
-- BrightSteps — GRANT only (policy already exists)
-- Fixes: permission denied for table applications
-- =============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT INSERT, SELECT ON TABLE public.applications TO anon;
GRANT ALL ON TABLE public.applications TO authenticated;

-- Confirm
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'applications'
ORDER BY grantee, privilege_type;
