-- Utility functions and triggers shared across all tables

-- Auto-update updated_at on every row update
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Helper: attach updated_at trigger to a table
-- Usage: SELECT attach_updated_at_trigger('table_name');
CREATE OR REPLACE FUNCTION attach_updated_at_trigger(tbl text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE format(
    'CREATE OR REPLACE TRIGGER set_updated_at
     BEFORE UPDATE ON %I
     FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
    tbl
  );
END;
$$;

-- Create a profile row when an office user or contractor signs up via Supabase Auth.
-- Clients never hit this — they have no auth.users row, only a per-job access token.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'contractor')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Helper: current caller's role, used in RLS policies
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS text LANGUAGE sql SECURITY DEFINER AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION is_office()
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'office'
  );
$$;
