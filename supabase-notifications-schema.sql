-- Notifications Schema with Triggers
-- Run this in your Supabase SQL Editor to create the notifications system

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'follow')),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can mark their notifications as read" ON public.notifications;

-- Policy: Users can only view their own notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Anyone can insert notifications (for triggers and server actions)
CREATE POLICY "System can insert notifications"
  ON public.notifications
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy: Users can only update (mark as read) their own notifications
CREATE POLICY "Users can mark their notifications as read"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_user_read_idx ON public.notifications(user_id, read_at) 
  WHERE read_at IS NULL;

-- Trigger function: Create notification when someone likes a post
CREATE OR REPLACE FUNCTION notify_post_like()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify if the liker is not the post owner
  IF NEW.user_id != (SELECT user_id FROM public.posts WHERE id = NEW.post_id) THEN
    INSERT INTO public.notifications (user_id, actor_id, type, post_id)
    SELECT 
      p.user_id,
      NEW.user_id,
      'like',
      NEW.post_id
    FROM public.posts p
    WHERE p.id = NEW.post_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function: Create notification when someone comments on a post
CREATE OR REPLACE FUNCTION notify_post_comment()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify if the commenter is not the post owner
  IF NEW.user_id != (SELECT user_id FROM public.posts WHERE id = NEW.post_id) THEN
    INSERT INTO public.notifications (user_id, actor_id, type, post_id)
    SELECT 
      p.user_id,
      NEW.user_id,
      'comment',
      NEW.post_id
    FROM public.posts p
    WHERE p.id = NEW.post_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function: Create notification when someone follows you
CREATE OR REPLACE FUNCTION notify_follow()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, actor_id, type)
  VALUES (NEW.following_id, NEW.follower_id, 'follow');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS on_post_like_notify ON public.post_likes;
DROP TRIGGER IF EXISTS on_post_comment_notify ON public.post_comments;
DROP TRIGGER IF EXISTS on_follow_notify ON public.follows;

-- Create trigger: Notify on post like
CREATE TRIGGER on_post_like_notify
  AFTER INSERT ON public.post_likes
  FOR EACH ROW
  EXECUTE FUNCTION notify_post_like();

-- Create trigger: Notify on post comment
CREATE TRIGGER on_post_comment_notify
  AFTER INSERT ON public.post_comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_post_comment();

-- Create trigger: Notify on follow
CREATE TRIGGER on_follow_notify
  AFTER INSERT ON public.follows
  FOR EACH ROW
  EXECUTE FUNCTION notify_follow();

COMMENT ON TABLE public.notifications IS 'User notifications for likes, comments, and follows';
COMMENT ON COLUMN public.notifications.user_id IS 'User receiving the notification';
COMMENT ON COLUMN public.notifications.actor_id IS 'User who performed the action';
COMMENT ON COLUMN public.notifications.type IS 'Type of notification: like, comment, or follow';
COMMENT ON COLUMN public.notifications.post_id IS 'Related post (for like/comment notifications)';
COMMENT ON COLUMN public.notifications.read_at IS 'Timestamp when notification was read (NULL = unread)';
