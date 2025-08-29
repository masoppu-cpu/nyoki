-- Storage buckets and policies setup
-- Created: 2025-01-28

-- ==============================================
-- Storage Buckets
-- ==============================================
-- Note: Buckets are created via Supabase Dashboard or CLI
-- This file contains the policies for the buckets

-- ==============================================
-- Storage Policies - room-images bucket
-- ==============================================

-- Users can upload their own room images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='storage' AND tablename='objects' AND policyname='Users can upload own room images'
  ) THEN
    CREATE POLICY "Users can upload own room images"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'room-images' 
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;

-- Users can view their own room images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='storage' AND tablename='objects' AND policyname='Users can view own room images'
  ) THEN
    CREATE POLICY "Users can view own room images"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'room-images' 
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;

-- Users can update their own room images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='storage' AND tablename='objects' AND policyname='Users can update own room images'
  ) THEN
    CREATE POLICY "Users can update own room images"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'room-images' 
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;

-- Users can delete their own room images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='storage' AND tablename='objects' AND policyname='Users can delete own room images'
  ) THEN
    CREATE POLICY "Users can delete own room images"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'room-images' 
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;

-- ==============================================
-- Storage Policies - plant-images bucket (public)
-- ==============================================

-- Anyone can view plant images (public bucket)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='storage' AND tablename='objects' AND policyname='Plant images are publicly viewable'
  ) THEN
    CREATE POLICY "Plant images are publicly viewable"
    ON storage.objects FOR SELECT
    TO anon, authenticated
    USING (bucket_id = 'plant-images');
  END IF;
END $$;

-- Only admins can manage plant images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='storage' AND tablename='objects' AND policyname='Only admins can upload plant images'
  ) THEN
    CREATE POLICY "Only admins can upload plant images"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'plant-images'
      AND auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='storage' AND tablename='objects' AND policyname='Only admins can update plant images'
  ) THEN
    CREATE POLICY "Only admins can update plant images"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'plant-images'
      AND auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='storage' AND tablename='objects' AND policyname='Only admins can delete plant images'
  ) THEN
    CREATE POLICY "Only admins can delete plant images"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'plant-images'
      AND auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
    );
  END IF;
END $$;

-- ==============================================
-- Storage Policies - user-avatars bucket
-- ==============================================

-- Users can upload their own avatar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='storage' AND tablename='objects' AND policyname='Users can upload own avatar'
  ) THEN
    CREATE POLICY "Users can upload own avatar"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'user-avatars'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;

-- Users can view their own avatar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='storage' AND tablename='objects' AND policyname='Users can view own avatar'
  ) THEN
    CREATE POLICY "Users can view own avatar"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'user-avatars'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;

-- Users can update their own avatar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='storage' AND tablename='objects' AND policyname='Users can update own avatar'
  ) THEN
    CREATE POLICY "Users can update own avatar"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'user-avatars'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;

-- Users can delete their own avatar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='storage' AND tablename='objects' AND policyname='Users can delete own avatar'
  ) THEN
    CREATE POLICY "Users can delete own avatar"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'user-avatars'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;

-- ==============================================
-- Note: Bucket creation script for reference
-- ==============================================
-- This needs to be run via Supabase Dashboard or supabase CLI
-- 
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES 
--   ('room-images', 'room-images', false),
--   ('plant-images', 'plant-images', true),
--   ('user-avatars', 'user-avatars', false);
--
