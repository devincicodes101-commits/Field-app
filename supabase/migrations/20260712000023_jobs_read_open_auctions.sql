-- Contractors/operatives must be able to READ open (unassigned) auction jobs so they
-- appear on the Available board and can be bid on. The base jobs RLS only allowed
-- reading jobs already assigned to them (contractor_id = auth.uid()), which hid every
-- open auction and also made placeBid's job lookup return nothing.
DROP POLICY IF EXISTS "jobs: read open auctions" ON public.jobs;
CREATE POLICY "jobs: read open auctions"
  ON public.jobs FOR SELECT TO authenticated USING (
    assignment_type = 'auction' AND assigned_team IS NULL
  );
