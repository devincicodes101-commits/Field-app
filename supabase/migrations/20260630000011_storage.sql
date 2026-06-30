-- Private storage bucket for job photos. Objects are stored under "<job_id>/<filename>"
-- so policies can scope access by job participancy, same as the job_photos table rows.
-- Client uploads (no Auth session) go through an API route using the service role key,
-- which bypasses these policies after validating client_access_token server-side.

INSERT INTO storage.buckets (id, name, public)
VALUES ('job-photos', 'job-photos', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "job-photos: office full access"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'job-photos' AND is_office());

CREATE POLICY "job-photos: contractor read/write own job"
  ON storage.objects FOR ALL TO authenticated
  USING (
    bucket_id = 'job-photos' AND EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id::text = (storage.foldername(name))[1]
        AND j.contractor_id = auth.uid()
    )
  );
