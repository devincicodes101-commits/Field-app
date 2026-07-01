-- RLS policies for operative role on existing tables.
-- Operatives are matched to jobs via jobs.assigned_team = profiles.full_name.

CREATE OR REPLACE FUNCTION is_operative()
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'operative'
  );
$$;

-- jobs: operative can read/update their assigned jobs
CREATE POLICY "jobs: operative read assigned"
  ON public.jobs FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'operative' AND assigned_team = p.full_name
    )
  );

CREATE POLICY "jobs: operative update assigned"
  ON public.jobs FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'operative' AND assigned_team = p.full_name
    )
  );

-- job_messages: operative can read/write on their jobs
CREATE POLICY "job_messages: operative on assigned job"
  ON public.job_messages FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE j.id = job_id AND p.role = 'operative' AND j.assigned_team = p.full_name
    )
  );

CREATE POLICY "job_messages: operative insert on assigned job"
  ON public.job_messages FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.jobs j
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE j.id = job_id AND p.role = 'operative' AND j.assigned_team = p.full_name
    )
  );

-- job_photos: operative can read/write on their jobs
CREATE POLICY "job_photos: operative on assigned job"
  ON public.job_photos FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE j.id = job_id AND p.role = 'operative' AND j.assigned_team = p.full_name
    )
  );

CREATE POLICY "job_photos: operative insert on assigned job"
  ON public.job_photos FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.jobs j
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE j.id = job_id AND p.role = 'operative' AND j.assigned_team = p.full_name
    )
  );

-- extra_work_requests: operative read own
CREATE POLICY "extra_work: operative read on assigned job"
  ON public.extra_work_requests FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE j.id = job_id AND p.role = 'operative' AND j.assigned_team = p.full_name
    )
  );

-- storage: operative can read/write photos for their assigned jobs
CREATE POLICY "job-photos: operative on assigned job"
  ON storage.objects FOR ALL TO authenticated
  USING (
    bucket_id = 'job-photos' AND EXISTS (
      SELECT 1 FROM public.jobs j
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE j.id::text = (storage.foldername(name))[1]
        AND p.role = 'operative' AND j.assigned_team = p.full_name
    )
  );