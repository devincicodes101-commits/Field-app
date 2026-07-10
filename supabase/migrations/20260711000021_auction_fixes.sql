-- Fixes for the auction / CRM-sync work:
-- 1) job_bids was created with NO row-level security (open to anyone with the anon key).
-- 2) CRM-created jobs need an idempotency key so retries don't create duplicates.

-- ── 1) Secure job_bids ────────────────────────────────────────────
ALTER TABLE public.job_bids ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "job_bids: office read all" ON public.job_bids;
CREATE POLICY "job_bids: office read all"
  ON public.job_bids FOR SELECT TO authenticated USING (is_office());

DROP POLICY IF EXISTS "job_bids: read bids on auction jobs" ON public.job_bids;
CREATE POLICY "job_bids: read bids on auction jobs"
  ON public.job_bids FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.assignment_type = 'auction')
  );

DROP POLICY IF EXISTS "job_bids: contractor insert own" ON public.job_bids;
CREATE POLICY "job_bids: contractor insert own"
  ON public.job_bids FOR INSERT TO authenticated WITH CHECK (contractor_id = auth.uid());

-- No UPDATE/DELETE policies: bids are immutable once placed.

-- ── 2) Idempotency key for CRM-created jobs ───────────────────────
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS external_ref TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_jobs_external_ref
  ON public.jobs(external_ref) WHERE external_ref IS NOT NULL;
