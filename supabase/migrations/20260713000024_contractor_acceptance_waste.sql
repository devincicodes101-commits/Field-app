-- Contractor acceptance status for direct-assign jobs
-- When office assigns a contractor, they start as 'pending' until they accept or reject.
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS contractor_acceptance text DEFAULT 'pending'
    CHECK (contractor_acceptance IN ('pending', 'accepted', 'rejected'));

-- Waste documentation field — filled in by the operative/contractor on site
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS waste_notes text;
