-- BrightSteps — attendance table access for authenticated staff
GRANT ALL ON TABLE public.attendance TO authenticated;

DROP POLICY IF EXISTS attendance_staff ON public.attendance;
CREATE POLICY attendance_staff_all ON public.attendance
  FOR ALL TO authenticated
  USING (public.is_staff() AND facility_id = public.my_facility_id())
  WITH CHECK (public.is_staff() AND facility_id = public.my_facility_id());

DROP POLICY IF EXISTS attendance_parent_read ON public.attendance;
CREATE POLICY attendance_parent_read ON public.attendance
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.parent_children pc
      WHERE pc.child_id = attendance.child_id AND pc.parent_id = auth.uid()
    )
  );
