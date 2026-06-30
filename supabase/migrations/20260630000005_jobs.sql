-- Jobs: the central entity all three parties interact around.
-- Clients have no Supabase Auth account, so they're addressed via client_access_token
-- (a per-job secret used by API routes to authorize client-side reads/writes server-side,
-- the same pattern used for client_photos/messaging without requiring client signup).

CREATE TABLE IF NOT EXISTS public.jobs (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title                 text NOT NULL,
  description           text,
  address               text NOT NULL,
  client_name           text NOT NULL,
  client_email          text,
  client_phone          text,
  client_access_token   text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(20), 'hex'),
  contractor_id         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status                job_status NOT NULL DEFAULT 'quote_sent',
  scheduled_date        timestamptz,
  quote_accepted_at     timestamptz,
  total_value           numeric(10,2),
  completed_at          timestamptz,
  completion_notes      text,
  created_by            uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_jobs_contractor ON public.jobs(contractor_id);
CREATE INDEX idx_jobs_status ON public.jobs(status);
CREATE INDEX idx_jobs_scheduled_date ON public.jobs(scheduled_date);
SELECT attach_updated_at_trigger('jobs');
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
