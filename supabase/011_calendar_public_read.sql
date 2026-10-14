
-- Center calendar is public read (parents/visitors use anon key)
GRANT SELECT ON TABLE public.calendar_events TO anon;

DROP POLICY IF EXISTS calendar_read_anon ON public.calendar_events;
CREATE POLICY calendar_read_anon ON public.calendar_events
  FOR SELECT TO anon
  USING (true);
