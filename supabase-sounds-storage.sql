-- Create sounds storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('sounds', 'sounds', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for sounds bucket

-- Policy 1: Authenticated users can upload sounds
CREATE POLICY "Authenticated users can upload sounds"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'sounds');

-- Policy 2: Public read access for playback
CREATE POLICY "Public can view sounds"
ON storage.objects
FOR SELECT
USING (bucket_id = 'sounds');

-- Policy 3: Users can update sounds
CREATE POLICY "Users can update sounds"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'sounds');

-- Policy 4: Users can delete sounds
CREATE POLICY "Users can delete sounds"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'sounds');
