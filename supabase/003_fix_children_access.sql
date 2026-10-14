-- =============================================================================
-- BrightSteps — Fix children read/write for authenticated staff
-- Run in Supabase SQL Editor (fixes empty table / silent LocalStorage fallback)
-- =============================================================================

-- 1) Grants so Data API can reach the table
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- 2) Ensure every staff profile is linked to the NCDC facility
UPDATE public.profiles
SET facility_id = 'a0000000-0000-4000-8000-000000000001',
    active = true
WHERE role IN ('head', 'faculty')
  AND (facility_id IS NULL OR facility_id IS DISTINCT FROM 'a0000000-0000-4000-8000-000000000001');

-- 3) Recreate children staff policy with explicit WITH CHECK (required for INSERT)
DROP POLICY IF EXISTS children_staff ON public.children;

CREATE POLICY children_staff_select ON public.children
  FOR SELECT TO authenticated
  USING (
    public.is_staff()
    AND facility_id = public.my_facility_id()
  );

CREATE POLICY children_staff_insert ON public.children
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_staff()
    AND facility_id = public.my_facility_id()
  );

CREATE POLICY children_staff_update ON public.children
  FOR UPDATE TO authenticated
  USING (public.is_staff() AND facility_id = public.my_facility_id())
  WITH CHECK (public.is_staff() AND facility_id = public.my_facility_id());

CREATE POLICY children_staff_delete ON public.children
  FOR DELETE TO authenticated
  USING (public.is_staff() AND facility_id = public.my_facility_id());

-- 4) Sanity checks (read results in SQL Editor)
SELECT id, full_name, role, is_head, active, facility_id, email
FROM public.profiles
ORDER BY role;

SELECT public.is_staff() AS am_i_staff;  -- may be null in SQL editor (no JWT)

SELECT COUNT(*) AS children_count FROM public.children;
