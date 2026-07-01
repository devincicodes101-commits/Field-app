-- Add operative as a third account-holding role.
-- Operatives see jobs where jobs.assigned_team matches their profile.full_name,
-- rather than via contractor assignment (which is contractor-role only).

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'operative';

-- assigned_team: free-text name used to match operatives to jobs.
-- Also used for display in job cards and completion records.
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS assigned_team text;