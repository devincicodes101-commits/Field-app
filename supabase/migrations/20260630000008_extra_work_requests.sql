-- Extra-work requests (scope item 7): contractor requests an additional amount
-- when the job is bigger than quoted; office approves or rejects.

CREATE TABLE IF NOT EXISTS public.extra_work_requests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id          uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  contractor_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description     text NOT NULL,
  amount          numeric(10,2) NOT NULL,
  status          extra_work_status NOT NULL DEFAULT 'pending',
  decided_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  decided_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_extra_work_job ON public.extra_work_requests(job_id);
CREATE INDEX idx_extra_work_contractor ON public.extra_work_requests(contractor_id);
SELECT attach_updated_at_trigger('extra_work_requests');
ALTER TABLE public.extra_work_requests ENABLE ROW LEVEL SECURITY;
