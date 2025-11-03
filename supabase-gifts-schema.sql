-- Virtual Gifts Schema
-- Tracks gifts sent during live streams or to posts

CREATE TABLE IF NOT EXISTS gifts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id text, -- For live stream sessions or post IDs
    gift_type text NOT NULL, -- e.g., 'rose', 'diamond', 'galaxy', etc.
    coins integer NOT NULL DEFAULT 0, -- Virtual coin value
    created_at timestamptz DEFAULT now()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_gifts_user_id ON gifts(user_id);
CREATE INDEX IF NOT EXISTS idx_gifts_session_id ON gifts(session_id);
CREATE INDEX IF NOT EXISTS idx_gifts_created_at ON gifts(created_at DESC);

-- RLS Policies
ALTER TABLE gifts ENABLE ROW LEVEL SECURITY;

-- Anyone can view gifts
CREATE POLICY "Gifts are viewable by everyone"
    ON gifts FOR SELECT
    USING (true);

-- Users can insert their own gifts
CREATE POLICY "Users can send gifts"
    ON gifts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Optional: Gift summary view for creators
CREATE OR REPLACE VIEW creator_gift_earnings AS
SELECT 
    g.user_id as creator_id,
    COUNT(*) as total_gifts,
    SUM(g.coins) as total_coins,
    json_agg(
        json_build_object(
            'gift_type', g.gift_type,
            'count', gift_counts.count,
            'total_coins', gift_counts.total_coins
        )
    ) as gifts_by_type
FROM gifts g
LEFT JOIN (
    SELECT 
        user_id,
        gift_type,
        COUNT(*) as count,
        SUM(coins) as total_coins
    FROM gifts
    GROUP BY user_id, gift_type
) gift_counts ON g.user_id = gift_counts.user_id AND g.gift_type = gift_counts.gift_type
GROUP BY g.user_id;

GRANT SELECT ON creator_gift_earnings TO authenticated;
