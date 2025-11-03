-- Post Drafts Schema
-- Run this in your Supabase SQL Editor to create the drafts system

-- Create post_drafts table
CREATE TABLE IF NOT EXISTS public.post_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  video_url TEXT,
  cover_url TEXT,
  caption TEXT,
  hashtags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on user_id for fast lookups
CREATE INDEX IF NOT EXISTS post_drafts_user_id_idx 
  ON public.post_drafts(user_id);

-- Create index on updated_at for sorting
CREATE INDEX IF NOT EXISTS post_drafts_updated_at_idx 
  ON public.post_drafts(updated_at DESC);

-- Enable Row Level Security
ALTER TABLE public.post_drafts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own drafts" ON public.post_drafts;
DROP POLICY IF EXISTS "Users can insert their own drafts" ON public.post_drafts;
DROP POLICY IF EXISTS "Users can update their own drafts" ON public.post_drafts;
DROP POLICY IF EXISTS "Users can delete their own drafts" ON public.post_drafts;

-- Policy: Users can only view their own drafts
CREATE POLICY "Users can view their own drafts"
  ON public.post_drafts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can only insert their own drafts
CREATE POLICY "Users can insert their own drafts"
  ON public.post_drafts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own drafts
CREATE POLICY "Users can update their own drafts"
  ON public.post_drafts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only delete their own drafts
CREATE POLICY "Users can delete their own drafts"
  ON public.post_drafts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_post_drafts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS post_drafts_updated_at_trigger ON public.post_drafts;
CREATE TRIGGER post_drafts_updated_at_trigger
  BEFORE UPDATE ON public.post_drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_post_drafts_updated_at();

COMMENT ON TABLE public.post_drafts IS 'User draft posts with autosave';
COMMENT ON COLUMN public.post_drafts.user_id IS 'The user who created the draft';
COMMENT ON COLUMN public.post_drafts.video_url IS 'URL to the draft video in storage';
COMMENT ON COLUMN public.post_drafts.cover_url IS 'URL to the selected cover image';
COMMENT ON COLUMN public.post_drafts.caption IS 'Draft caption text';
COMMENT ON COLUMN public.post_drafts.hashtags IS 'Extracted hashtags from caption';
COMMENT ON COLUMN public.post_drafts.updated_at IS 'Last autosave timestamp';
