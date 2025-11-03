-- Analytics Schema
-- Run this in your Supabase SQL Editor to create the analytics tables

-- Drop existing post_impressions table if it exists (schema change)
DROP TABLE IF EXISTS public.post_impressions CASCADE;

-- Create post_impressions table with engagement tracking
CREATE TABLE public.post_impressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ms_watched INTEGER DEFAULT 0,
  liked BOOLEAN DEFAULT false,
  commented BOOLEAN DEFAULT false,
  followed_creator BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create unique index to prevent duplicate impressions per user per day
-- Note: Using expression in index (not table constraint) is required for DATE()
CREATE UNIQUE INDEX post_impressions_user_day_unique
  ON public.post_impressions(post_id, user_id, (DATE(created_at)));

-- Create indexes for performance
CREATE INDEX post_impressions_user_created_idx 
  ON public.post_impressions(user_id, created_at DESC);

CREATE INDEX post_impressions_post_idx 
  ON public.post_impressions(post_id);

CREATE INDEX posts_created_idx 
  ON public.posts(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.post_impressions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own impressions" ON public.post_impressions;
DROP POLICY IF EXISTS "Users can view their own impressions" ON public.post_impressions;
DROP POLICY IF EXISTS "Users can update their own impressions" ON public.post_impressions;

-- Policy: Users can only insert their own impressions
CREATE POLICY "Users can insert their own impressions"
  ON public.post_impressions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only view their own impressions
CREATE POLICY "Users can view their own impressions"
  ON public.post_impressions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can only update their own impressions
CREATE POLICY "Users can update their own impressions"
  ON public.post_impressions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add view_count column to posts table
ALTER TABLE public.posts 
  ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Create index on view_count for sorting by popularity
CREATE INDEX IF NOT EXISTS posts_view_count_idx 
  ON public.posts(view_count DESC);

-- Function to update post view count (incremental)
CREATE OR REPLACE FUNCTION update_post_view_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment the view_count in posts table
  UPDATE public.posts
  SET view_count = view_count + 1
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

-- Algorithmic ranking function for For You feed
CREATE OR REPLACE FUNCTION get_ranked_feed(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 10,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  post_id UUID,
  score DECIMAL
) AS $$
DECLARE
  w1 DECIMAL := 0.5;   -- watch time weight
  w2 DECIMAL := 1.2;   -- like weight
  w3 DECIMAL := 1.5;   -- comment weight
  w4 DECIMAL := 2.0;   -- follow creator weight
  w5 DECIMAL := 1.0;   -- recency weight
  w6 DECIMAL := 3.0;   -- overexposure penalty weight
BEGIN
  RETURN QUERY
  WITH user_impressions AS (
    SELECT 
      pi.post_id,
      pi.user_id,
      pi.ms_watched,
      pi.liked,
      pi.commented,
      pi.followed_creator,
      pi.created_at,
      COUNT(*) OVER (PARTITION BY pi.post_id) as view_count_today
    FROM public.post_impressions pi
    WHERE pi.user_id = p_user_id
      AND pi.created_at >= CURRENT_DATE
  ),
  reported_posts AS (
    SELECT post_id
    FROM public.reports
    WHERE reporter_id = p_user_id
  ),
  ranked_posts AS (
    SELECT 
      p.id as post_id,
      p.user_id as creator_id,
      p.created_at,
      COALESCE(ui.ms_watched, 0) as ms_watched,
      COALESCE(ui.liked::int, 0) as liked,
      COALESCE(ui.commented::int, 0) as commented,
      COALESCE(ui.followed_creator::int, 0) as followed_creator,
      COALESCE(ui.view_count_today, 0) as views_today,
      EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 3600.0 as hours_since_post,
      p.view_count,
      ROW_NUMBER() OVER (PARTITION BY p.user_id ORDER BY p.created_at DESC) as creator_rank
    FROM public.posts p
    LEFT JOIN user_impressions ui ON p.id = ui.post_id
    WHERE p.id NOT IN (SELECT post_id FROM reported_posts)
  ),
  scored_posts AS (
    SELECT 
      rp.post_id,
      (
        -- Watch time normalized (0-1, assuming 30s max meaningful watch)
        w1 * LEAST(rp.ms_watched / 30000.0, 1.0) +
        
        -- Engagement signals
        w2 * rp.liked +
        w3 * rp.commented +
        w4 * rp.followed_creator +
        
        -- Recency decay (exponential decay over 48 hours)
        w5 * EXP(-rp.hours_since_post / 48.0) +
        
        -- Overexposure penalty (if seen 3+ times today)
        CASE 
          WHEN rp.views_today >= 3 THEN -w6
          ELSE 0
        END +
        
        -- Creator diversity bonus (prefer first post from creator)
        CASE 
          WHEN rp.creator_rank = 1 THEN 0.5
          WHEN rp.creator_rank = 2 THEN 0.2
          ELSE -0.3 * (rp.creator_rank - 2)
        END +
        
        -- Cold start boost (posts with < 5 views get bonus)
        CASE 
          WHEN rp.view_count < 5 THEN 0.8
          ELSE 0
        END
      ) as score
    FROM ranked_posts rp
  )
  SELECT 
    sp.post_id,
    sp.score
  FROM scored_posts sp
  ORDER BY sp.score DESC, sp.post_id
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE public.post_impressions IS 'Tracks user engagement with posts (watch time, likes, comments, follows)';
COMMENT ON COLUMN public.post_impressions.post_id IS 'The post that was viewed';
COMMENT ON COLUMN public.post_impressions.user_id IS 'The user who viewed the post';
COMMENT ON COLUMN public.post_impressions.ms_watched IS 'Milliseconds the post was visible';
COMMENT ON COLUMN public.post_impressions.liked IS 'Whether user liked the post during this session';
COMMENT ON COLUMN public.post_impressions.commented IS 'Whether user commented on the post during this session';
COMMENT ON COLUMN public.post_impressions.followed_creator IS 'Whether user followed the creator during this session';
COMMENT ON COLUMN public.post_impressions.created_at IS 'When the impression was recorded';
COMMENT ON COLUMN public.posts.view_count IS 'Total unique impressions across all time';
