-- Migration: Add likes and comments to activities
-- Run this migration if you already have the activities table
-- This adds the ability to like and comment on friend activities

-- ============================================================================
-- UPDATE ACTIVITIES TABLE CONSTRAINT
-- ============================================================================

-- Drop the old constraint and add new one with additional activity types
ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_type_check;
ALTER TABLE activities ADD CONSTRAINT activities_type_check CHECK (
  activity_type = ANY (ARRAY[
    'workout_completed'::text,
    'workout_missed'::text,
    'workout_planned'::text,
    'rest_day_planned'::text,
    'weight_logged'::text,
    'activity_liked'::text,
    'activity_commented'::text
  ])
);

-- ============================================================================
-- CREATE LIKES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS activity_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT activity_likes_unique UNIQUE (activity_id, user_id)
);

-- ============================================================================
-- CREATE COMMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS activity_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT activity_comments_unique UNIQUE (activity_id, user_id),
  CONSTRAINT comment_length_check CHECK (char_length(comment) >= 1 AND char_length(comment) <= 280)
);

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_activity_likes_activity ON public.activity_likes USING btree (activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_likes_user ON public.activity_likes USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_activity_comments_activity ON public.activity_comments USING btree (activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_comments_user ON public.activity_comments USING btree (user_id);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE activity_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_comments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE RLS POLICIES FOR ACTIVITY_LIKES
-- ============================================================================

-- Users can view likes on activities they can see (own or friends')
DROP POLICY IF EXISTS "Users can view activity likes" ON activity_likes;
CREATE POLICY "Users can view activity likes"
  ON activity_likes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM activities a
      WHERE a.id = activity_likes.activity_id
      AND (
        a.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM friends
          WHERE (friends.user_id = auth.uid() AND friends.friend_id = a.user_id)
             OR (friends.friend_id = auth.uid() AND friends.user_id = a.user_id)
        )
      )
    )
  );

-- Users can like activities from friends
DROP POLICY IF EXISTS "Users can like activities" ON activity_likes;
CREATE POLICY "Users can like activities"
  ON activity_likes
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM activities a
      WHERE a.id = activity_likes.activity_id
      AND (
        a.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM friends
          WHERE (friends.user_id = auth.uid() AND friends.friend_id = a.user_id)
             OR (friends.friend_id = auth.uid() AND friends.user_id = a.user_id)
        )
      )
    )
  );

-- Users can unlike (delete their own likes)
DROP POLICY IF EXISTS "Users can unlike activities" ON activity_likes;
CREATE POLICY "Users can unlike activities"
  ON activity_likes
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- CREATE RLS POLICIES FOR ACTIVITY_COMMENTS
-- ============================================================================

-- Users can view comments on activities they can see (own or friends')
DROP POLICY IF EXISTS "Users can view activity comments" ON activity_comments;
CREATE POLICY "Users can view activity comments"
  ON activity_comments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM activities a
      WHERE a.id = activity_comments.activity_id
      AND (
        a.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM friends
          WHERE (friends.user_id = auth.uid() AND friends.friend_id = a.user_id)
             OR (friends.friend_id = auth.uid() AND friends.user_id = a.user_id)
        )
      )
    )
  );

-- Users can comment on activities from friends
DROP POLICY IF EXISTS "Users can comment on activities" ON activity_comments;
CREATE POLICY "Users can comment on activities"
  ON activity_comments
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM activities a
      WHERE a.id = activity_comments.activity_id
      AND (
        a.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM friends
          WHERE (friends.user_id = auth.uid() AND friends.friend_id = a.user_id)
             OR (friends.friend_id = auth.uid() AND friends.user_id = a.user_id)
        )
      )
    )
  );

-- Users can update their own comments
DROP POLICY IF EXISTS "Users can update their comments" ON activity_comments;
CREATE POLICY "Users can update their comments"
  ON activity_comments
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments
DROP POLICY IF EXISTS "Users can delete their comments" ON activity_comments;
CREATE POLICY "Users can delete their comments"
  ON activity_comments
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- CREATE TRIGGER FUNCTIONS FOR NOTIFICATIONS
-- ============================================================================

-- Function to create notification activity when someone likes an activity
CREATE OR REPLACE FUNCTION create_like_notification_activity()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  activity_owner_id UUID;
  liker_username TEXT;
BEGIN
  -- Get the owner of the activity being liked
  SELECT user_id INTO activity_owner_id FROM activities WHERE id = NEW.activity_id;
  
  -- Don't create notification if user likes their own activity
  IF activity_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get the username of the liker
  SELECT username INTO liker_username FROM profiles WHERE id = NEW.user_id;
  
  -- Create notification activity for the activity owner
  INSERT INTO activities (user_id, activity_type, reference_id, metadata)
  VALUES (
    activity_owner_id,
    'activity_liked',
    NEW.activity_id,
    jsonb_build_object(
      'liker_id', NEW.user_id,
      'liker_username', COALESCE(liker_username, 'Unknown'),
      'like_id', NEW.id
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for like notifications
DROP TRIGGER IF EXISTS create_like_notification_trigger ON activity_likes;
CREATE TRIGGER create_like_notification_trigger
  AFTER INSERT ON activity_likes
  FOR EACH ROW
  EXECUTE FUNCTION create_like_notification_activity();

-- Function to create notification activity when someone comments on an activity
CREATE OR REPLACE FUNCTION create_comment_notification_activity()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  activity_owner_id UUID;
  commenter_username TEXT;
BEGIN
  -- Get the owner of the activity being commented on
  SELECT user_id INTO activity_owner_id FROM activities WHERE id = NEW.activity_id;
  
  -- Don't create notification if user comments on their own activity
  IF activity_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get the username of the commenter
  SELECT username INTO commenter_username FROM profiles WHERE id = NEW.user_id;
  
  -- Create notification activity for the activity owner
  INSERT INTO activities (user_id, activity_type, reference_id, metadata)
  VALUES (
    activity_owner_id,
    'activity_commented',
    NEW.activity_id,
    jsonb_build_object(
      'commenter_id', NEW.user_id,
      'commenter_username', COALESCE(commenter_username, 'Unknown'),
      'comment', NEW.comment,
      'comment_id', NEW.id
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for comment notifications
DROP TRIGGER IF EXISTS create_comment_notification_trigger ON activity_comments;
CREATE TRIGGER create_comment_notification_trigger
  AFTER INSERT ON activity_comments
  FOR EACH ROW
  EXECUTE FUNCTION create_comment_notification_activity();

-- Function to update updated_at timestamp for activity_comments
CREATE OR REPLACE FUNCTION update_activity_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at for activity_comments
DROP TRIGGER IF EXISTS update_activity_comments_updated_at ON activity_comments;
CREATE TRIGGER update_activity_comments_updated_at
  BEFORE UPDATE ON activity_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_activity_comments_updated_at();

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_likes') THEN
    RAISE NOTICE '✓ activity_likes table created successfully';
  ELSE
    RAISE EXCEPTION '✗ activity_likes table creation failed';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_comments') THEN
    RAISE NOTICE '✓ activity_comments table created successfully';
  ELSE
    RAISE EXCEPTION '✗ activity_comments table creation failed';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'activity_likes' 
    AND rowsecurity = true
  ) THEN
    RAISE NOTICE '✓ RLS enabled on activity_likes table';
  ELSE
    RAISE EXCEPTION '✗ RLS not enabled on activity_likes table';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'activity_comments' 
    AND rowsecurity = true
  ) THEN
    RAISE NOTICE '✓ RLS enabled on activity_comments table';
  ELSE
    RAISE EXCEPTION '✗ RLS not enabled on activity_comments table';
  END IF;
END $$;

-- ============================================================================
-- NOTES
-- ============================================================================
-- This migration adds:
-- 1. activity_likes table for tracking likes (one like per user per activity)
-- 2. activity_comments table for comments (one comment per user per activity, max 280 chars)
-- 3. Updated activities constraint to include 'activity_liked' and 'activity_commented' types
-- 4. Indexes for efficient querying
-- 5. RLS policies for both tables
-- 6. Triggers to create notification activities when:
--    - Someone likes a friend's activity
--    - Someone comments on a friend's activity
--
-- New activity types added:
-- - activity_liked: Someone liked your activity (notification)
-- - activity_commented: Someone commented on your activity (notification)

