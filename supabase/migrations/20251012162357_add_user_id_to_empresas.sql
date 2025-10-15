/*
  # Add user_id to empresas table

  1. Changes
    - Add `user_id` field (uuid) to empresas table to link with auth.users
  
  2. Notes
    - Links each company to a Supabase auth user
    - Allows users to access their own company data
*/

-- Add user_id field to empresas table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'empresas' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE empresas ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;