-- Post Comments Schema
-- Run this in your Supabase SQL Editor to create the post_comments table

-- Create post_comments table
CREATE TABLE IF NOT EXISTS public.post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view comments" ON public.post_comments;
DROP POLICY IF EXISTS "Users can insert their own comments" ON public.post_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.post_comments;

-- Policy: Anyone can view all comments
CREATE POLICY "Anyone can view comments"
  ON public.post_comments
  FOR SELECT
  TO public
  USING (true);

-- Policy: Authenticated users can insert their own comments
CREATE POLICY "Users can insert their own comments"
  ON public.post_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own comments
CREATE POLICY "Users can delete their own comments"
  ON public.post_comments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index on post_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON public.post_comments(post_id);

-- Create index on user_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_post_comments_user_id ON public.post_comments(user_id);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_post_comments_created_at ON public.post_comments(created_at DESC);

-- Create RPC function to increment comment count when comment is inserted
CREATE OR REPLACE FUNCTION public.add_comment_and_increment(
  p_post_id UUID,
  p_message TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_comment_id UUID;
  v_user_id UUID;
  v_result JSONB;
BEGIN
  -- Get the authenticated user ID
  v_user_id := auth.uid();
  
  -- Reject if not authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Insert the comment
  INSERT INTO public.post_comments (post_id, user_id, message)
  VALUES (p_post_id, v_user_id, p_message)
  RETURNING id INTO v_comment_id;
  
  -- Increment the comment count
  UPDATE public.posts
  SET comment_count = comment_count + 1
  WHERE id = p_post_id;
  
  -- Return success with new count and comment ID
  SELECT jsonb_build_object(
    'success', true,
    'comment_id', v_comment_id,
    'comment_count', comment_count
  ) INTO v_result
  FROM public.posts
  WHERE id = p_post_id;
  
  RETURN v_result;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.add_comment_and_increment TO authenticated;

-- Create RPC function to delete comment and decrement count atomically
CREATE OR REPLACE FUNCTION public.delete_comment_and_decrement(p_comment_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_post_id UUID;
  v_deleted_count INTEGER;
  v_result JSONB;
BEGIN
  -- Get the authenticated user ID
  v_user_id := auth.uid();
  
  -- Reject if not authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Delete the comment (only if owned by the user)
  DELETE FROM public.post_comments
  WHERE id = p_comment_id AND user_id = v_user_id
  RETURNING post_id INTO v_post_id;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  -- Only decrement if a comment was actually deleted
  IF v_deleted_count > 0 THEN
    UPDATE public.posts
    SET comment_count = GREATEST(0, comment_count - 1)
    WHERE id = v_post_id;
    
    SELECT jsonb_build_object(
      'success', true,
      'comment_count', comment_count
    ) INTO v_result
    FROM public.posts
    WHERE id = v_post_id;
  ELSE
    v_result := jsonb_build_object(
      'success', false,
      'error', 'Comment not found or not owned by user'
    );
  END IF;
  
  RETURN v_result;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_comment_and_decrement TO authenticated;
