-- BrightSteps — ensure assessments + progress_reports are writable by staff
GRANT ALL ON TABLE public.assessments TO authenticated;
GRANT ALL ON TABLE public.progress_reports TO authenticated;

DROP POLICY IF EXISTS assessments_staff ON public.assessments;
CREATE POLICY assessments_staff_all ON public.assessments
  FOR ALL TO authenticated
  USING (public.is_staff() AND facility_id = public.my_facility_id())
  WITH CHECK (public.is_staff() AND facility_id = public.my_facility_id());

DROP POLICY IF EXISTS reports_staff ON public.progress_reports;
CREATE POLICY reports_staff_all ON public.progress_reports
  FOR ALL TO authenticated
  USING (public.is_staff() AND facility_id = public.my_facility_id())
  WITH CHECK (public.is_staff() AND facility_id = public.my_facility_id());

-- Parent read of approved reports only (keep existing parent policy name if present)
DROP POLICY IF EXISTS reports_parent_approved ON public.progress_reports;
CREATE POLICY reports_parent_approved ON public.progress_reports
  FOR SELECT TO authenticated
  USING (
    status = 'approved'
    AND EXISTS (
      SELECT 1 FROM public.parent_children pc
      WHERE pc.child_id = progress_reports.child_id AND pc.parent_id = auth.uid()
    )
  );
