-- Performance Optimization for RollCall
-- Adds/verifies critical indexes for query performance

-- Posts table indexes
CREATE INDEX IF NOT EXISTS idx_posts_created_at_desc 
    ON public.posts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_posts_hashtags_gin 
    ON public.posts USING GIN (hashtags);

CREATE INDEX IF NOT EXISTS idx_posts_user_id 
    ON public.posts(user_id);

CREATE INDEX IF NOT EXISTS idx_posts_user_created 
    ON public.posts(user_id, created_at DESC);

-- Comments table indexes (table is named "comments" not "post_comments")
CREATE INDEX IF NOT EXISTS idx_comments_post_created 
    ON public.comments(post_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_comments_user_id 
    ON public.comments(user_id);

-- Likes table indexes (table is named "likes" not "post_likes")
CREATE INDEX IF NOT EXISTS idx_likes_post_id 
    ON public.likes(post_id);

CREATE INDEX IF NOT EXISTS idx_likes_user_id 
    ON public.likes(user_id);

CREATE INDEX IF NOT EXISTS idx_likes_user_post 
    ON public.likes(user_id, post_id);

-- Follows table indexes
CREATE INDEX IF NOT EXISTS idx_follows_follower_id 
    ON public.follows(follower_id);

CREATE INDEX IF NOT EXISTS idx_follows_following_id 
    ON public.follows(following_id);

CREATE INDEX IF NOT EXISTS idx_follows_follower_created 
    ON public.follows(follower_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_follows_following_created 
    ON public.follows(following_id, created_at DESC);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_created 
    ON public.notifications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_actor_id 
    ON public.notifications(actor_id);

-- Post impressions indexes
CREATE INDEX IF NOT EXISTS idx_post_impressions_user_created 
    ON public.post_impressions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_post_impressions_post_id 
    ON public.post_impressions(post_id);

CREATE INDEX IF NOT EXISTS idx_post_impressions_user_post_date 
    ON public.post_impressions(user_id, post_id, created_at DESC);

-- Messages indexes for DM performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created 
    ON public.messages(conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_sender_id 
    ON public.messages(sender_id);

-- Conversation members indexes
CREATE INDEX IF NOT EXISTS idx_conversation_members_user 
    ON public.conversation_members(user_id);

CREATE INDEX IF NOT EXISTS idx_conversation_members_conversation 
    ON public.conversation_members(conversation_id);

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_username 
    ON public.profiles(username);

CREATE INDEX IF NOT EXISTS idx_profiles_created_at 
    ON public.profiles(created_at DESC);

-- Reports and hidden posts indexes (already created in previous schema)
-- idx_reports_reporter_id
-- idx_reports_post_id
-- idx_hidden_posts_user_id

-- Live session indexes
CREATE INDEX IF NOT EXISTS idx_live_sessions_user_id 
    ON public.live_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_live_sessions_created_at 
    ON public.live_sessions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_live_sessions_status 
    ON public.live_sessions(status) 
    WHERE status = 'active';

-- Live chat indexes
CREATE INDEX IF NOT EXISTS idx_live_chat_session_created 
    ON public.live_chat(session_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_live_chat_user_id 
    ON public.live_chat(user_id);

-- Live reactions indexes
CREATE INDEX IF NOT EXISTS idx_live_reactions_session_created 
    ON public.live_reactions(session_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_live_reactions_user_id 
    ON public.live_reactions(user_id);

-- Post drafts indexes
CREATE INDEX IF NOT EXISTS idx_post_drafts_user_updated 
    ON public.post_drafts(user_id, updated_at DESC);

-- Comments for documentation
COMMENT ON INDEX idx_posts_created_at_desc IS 'Optimizes feed queries ordered by recency';
COMMENT ON INDEX idx_posts_hashtags_gin IS 'Enables fast hashtag search with GIN index';
COMMENT ON INDEX idx_comments_post_created IS 'Optimizes comment fetching for posts (ascending order for chronological display)';
COMMENT ON INDEX idx_notifications_user_created IS 'Optimizes notification feed queries';
COMMENT ON INDEX idx_post_impressions_user_created IS 'Optimizes analytics queries for user engagement history';
COMMENT ON INDEX idx_follows_follower_id IS 'Optimizes queries for users a person follows';
COMMENT ON INDEX idx_follows_following_id IS 'Optimizes queries for followers of a user';
