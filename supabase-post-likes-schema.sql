-- Post Likes Schema
-- Run this in your Supabase SQL Editor to create the post_likes table

-- Create post_likes table
CREATE TABLE IF NOT EXISTS public.post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view post likes" ON public.post_likes;
DROP POLICY IF EXISTS "Users can like posts" ON public.post_likes;
DROP POLICY IF EXISTS "Users can unlike their own likes" ON public.post_likes;

-- Policy: Anyone can view all post likes
CREATE POLICY "Anyone can view post likes"
  ON public.post_likes
  FOR SELECT
  TO public
  USING (true);

-- Policy: Authenticated users can insert their own likes
CREATE POLICY "Users can like posts"
  ON public.post_likes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own likes
CREATE POLICY "Users can unlike their own likes"
  ON public.post_likes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index on post_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON public.post_likes(post_id);

-- Create index on user_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON public.post_likes(user_id);

-- Create composite index for checking if user liked a post
CREATE INDEX IF NOT EXISTS idx_post_likes_post_user ON public.post_likes(post_id, user_id);
