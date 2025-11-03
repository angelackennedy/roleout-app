-- Posts Schema
-- Run this in your Supabase SQL Editor to create the posts table

-- Create posts table
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  cover_url TEXT,
  caption TEXT,
  hashtags TEXT[],
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view posts" ON public.posts;
DROP POLICY IF EXISTS "Users can insert their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON public.posts;

-- Policy: Anyone can view all posts
CREATE POLICY "Anyone can view posts"
  ON public.posts
  FOR SELECT
  TO public
  USING (true);

-- Policy: Authenticated users can insert their own posts
CREATE POLICY "Users can insert their own posts"
  ON public.posts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own posts
CREATE POLICY "Users can update their own posts"
  ON public.posts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own posts
CREATE POLICY "Users can delete their own posts"
  ON public.posts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index on created_at for feed ordering
CREATE INDEX IF NOT EXISTS posts_created_at_idx ON public.posts(created_at DESC);

-- Create GIN index on hashtags for tag search
CREATE INDEX IF NOT EXISTS posts_hashtags_idx ON public.posts USING GIN(hashtags);

-- Create index on user_id for user's posts
CREATE INDEX IF NOT EXISTS posts_user_id_idx ON public.posts(user_id);

COMMENT ON TABLE public.posts IS 'User-uploaded video posts for the For You feed';
COMMENT ON COLUMN public.posts.id IS 'Unique post identifier';
COMMENT ON COLUMN public.posts.user_id IS 'References profiles.id of the post creator';
COMMENT ON COLUMN public.posts.video_url IS 'Public URL to video in Supabase Storage';
COMMENT ON COLUMN public.posts.cover_url IS 'Public URL to cover/thumbnail image';
COMMENT ON COLUMN public.posts.caption IS 'Post caption text';
COMMENT ON COLUMN public.posts.hashtags IS 'Array of hashtags extracted from caption';
COMMENT ON COLUMN public.posts.like_count IS 'Number of likes (denormalized)';
COMMENT ON COLUMN public.posts.comment_count IS 'Number of comments (denormalized)';
COMMENT ON COLUMN public.posts.share_count IS 'Number of shares (denormalized)';
