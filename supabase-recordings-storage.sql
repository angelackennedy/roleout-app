-- Create recordings storage bucket for live session replays
INSERT INTO storage.buckets (id, name, public)
VALUES ('recordings', 'recordings', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for recordings bucket

-- Policy 1: Authenticated users can upload to their own folder
CREATE POLICY "Users can upload own recordings"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'recordings' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 2: Public read access for playback
CREATE POLICY "Public can view recordings"
ON storage.objects
FOR SELECT
USING (bucket_id = 'recordings');

-- Policy 3: Users can update their own recordings
CREATE POLICY "Users can update own recordings"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'recordings' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4: Users can delete their own recordings
CREATE POLICY "Users can delete own recordings"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'recordings' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
