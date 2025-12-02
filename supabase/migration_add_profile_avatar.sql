-- Migration: Add avatar_url to profiles table
-- Run this migration to add profile picture support

-- ============================================================================
-- ADD AVATAR_URL COLUMN TO PROFILES
-- ============================================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT NULL;

-- ============================================================================
-- CREATE STORAGE BUCKET FOR AVATARS
-- ============================================================================

-- Note: This needs to be run in the Supabase dashboard SQL editor
-- or via the Supabase CLI with appropriate permissions

-- Create the avatars bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,  -- Public bucket so avatars can be displayed
  2097152,  -- 2MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- ============================================================================
-- STORAGE POLICIES FOR AVATARS BUCKET
-- ============================================================================

-- Allow authenticated users to upload their own avatars
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = 'avatars'
  AND auth.uid()::text = split_part(storage.filename(name), '-', 1)
);

-- Allow authenticated users to update their own avatars
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = split_part(storage.filename(name), '-', 1)
);

-- Allow authenticated users to delete their own avatars
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = split_part(storage.filename(name), '-', 1)
);

-- Allow anyone to view avatars (public bucket)
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
CREATE POLICY "Anyone can view avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'avatar_url'
  ) THEN
    RAISE NOTICE '✓ avatar_url column added to profiles table';
  ELSE
    RAISE EXCEPTION '✗ avatar_url column not found in profiles table';
  END IF;
END $$;

-- ============================================================================
-- NOTES
-- ============================================================================
-- This migration adds:
-- 1. avatar_url column to profiles table
-- 2. avatars storage bucket with 2MB file size limit
-- 3. Storage policies for upload, update, delete, and view
--
-- IMPORTANT: After running this migration, you may also need to:
-- 1. Enable the Storage service in your Supabase project
-- 2. Verify the bucket was created in Storage > Buckets
-- 3. Check that RLS is enabled for storage.objects
--
-- The avatar upload flow:
-- 1. User selects an image file
-- 2. File is uploaded to storage.objects in 'avatars' bucket
-- 3. Public URL is generated and saved to profiles.avatar_url

