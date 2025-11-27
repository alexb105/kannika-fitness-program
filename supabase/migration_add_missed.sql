-- Migration: Add missed column to days table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'days' AND column_name = 'missed'
  ) THEN
    ALTER TABLE days ADD COLUMN missed BOOLEAN DEFAULT FALSE;
    CREATE INDEX IF NOT EXISTS idx_days_trainer_missed ON public.days USING btree (trainer_id, missed, type);
  END IF;
END $$;

