-- Create live_recordings table for storing recorded live sessions
CREATE TABLE IF NOT EXISTS public.live_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  storage_path TEXT NOT NULL,
  public_url TEXT,
  duration_seconds INTEGER,
  size_bytes BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient queries by session
CREATE INDEX IF NOT EXISTS idx_live_recordings_session_time 
ON public.live_recordings(session_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.live_recordings ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view their own recordings
CREATE POLICY "Users can view own recordings"
ON public.live_recordings
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy 2: Users can insert their own recordings
CREATE POLICY "Users can insert own recordings"
ON public.live_recordings
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy 3: Everyone can view recordings (for public playback)
CREATE POLICY "Everyone can view recordings"
ON public.live_recordings
FOR SELECT
USING (true);

-- IMPORTANT: Supabase Storage Setup
-- 1. Create a Storage bucket named "recordings" in Supabase Dashboard
-- 2. Set bucket policies:
--    - Allow authenticated users to INSERT/UPDATE files where user_id matches
--    - Allow public SELECT (read) for playback
-- 3. Bucket is PUBLIC for video playback URLs

-- Storage bucket policies (run in Supabase Dashboard > Storage > Policies):
/*
-- Allow authenticated users to upload their own recordings
CREATE POLICY "Users can upload own recordings"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'recordings' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access for playback
CREATE POLICY "Public can view recordings"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'recordings');

-- Allow users to update their own recordings
CREATE POLICY "Users can update own recordings"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'recordings' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
*/
