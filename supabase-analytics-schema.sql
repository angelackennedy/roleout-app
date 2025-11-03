-- Analytics Schema
-- Run this in your Supabase SQL Editor to create the analytics tables

-- Create post_impressions table
CREATE TABLE IF NOT EXISTS public.post_impressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create unique constraint to prevent duplicate impressions per user per day
CREATE UNIQUE INDEX IF NOT EXISTS post_impressions_user_day_unique 
  ON public.post_impressions(post_id, user_id, DATE(created_at));

-- Create index for counting views per post
CREATE INDEX IF NOT EXISTS post_impressions_post_id_idx 
  ON public.post_impressions(post_id);

-- Create index for user's impression history
CREATE INDEX IF NOT EXISTS post_impressions_user_id_idx 
  ON public.post_impressions(user_id);

-- Enable Row Level Security
ALTER TABLE public.post_impressions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own impressions" ON public.post_impressions;
DROP POLICY IF EXISTS "Anyone can view impressions" ON public.post_impressions;

-- Policy: Users can only insert their own impressions
CREATE POLICY "Users can insert their own impressions"
  ON public.post_impressions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Anyone can view impressions (needed for view counts)
CREATE POLICY "Anyone can view impressions"
  ON public.post_impressions
  FOR SELECT
  TO public
  USING (true);

-- Add view_count column to posts table
ALTER TABLE public.posts 
  ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Create index on view_count for sorting by popularity
CREATE INDEX IF NOT EXISTS posts_view_count_idx 
  ON public.posts(view_count DESC);

-- Function to update post view count
CREATE OR REPLACE FUNCTION update_post_view_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the view_count in posts table
  UPDATE public.posts
  SET view_count = (
    SELECT COUNT(DISTINCT user_id)
    FROM public.post_impressions
    WHERE post_id = NEW.post_id
  )
  WHERE id = NEW.post_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update view count when impression is inserted
DROP TRIGGER IF EXISTS update_view_count_on_impression ON public.post_impressions;
CREATE TRIGGER update_view_count_on_impression
  AFTER INSERT ON public.post_impressions
  FOR EACH ROW
  EXECUTE FUNCTION update_post_view_count();

COMMENT ON TABLE public.post_impressions IS 'Tracks when users view posts (50% visible for 2+ seconds)';
COMMENT ON COLUMN public.post_impressions.post_id IS 'The post that was viewed';
COMMENT ON COLUMN public.post_impressions.user_id IS 'The user who viewed the post (null for anonymous)';
COMMENT ON COLUMN public.post_impressions.created_at IS 'When the impression was recorded';
COMMENT ON COLUMN public.posts.view_count IS 'Total unique viewers of this post';
