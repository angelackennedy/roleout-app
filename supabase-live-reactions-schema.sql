-- Live Session Reactions Schema
-- Run this in your Supabase SQL Editor to create the live reactions system

-- Create live_reactions table
CREATE TABLE IF NOT EXISTS public.live_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id),
  emoji TEXT NOT NULL CHECK (emoji IN ('❤️', '🔥', '👏')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient queries by session and time
CREATE INDEX IF NOT EXISTS live_reactions_session_created_idx 
  ON public.live_reactions(session_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.live_reactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can view reactions" ON public.live_reactions;
DROP POLICY IF EXISTS "Authenticated users can add reactions" ON public.live_reactions;

-- Policy: Authenticated users can view all reactions
CREATE POLICY "Authenticated users can view reactions"
  ON public.live_reactions
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Authenticated users can insert their own reactions
CREATE POLICY "Authenticated users can add reactions"
  ON public.live_reactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Function to get reaction counts for a session
CREATE OR REPLACE FUNCTION get_reaction_counts(p_session_id UUID)
RETURNS TABLE(emoji TEXT, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    lr.emoji,
    COUNT(*)::BIGINT
  FROM public.live_reactions lr
  WHERE lr.session_id = p_session_id
  GROUP BY lr.emoji;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_reaction_counts(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_reaction_counts(UUID) TO anon;

COMMENT ON TABLE public.live_reactions IS 'Emoji reactions for live streaming sessions';
COMMENT ON COLUMN public.live_reactions.session_id IS 'References live_sessions.id';
COMMENT ON COLUMN public.live_reactions.user_id IS 'User who sent the reaction';
COMMENT ON COLUMN public.live_reactions.emoji IS 'One of: ❤️, 🔥, 👏';
