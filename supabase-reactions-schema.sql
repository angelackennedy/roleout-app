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

-- Enable Realtime for live_reactions table
-- Note: Run this in Supabase SQL editor or enable via Dashboard > Database > Replication
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_reactions;

-- IMPORTANT: After running this SQL, go to your Supabase Dashboard:
-- 1. Navigate to Database > Replication
-- 2. Enable replication for the 'live_reactions' table if not already enabled
