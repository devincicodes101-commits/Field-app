-- Upgrade jobs table with 3-way assignment, contractor %, and auction fields
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS assignment_type       TEXT NOT NULL DEFAULT 'operative',
  ADD COLUMN IF NOT EXISTS contractor_percentage NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS auction_start_bid     NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS auction_ends_at       TIMESTAMPTZ;

-- Migrate any existing 'direct' values (from previous migration) to 'operative'
UPDATE public.jobs SET assignment_type = 'operative' WHERE assignment_type = 'direct';

-- Coverage area + logo on contractors
ALTER TABLE public.contractors
  ADD COLUMN IF NOT EXISTS logo_url              TEXT,
  ADD COLUMN IF NOT EXISTS coverage_type         TEXT NOT NULL DEFAULT 'national',
  ADD COLUMN IF NOT EXISTS coverage_radius_miles INTEGER,
  ADD COLUMN IF NOT EXISTS coverage_postcodes    TEXT;

-- Job bids table for auction flow
CREATE TABLE IF NOT EXISTS public.job_bids (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id          UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  contractor_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contractor_name TEXT NOT NULL,
  amount          NUMERIC(10,2) NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_bids_job_id ON public.job_bids(job_id);
CREATE INDEX IF NOT EXISTS idx_job_bids_amount  ON public.job_bids(job_id, amount DESC);