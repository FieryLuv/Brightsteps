-- Calendar events: extra fields + staff RLS
ALTER TABLE public.calendar_events
  ADD COLUMN IF NOT EXISTS event_type text DEFAULT 'Event',
  ADD COLUMN IF NOT EXISTS audience text DEFAULT '';

GRANT ALL ON TABLE public.calendar_events TO authenticated;

DROP POLICY IF EXISTS calendar_staff ON public.calendar_events;
DROP POLICY IF EXISTS calendar_parent_read ON public.calendar_events;
DROP POLICY IF EXISTS calendar_staff_all ON public.calendar_events;

CREATE POLICY calendar_staff_all ON public.calendar_events
  FOR ALL TO authenticated
  USING (public.is_staff() AND facility_id = public.my_facility_id())
  WITH CHECK (public.is_staff() AND facility_id = public.my_facility_id());

-- Parents / authenticated can read center events (facility-wide schedule)
CREATE POLICY calendar_read_authenticated ON public.calendar_events
  FOR SELECT TO authenticated
  USING (true);
