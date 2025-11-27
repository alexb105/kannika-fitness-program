-- Create weight_entries table
CREATE TABLE IF NOT EXISTS weight_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL,
  weight DECIMAL(5, 2) NOT NULL,
  date DATE NOT NULL,
  notes TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT weight_entries_trainer_id_fkey FOREIGN KEY (trainer_id) REFERENCES trainers(id) ON DELETE CASCADE,
  CONSTRAINT weight_entries_trainer_id_date_key UNIQUE (trainer_id, date)
);

-- Create index on trainer_id and date for faster queries
CREATE INDEX IF NOT EXISTS idx_weight_entries_trainer_date ON public.weight_entries USING btree (trainer_id, date DESC);

-- Create index on trainer_id for faster queries
CREATE INDEX IF NOT EXISTS idx_weight_entries_trainer ON public.weight_entries USING btree (trainer_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_weight_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_weight_entries_updated_at
  BEFORE UPDATE ON weight_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_weight_entries_updated_at();

-- Enable Row Level Security
ALTER TABLE weight_entries ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow all operations on weight_entries" ON weight_entries;

-- Policy for weight_entries table: Allow all operations (since we're using anon key)
CREATE POLICY "Allow all operations on weight_entries"
  ON weight_entries
  FOR ALL
  USING (true)
  WITH CHECK (true);

