-- BrightSteps — health_records access for staff
GRANT ALL ON TABLE public.health_records TO authenticated;

DROP POLICY IF EXISTS health_staff ON public.health_records;
DROP POLICY IF EXISTS health_parent_read ON public.health_records;

CREATE POLICY health_staff_all ON public.health_records
  FOR ALL TO authenticated
  USING (public.is_staff() AND facility_id = public.my_facility_id())
  WITH CHECK (public.is_staff() AND facility_id = public.my_facility_id());

CREATE POLICY health_parent_read ON public.health_records
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.parent_children pc
      WHERE pc.child_id = health_records.child_id AND pc.parent_id = auth.uid()
    )
  );
