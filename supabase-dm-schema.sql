-- Direct Messages (DM) Schema
-- Run this in your Supabase SQL Editor to create the DM system

-- Create conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create conversation_members junction table
CREATE TABLE IF NOT EXISTS public.conversation_members (
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (conversation_id, user_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS conversation_members_user_id_idx 
  ON public.conversation_members(user_id);

CREATE INDEX IF NOT EXISTS conversation_members_conversation_id_idx 
  ON public.conversation_members(conversation_id);

CREATE INDEX IF NOT EXISTS messages_conversation_created_idx 
  ON public.messages(conversation_id, created_at ASC);

CREATE INDEX IF NOT EXISTS messages_created_at_idx 
  ON public.messages(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view conversations they are members of" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can view conversation members" ON public.conversation_members;
DROP POLICY IF EXISTS "Users can add themselves to new conversations" ON public.conversation_members;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON public.messages;

-- Conversations policies
CREATE POLICY "Users can view conversations they are members of"
  ON public.conversations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members
      WHERE conversation_members.conversation_id = conversations.id
        AND conversation_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create conversations"
  ON public.conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Conversation members policies
CREATE POLICY "Users can view conversation members"
  ON public.conversation_members
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = conversation_members.conversation_id
        AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add themselves to new conversations"
  ON public.conversation_members
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Messages policies
CREATE POLICY "Users can view messages in their conversations"
  ON public.messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members
      WHERE conversation_members.conversation_id = messages.conversation_id
        AND conversation_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages to their conversations"
  ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.conversation_members
      WHERE conversation_members.conversation_id = messages.conversation_id
        AND conversation_members.user_id = auth.uid()
    )
  );

-- Helper function to find or create a 1-on-1 conversation
CREATE OR REPLACE FUNCTION get_or_create_conversation(other_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  existing_conversation_id UUID;
  new_conversation_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  IF current_user_id = other_user_id THEN
    RAISE EXCEPTION 'Cannot create conversation with yourself';
  END IF;
  
  -- Find existing 1-on-1 conversation
  SELECT cm1.conversation_id INTO existing_conversation_id
  FROM conversation_members cm1
  INNER JOIN conversation_members cm2 
    ON cm1.conversation_id = cm2.conversation_id
  WHERE cm1.user_id = current_user_id
    AND cm2.user_id = other_user_id
    AND (
      SELECT COUNT(*) 
      FROM conversation_members cm3 
      WHERE cm3.conversation_id = cm1.conversation_id
    ) = 2
  LIMIT 1;
  
  IF existing_conversation_id IS NOT NULL THEN
    RETURN existing_conversation_id;
  END IF;
  
  -- Create new conversation
  INSERT INTO conversations DEFAULT VALUES
  RETURNING id INTO new_conversation_id;
  
  -- Add both users
  INSERT INTO conversation_members (conversation_id, user_id)
  VALUES 
    (new_conversation_id, current_user_id),
    (new_conversation_id, other_user_id);
  
  RETURN new_conversation_id;
END;
$$;

COMMENT ON TABLE public.conversations IS 'DM conversations between users';
COMMENT ON TABLE public.conversation_members IS 'Members of each conversation';
COMMENT ON TABLE public.messages IS 'Messages in conversations';
COMMENT ON FUNCTION get_or_create_conversation IS 'Find or create a 1-on-1 conversation between current user and another user';
