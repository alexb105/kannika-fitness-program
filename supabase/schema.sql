-- Create trainers table
CREATE TABLE IF NOT EXISTS trainers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create days table
CREATE TABLE IF NOT EXISTS days (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL,
  date DATE NOT NULL,
  type TEXT NOT NULL,
  exercises JSONB NULL DEFAULT '[]'::jsonb,
  duration INTEGER NULL,
  notes TEXT NULL,
  completed BOOLEAN NULL DEFAULT FALSE,
  missed BOOLEAN NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
  archived BOOLEAN NULL DEFAULT FALSE,
  CONSTRAINT days_pkey PRIMARY KEY (id),
  CONSTRAINT days_trainer_id_date_key UNIQUE (trainer_id, date),
  CONSTRAINT days_trainer_id_fkey FOREIGN KEY (trainer_id) REFERENCES trainers(id) ON DELETE CASCADE,
  CONSTRAINT days_type_check CHECK (
    type = ANY (ARRAY['workout'::text, 'rest'::text, 'empty'::text])
  )
);

-- Create index on trainer_id and date for faster queries
CREATE INDEX IF NOT EXISTS idx_days_trainer_date ON public.days USING btree (trainer_id, date);

-- Create index on trainer_id and completed for stats queries
CREATE INDEX IF NOT EXISTS idx_days_trainer_completed ON public.days USING btree (trainer_id, completed, type);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_days_updated_at
  BEFORE UPDATE ON days
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default trainers (if they don't exist)
INSERT INTO trainers (name) VALUES ('alexander') ON CONFLICT (name) DO NOTHING;
INSERT INTO trainers (name) VALUES ('kannika') ON CONFLICT (name) DO NOTHING;

-- Migration: Add archived column if it doesn't exist (for existing databases)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'days' AND column_name = 'archived'
  ) THEN
    ALTER TABLE days ADD COLUMN archived BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Create index on trainer_id and archived for archive queries (after column exists)
CREATE INDEX IF NOT EXISTS idx_days_trainer_archived ON public.days USING btree (trainer_id, archived);

-- Create index on trainer_id and missed for missed queries
CREATE INDEX IF NOT EXISTS idx_days_trainer_missed ON public.days USING btree (trainer_id, missed, type);

-- Migration: Add missed column if it doesn't exist (for existing databases)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'days' AND column_name = 'missed'
  ) THEN
    ALTER TABLE days ADD COLUMN missed BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

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

