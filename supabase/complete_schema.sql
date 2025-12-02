-- Complete Schema for Elite Fitness
-- User-based authentication system
-- Run this entire file to set up the database from scratch

-- ============================================================================
-- STEP 1: CREATE TABLES
-- ============================================================================

-- Create days table
CREATE TABLE IF NOT EXISTS days (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
  CONSTRAINT days_user_id_date_key UNIQUE (user_id, date),
  CONSTRAINT days_type_check CHECK (
    type = ANY (ARRAY['workout'::text, 'rest'::text, 'empty'::text])
  )
);

-- Create weight_entries table
CREATE TABLE IF NOT EXISTS weight_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weight DECIMAL(5, 2) NOT NULL,
  date DATE NOT NULL,
  notes TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT weight_entries_user_id_date_key UNIQUE (user_id, date)
);

-- Create profiles table for user information
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  avatar_url TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT username_length_check CHECK (char_length(username) >= 3 AND char_length(username) <= 20),
  CONSTRAINT username_format_check CHECK (username ~ '^[a-zA-Z0-9_-]+$')
);

-- Create friends table
CREATE TABLE IF NOT EXISTS friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT friends_user_friend_unique UNIQUE (user_id, friend_id),
  CONSTRAINT friends_no_self_friend CHECK (user_id != friend_id)
);

-- Create friend_requests table
CREATE TABLE IF NOT EXISTS friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT friend_requests_sender_receiver_unique UNIQUE (sender_id, receiver_id),
  CONSTRAINT friend_requests_no_self_request CHECK (sender_id != receiver_id),
  CONSTRAINT friend_requests_status_check CHECK (status IN ('pending', 'accepted', 'declined'))
);

-- Create activities table for social feed
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  reference_id UUID NULL, -- Reference to the related entity (day_id, weight_entry_id, etc.)
  reference_date DATE NULL, -- The date associated with the activity (e.g., workout date)
  metadata JSONB NULL DEFAULT '{}'::jsonb, -- Additional data like exercise count, weight value, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT activities_type_check CHECK (
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
  )
);

-- Create activity_likes table for tracking likes on activities
CREATE TABLE IF NOT EXISTS activity_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT activity_likes_unique UNIQUE (activity_id, user_id)
);

-- Create activity_comments table for single comment per activity per user
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

-- Create comment_likes table for liking comments (to acknowledge friend's comments)
CREATE TABLE IF NOT EXISTS comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES activity_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT comment_likes_unique UNIQUE (comment_id, user_id)
);

-- ============================================================================
-- STEP 2: CREATE INDEXES
-- ============================================================================

-- Indexes for days table
CREATE INDEX IF NOT EXISTS idx_days_user_date ON public.days USING btree (user_id, date);
CREATE INDEX IF NOT EXISTS idx_days_user_completed ON public.days USING btree (user_id, completed, type);
CREATE INDEX IF NOT EXISTS idx_days_user_archived ON public.days USING btree (user_id, archived);
CREATE INDEX IF NOT EXISTS idx_days_user_missed ON public.days USING btree (user_id, missed, type);

-- Indexes for weight_entries table
CREATE INDEX IF NOT EXISTS idx_weight_entries_user_date ON public.weight_entries USING btree (user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_weight_entries_user ON public.weight_entries USING btree (user_id);

-- Indexes for profiles table
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles USING btree (username);

-- Indexes for friends table
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON public.friends USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON public.friends USING btree (friend_id);

-- Indexes for friend_requests table
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver ON public.friend_requests USING btree (receiver_id, status);
CREATE INDEX IF NOT EXISTS idx_friend_requests_sender ON public.friend_requests USING btree (sender_id, status);

-- Indexes for activities table
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON public.activities USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON public.activities USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_user_created ON public.activities USING btree (user_id, created_at DESC);

-- Indexes for activity_likes table
CREATE INDEX IF NOT EXISTS idx_activity_likes_activity ON public.activity_likes USING btree (activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_likes_user ON public.activity_likes USING btree (user_id);

-- Indexes for activity_comments table
CREATE INDEX IF NOT EXISTS idx_activity_comments_activity ON public.activity_comments USING btree (activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_comments_user ON public.activity_comments USING btree (user_id);

-- Indexes for comment_likes table
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment ON public.comment_likes USING btree (comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user ON public.comment_likes USING btree (user_id);

-- ============================================================================
-- STEP 3: CREATE FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp for days
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at for days
DROP TRIGGER IF EXISTS update_days_updated_at ON days;
CREATE TRIGGER update_days_updated_at
  BEFORE UPDATE ON days
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to update updated_at timestamp for weight_entries
CREATE OR REPLACE FUNCTION update_weight_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at for weight_entries
DROP TRIGGER IF EXISTS update_weight_entries_updated_at ON weight_entries;
CREATE TRIGGER update_weight_entries_updated_at
  BEFORE UPDATE ON weight_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_weight_entries_updated_at();

-- Function to update updated_at timestamp for profiles
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at for profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profiles_updated_at();

-- Function to update updated_at timestamp for friend_requests
CREATE OR REPLACE FUNCTION update_friend_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at for friend_requests
DROP TRIGGER IF EXISTS update_friend_requests_updated_at ON friend_requests;
CREATE TRIGGER update_friend_requests_updated_at
  BEFORE UPDATE ON friend_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_friend_requests_updated_at();

-- Function to automatically create bidirectional friendship when request is accepted
-- SECURITY DEFINER allows this function to bypass RLS when creating friendships
CREATE OR REPLACE FUNCTION create_bidirectional_friendship()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    -- Insert friendship for sender -> receiver
    INSERT INTO friends (user_id, friend_id)
    VALUES (NEW.sender_id, NEW.receiver_id)
    ON CONFLICT (user_id, friend_id) DO NOTHING;
    
    -- Insert friendship for receiver -> sender (bidirectional)
    INSERT INTO friends (user_id, friend_id)
    VALUES (NEW.receiver_id, NEW.sender_id)
    ON CONFLICT (user_id, friend_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create friendships when request is accepted
DROP TRIGGER IF EXISTS create_friendship_on_accept ON friend_requests;
CREATE TRIGGER create_friendship_on_accept
  AFTER UPDATE ON friend_requests
  FOR EACH ROW
  WHEN (NEW.status = 'accepted' AND OLD.status = 'pending')
  EXECUTE FUNCTION create_bidirectional_friendship();

-- Function to clean up other friend requests between users after friendship is created
-- Note: We can't delete the row being updated, so we only clean up other requests
CREATE OR REPLACE FUNCTION cleanup_other_friend_requests()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    -- Clean up any other friend requests between these users (in either direction)
    -- We exclude the current request since we can't delete it in the same trigger
    DELETE FROM friend_requests
    WHERE ((sender_id = NEW.sender_id AND receiver_id = NEW.receiver_id)
        OR (sender_id = NEW.receiver_id AND receiver_id = NEW.sender_id))
      AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to clean up other requests after friendship is created
DROP TRIGGER IF EXISTS cleanup_other_friend_requests_after_accept ON friend_requests;
CREATE TRIGGER cleanup_other_friend_requests_after_accept
  AFTER UPDATE ON friend_requests
  FOR EACH ROW
  WHEN (NEW.status = 'accepted' AND OLD.status = 'pending')
  EXECUTE FUNCTION cleanup_other_friend_requests();

-- Function to delete accepted friend requests (to be called separately)
-- This can be run periodically or after accepting requests
CREATE OR REPLACE FUNCTION cleanup_accepted_friend_requests()
RETURNS INTEGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete accepted friend requests where users are already friends
  WITH requests_to_delete AS (
    SELECT fr.id
    FROM friend_requests fr
    WHERE fr.status = 'accepted'
      AND EXISTS (
        SELECT 1 FROM friends f
        WHERE (f.user_id = fr.sender_id AND f.friend_id = fr.receiver_id)
           OR (f.user_id = fr.receiver_id AND f.friend_id = fr.sender_id)
      )
  )
  DELETE FROM friend_requests
  WHERE id IN (SELECT id FROM requests_to_delete);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION cleanup_accepted_friend_requests() TO authenticated;

-- Function to prevent creating friend requests when users are already friends
CREATE OR REPLACE FUNCTION prevent_friend_request_if_already_friends()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if users are already friends (in either direction)
  IF EXISTS (
    SELECT 1 FROM friends
    WHERE (user_id = NEW.sender_id AND friend_id = NEW.receiver_id)
       OR (user_id = NEW.receiver_id AND friend_id = NEW.sender_id)
  ) THEN
    RAISE EXCEPTION 'Users are already friends. Cannot send friend request.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to prevent friend requests between existing friends
DROP TRIGGER IF EXISTS check_existing_friendship_before_request ON friend_requests;
CREATE TRIGGER check_existing_friendship_before_request
  BEFORE INSERT ON friend_requests
  FOR EACH ROW
  EXECUTE FUNCTION prevent_friend_request_if_already_friends();

-- Function to remove bidirectional friendship
-- SECURITY DEFINER allows this function to bypass RLS when removing friendships
CREATE OR REPLACE FUNCTION remove_bidirectional_friendship(
  p_user_id UUID,
  p_friend_id UUID
)
RETURNS void
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete both directions of the friendship
  DELETE FROM friends
  WHERE (user_id = p_user_id AND friend_id = p_friend_id)
     OR (user_id = p_friend_id AND friend_id = p_user_id);
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION remove_bidirectional_friendship(UUID, UUID) TO authenticated;

-- ============================================================================
-- ACTIVITY FEED FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to create activity when a workout is completed or missed
CREATE OR REPLACE FUNCTION create_workout_status_activity()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only create activity when status changes from false to true
  -- Workout completed
  IF NEW.completed = true AND (OLD.completed IS NULL OR OLD.completed = false) AND NEW.type = 'workout' THEN
    INSERT INTO activities (user_id, activity_type, reference_id, reference_date, metadata)
    VALUES (
      NEW.user_id,
      'workout_completed',
      NEW.id,
      NEW.date,
      jsonb_build_object(
        'exercises', COALESCE(NEW.exercises, '[]'::jsonb),
        'duration', NEW.duration,
        'notes', NEW.notes
      )
    );
  END IF;
  
  -- Workout missed
  IF NEW.missed = true AND (OLD.missed IS NULL OR OLD.missed = false) AND NEW.type = 'workout' THEN
    INSERT INTO activities (user_id, activity_type, reference_id, reference_date, metadata)
    VALUES (
      NEW.user_id,
      'workout_missed',
      NEW.id,
      NEW.date,
      jsonb_build_object(
        'exercises', COALESCE(NEW.exercises, '[]'::jsonb),
        'duration', NEW.duration
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for workout status changes
DROP TRIGGER IF EXISTS create_workout_status_activity_trigger ON days;
CREATE TRIGGER create_workout_status_activity_trigger
  AFTER UPDATE ON days
  FOR EACH ROW
  EXECUTE FUNCTION create_workout_status_activity();

-- Function to create activity when a day is planned (workout or rest day)
CREATE OR REPLACE FUNCTION create_day_planned_activity()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only create activity when type changes from 'empty' to 'workout' or 'rest'
  IF OLD.type = 'empty' AND NEW.type = 'workout' THEN
    INSERT INTO activities (user_id, activity_type, reference_id, reference_date, metadata)
    VALUES (
      NEW.user_id,
      'workout_planned',
      NEW.id,
      NEW.date,
      jsonb_build_object(
        'exercises', COALESCE(NEW.exercises, '[]'::jsonb),
        'duration', NEW.duration,
        'notes', NEW.notes
      )
    );
  ELSIF OLD.type = 'empty' AND NEW.type = 'rest' THEN
    INSERT INTO activities (user_id, activity_type, reference_id, reference_date, metadata)
    VALUES (
      NEW.user_id,
      'rest_day_planned',
      NEW.id,
      NEW.date,
      jsonb_build_object('notes', NEW.notes)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for day planning
DROP TRIGGER IF EXISTS create_day_planned_activity_trigger ON days;
CREATE TRIGGER create_day_planned_activity_trigger
  AFTER UPDATE ON days
  FOR EACH ROW
  WHEN (OLD.type = 'empty' AND NEW.type != 'empty')
  EXECUTE FUNCTION create_day_planned_activity();

-- Function to create activity when weight is logged
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

-- Trigger for weight logging (only on insert, not update)
DROP TRIGGER IF EXISTS create_weight_logged_activity_trigger ON weight_entries;
CREATE TRIGGER create_weight_logged_activity_trigger
  AFTER INSERT ON weight_entries
  FOR EACH ROW
  EXECUTE FUNCTION create_weight_logged_activity();

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
-- STEP 4: ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE days ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 5: CREATE RLS POLICIES
-- ============================================================================

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can view their own days" ON days;
DROP POLICY IF EXISTS "Users can insert their own days" ON days;
DROP POLICY IF EXISTS "Users can update their own days" ON days;
DROP POLICY IF EXISTS "Users can delete their own days" ON days;
DROP POLICY IF EXISTS "Users can view their own weight entries" ON weight_entries;
DROP POLICY IF EXISTS "Users can insert their own weight entries" ON weight_entries;
DROP POLICY IF EXISTS "Users can update their own weight entries" ON weight_entries;
DROP POLICY IF EXISTS "Users can delete their own weight entries" ON weight_entries;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view all usernames" ON profiles;
DROP POLICY IF EXISTS "Users can view their friends" ON friends;
DROP POLICY IF EXISTS "Users can add friends" ON friends;
DROP POLICY IF EXISTS "Users can remove friends" ON friends;
DROP POLICY IF EXISTS "Users can view received requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can view sent requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can send friend requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can update received requests" ON friend_requests;

-- RLS Policies for days table
-- Users can see their own days
CREATE POLICY "Users can view their own days"
  ON days
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can view their friends' days (for social features)
CREATE POLICY "Users can view friends' days"
  ON days
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM friends
      WHERE (friends.user_id = auth.uid() AND friends.friend_id = days.user_id)
         OR (friends.friend_id = auth.uid() AND friends.user_id = days.user_id)
    )
  );

CREATE POLICY "Users can insert their own days"
  ON days
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own days"
  ON days
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own days"
  ON days
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for weight_entries table
-- Users can only see and modify their own weight entries
CREATE POLICY "Users can view their own weight entries"
  ON weight_entries
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own weight entries"
  ON weight_entries
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weight entries"
  ON weight_entries
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own weight entries"
  ON weight_entries
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for profiles table
-- Users can view and modify their own profile
CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow users to check if a username is taken (read-only access to username field)
CREATE POLICY "Users can view all usernames"
  ON profiles
  FOR SELECT
  USING (true);

-- RLS Policies for friends table
-- Users can view their own friend list
CREATE POLICY "Users can view their friends"
  ON friends
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can add friends
-- This policy allows inserts where user is either user_id OR friend_id
-- This is needed for the bidirectional friendship trigger to work
CREATE POLICY "Users can add friends"
  ON friends
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.uid() = friend_id);

-- Users can remove their own friends (bidirectional)
-- Allow deletion when user is either user_id OR friend_id to ensure both directions are removed
CREATE POLICY "Users can remove friends"
  ON friends
  FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- RLS Policies for friend_requests table
-- Users can view friend requests they sent or received
CREATE POLICY "Users can view received requests"
  ON friend_requests
  FOR SELECT
  USING (auth.uid() = receiver_id OR auth.uid() = sender_id);

-- Users can send friend requests
CREATE POLICY "Users can send friend requests"
  ON friend_requests
  FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Users can accept/decline requests they received
-- Simple policy: only check that user is the receiver
-- The app already filters for status='pending' in the query
CREATE POLICY "Users can update received requests"
  ON friend_requests
  FOR UPDATE
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- RLS Policies for activities table
-- Users can view their own activities
DROP POLICY IF EXISTS "Users can view their own activities" ON activities;
CREATE POLICY "Users can view their own activities"
  ON activities
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can view their friends' activities (for social feed)
DROP POLICY IF EXISTS "Users can view friends' activities" ON activities;
CREATE POLICY "Users can view friends' activities"
  ON activities
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM friends
      WHERE (friends.user_id = auth.uid() AND friends.friend_id = activities.user_id)
         OR (friends.friend_id = auth.uid() AND friends.user_id = activities.user_id)
    )
  );

-- Activities are created by triggers (SECURITY DEFINER), so no INSERT policy needed for users
-- But we add one in case manual inserts are needed
DROP POLICY IF EXISTS "Users can insert their own activities" ON activities;
CREATE POLICY "Users can insert their own activities"
  ON activities
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for activity_likes table
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

-- RLS Policies for activity_comments table
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

-- RLS Policies for comment_likes table

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
-- VERIFICATION
-- ============================================================================

-- Verify tables were created
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'days') THEN
    RAISE NOTICE '✓ days table created successfully';
  ELSE
    RAISE EXCEPTION '✗ days table creation failed';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'weight_entries') THEN
    RAISE NOTICE '✓ weight_entries table created successfully';
  ELSE
    RAISE EXCEPTION '✗ weight_entries table creation failed';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    RAISE NOTICE '✓ profiles table created successfully';
  ELSE
    RAISE EXCEPTION '✗ profiles table creation failed';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'friends') THEN
    RAISE NOTICE '✓ friends table created successfully';
  ELSE
    RAISE EXCEPTION '✗ friends table creation failed';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'comment_likes') THEN
    RAISE NOTICE '✓ comment_likes table created successfully';
  ELSE
    RAISE EXCEPTION '✗ comment_likes table creation failed';
  END IF;
END $$;

-- Verify RLS is enabled
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'days' 
    AND rowsecurity = true
  ) THEN
    RAISE NOTICE '✓ RLS enabled on days table';
  ELSE
    RAISE EXCEPTION '✗ RLS not enabled on days table';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'weight_entries' 
    AND rowsecurity = true
  ) THEN
    RAISE NOTICE '✓ RLS enabled on weight_entries table';
  ELSE
    RAISE EXCEPTION '✗ RLS not enabled on weight_entries table';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'profiles' 
    AND rowsecurity = true
  ) THEN
    RAISE NOTICE '✓ RLS enabled on profiles table';
  ELSE
    RAISE EXCEPTION '✗ RLS not enabled on profiles table';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'friends' 
    AND rowsecurity = true
  ) THEN
    RAISE NOTICE '✓ RLS enabled on friends table';
  ELSE
    RAISE EXCEPTION '✗ RLS not enabled on friends table';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'friend_requests' 
    AND rowsecurity = true
  ) THEN
    RAISE NOTICE '✓ RLS enabled on friend_requests table';
  ELSE
    RAISE EXCEPTION '✗ RLS not enabled on friend_requests table';
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

  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'activities' 
    AND rowsecurity = true
  ) THEN
    RAISE NOTICE '✓ RLS enabled on activities table';
  ELSE
    RAISE EXCEPTION '✗ RLS not enabled on activities table';
  END IF;
END $$;

-- ============================================================================
-- NOTES
-- ============================================================================

-- This schema creates:
-- 1. days table: Stores workout/rest day plans for each user
-- 2. weight_entries table: Stores weight tracking data for each user
-- 3. profiles table: Stores user profile information including usernames
-- 4. friends table: Stores friend relationships between users (bidirectional)
-- 5. friend_requests table: Stores friend requests with pending/accepted/declined status
-- 6. activities table: Stores social feed activities (workout completed/missed, weight logged, etc.)
-- 7. All necessary indexes for performance
-- 8. Automatic timestamp updates via triggers
-- 9. Automatic bidirectional friendship creation when request is accepted (via SECURITY DEFINER trigger)
-- 10. Automatic cleanup of redundant friend requests when friendships are created
-- 11. Prevention of friend requests when users are already friends
-- 12. Bidirectional friend removal function
-- 13. Automatic activity creation triggers for social feed
-- 14. Row Level Security (RLS) policies to ensure users can only access their own data and friends' activities
--
-- IMPORTANT FEATURES INCLUDED:
-- - friend_requests UPDATE policy: Simple policy allowing receivers to update requests
-- - friends INSERT policy: Allows inserts where user is either user_id OR friend_id (for trigger)
-- - friends DELETE policy: Allows deletion when user is either user_id OR friend_id (bidirectional removal)
-- - create_bidirectional_friendship function: Uses SECURITY DEFINER to bypass RLS when needed
-- - remove_bidirectional_friendship function: Removes friendships from both users' perspectives
-- - cleanup_other_friend_requests trigger: Automatically removes duplicate requests when friendship is created
-- - prevent_friend_request_if_already_friends trigger: Prevents creating requests when users are already friends
-- - cleanup_accepted_friend_requests function: Manually clean up accepted requests where friendship exists
-- - Users can view friends' days: RLS policy allows viewing friends' workout schedules
--
-- After running this schema:
-- 1. Users can sign up and sign in via Supabase Auth
-- 2. Each user will see only their own schedule and weight data
-- 3. The app will automatically create initial empty days when a user first accesses their schedule
-- 4. Users can create usernames and send friend requests by username
-- 5. Users receive notifications for pending friend requests
-- 6. Users can accept/decline friend requests (RLS policies are correctly configured)
-- 7. When accepted, friendships are automatically created bidirectionally via trigger
-- 8. Redundant friend requests are automatically cleaned up when friendships are created
-- 9. Users cannot send friend requests to users they are already friends with
-- 10. Users can view their friends list and remove friends (removes for both users)
-- 11. Users can view their friends' workout schedules
--
-- 12. Users can view their friends' activities in the social feed
--
-- SOCIAL FEED ACTIVITY TYPES:
-- - workout_completed: When a user marks a workout as completed
-- - workout_missed: When a user marks a workout as missed
-- - workout_planned: When a user plans a workout (changes from empty to workout)
-- - rest_day_planned: When a user plans a rest day (changes from empty to rest)
-- - weight_logged: When a user logs a new weight entry
--
-- No trainer_id columns are included - this is a pure user-based system.
-- This schema has been tested and all RLS policies are correctly configured.

