-- Three-way messaging (scope item 4) and job photos (scope item 6: client image upload,
-- plus completion photos required by our default for scope item 8: job completion).

CREATE TABLE IF NOT EXISTS public.job_messages (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id        uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  sender_role   message_sender_role NOT NULL,
  sender_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_name   text NOT NULL,
  body          text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_job_messages_job ON public.job_messages(job_id, created_at);
ALTER TABLE public.job_messages ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.job_photos (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id        uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  kind          photo_kind NOT NULL,
  uploaded_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  uploaded_by_name text,
  storage_path  text NOT NULL,
  caption       text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_job_photos_job ON public.job_photos(job_id, kind);
ALTER TABLE public.job_photos ENABLE ROW LEVEL SECURITY;
