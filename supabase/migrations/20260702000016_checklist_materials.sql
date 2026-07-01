-- Job checklist items
CREATE TABLE IF NOT EXISTS public.job_checklist_items (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id      uuid        NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  label       text        NOT NULL,
  is_completed boolean    NOT NULL DEFAULT false,
  notes       text,
  created_by  uuid        REFERENCES public.profiles(id),
  sort_order  integer     NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.job_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "office full access checklist" ON public.job_checklist_items
  FOR ALL USING (is_office()) WITH CHECK (is_office());

CREATE POLICY "field worker read checklist" ON public.job_checklist_items
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "field worker update checklist" ON public.job_checklist_items
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "field worker insert checklist" ON public.job_checklist_items
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "field worker delete checklist" ON public.job_checklist_items
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Job materials
CREATE TABLE IF NOT EXISTS public.job_materials (
  id          uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id      uuid          NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  name        text          NOT NULL,
  quantity    numeric(10,2) NOT NULL DEFAULT 1,
  unit        text          NOT NULL DEFAULT 'm',
  unit_cost   numeric(10,2) NOT NULL DEFAULT 0,
  added_by    uuid          REFERENCES public.profiles(id),
  created_at  timestamptz   NOT NULL DEFAULT now(),
  updated_at  timestamptz   NOT NULL DEFAULT now()
);

ALTER TABLE public.job_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "office full access materials" ON public.job_materials
  FOR ALL USING (is_office()) WITH CHECK (is_office());

CREATE POLICY "field worker manage materials" ON public.job_materials
  FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);