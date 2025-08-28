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
CREATE POLICY "Users can upload own room images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'room-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can view their own room images
CREATE POLICY "Users can view own room images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'room-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own room images
CREATE POLICY "Users can update own room images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'room-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own room images
CREATE POLICY "Users can delete own room images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'room-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ==============================================
-- Storage Policies - plant-images bucket (public)
-- ==============================================

-- Anyone can view plant images (public bucket)
CREATE POLICY "Plant images are publicly viewable"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'plant-images');

-- Only admins can manage plant images
CREATE POLICY "Only admins can upload plant images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'plant-images'
  AND auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
);

CREATE POLICY "Only admins can update plant images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'plant-images'
  AND auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
);

CREATE POLICY "Only admins can delete plant images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'plant-images'
  AND auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
);

-- ==============================================
-- Storage Policies - user-avatars bucket
-- ==============================================

-- Users can upload their own avatar
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can view their own avatar
CREATE POLICY "Users can view own avatar"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'user-avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own avatar
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

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