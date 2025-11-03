-- Sounds Schema
-- Run this in your Supabase SQL Editor to create the sounds table

-- Create sounds table
CREATE TABLE IF NOT EXISTS public.sounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  artist TEXT,
  file_url TEXT NOT NULL,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for search performance
CREATE INDEX IF NOT EXISTS idx_sounds_title 
ON public.sounds(title);

CREATE INDEX IF NOT EXISTS idx_sounds_created 
ON public.sounds(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.sounds ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view sounds (public library)
CREATE POLICY "Everyone can view sounds"
ON public.sounds
FOR SELECT
USING (true);

-- Policy: Authenticated users can insert sounds
CREATE POLICY "Authenticated users can insert sounds"
ON public.sounds
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Users can update their own sounds (we'll track via created_by later if needed)
CREATE POLICY "Anyone can update sounds"
ON public.sounds
FOR UPDATE
TO authenticated
USING (true);

COMMENT ON TABLE public.sounds IS 'Sound library for video posts';
COMMENT ON COLUMN public.sounds.id IS 'Unique sound identifier';
COMMENT ON COLUMN public.sounds.title IS 'Sound track title';
COMMENT ON COLUMN public.sounds.artist IS 'Sound track artist name';
COMMENT ON COLUMN public.sounds.file_url IS 'Public URL to sound file in storage';
COMMENT ON COLUMN public.sounds.duration_seconds IS 'Length of sound in seconds';
