-- Attendance logs (daily clock-in / clock-out)
CREATE TABLE IF NOT EXISTS public.attendance_logs (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  work_date   date        NOT NULL DEFAULT CURRENT_DATE,
  clock_in    timestamptz NOT NULL DEFAULT now(),
  clock_out   timestamptz,
  early_leave boolean     NOT NULL DEFAULT false,
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, work_date)
);

ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "office full access attendance" ON public.attendance_logs
  FOR ALL USING (is_office());

CREATE POLICY "user own attendance" ON public.attendance_logs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- GPS on-site check-in / check-out events
CREATE TABLE IF NOT EXISTS public.job_site_checks (
  id                   uuid             PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id               uuid             NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  user_id              uuid             NOT NULL REFERENCES public.profiles(id),
  event_type           text             NOT NULL CHECK (event_type IN ('check_in','check_out')),
  latitude             double precision,
  longitude            double precision,
  distance_from_site   double precision,
  confirmed_on_site    boolean          NOT NULL DEFAULT false,
  time_on_site_minutes integer,
  created_at           timestamptz      NOT NULL DEFAULT now()
);

ALTER TABLE public.job_site_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "office full access site checks" ON public.job_site_checks
  FOR ALL USING (is_office());

CREATE POLICY "field worker own site checks" ON public.job_site_checks
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Live operative location (upserted on GPS update)
CREATE TABLE IF NOT EXISTS public.operative_locations (
  user_id     uuid             PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  latitude    double precision,
  longitude   double precision,
  accuracy    double precision,
  is_tracking boolean          NOT NULL DEFAULT false,
  updated_at  timestamptz      NOT NULL DEFAULT now()
);

ALTER TABLE public.operative_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "office view locations" ON public.operative_locations
  FOR SELECT USING (is_office());

CREATE POLICY "user own location" ON public.operative_locations
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
