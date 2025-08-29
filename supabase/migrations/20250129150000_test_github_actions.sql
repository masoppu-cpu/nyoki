-- Test migration for GitHub Actions CI/CD
-- Date: 2025-01-29
-- Purpose: Verify GitHub Actions workflow is working correctly

-- This is a safe no-op migration that just adds a comment to the database
-- It won't affect any existing data or schema

DO $$
BEGIN
  -- Just a comment to verify the migration ran
  RAISE NOTICE 'GitHub Actions test migration executed successfully at %', NOW();
END $$;

-- Add a test comment to profiles table (no actual change)
COMMENT ON TABLE public.profiles IS 'User profiles table - GitHub Actions test verified 2025-01-29';