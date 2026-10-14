-- =============================================================================
-- BrightSteps — Parent multi-device access (anon-safe RPCs)
-- Parents log in with guardian name + Child ID (+ optional password).
-- SECURITY DEFINER functions return only that family's data.
-- =============================================================================

ALTER TABLE public.children
  ADD COLUMN IF NOT EXISTS parent_password text DEFAULT '';

GRANT EXECUTE ON FUNCTION public.parent_portal_login(text, text, text) TO anon, authenticated;
-- (re-granted after create below)

CREATE OR REPLACE FUNCTION public.parent_portal_login(
  p_guardian text,
  p_child_code text DEFAULT NULL,
  p_password text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_guardian text := lower(trim(coalesce(p_guardian, '')));
  v_code text := upper(trim(coalesce(p_child_code, '')));
  v_pass text := coalesce(p_password, '');
  v_children jsonb;
  v_child_ids uuid[];
  v_id uuid;
  v_reports jsonb := '[]'::jsonb;
  v_assessments jsonb := '[]'::jsonb;
  v_attendance jsonb := '[]'::jsonb;
  v_health jsonb := '[]'::jsonb;
  v_contrib jsonb := '[]'::jsonb;
  v_sfp jsonb := '[]'::jsonb;
  r record;
BEGIN
  IF v_guardian = '' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Guardian name is required.');
  END IF;

  -- Match guardian against login name / parent / mother / father (case-insensitive)
  SELECT coalesce(jsonb_agg(to_jsonb(c) ORDER BY c.full_name), '[]'::jsonb),
         array_agg(c.id)
  INTO v_children, v_child_ids
  FROM public.children c
  WHERE c.archived IS NOT TRUE
    AND c.facility_id = 'a0000000-0000-4000-8000-000000000001'::uuid
    AND (
      lower(trim(coalesce(c.parent_login_name, ''))) = v_guardian
      OR lower(trim(coalesce(c.parent_name, ''))) = v_guardian
      OR lower(trim(coalesce(c.mother_name, ''))) = v_guardian
      OR lower(trim(coalesce(c.father_name, ''))) = v_guardian
    )
    AND (v_code = '' OR upper(trim(c.child_code)) = v_code);

  IF v_children IS NULL OR jsonb_array_length(v_children) = 0 THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'No enrolled children found for that guardian name and Child ID. Check the credentials from enrollment.'
    );
  END IF;

  -- If any matched child has a password, require it
  IF EXISTS (
    SELECT 1 FROM public.children c
    WHERE c.id = ANY (v_child_ids)
      AND coalesce(trim(c.parent_password), '') <> ''
  ) THEN
    IF v_pass = '' OR NOT EXISTS (
      SELECT 1 FROM public.children c
      WHERE c.id = ANY (v_child_ids)
        AND c.parent_password = v_pass
    ) THEN
      RETURN jsonb_build_object(
        'ok', false,
        'error', 'Incorrect or missing password. Use the password set in parent Settings, or ask the teacher.'
      );
    END IF;
    -- Narrow to children that share this password (or empty)
    SELECT coalesce(jsonb_agg(to_jsonb(c) ORDER BY c.full_name), '[]'::jsonb),
           array_agg(c.id)
    INTO v_children, v_child_ids
    FROM public.children c
    WHERE c.id = ANY (v_child_ids)
      AND (coalesce(trim(c.parent_password), '') = '' OR c.parent_password = v_pass);
  END IF;

  -- Approved progress reports
  SELECT coalesce(jsonb_agg(to_jsonb(pr)), '[]'::jsonb) INTO v_reports
  FROM public.progress_reports pr
  WHERE pr.child_id = ANY (v_child_ids)
    AND pr.status = 'approved';

  SELECT coalesce(jsonb_agg(to_jsonb(a)), '[]'::jsonb) INTO v_assessments
  FROM public.assessments a
  WHERE a.child_id = ANY (v_child_ids);

  SELECT coalesce(jsonb_agg(to_jsonb(att)), '[]'::jsonb) INTO v_attendance
  FROM public.attendance att
  WHERE att.child_id = ANY (v_child_ids);

  SELECT coalesce(jsonb_agg(to_jsonb(h)), '[]'::jsonb) INTO v_health
  FROM public.health_records h
  WHERE h.child_id = ANY (v_child_ids);

  SELECT coalesce(jsonb_agg(to_jsonb(ct)), '[]'::jsonb) INTO v_contrib
  FROM public.contributions ct
  WHERE ct.child_id = ANY (v_child_ids);

  SELECT coalesce(jsonb_agg(to_jsonb(b)), '[]'::jsonb) INTO v_sfp
  FROM public.sfp_beneficiaries b
  WHERE b.child_id = ANY (v_child_ids);

  RETURN jsonb_build_object(
    'ok', true,
    'children', v_children,
    'reports', coalesce(v_reports, '[]'::jsonb),
    'assessments', coalesce(v_assessments, '[]'::jsonb),
    'attendance', coalesce(v_attendance, '[]'::jsonb),
    'health', coalesce(v_health, '[]'::jsonb),
    'contributions', coalesce(v_contrib, '[]'::jsonb),
    'sfp', coalesce(v_sfp, '[]'::jsonb)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.parent_portal_login(text, text, text) TO anon, authenticated;
REVOKE ALL ON FUNCTION public.parent_portal_login(text, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.parent_portal_login(text, text, text) TO anon, authenticated;
