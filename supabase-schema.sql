-- RollCall Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Posts table
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  video_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0
);

-- Likes table
CREATE TABLE likes (
  id UUID DEFAULT  gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- Comments table
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Moderation actions table (FA³)
CREATE TABLE moderation_actions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  moderator_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL, -- 'remove', 'warn', 'restore', etc.
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Flags table (user reports)
CREATE TABLE flags (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'reviewed', 'resolved'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_likes_post_id ON likes(post_id);
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_flags_status ON flags(status);

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE flags ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" 
  ON profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Posts policies
CREATE POLICY "Posts are viewable by everyone" 
  ON posts FOR SELECT 
  USING (true);

CREATE POLICY "Users can create own posts" 
  ON posts FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts" 
  ON posts FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts" 
  ON posts FOR DELETE 
  USING (auth.uid() = user_id);

-- Likes policies
CREATE POLICY "Likes are viewable by everyone" 
  ON likes FOR SELECT 
  USING (true);

CREATE POLICY "Users can create own likes" 
  ON likes FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes" 
  ON likes FOR DELETE 
  USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Comments are viewable by everyone" 
  ON comments FOR SELECT 
  USING (true);

CREATE POLICY "Users can create own comments" 
  ON comments FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" 
  ON comments FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" 
  ON comments FOR DELETE 
  USING (auth.uid() = user_id);

-- Moderation actions policies (public transparency - FA³)
CREATE POLICY "Moderation actions are viewable by everyone" 
  ON moderation_actions FOR SELECT 
  USING (true);

CREATE POLICY "Only moderators can create moderation actions" 
  ON moderation_actions FOR INSERT 
  WITH CHECK (auth.uid() = moderator_id);

-- Flags policies
CREATE POLICY "Users can view own flags" 
  ON flags FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create flags" 
  ON flags FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Functions for updating counts
CREATE OR REPLACE FUNCTION increment_like_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts 
  SET like_count = like_count + 1 
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_like_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts 
  SET like_count = like_count - 1 
  WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts 
  SET comment_count = comment_count + 1 
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts 
  SET comment_count = comment_count - 1 
  WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER on_like_created
  AFTER INSERT ON likes
  FOR EACH ROW
  EXECUTE FUNCTION increment_like_count();

CREATE TRIGGER on_like_deleted
  AFTER DELETE ON likes
  FOR EACH ROW
  EXECUTE FUNCTION decrement_like_count();

CREATE TRIGGER on_comment_created
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION increment_comment_count();

CREATE TRIGGER on_comment_deleted
  AFTER DELETE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION decrement_comment_count();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
