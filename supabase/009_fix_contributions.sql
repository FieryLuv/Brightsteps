GRANT ALL ON TABLE public.contributions TO authenticated;

DROP POLICY IF EXISTS contributions_staff ON public.contributions;
DROP POLICY IF EXISTS contributions_parent_read ON public.contributions;

CREATE POLICY contributions_staff_all ON public.contributions
  FOR ALL TO authenticated
  USING (public.is_staff() AND facility_id = public.my_facility_id())
  WITH CHECK (public.is_staff() AND facility_id = public.my_facility_id());

CREATE POLICY contributions_parent_read ON public.contributions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.parent_children pc
      WHERE pc.child_id = contributions.child_id AND pc.parent_id = auth.uid()
    )
  );
