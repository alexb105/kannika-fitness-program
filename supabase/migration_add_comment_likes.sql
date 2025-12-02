-- Migration: Add comment likes
-- Run this migration to add the ability to like comments
-- This allows users to acknowledge friend's comments on their activities

-- ============================================================================
-- UPDATE ACTIVITIES TABLE CONSTRAINT
-- ============================================================================

-- Drop the old constraint and add new one with comment_liked activity type
ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_type_check;
ALTER TABLE activities ADD CONSTRAINT activities_type_check CHECK (
  activity_type = ANY (ARRAY[
    'workout_completed'::text,
    'workout_missed'::text,
    'workout_planned'::text,
    'rest_day_planned'::text,
    'weight_logged'::text,
    'activity_liked'::text,
    'activity_commented'::text,
    'comment_liked'::text
  ])
);

-- ============================================================================
-- CREATE COMMENT LIKES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES activity_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT comment_likes_unique UNIQUE (comment_id, user_id)
);

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_comment_likes_comment ON public.comment_likes USING btree (comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user ON public.comment_likes USING btree (user_id);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE RLS POLICIES FOR COMMENT_LIKES
-- ============================================================================

-- Users can view likes on comments they can see
DROP POLICY IF EXISTS "Users can view comment likes" ON comment_likes;
CREATE POLICY "Users can view comment likes"
  ON comment_likes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM activity_comments ac
      JOIN activities a ON a.id = ac.activity_id
      WHERE ac.id = comment_likes.comment_id
      AND (
        a.user_id = auth.uid()
        OR ac.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM friends
          WHERE (friends.user_id = auth.uid() AND friends.friend_id = a.user_id)
             OR (friends.friend_id = auth.uid() AND friends.user_id = a.user_id)
        )
      )
    )
  );

-- Users can like comments on their own activities or comments from friends
DROP POLICY IF EXISTS "Users can like comments" ON comment_likes;
CREATE POLICY "Users can like comments"
  ON comment_likes
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM activity_comments ac
      JOIN activities a ON a.id = ac.activity_id
      WHERE ac.id = comment_likes.comment_id
      AND (
        a.user_id = auth.uid()  -- User owns the activity (can like comments on their posts)
        OR ac.user_id = auth.uid()  -- User owns the comment
        OR EXISTS (
          SELECT 1 FROM friends
          WHERE (friends.user_id = auth.uid() AND friends.friend_id = a.user_id)
             OR (friends.friend_id = auth.uid() AND friends.user_id = a.user_id)
        )
      )
    )
  );

-- Users can unlike (delete their own likes)
DROP POLICY IF EXISTS "Users can unlike comments" ON comment_likes;
CREATE POLICY "Users can unlike comments"
  ON comment_likes
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- CREATE TRIGGER FUNCTION FOR COMMENT LIKE NOTIFICATIONS
-- ============================================================================

-- Function to create notification activity when someone likes a comment
CREATE OR REPLACE FUNCTION create_comment_like_notification_activity()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  comment_owner_id UUID;
  liker_username TEXT;
  comment_text TEXT;
BEGIN
  -- Get the owner of the comment being liked and the comment text
  SELECT user_id, comment INTO comment_owner_id, comment_text 
  FROM activity_comments WHERE id = NEW.comment_id;
  
  -- Don't create notification if user likes their own comment
  IF comment_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get the username of the liker
  SELECT username INTO liker_username FROM profiles WHERE id = NEW.user_id;
  
  -- Create notification activity for the comment owner
  INSERT INTO activities (user_id, activity_type, reference_id, metadata)
  VALUES (
    comment_owner_id,
    'comment_liked',
    NEW.comment_id,
    jsonb_build_object(
      'liker_id', NEW.user_id,
      'liker_username', COALESCE(liker_username, 'Unknown'),
      'comment_preview', LEFT(comment_text, 50),
      'like_id', NEW.id
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for comment like notifications
DROP TRIGGER IF EXISTS create_comment_like_notification_trigger ON comment_likes;
CREATE TRIGGER create_comment_like_notification_trigger
  AFTER INSERT ON comment_likes
  FOR EACH ROW
  EXECUTE FUNCTION create_comment_like_notification_activity();

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'comment_likes') THEN
    RAISE NOTICE '✓ comment_likes table created successfully';
  ELSE
    RAISE EXCEPTION '✗ comment_likes table creation failed';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'comment_likes' 
    AND rowsecurity = true
  ) THEN
    RAISE NOTICE '✓ RLS enabled on comment_likes table';
  ELSE
    RAISE EXCEPTION '✗ RLS not enabled on comment_likes table';
  END IF;
END $$;

-- ============================================================================
-- GRANT EXECUTE ON FUNCTION
-- ============================================================================

GRANT EXECUTE ON FUNCTION create_comment_like_notification_activity() TO authenticated;

-- ============================================================================
-- NOTES
-- ============================================================================
-- This migration adds:
-- 1. comment_likes table for tracking likes on comments
-- 2. Updated activities constraint to include 'comment_liked' type
-- 3. Indexes for efficient querying
-- 4. RLS policies for comment_likes
-- 5. Trigger to create notification when someone likes a comment
--
-- New activity type:
-- - comment_liked: Someone liked your comment (notification)
--
-- Use case:
-- When a friend comments on your activity, you can like their comment
-- to acknowledge it. The friend will receive a notification.

