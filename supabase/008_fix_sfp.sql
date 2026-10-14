-- BrightSteps — SFP tables access for staff
GRANT ALL ON TABLE public.sfp_cycles TO authenticated;
GRANT ALL ON TABLE public.sfp_beneficiaries TO authenticated;
GRANT ALL ON TABLE public.sfp_hot_meal_logs TO authenticated;
GRANT ALL ON TABLE public.sfp_nutricombo_deliveries TO authenticated;

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT policyname, tablename FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('sfp_cycles','sfp_beneficiaries','sfp_hot_meal_logs','sfp_nutricombo_deliveries')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

CREATE POLICY sfp_cycles_staff ON public.sfp_cycles
  FOR ALL TO authenticated
  USING (public.is_staff() AND facility_id = public.my_facility_id())
  WITH CHECK (public.is_staff() AND facility_id = public.my_facility_id());

CREATE POLICY sfp_ben_staff ON public.sfp_beneficiaries
  FOR ALL TO authenticated
  USING (public.is_staff() AND facility_id = public.my_facility_id())
  WITH CHECK (public.is_staff() AND facility_id = public.my_facility_id());

CREATE POLICY sfp_hot_staff ON public.sfp_hot_meal_logs
  FOR ALL TO authenticated
  USING (public.is_staff() AND facility_id = public.my_facility_id())
  WITH CHECK (public.is_staff() AND facility_id = public.my_facility_id());

CREATE POLICY sfp_nutri_staff ON public.sfp_nutricombo_deliveries
  FOR ALL TO authenticated
  USING (public.is_staff() AND facility_id = public.my_facility_id())
  WITH CHECK (public.is_staff() AND facility_id = public.my_facility_id());

-- Parent read beneficiaries + recent feeding for linked children
CREATE POLICY sfp_ben_parent ON public.sfp_beneficiaries
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.parent_children pc
      WHERE pc.child_id = sfp_beneficiaries.child_id AND pc.parent_id = auth.uid()
    )
  );

CREATE POLICY sfp_hot_parent ON public.sfp_hot_meal_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.parent_children pc
      WHERE pc.child_id = sfp_hot_meal_logs.child_id AND pc.parent_id = auth.uid()
    )
  );
