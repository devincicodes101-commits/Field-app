-- Rescheduling (scope item 5). Default behavior (unconfirmed by Paul as of 2026-06-30):
-- the contractor moves the job directly — no client approval step. This table is a log;
-- jobs.scheduled_date is updated immediately when a row is inserted (see app logic),
-- so it always reflects the office diary in real time per the scope requirement.

CREATE TABLE IF NOT EXISTS public.job_reschedules (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id          uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  old_date        timestamptz,
  new_date        timestamptz NOT NULL,
  changed_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reason          text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_job_reschedules_job ON public.job_reschedules(job_id, created_at);
ALTER TABLE public.job_reschedules ENABLE ROW LEVEL SECURITY;
