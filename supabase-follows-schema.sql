-- Follows Schema
-- Run this in your Supabase SQL Editor to create the follows table

-- Create follows table
CREATE TABLE IF NOT EXISTS public.follows (
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  -- Prevent self-follows
  CHECK (follower_id != following_id)
);

-- Enable Row Level Security
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view follows" ON public.follows;
DROP POLICY IF EXISTS "Users can follow others" ON public.follows;
DROP POLICY IF EXISTS "Users can unfollow" ON public.follows;

-- Policy: Anyone can view all follows
CREATE POLICY "Anyone can view follows"
  ON public.follows
  FOR SELECT
  TO public
  USING (true);

-- Policy: Authenticated users can follow others (insert their own follows)
CREATE POLICY "Users can follow others"
  ON public.follows
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = follower_id);

-- Policy: Users can unfollow (delete their own follows)
CREATE POLICY "Users can unfollow"
  ON public.follows
  FOR DELETE
  TO authenticated
  USING (auth.uid() = follower_id);

-- Create index on follower_id for fast lookups of "who I'm following"
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows(follower_id);

-- Create index on following_id for fast lookups of "who follows me"
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON public.follows(following_id);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_follows_created_at ON public.follows(created_at DESC);
