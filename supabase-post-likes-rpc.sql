-- Post Likes RPC Functions
-- Run this in your Supabase SQL Editor to create atomic like/unlike functions

-- Function: Like a post (insert like + increment count)
CREATE OR REPLACE FUNCTION public.like_post(p_post_id UUID, p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Insert the like (will fail if already exists due to unique constraint)
  INSERT INTO public.post_likes (post_id, user_id)
  VALUES (p_post_id, p_user_id);
  
  -- Increment the like count
  UPDATE public.posts
  SET like_count = like_count + 1
  WHERE id = p_post_id;
  
  -- Return success with new count
  SELECT jsonb_build_object(
    'success', true,
    'like_count', like_count
  ) INTO v_result
  FROM public.posts
  WHERE id = p_post_id;
  
  RETURN v_result;
EXCEPTION
  WHEN unique_violation THEN
    -- Already liked, return current count
    SELECT jsonb_build_object(
      'success', false,
      'error', 'Already liked',
      'like_count', like_count
    ) INTO v_result
    FROM public.posts
    WHERE id = p_post_id;
    
    RETURN v_result;
END;
$$;

-- Function: Unlike a post (delete like + decrement count)
CREATE OR REPLACE FUNCTION public.unlike_post(p_post_id UUID, p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_deleted_count INTEGER;
BEGIN
  -- Delete the like
  DELETE FROM public.post_likes
  WHERE post_id = p_post_id AND user_id = p_user_id;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  -- Only decrement if a like was actually deleted
  IF v_deleted_count > 0 THEN
    UPDATE public.posts
    SET like_count = GREATEST(0, like_count - 1)
    WHERE id = p_post_id;
  END IF;
  
  -- Return success with new count
  SELECT jsonb_build_object(
    'success', true,
    'like_count', like_count
  ) INTO v_result
  FROM public.posts
  WHERE id = p_post_id;
  
  RETURN v_result;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.like_post TO authenticated;
GRANT EXECUTE ON FUNCTION public.unlike_post TO authenticated;
