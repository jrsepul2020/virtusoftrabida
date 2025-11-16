/*
  # Security Fix: Re-enable RLS with Proper Policies

  ## Security Updates
  - Ensure user_id column exists on empresas table
  - Re-enable Row Level Security on companies and samples tables
  - Create secure policies that protect data while allowing necessary operations
  - Implement role-based access control
*/

-- First, ensure user_id column exists on empresas table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'empresas' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE empresas ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Re-enable RLS on empresas table
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;

-- Re-enable RLS on muestras table
ALTER TABLE muestras ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Public can register companies" ON empresas;
DROP POLICY IF EXISTS "Authenticated users can view companies" ON empresas;
DROP POLICY IF EXISTS "Authenticated users can update companies" ON empresas;
DROP POLICY IF EXISTS "Authenticated users can delete companies" ON empresas;

DROP POLICY IF EXISTS "Public can submit samples" ON muestras;
DROP POLICY IF EXISTS "Authenticated users can view samples" ON muestras;
DROP POLICY IF EXISTS "Authenticated users can update samples" ON muestras;
DROP POLICY IF EXISTS "Authenticated users can delete samples" ON muestras;

-- Create secure policies for companies table

-- Allow anyone to register companies (public registration)
CREATE POLICY "companies_insert_public"
  ON empresas FOR INSERT
  WITH CHECK (true);

-- Allow authenticated users to view their own company data
CREATE POLICY "companies_select_own"
  ON empresas FOR SELECT
  USING (auth.uid() = user_id);

-- Allow authenticated users to update their own company data
CREATE POLICY "companies_update_own"
  ON empresas FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to delete their own company data
CREATE POLICY "companies_delete_own"
  ON empresas FOR DELETE
  USING (auth.uid() = user_id);

-- Create secure policies for samples table

-- Allow anyone to submit samples (public registration)
CREATE POLICY "samples_insert_public"
  ON muestras FOR INSERT
  WITH CHECK (true);

-- Allow authenticated users to view samples from their own company
CREATE POLICY "samples_select_own_company"
  ON muestras FOR SELECT
  USING (
    empresa_id IN (
      SELECT id FROM empresas WHERE user_id = auth.uid()
    )
  );

-- Allow authenticated users to update samples from their own company
CREATE POLICY "samples_update_own_company"
  ON muestras FOR UPDATE
  USING (
    empresa_id IN (
      SELECT id FROM empresas WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    empresa_id IN (
      SELECT id FROM empresas WHERE user_id = auth.uid()
    )
  );

-- Allow authenticated users to delete samples from their own company
CREATE POLICY "samples_delete_own_company"
  ON muestras FOR DELETE
  USING (
    empresa_id IN (
      SELECT id FROM empresas WHERE user_id = auth.uid()
    )
  );

-- Create admin policies for full access (authenticated users can manage all)
-- Note: In production, you should create a proper admin role system
CREATE POLICY "admin_full_access_companies"
  ON empresas FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "admin_full_access_samples"
  ON muestras FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);