-- Add sound_id column to posts table
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS sound_id UUID REFERENCES public.sounds(id) ON DELETE SET NULL;

-- Create index for posts by sound
CREATE INDEX IF NOT EXISTS idx_posts_sound_id 
ON public.posts(sound_id);

COMMENT ON COLUMN public.posts.sound_id IS 'Reference to attached sound from sound library';
