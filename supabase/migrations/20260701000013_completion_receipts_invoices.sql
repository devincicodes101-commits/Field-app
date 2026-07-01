-- Full completion flow: job_completions (extended), receipts, invoices.

-- ─────────────────────────────────────────────────────────────

CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;
CREATE OR REPLACE FUNCTION next_invoice_number()
RETURNS text LANGUAGE sql AS $$
  SELECT 'INV-' || LPAD(nextval('invoice_number_seq')::text, 5, '0');
$$;

-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.invoices (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id            uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  invoice_number    text NOT NULL UNIQUE DEFAULT next_invoice_number(),
  net_amount        numeric(10,2) NOT NULL,
  vat_rate          numeric(5,4) NOT NULL DEFAULT 0.20,
  vat_amount        numeric(10,2) NOT NULL,
  total_amount      numeric(10,2) NOT NULL,
  status            text NOT NULL DEFAULT 'sent',
  created_by        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_invoices_job ON public.invoices(job_id);
SELECT attach_updated_at_trigger('invoices');
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────

-- Drop the earlier minimal completion trigger guard table approach —
-- we now capture a full JobCompletion record here instead.
-- The DB-level photo guard trigger (0009) still enforces at least one photo.

CREATE TABLE IF NOT EXISTS public.job_completions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id                uuid NOT NULL UNIQUE REFERENCES public.jobs(id) ON DELETE CASCADE,
  invoice_id            uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  completed_by          uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  operative_name        text,
  customer_signature    text,        -- base64 PNG from signature pad
  customer_satisfaction text CHECK (customer_satisfaction IN ('excellent','good','satisfactory','poor')),
  star_rating           integer CHECK (star_rating BETWEEN 1 AND 5),
  feedback              text,
  additional_comments   text,
  before_after_photos   text[] NOT NULL DEFAULT '{}',   -- storage paths
  video_url             text,
  completed_at          timestamptz NOT NULL DEFAULT now(),
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_job_completions_job ON public.job_completions(job_id);
ALTER TABLE public.job_completions ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.receipts (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id           uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  submitted_by     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  operative_name   text,
  storage_path     text NOT NULL,
  amount           numeric(10,2),
  description      text,
  purchase_date    date,
  status           text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_receipts_job ON public.receipts(job_id);
SELECT attach_updated_at_trigger('receipts');
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- RLS for new tables

-- invoices
CREATE POLICY "invoices: office full access"
  ON public.invoices FOR ALL TO authenticated USING (is_office());

CREATE POLICY "invoices: contractor/operative read own job"
  ON public.invoices FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = job_id
        AND (
          j.contractor_id = auth.uid() OR
          EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND j.assigned_team = p.full_name)
        )
    )
  );

-- job_completions
CREATE POLICY "job_completions: office full access"
  ON public.job_completions FOR ALL TO authenticated USING (is_office());

CREATE POLICY "job_completions: contractor/operative read own job"
  ON public.job_completions FOR SELECT TO authenticated USING (
    completed_by = auth.uid() OR is_office()
  );

CREATE POLICY "job_completions: contractor/operative insert"
  ON public.job_completions FOR INSERT TO authenticated WITH CHECK (
    completed_by = auth.uid()
  );

-- receipts
CREATE POLICY "receipts: office full access"
  ON public.receipts FOR ALL TO authenticated USING (is_office());

CREATE POLICY "receipts: submitted by self"
  ON public.receipts FOR SELECT TO authenticated USING (
    submitted_by = auth.uid()
  );

CREATE POLICY "receipts: insert own"
  ON public.receipts FOR INSERT TO authenticated WITH CHECK (
    submitted_by = auth.uid()
  );