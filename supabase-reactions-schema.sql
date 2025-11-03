-- Create live_reactions table for emoji reactions during live sessions
CREATE TABLE IF NOT EXISTS public.live_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL CHECK (emoji IN ('❤️', '🔥', '👏')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient queries by session and time
CREATE INDEX IF NOT EXISTS idx_live_reactions_session_time 
ON public.live_reactions(session_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.live_reactions ENABLE ROW LEVEL SECURITY;

-- Policy 1: Authenticated users can insert their own reactions
CREATE POLICY "Authenticated users can insert reactions"
ON public.live_reactions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy 2: Everyone can view reactions (including anon for realtime updates)
CREATE POLICY "Everyone can view reactions"
ON public.live_reactions
FOR SELECT
USING (true);

-- Function to get reaction counts per emoji for a session
CREATE OR REPLACE FUNCTION get_reaction_counts(p_session_id UUID)
RETURNS TABLE(emoji TEXT, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    lr.emoji,
    COUNT(*)::BIGINT as count
  FROM live_reactions lr
  WHERE lr.session_id = p_session_id
  GROUP BY lr.emoji;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_reaction_counts(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_reaction_counts(UUID) TO anon;

-- Enable Realtime for live_reactions table
-- Note: Run this in Supabase SQL editor or enable via Dashboard > Database > Replication
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_reactions;

-- IMPORTANT: After running this SQL, go to your Supabase Dashboard:
-- 1. Navigate to Database > Replication
-- 2. Enable replication for the 'live_reactions' table if not already enabled
