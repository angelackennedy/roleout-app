-- Posts Storage Bucket Setup
-- Run this in your Supabase SQL Editor to create the posts storage bucket

-- Create posts storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('posts', 'posts', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Post videos are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own posts" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own posts" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own posts" ON storage.objects;

-- Policy: Anyone can view posts
CREATE POLICY "Post videos are publicly accessible"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'posts');

-- Policy: Authenticated users can upload their own posts
CREATE POLICY "Users can upload their own posts"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'posts' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Users can update their own posts
CREATE POLICY "Users can update their own posts"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'posts' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'posts' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Users can delete their own posts
CREATE POLICY "Users can delete their own posts"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'posts' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

COMMENT ON POLICY "Post videos are publicly accessible" ON storage.objects IS 'Allow public read access to post videos and covers';
COMMENT ON POLICY "Users can upload their own posts" ON storage.objects IS 'Users can only upload to their own folder (userId)';
