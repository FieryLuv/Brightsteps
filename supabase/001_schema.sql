-- =============================================================================
-- BrightSteps — Supabase / PostgreSQL schema (Step 1)
-- NCDC Medina · Child Development Monitoring System
-- =============================================================================
-- Run in Supabase SQL Editor (or via CLI) AFTER creating the project.
-- Maps current LocalStorage stores → relational tables.
-- Flexible profile parts use JSONB to match the existing form shape without
-- exploding into dozens of sparse columns on day one.
-- =============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Roles (app-level; stored on profiles)
-- head | faculty | parent | visitor
-- ---------------------------------------------------------------------------

CREATE TYPE public.app_role AS ENUM ('head', 'faculty', 'parent', 'visitor');

-- ---------------------------------------------------------------------------
-- Facility (single center for NCDC Medina; extensible later)
-- ---------------------------------------------------------------------------
CREATE TABLE public.facilities (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  center_name   text NOT NULL DEFAULT 'National Child Development Center — Medina',
  facility_category text DEFAULT 'CDC',
  province      text DEFAULT 'Misamis Oriental',
  district      text DEFAULT '',
  municipality  text DEFAULT 'Medina',
  barangay      text DEFAULT '',
  address       text DEFAULT '',
  with_wash_facility boolean DEFAULT false,
  with_community_garden boolean DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- TeacherStore staff + parent login identity
-- ---------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  facility_id   uuid REFERENCES public.facilities(id) ON DELETE SET NULL,
  role          public.app_role NOT NULL DEFAULT 'faculty',
  full_name     text NOT NULL DEFAULT '',
  username      text UNIQUE,
  position      text DEFAULT '',
  sex           text DEFAULT '',
  email         text DEFAULT '',
  phone         text DEFAULT '',
  employee_id   text DEFAULT '',
  -- Head pointer: at most one head per facility (enforced in app + partial unique optional)
  is_head       boolean NOT NULL DEFAULT false,
  active        boolean NOT NULL DEFAULT true,
  archived_at   timestamptz,
  password_hint text DEFAULT '',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX profiles_facility_idx ON public.profiles(facility_id);
CREATE INDEX profiles_role_idx ON public.profiles(role);
CREATE INDEX profiles_active_idx ON public.profiles(active);

-- ---------------------------------------------------------------------------
-- Classes (ClassStore)
-- ---------------------------------------------------------------------------
CREATE TABLE public.classes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id   uuid NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  key           text NOT NULL,              -- e.g. explorers, stars, sunshine
  name          text NOT NULL,
  age_range     text DEFAULT '',
  description   text DEFAULT '',
  active        boolean NOT NULL DEFAULT true,
  sort_order    int DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (facility_id, key)
);

-- ---------------------------------------------------------------------------
-- Children (ChildRegistry / SampleChildren)
-- Core identity columns + JSONB for ECCD profile phases B–D
-- ---------------------------------------------------------------------------
CREATE TABLE public.children (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id     uuid NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  class_id        uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  child_code      text NOT NULL,
  first_name      text DEFAULT '',
  middle_initial  text DEFAULT '',
  last_name       text DEFAULT '',
  full_name       text NOT NULL,
  sex             text DEFAULT 'Female',
  birth_date      date,
  age_months      int,
  age_label       text DEFAULT '',
  section_key     text DEFAULT '',          -- denormalized class.key for fast filters
  section_label   text DEFAULT '',
  record_type     smallint DEFAULT 1,       -- 1 = 0–36m, 2 = 37–71m
  parent_name     text DEFAULT '',
  mother_name     text DEFAULT '',
  father_name     text DEFAULT '',
  -- Address
  barangay        text DEFAULT '',
  municipality    text DEFAULT 'Medina',
  province        text DEFAULT 'Misamis Oriental',
  region          text DEFAULT 'X',
  purok           text DEFAULT '',
  siblings_count  int DEFAULT 0,
  birth_order     text DEFAULT '',
  -- Soft archive
  archived        boolean NOT NULL DEFAULT false,
  archived_at     timestamptz,
  archive_reason  text DEFAULT '',
  -- ECCD / enrollment extras (JSONB keeps parity with current forms)
  vaccines        jsonb DEFAULT '{}'::jsonb,
  documents       jsonb DEFAULT '{}'::jsonb,
  photo_path      text,                     -- Storage path (not base64)
  mother_profile  jsonb DEFAULT '{}'::jsonb,
  father_profile  jsonb DEFAULT '{}'::jsonb,
  siblings_detail jsonb DEFAULT '[]'::jsonb,
  physical_attributes jsonb DEFAULT '{}'::jsonb,
  prior_ece       jsonb DEFAULT '{}'::jsonb,
  transport       jsonb DEFAULT '{}'::jsonb,
  accompanies     jsonb DEFAULT '{}'::jsonb,
  profile_meta    jsonb DEFAULT '{}'::jsonb,
  enrollment_health jsonb DEFAULT '{}'::jsonb,
  enrollment_source text DEFAULT 'walk_in',
  application_id  uuid,                     -- FK filled after applications table
  -- Parent portal credentials (guardian login)
  parent_login_name text DEFAULT '',
  parent_login_hint text DEFAULT '',
  -- Dev status cache (optional; live insight preferred)
  status          text DEFAULT 'on_track',
  status_label    text DEFAULT 'On Track',
  focus_area      text,
  enrolled_at     timestamptz DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (facility_id, child_code)
);

CREATE INDEX children_facility_idx ON public.children(facility_id);
CREATE INDEX children_class_idx ON public.children(class_id);
CREATE INDEX children_archived_idx ON public.children(facility_id, archived);
CREATE INDEX children_section_idx ON public.children(facility_id, section_key);

-- Parent ↔ child link (one parent auth user may have several children)
CREATE TABLE public.parent_children (
  parent_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  child_id    uuid NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  PRIMARY KEY (parent_id, child_id)
);

-- ---------------------------------------------------------------------------
-- Online enrollment applications (ApplicationStore)
-- ---------------------------------------------------------------------------
CREATE TABLE public.applications (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id   uuid NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  status        text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'approved', 'rejected', 'enrolled', 'cancelled')),
  payload       jsonb NOT NULL DEFAULT '{}'::jsonb,  -- full form softcopy
  child_name    text DEFAULT '',
  guardian_name text DEFAULT '',
  contact       text DEFAULT '',
  reviewed_by   uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at   timestamptz,
  enrolled_child_id uuid REFERENCES public.children(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX applications_status_idx ON public.applications(facility_id, status);

ALTER TABLE public.children
  ADD CONSTRAINT children_application_fk
  FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- ECCD assessments (AssessmentStore)
-- ---------------------------------------------------------------------------
CREATE TABLE public.assessments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id        uuid NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  facility_id     uuid NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  period          text NOT NULL,            -- 1st … 6th
  record_type     smallint,
  age_months      int,
  domain_scores   jsonb DEFAULT '{}'::jsonb,
  responses       jsonb DEFAULT '{}'::jsonb,
  item_results    jsonb DEFAULT '[]'::jsonb,
  insight         jsonb DEFAULT '{}'::jsonb,
  final_scores    jsonb,
  finalized       boolean DEFAULT false,
  finalized_at    timestamptz,
  saved_at        timestamptz DEFAULT now(),
  created_by      uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (child_id, period)
);

CREATE INDEX assessments_child_idx ON public.assessments(child_id);

-- ---------------------------------------------------------------------------
-- Progress reports for parent portal (ReportStore)
-- ---------------------------------------------------------------------------
CREATE TABLE public.progress_reports (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id        uuid NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  facility_id     uuid NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  period          text NOT NULL,
  record_type     smallint,
  age_months      int,
  domain_scores   jsonb DEFAULT '[]'::jsonb,
  standard_score  numeric,
  sum_of_scaled   numeric,
  overall_label   text DEFAULT '',
  teacher_note    text DEFAULT '',
  parent_draft    text DEFAULT '',
  tips            jsonb DEFAULT '[]'::jsonb,
  strengths       jsonb DEFAULT '[]'::jsonb,
  needs           jsonb DEFAULT '[]'::jsonb,
  teacher_comments jsonb DEFAULT '[]'::jsonb,
  focus_items     jsonb DEFAULT '[]'::jsonb,
  status          text NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'approved')),
  approved_at     timestamptz,
  updated_by      uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (child_id, period)
);

-- ---------------------------------------------------------------------------
-- Attendance (AttendanceStore) — one row per child per day
-- ---------------------------------------------------------------------------
CREATE TABLE public.attendance (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id   uuid NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  child_id      uuid NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  class_id      uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  section_key   text NOT NULL,
  attend_date   date NOT NULL,
  mark          text NOT NULL CHECK (mark IN ('P', 'A')),
  remarks       text DEFAULT '',            -- required when mark = 'A' (app-enforced)
  recorded_by   uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  saved_at      timestamptz DEFAULT now(),
  UNIQUE (child_id, attend_date)
);

CREATE INDEX attendance_section_date_idx ON public.attendance(facility_id, section_key, attend_date);

-- ---------------------------------------------------------------------------
-- Health records (HealthStore)
-- ---------------------------------------------------------------------------
CREATE TABLE public.health_records (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id      uuid NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  facility_id   uuid NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  recorded_at   date DEFAULT CURRENT_DATE,
  height_cm     numeric,
  weight_kg     numeric,
  bmi           numeric,
  nutrition_status text DEFAULT '',
  notes         text DEFAULT '',
  feeding_participating boolean DEFAULT false,
  payload       jsonb DEFAULT '{}'::jsonb,  -- extra fields
  created_by    uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX health_child_idx ON public.health_records(child_id);

-- ---------------------------------------------------------------------------
-- SFP cycle + beneficiary + feeding logs
-- ---------------------------------------------------------------------------
CREATE TABLE public.sfp_cycles (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id   uuid NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  cycle_number  int,
  cycle_label   text DEFAULT '',
  school_year   text DEFAULT '',
  worker_name   text DEFAULT '',
  facility_name text DEFAULT '',
  facility_category text DEFAULT 'CDC',
  province      text DEFAULT '',
  municipality  text DEFAULT '',
  barangay      text DEFAULT '',
  with_wash_facility boolean DEFAULT false,
  with_community_garden boolean DEFAULT false,
  menu          jsonb DEFAULT '[]'::jsonb,
  is_active     boolean DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.sfp_beneficiaries (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id      uuid NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  facility_id   uuid NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  cycle_id      uuid REFERENCES public.sfp_cycles(id) ON DELETE SET NULL,
  -- Identity snapshot (editable per form)
  beneficiary_name text DEFAULT '',
  beneficiary_sex  text DEFAULT '',
  beneficiary_birth_date date,
  beneficiary_age_label text DEFAULT '',
  beneficiary_address text DEFAULT '',
  parent_name   text DEFAULT '',
  flags         jsonb DEFAULT '{}'::jsonb,  -- 4Ps, disability, indigenous, solo, deworm, vitA, etc.
  entry_height  numeric,
  entry_weight  numeric,
  entry_bmi     numeric,
  entry_nutrition text DEFAULT '',
  six_mo_height numeric,
  six_mo_weight numeric,
  six_mo_bmi    numeric,
  six_mo_nutrition text DEFAULT '',
  consent       jsonb DEFAULT '{}'::jsonb,
  payload       jsonb DEFAULT '{}'::jsonb,
  enrolled      boolean DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (child_id, cycle_id)
);

-- Hot meal log (-A)
CREATE TABLE public.sfp_hot_meal_logs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id   uuid NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  child_id      uuid NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  section_key   text DEFAULT '',
  log_date      date NOT NULL,
  status        text NOT NULL CHECK (status IN ('Fed', 'Not fed', 'Absent')),
  menu_label    text DEFAULT '',
  recorded_by   uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (child_id, log_date)
);

-- NUTRICombo delivery (-C)
CREATE TABLE public.sfp_nutricombo_deliveries (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id   uuid NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  child_id      uuid NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  section_key   text DEFAULT '',
  delivery_no   int,
  qty           numeric,
  received      boolean DEFAULT false,
  parent_signed boolean DEFAULT false,
  delivered_at  date,
  notes         text DEFAULT '',
  recorded_by   uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Monthly contributions C1 (ContributionStore)
-- ---------------------------------------------------------------------------
CREATE TABLE public.contributions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id      uuid NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  facility_id   uuid NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  year_month    text NOT NULL,              -- YYYY-MM
  amount_due    numeric DEFAULT 0,
  amount_paid   numeric DEFAULT 0,
  status        text DEFAULT 'unpaid'
                  CHECK (status IN ('unpaid', 'partial', 'paid', 'waived')),
  notes         text DEFAULT '',
  paid_at       date,
  recorded_by   uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (child_id, year_month)
);

-- ---------------------------------------------------------------------------
-- Calendar events
-- ---------------------------------------------------------------------------
CREATE TABLE public.calendar_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id   uuid NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  title         text NOT NULL,
  event_date    date NOT NULL,
  event_time    text DEFAULT '',
  description   text DEFAULT '',
  created_by    uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Head transfer proposals (TeacherStore pendingHeadTransfer)
-- ---------------------------------------------------------------------------
CREATE TABLE public.head_transfer_proposals (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id   uuid NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  from_staff_id uuid NOT NULL REFERENCES public.profiles(id),
  to_staff_id   uuid NOT NULL REFERENCES public.profiles(id),
  status        text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  proposed_at   timestamptz DEFAULT now(),
  resolved_at   timestamptz
);

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_facilities_updated BEFORE UPDATE ON public.facilities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_classes_updated BEFORE UPDATE ON public.classes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_children_updated BEFORE UPDATE ON public.children
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_applications_updated BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_assessments_updated BEFORE UPDATE ON public.assessments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_reports_updated BEFORE UPDATE ON public.progress_reports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Auto-create profile row when a user signs up (auth.users → profiles)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'faculty')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Seed: one facility + default classes (ids stable for seed scripts)
-- ---------------------------------------------------------------------------
INSERT INTO public.facilities (id, center_name, municipality, province, barangay)
VALUES (
  'a0000000-0000-4000-8000-000000000001',
  'National Child Development Center — Medina',
  'Medina',
  'Misamis Oriental',
  ''
)
ON CONFLICT DO NOTHING;

INSERT INTO public.classes (facility_id, key, name, age_range, sort_order) VALUES
  ('a0000000-0000-4000-8000-000000000001', 'explorers', 'Little Explorers', '0–3 yrs', 1),
  ('a0000000-0000-4000-8000-000000000001', 'stars', 'Little Stars', '3–4 yrs', 2),
  ('a0000000-0000-4000-8000-000000000001', 'sunshine', 'Sunshine Group', '4–5 yrs', 3)
ON CONFLICT DO NOTHING;

-- Storage buckets (run in dashboard or via API): photos, documents
-- RLS policies: see 002_rls.sql (next step)
