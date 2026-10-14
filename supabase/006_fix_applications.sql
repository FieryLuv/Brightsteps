-- BrightSteps — applications: visitor (anon) insert + staff manage
GRANT SELECT, INSERT ON TABLE public.applications TO anon;
GRANT ALL ON TABLE public.applications TO authenticated;

DROP POLICY IF EXISTS applications_staff ON public.applications;
DROP POLICY IF EXISTS applications_insert_public ON public.applications;

-- Anyone with the publishable/anon key can submit an enrollment application
CREATE POLICY applications_anon_insert ON public.applications
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Staff full access for their facility
CREATE POLICY applications_staff_all ON public.applications
  FOR ALL TO authenticated
  USING (public.is_staff() AND facility_id = public.my_facility_id())
  WITH CHECK (public.is_staff() AND facility_id = public.my_facility_id());

-- Optional: anon cannot read others' applications (no SELECT policy for anon beyond grant — revoke select if desired)
REVOKE SELECT ON TABLE public.applications FROM anon;
