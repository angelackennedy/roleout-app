-- Create live_chat table for real-time chat messages during live sessions
CREATE TABLE IF NOT EXISTS public.live_chat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient queries by session and time
CREATE INDEX IF NOT EXISTS idx_live_chat_session_time 
ON public.live_chat(session_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.live_chat ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can insert their own messages
CREATE POLICY "Users can insert own messages"
ON public.live_chat
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy 2: Anyone can view messages for any session (read-only for viewers, including anon)
CREATE POLICY "Anyone can view messages"
ON public.live_chat
FOR SELECT
USING (true);

-- Policy 3: Users can only update their own messages (optional, for future edit feature)
CREATE POLICY "Users can update own messages"
ON public.live_chat
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 4: Users can only delete their own messages (optional, for future delete feature)
CREATE POLICY "Users can delete own messages"
ON public.live_chat
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Function to get message count for a session
CREATE OR REPLACE FUNCTION get_message_count(p_session_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*)::INTEGER FROM public.live_chat WHERE session_id = p_session_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_message_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_message_count(UUID) TO anon;

-- Enable Realtime for live_chat table
-- Note: Run this in Supabase SQL editor or enable via Dashboard > Database > Replication
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_chat;

-- IMPORTANT: After running this SQL, go to your Supabase Dashboard:
-- 1. Navigate to Database > Replication
-- 2. Enable replication for the 'live_chat' table if not already enabled
