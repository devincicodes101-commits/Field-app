-- Row-Level Security: office staff and contractors hold real Supabase Auth sessions
-- and are governed by these policies. Clients hold no account — all client-facing
-- reads/writes go through Next.js API routes using the service role key after
-- validating jobs.client_access_token server-side, so no client RLS policies exist here.

-- Role-lookup helpers (LANGUAGE sql functions are validated against the catalog at
-- creation time, so these must live after public.profiles exists, not in 0002_functions.sql).
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS text LANGUAGE sql SECURITY DEFINER AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION is_office()
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'office'
  );
$$;

-- ─────────── profiles ──────────────────────────────────────────

CREATE POLICY "profiles: read own"
  ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());

CREATE POLICY "profiles: office read all"
  ON public.profiles FOR SELECT TO authenticated USING (is_office());

CREATE POLICY "profiles: update own"
  ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());

CREATE POLICY "profiles: office full access"
  ON public.profiles FOR ALL TO authenticated USING (is_office());

-- ─────────── contractors ────────────────────────────────────────

CREATE POLICY "contractors: read own"
  ON public.contractors FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "contractors: insert own"
  ON public.contractors FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "contractors: update own"
  ON public.contractors FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "contractors: office full access"
  ON public.contractors FOR ALL TO authenticated USING (is_office());

-- ─────────── jobs ───────────────────────────────────────────────

CREATE POLICY "jobs: office full access"
  ON public.jobs FOR ALL TO authenticated USING (is_office());

CREATE POLICY "jobs: contractor read assigned"
  ON public.jobs FOR SELECT TO authenticated USING (contractor_id = auth.uid());

CREATE POLICY "jobs: contractor update assigned"
  ON public.jobs FOR UPDATE TO authenticated
  USING (contractor_id = auth.uid())
  WITH CHECK (contractor_id = auth.uid());

-- ─────────── job_messages ────────────────────────────────────────

CREATE POLICY "job_messages: read as job participant"
  ON public.job_messages FOR SELECT TO authenticated USING (
    is_office() OR EXISTS (
      SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.contractor_id = auth.uid()
    )
  );

CREATE POLICY "job_messages: insert as job participant"
  ON public.job_messages FOR INSERT TO authenticated WITH CHECK (
    is_office() OR EXISTS (
      SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.contractor_id = auth.uid()
    )
  );

-- ─────────── job_photos ──────────────────────────────────────────

CREATE POLICY "job_photos: read as job participant"
  ON public.job_photos FOR SELECT TO authenticated USING (
    is_office() OR EXISTS (
      SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.contractor_id = auth.uid()
    )
  );

CREATE POLICY "job_photos: insert as job participant"
  ON public.job_photos FOR INSERT TO authenticated WITH CHECK (
    is_office() OR EXISTS (
      SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.contractor_id = auth.uid()
    )
  );

-- ─────────── job_reschedules ─────────────────────────────────────

CREATE POLICY "job_reschedules: read as job participant"
  ON public.job_reschedules FOR SELECT TO authenticated USING (
    is_office() OR EXISTS (
      SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.contractor_id = auth.uid()
    )
  );

CREATE POLICY "job_reschedules: insert as job participant"
  ON public.job_reschedules FOR INSERT TO authenticated WITH CHECK (
    is_office() OR EXISTS (
      SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.contractor_id = auth.uid()
    )
  );

-- ─────────── extra_work_requests ─────────────────────────────────

CREATE POLICY "extra_work: contractor read own"
  ON public.extra_work_requests FOR SELECT TO authenticated USING (contractor_id = auth.uid());

CREATE POLICY "extra_work: office read all"
  ON public.extra_work_requests FOR SELECT TO authenticated USING (is_office());

CREATE POLICY "extra_work: contractor insert own"
  ON public.extra_work_requests FOR INSERT TO authenticated WITH CHECK (
    contractor_id = auth.uid() AND EXISTS (
      SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.contractor_id = auth.uid()
    )
  );

CREATE POLICY "extra_work: office decide"
  ON public.extra_work_requests FOR UPDATE TO authenticated USING (is_office());
