-- Contractor business details, captured at registration (Phase 1 scope item 2).
-- Banking/VAT fields are stored now but not used until the invoicing phase.

CREATE TABLE IF NOT EXISTS public.contractors (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name          text NOT NULL,
  address_line1         text NOT NULL,
  address_line2         text,
  city                  text NOT NULL,
  postcode              text NOT NULL,
  bank_account_name     text,
  bank_sort_code        text,
  bank_account_number   text,
  vat_registered        boolean NOT NULL DEFAULT false,
  vat_number            text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_contractors_user ON public.contractors(user_id);
SELECT attach_updated_at_trigger('contractors');
ALTER TABLE public.contractors ENABLE ROW LEVEL SECURITY;
