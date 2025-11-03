-- Reports Schema
-- Run this in your Supabase SQL Editor to create the reports table
-- This allows users to report posts and hide content they've reported

-- Create reports table
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Prevent duplicate reports from the same user for the same post
  UNIQUE(reporter_id, post_id)
);

-- Enable Row Level Security
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can report posts" ON public.reports;
DROP POLICY IF EXISTS "Admins can view all reports" ON public.reports;

-- Policy: Authenticated users can report posts (insert their own reports)
CREATE POLICY "Users can report posts"
  ON public.reports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

-- Policy: Only admins can view reports
-- Note: To make a user an admin, set their JWT role to 'admin'
-- This is typically done through Supabase Auth custom claims
CREATE POLICY "Admins can view all reports"
  ON public.reports
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() ->> 'role')::text = 'admin'
  );

-- Create index on reporter_id for fast "posts I reported" lookups
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON public.reports(reporter_id);

-- Create index on post_id for fast "reports for this post" lookups
CREATE INDEX IF NOT EXISTS idx_reports_post_id ON public.reports(post_id);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at DESC);

-- Comments for documentation
COMMENT ON TABLE public.reports IS 'User-reported posts for content moderation';
COMMENT ON COLUMN public.reports.reason IS 'User-provided reason for reporting (optional)';
COMMENT ON POLICY "Users can report posts" ON public.reports IS 'Users can only insert reports with their own user_id';
COMMENT ON POLICY "Admins can view all reports" ON public.reports IS 'Only users with admin role can view reports';
