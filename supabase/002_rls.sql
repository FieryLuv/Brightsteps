-- =============================================================================
-- BrightSteps — Row Level Security (Step 1b)
-- Run AFTER 001_schema.sql
-- =============================================================================
-- Policy model (single facility for now):
--   head / faculty  → full read/write on facility data (active staff only)
--   parent          → read own linked children + approved reports + own contributions
--   visitor         → insert applications only (no child read)
-- =============================================================================

ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sfp_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sfp_beneficiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sfp_hot_meal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sfp_nutricombo_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.head_transfer_proposals ENABLE ROW LEVEL SECURITY;

-- Helpers
CREATE OR REPLACE FUNCTION public.current_role()
RETURNS public.app_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('head', 'faculty')
      AND active = true
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_head()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND (role = 'head' OR is_head = true)
      AND active = true
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.my_facility_id()
RETURNS uuid AS $$
  SELECT facility_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Profiles: users read/update self; staff can read colleagues in facility
CREATE POLICY profiles_select_self_or_staff ON public.profiles
  FOR SELECT USING (
    id = auth.uid()
    OR (public.is_staff() AND facility_id = public.my_facility_id())
  );

CREATE POLICY profiles_update_self ON public.profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY profiles_head_manage ON public.profiles
  FOR ALL USING (public.is_head() AND facility_id = public.my_facility_id());

-- Facilities: staff of that facility
CREATE POLICY facilities_staff ON public.facilities
  FOR ALL USING (public.is_staff() AND id = public.my_facility_id());

CREATE POLICY facilities_parent_read ON public.facilities
  FOR SELECT USING (id = public.my_facility_id());

-- Classes
CREATE POLICY classes_staff ON public.classes
  FOR ALL USING (public.is_staff() AND facility_id = public.my_facility_id());

CREATE POLICY classes_parent_read ON public.classes
  FOR SELECT USING (facility_id = public.my_facility_id());

-- Children: staff full access in facility; parents only linked children
CREATE POLICY children_staff ON public.children
  FOR ALL USING (public.is_staff() AND facility_id = public.my_facility_id());

CREATE POLICY children_parent_read ON public.children
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.parent_children pc
      WHERE pc.child_id = children.id AND pc.parent_id = auth.uid()
    )
  );

-- Parent links
CREATE POLICY parent_children_staff ON public.parent_children
  FOR ALL USING (public.is_staff());

CREATE POLICY parent_children_self ON public.parent_children
  FOR SELECT USING (parent_id = auth.uid());

-- Applications: staff manage; anyone authenticated can insert (visitor path)
CREATE POLICY applications_staff ON public.applications
  FOR ALL USING (public.is_staff() AND facility_id = public.my_facility_id());

CREATE POLICY applications_insert_public ON public.applications
  FOR INSERT WITH CHECK (true);
-- Note: tighten with anon key + captcha later; for visitor enrollment use service role
-- or a dedicated Edge Function.

-- Assessments / reports / attendance / health / SFP / contributions / calendar
CREATE POLICY assessments_staff ON public.assessments
  FOR ALL USING (public.is_staff() AND facility_id = public.my_facility_id());

CREATE POLICY assessments_parent_read ON public.assessments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.parent_children pc
      WHERE pc.child_id = assessments.child_id AND pc.parent_id = auth.uid()
    )
  );

CREATE POLICY reports_staff ON public.progress_reports
  FOR ALL USING (public.is_staff() AND facility_id = public.my_facility_id());

CREATE POLICY reports_parent_approved ON public.progress_reports
  FOR SELECT USING (
    status = 'approved'
    AND EXISTS (
      SELECT 1 FROM public.parent_children pc
      WHERE pc.child_id = progress_reports.child_id AND pc.parent_id = auth.uid()
    )
  );

CREATE POLICY attendance_staff ON public.attendance
  FOR ALL USING (public.is_staff() AND facility_id = public.my_facility_id());

CREATE POLICY attendance_parent_read ON public.attendance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.parent_children pc
      WHERE pc.child_id = attendance.child_id AND pc.parent_id = auth.uid()
    )
  );

CREATE POLICY health_staff ON public.health_records
  FOR ALL USING (public.is_staff() AND facility_id = public.my_facility_id());

CREATE POLICY health_parent_read ON public.health_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.parent_children pc
      WHERE pc.child_id = health_records.child_id AND pc.parent_id = auth.uid()
    )
  );

CREATE POLICY sfp_cycles_staff ON public.sfp_cycles
  FOR ALL USING (public.is_staff() AND facility_id = public.my_facility_id());

CREATE POLICY sfp_ben_staff ON public.sfp_beneficiaries
  FOR ALL USING (public.is_staff() AND facility_id = public.my_facility_id());

CREATE POLICY sfp_ben_parent_read ON public.sfp_beneficiaries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.parent_children pc
      WHERE pc.child_id = sfp_beneficiaries.child_id AND pc.parent_id = auth.uid()
    )
  );

CREATE POLICY sfp_hot_staff ON public.sfp_hot_meal_logs
  FOR ALL USING (public.is_staff() AND facility_id = public.my_facility_id());

CREATE POLICY sfp_hot_parent_read ON public.sfp_hot_meal_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.parent_children pc
      WHERE pc.child_id = sfp_hot_meal_logs.child_id AND pc.parent_id = auth.uid()
    )
  );

CREATE POLICY sfp_nutri_staff ON public.sfp_nutricombo_deliveries
  FOR ALL USING (public.is_staff() AND facility_id = public.my_facility_id());

CREATE POLICY contributions_staff ON public.contributions
  FOR ALL USING (public.is_staff() AND facility_id = public.my_facility_id());

CREATE POLICY contributions_parent_read ON public.contributions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.parent_children pc
      WHERE pc.child_id = contributions.child_id AND pc.parent_id = auth.uid()
    )
  );

CREATE POLICY calendar_staff ON public.calendar_events
  FOR ALL USING (public.is_staff() AND facility_id = public.my_facility_id());

CREATE POLICY calendar_parent_read ON public.calendar_events
  FOR SELECT USING (facility_id = public.my_facility_id());

CREATE POLICY head_transfer_staff ON public.head_transfer_proposals
  FOR ALL USING (public.is_staff() AND facility_id = public.my_facility_id());
