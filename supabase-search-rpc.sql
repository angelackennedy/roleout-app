-- Search RPC Functions
-- Run this in your Supabase SQL Editor to create search functions

-- Function to search posts by caption or hashtags
CREATE OR REPLACE FUNCTION search_posts(
  search_query TEXT,
  result_limit INTEGER DEFAULT 20,
  result_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  video_url TEXT,
  cover_url TEXT,
  caption TEXT,
  hashtags TEXT[],
  like_count INTEGER,
  comment_count INTEGER,
  share_count INTEGER,
  created_at TIMESTAMPTZ,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.video_url,
    p.cover_url,
    p.caption,
    p.hashtags,
    p.like_count,
    p.comment_count,
    p.share_count,
    p.created_at,
    pr.username,
    pr.display_name,
    pr.avatar_url
  FROM public.posts p
  INNER JOIN public.profiles pr ON p.user_id = pr.id
  WHERE 
    p.caption ILIKE '%' || search_query || '%'
    OR search_query = ANY(p.hashtags)
  ORDER BY p.created_at DESC
  LIMIT result_limit
  OFFSET result_offset;
END;
$$;

-- Function to search users by username or display name
CREATE OR REPLACE FUNCTION search_users(
  search_query TEXT,
  result_limit INTEGER DEFAULT 20,
  result_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pr.id,
    pr.username,
    pr.display_name,
    pr.avatar_url,
    pr.bio,
    pr.created_at
  FROM public.profiles pr
  WHERE 
    pr.username ILIKE '%' || search_query || '%'
    OR pr.display_name ILIKE '%' || search_query || '%'
  ORDER BY pr.created_at DESC
  LIMIT result_limit
  OFFSET result_offset;
END;
$$;

-- Function to get all hashtags with post counts (for trending/popular tags)
CREATE OR REPLACE FUNCTION get_trending_hashtags(
  result_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  tag TEXT,
  post_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    unnest(hashtags) as tag,
    COUNT(*) as post_count
  FROM public.posts
  WHERE hashtags IS NOT NULL AND array_length(hashtags, 1) > 0
  GROUP BY tag
  ORDER BY post_count DESC, tag ASC
  LIMIT result_limit;
END;
$$;

-- Function to get posts by specific hashtag
CREATE OR REPLACE FUNCTION get_posts_by_hashtag(
  tag_name TEXT,
  result_limit INTEGER DEFAULT 20,
  result_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  video_url TEXT,
  cover_url TEXT,
  caption TEXT,
  hashtags TEXT[],
  like_count INTEGER,
  comment_count INTEGER,
  share_count INTEGER,
  created_at TIMESTAMPTZ,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.video_url,
    p.cover_url,
    p.caption,
    p.hashtags,
    p.like_count,
    p.comment_count,
    p.share_count,
    p.created_at,
    pr.username,
    pr.display_name,
    pr.avatar_url
  FROM public.posts p
  INNER JOIN public.profiles pr ON p.user_id = pr.id
  WHERE tag_name = ANY(p.hashtags)
  ORDER BY p.created_at DESC
  LIMIT result_limit
  OFFSET result_offset;
END;
$$;

COMMENT ON FUNCTION search_posts IS 'Search posts by caption text or hashtag';
COMMENT ON FUNCTION search_users IS 'Search users by username or display name';
COMMENT ON FUNCTION get_trending_hashtags IS 'Get hashtags ordered by post count';
COMMENT ON FUNCTION get_posts_by_hashtag IS 'Get all posts containing a specific hashtag';
