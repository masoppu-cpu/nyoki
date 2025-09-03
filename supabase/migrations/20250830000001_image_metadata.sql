-- BE-006: 画像アップロード機能のためのimage_metadataテーブル作成
-- image_metadata table for storing uploaded image information

CREATE TABLE IF NOT EXISTS public.image_metadata (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  type TEXT CHECK (type IN ('room', 'avatar', 'plant')),
  size INTEGER,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_image_metadata_user_id ON public.image_metadata(user_id);
CREATE INDEX IF NOT EXISTS idx_image_metadata_type ON public.image_metadata(type);
CREATE INDEX IF NOT EXISTS idx_image_metadata_created_at ON public.image_metadata(created_at DESC);

-- Enable RLS
ALTER TABLE public.image_metadata ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can manage their own image metadata
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='image_metadata' AND policyname='Users can manage own image metadata'
  ) THEN
    CREATE POLICY "Users can manage own image metadata" 
    ON public.image_metadata 
    FOR ALL TO authenticated 
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Additional Storage Bucket policies (if not already exists)
-- These complement the existing storage setup

-- Ensure ar-generated bucket exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('ar-generated', 'ar-generated', false, 10485760, ARRAY['image/jpeg', 'image/png'])
ON CONFLICT (id) DO NOTHING;

-- RLS Policy for ar-generated bucket
DO $$
BEGIN
  -- Users can upload own AR generated images
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Users can upload own ar-generated images'
  ) THEN
    CREATE POLICY "Users can upload own ar-generated images"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'ar-generated' AND 
      (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;

  -- Users can view own AR generated images
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Users can view own ar-generated images'
  ) THEN
    CREATE POLICY "Users can view own ar-generated images"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'ar-generated' AND 
      (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;

  -- Users can delete own AR generated images
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Users can delete own ar-generated images'
  ) THEN
    CREATE POLICY "Users can delete own ar-generated images"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'ar-generated' AND 
      (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $$;