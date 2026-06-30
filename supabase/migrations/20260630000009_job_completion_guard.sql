-- Enforce our default for scope item 8 (unconfirmed by Paul as of 2026-06-30):
-- a job cannot be marked completed unless at least one completion photo exists.
-- If Paul's requirements differ (e.g. sign-off instead of/in addition to a photo),
-- this is the single place to change.

CREATE OR REPLACE FUNCTION enforce_completion_requires_photo()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.job_photos
      WHERE job_id = NEW.id AND kind = 'completion'
    ) THEN
      RAISE EXCEPTION 'job % cannot be marked completed without at least one completion photo', NEW.id;
    END IF;
    IF NEW.completed_at IS NULL THEN
      NEW.completed_at = now();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_job_completion_guard
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION enforce_completion_requires_photo();
