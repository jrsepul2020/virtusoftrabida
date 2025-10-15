/*
  # Fix RLS Policies for Public Access

  ## Changes
  This migration fixes the Row Level Security policies to allow anonymous users
  to insert companies and samples through the public registration form.

  ## Security Updates
  - Drop existing restrictive policies
  - Create new policies that allow public (anon + authenticated) to insert
  - Maintain admin-only access for select, update, and delete operations
*/

-- Drop existing policies for companies
DROP POLICY IF EXISTS "Anyone can register a company" ON companies;
DROP POLICY IF EXISTS "Authenticated users can view all companies" ON companies;
DROP POLICY IF EXISTS "Authenticated users can update companies" ON companies;
DROP POLICY IF EXISTS "Authenticated users can delete companies" ON companies;

-- Drop existing policies for samples
DROP POLICY IF EXISTS "Anyone can submit samples" ON samples;
DROP POLICY IF EXISTS "Authenticated users can view all samples" ON samples;
DROP POLICY IF EXISTS "Authenticated users can update samples" ON samples;
DROP POLICY IF EXISTS "Authenticated users can delete samples" ON samples;

-- Create new policies for companies table
-- Allow anyone (anon and authenticated) to insert
CREATE POLICY "Public can register companies"
  ON companies FOR INSERT
  WITH CHECK (true);

-- Allow authenticated users to view all companies (admin)
CREATE POLICY "Authenticated users can view companies"
  ON companies FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to update companies (admin)
CREATE POLICY "Authenticated users can update companies"
  ON companies FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete companies (admin)
CREATE POLICY "Authenticated users can delete companies"
  ON companies FOR DELETE
  TO authenticated
  USING (true);

-- Create new policies for samples table
-- Allow anyone (anon and authenticated) to insert samples
CREATE POLICY "Public can submit samples"
  ON samples FOR INSERT
  WITH CHECK (true);

-- Allow authenticated users to view all samples (admin)
CREATE POLICY "Authenticated users can view samples"
  ON samples FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to update samples (admin)
CREATE POLICY "Authenticated users can update samples"
  ON samples FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete samples (admin)
CREATE POLICY "Authenticated users can delete samples"
  ON samples FOR DELETE
  TO authenticated
  USING (true);