# BrightSteps × Supabase — Setup (Step 1)

## Goal
Replace browser LocalStorage with a free online **PostgreSQL** backend (Supabase) so NCDC Medina data is secure, recoverable, and accessible from a published URL.

## Stack
| Layer | Choice | Cost |
|--------|--------|------|
| Database + Auth + File storage | **Supabase** | Free tier |
| Frontend publish | **Vercel** or **Netlify** | Free |
| App code | Existing `artifacts/brightsteps/` | — |

## Free-tier notes (important for the client)
- **500 MB** database · **1 GB** file storage
- Project may **pause after ~1 week of inactivity** (data is kept; unpause in dashboard)
- **No automatic backups** on Free → export SQL monthly
- One NCDC center fits comfortably if child photos are compressed

---

## Step 1 — Create project (you do this once)

1. Go to [https://supabase.com](https://supabase.com) → **Start your project**
2. Create organization (e.g. `NCDC-Medina`) → new project `brightsteps`
3. Save the **database password** in a password manager
4. Wait until the project is ready

### Project settings → API
Copy for later (do **not** commit the **service_role** key to git):

- **Project URL** → `VITE_SUPABASE_URL` or `window.BRIGHTSTEPS_SUPABASE_URL`
- **anon public** key → safe in frontend
- **service_role** key → server / one-time seed only

---

## Step 2 — Run schema SQL

In Supabase Dashboard → **SQL Editor**:

1. Paste and run `001_schema.sql`
2. Paste and run `002_rls.sql`

Confirm tables under **Table Editor**:
`facilities`, `profiles`, `classes`, `children`, `applications`, `assessments`, `progress_reports`, `attendance`, `health_records`, `sfp_*`, `contributions`, `calendar_events`, …

### Storage buckets
**Storage** → New bucket:

| Bucket | Public |
|--------|--------|
| `child-photos` | Optional (signed URLs preferred) |
| `child-documents` | Private |

---

## Step 3 — Auth users (seed staff)

**Authentication** → Users → Add user:

| Email (example) | Password | Metadata (raw_user_meta_data) |
|-----------------|----------|-------------------------------|
| `irish.abordo@ncdc.local` | *(set strong)* | `{ "full_name": "Irish Abordo", "role": "head" }` |
| `maria.santos@ncdc.local` | *(set strong)* | `{ "full_name": "Maria Santos", "role": "faculty" }` |

Then in SQL (replace UUIDs from Auth users list):

```sql
UPDATE public.profiles
SET facility_id = 'a0000000-0000-4000-8000-000000000001',
    role = 'head',
    is_head = true,
    username = 'irish',
    position = 'Head Teacher / Admin',
    active = true
WHERE full_name ILIKE '%Irish%';

UPDATE public.profiles
SET facility_id = 'a0000000-0000-4000-8000-000000000001',
    role = 'faculty',
    is_head = false,
    username = 'maria',
    position = 'CDW / Teacher',
    active = true
WHERE full_name ILIKE '%Maria%';
```

---

## Step 4 — App wiring (next coding step)

1. Add `@supabase/supabase-js` to the frontend
2. Create `js/data/supabase-client.js` with URL + anon key
3. Migrate stores one domain at a time:
   1. `profiles` / staff login  
   2. `classes` + `children`  
   3. `applications`  
   4. `assessments` + `progress_reports`  
   5. `attendance`  
   6. health + SFP  
   7. `contributions` + calendar  
4. Keep LocalStorage as offline fallback until each domain is verified

---

## Step 5 — Publish

1. Push `brightsteps/` to GitHub  
2. Connect **Vercel/Netlify** → build: static (no build needed if plain HTML)  
3. Env vars: `SUPABASE_URL`, `SUPABASE_ANON_KEY`  
4. Share the live URL with NCDC Medina  

---

## Recovery (Free tier)

Monthly (or before demos):

1. Supabase → **Database** → **Backups** / SQL → export  
2. Or: `pg_dump` with connection string from Project Settings → Database  
3. Store export on institutional Drive  

---

## Schema map (LocalStorage → tables)

| Current store | Table(s) |
|---------------|----------|
| TeacherStore | `profiles`, `facilities`, `head_transfer_proposals` |
| ClassStore | `classes` |
| ChildRegistry | `children`, `parent_children` |
| ApplicationStore | `applications` |
| AssessmentStore | `assessments` |
| ReportStore | `progress_reports` |
| AttendanceStore | `attendance` |
| HealthStore | `health_records` |
| SfpStore | `sfp_cycles`, `sfp_beneficiaries`, `sfp_hot_meal_logs`, `sfp_nutricombo_deliveries` |
| ContributionStore | `contributions` |
| CalendarStore | `calendar_events` |

Photos/documents move from base64 in LocalStorage → **Storage paths** on `children.photo_path` / `documents` JSON.

---

## Status

- [x] Step 1 — Schema + RLS SQL written  
- [ ] Create Supabase project (manual)  
- [ ] Run `001_schema.sql` + `002_rls.sql`  
- [ ] Seed staff users  
- [ ] Wire JS client + migrate stores  
- [ ] Deploy frontend  
