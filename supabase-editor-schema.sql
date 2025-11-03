-- Editor Projects Table
-- Stores video editing projects with autosave support
CREATE TABLE IF NOT EXISTS public.editor_projects (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title varchar(255) NOT NULL DEFAULT 'Untitled Project',
    project_data jsonb NOT NULL DEFAULT '{}'::jsonb,
    thumbnail_url text,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- RLS Policies: Only project owner can access
ALTER TABLE public.editor_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own projects"
    ON public.editor_projects
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects"
    ON public.editor_projects
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
    ON public.editor_projects
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
    ON public.editor_projects
    FOR DELETE
    USING (auth.uid() = user_id);

-- Index for faster project lookups
CREATE INDEX IF NOT EXISTS idx_editor_projects_user_updated 
    ON public.editor_projects(user_id, updated_at DESC);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_editor_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_editor_projects_updated_at
    BEFORE UPDATE ON public.editor_projects
    FOR EACH ROW
    EXECUTE FUNCTION update_editor_projects_updated_at();

-- Storage bucket for editor assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('editor', 'editor', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for editor bucket
-- Public read, owner-only write
CREATE POLICY "Editor assets are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'editor');

CREATE POLICY "Users can upload to their own editor folder"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'editor' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can update their own editor assets"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'editor' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can delete their own editor assets"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'editor' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );
