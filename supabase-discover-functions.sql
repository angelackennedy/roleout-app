-- SQL Functions for Discover page optimization
-- These are optional but improve performance for trending data aggregation

-- Function to get trending hashtags within a time period
CREATE OR REPLACE FUNCTION get_trending_hashtags(
    since_time timestamptz DEFAULT now() - interval '7 days',
    limit_count integer DEFAULT 20
)
RETURNS TABLE (
    tag text,
    post_count bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        unnest(hashtags) as tag,
        COUNT(*) as post_count
    FROM posts
    WHERE created_at >= since_time
        AND hashtags IS NOT NULL
        AND array_length(hashtags, 1) > 0
    GROUP BY tag
    ORDER BY post_count DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get rising creators based on recent follower growth
CREATE OR REPLACE FUNCTION get_rising_creators(
    since_time timestamptz DEFAULT now() - interval '7 days',
    min_followers integer DEFAULT 2,
    limit_count integer DEFAULT 20
)
RETURNS TABLE (
    user_id uuid,
    username text,
    avatar_url text,
    bio text,
    new_followers bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as user_id,
        p.username,
        p.avatar_url,
        p.bio,
        COUNT(f.follower_id) as new_followers
    FROM profiles p
    INNER JOIN follows f ON f.followed_id = p.id
    WHERE f.created_at >= since_time
    GROUP BY p.id, p.username, p.avatar_url, p.bio
    HAVING COUNT(f.follower_id) >= min_followers
    ORDER BY new_followers DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get trending sounds based on usage
CREATE OR REPLACE FUNCTION get_trending_sounds(
    since_time timestamptz DEFAULT now() - interval '7 days',
    min_usage integer DEFAULT 3,
    limit_count integer DEFAULT 20
)
RETURNS TABLE (
    id uuid,
    title text,
    artist text,
    file_url text,
    duration integer,
    usage_count bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.title,
        s.artist,
        s.file_url,
        s.duration,
        COUNT(p.id) as usage_count
    FROM sounds s
    INNER JOIN posts p ON p.sound_id = s.id
    WHERE p.created_at >= since_time
    GROUP BY s.id, s.title, s.artist, s.file_url, s.duration
    HAVING COUNT(p.id) >= min_usage
    ORDER BY usage_count DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- Optional: Create materialized views for faster reads (refresh periodically)
-- Uncomment if you want to use materialized views instead of functions

-- CREATE MATERIALIZED VIEW IF NOT EXISTS trending_hashtags_24h AS
-- SELECT 
--     unnest(hashtags) as tag,
--     COUNT(*) as post_count
-- FROM posts
-- WHERE created_at >= now() - interval '24 hours'
--     AND hashtags IS NOT NULL
-- GROUP BY tag
-- ORDER BY post_count DESC
-- LIMIT 50;

-- CREATE MATERIALIZED VIEW IF NOT EXISTS trending_hashtags_7d AS
-- SELECT 
--     unnest(hashtags) as tag,
--     COUNT(*) as post_count
-- FROM posts
-- WHERE created_at >= now() - interval '7 days'
--     AND hashtags IS NOT NULL
-- GROUP BY tag
-- ORDER BY post_count DESC
-- LIMIT 50;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_posts_created_at_hashtags 
    ON posts(created_at) WHERE hashtags IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_follows_created_at 
    ON follows(created_at, followed_id);

CREATE INDEX IF NOT EXISTS idx_posts_sound_id_created_at 
    ON posts(sound_id, created_at) WHERE sound_id IS NOT NULL;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_trending_hashtags TO authenticated;
GRANT EXECUTE ON FUNCTION get_rising_creators TO authenticated;
GRANT EXECUTE ON FUNCTION get_trending_sounds TO authenticated;
