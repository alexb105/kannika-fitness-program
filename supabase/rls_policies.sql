-- Enable Row Level Security on tables
ALTER TABLE trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE days ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for clean migration)
DROP POLICY IF EXISTS "Allow all operations on trainers" ON trainers;
DROP POLICY IF EXISTS "Allow all operations on days" ON days;

-- Policy for trainers table: Allow all operations (since we're using anon key)
-- In a production app, you'd want more restrictive policies
CREATE POLICY "Allow all operations on trainers"
  ON trainers
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Policy for days table: Allow all operations (since we're using anon key)
-- In a production app, you'd want more restrictive policies based on trainer_id
CREATE POLICY "Allow all operations on days"
  ON days
  FOR ALL
  USING (true)
  WITH CHECK (true);

