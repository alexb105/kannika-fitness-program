-- Migration: Update weight logged activity to include previous weight
-- Run this migration to update the weight logging trigger

-- ============================================================================
-- UPDATE WEIGHT LOGGED ACTIVITY FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION create_weight_logged_activity()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  previous_weight DECIMAL(5, 2);
  previous_date DATE;
BEGIN
  -- Get the most recent previous weight entry for this user
  SELECT weight, date INTO previous_weight, previous_date
  FROM weight_entries
  WHERE user_id = NEW.user_id
    AND date < NEW.date
  ORDER BY date DESC
  LIMIT 1;

  INSERT INTO activities (user_id, activity_type, reference_id, reference_date, metadata)
  VALUES (
    NEW.user_id,
    'weight_logged',
    NEW.id,
    NEW.date,
    jsonb_build_object(
      'weight', NEW.weight,
      'previous_weight', previous_weight,
      'previous_date', previous_date,
      'weight_change', CASE WHEN previous_weight IS NOT NULL THEN NEW.weight - previous_weight ELSE NULL END,
      'notes', NEW.notes
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✓ Weight logged activity function updated to include previous weight';
END $$;

-- ============================================================================
-- NOTES
-- ============================================================================
-- This migration updates the create_weight_logged_activity function to:
-- 1. Look up the user's most recent previous weight entry
-- 2. Include previous_weight in the activity metadata
-- 3. Include previous_date in the activity metadata
-- 4. Calculate and include weight_change (difference between new and previous)
--
-- The weight_change will show:
-- - Negative values (green in UI) = weight loss
-- - Positive values (red in UI) = weight gain
-- - NULL if no previous weight exists

