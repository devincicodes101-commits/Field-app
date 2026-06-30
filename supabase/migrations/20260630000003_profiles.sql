-- Profiles for the two account-holding parties: office staff and contractors.
-- Clients have no account — they're addressed via jobs.client_access_token.

CREATE TABLE IF NOT EXISTS public.profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       text NOT NULL,
  full_name   text NOT NULL DEFAULT '',
  phone       text,
  role        user_role NOT NULL DEFAULT 'contractor',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

SELECT attach_updated_at_trigger('profiles');
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
