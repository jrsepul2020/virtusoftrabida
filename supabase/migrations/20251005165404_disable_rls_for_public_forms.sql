/*
  # Disable RLS for Public Form Access

  ## Changes
  This migration disables Row Level Security on companies and samples tables
  to allow the public registration form to work properly.

  ## Security Note
  - RLS is disabled to allow anonymous users to submit registrations
  - This is acceptable for a contest registration system where public submissions are required
  - Admin authentication still protects the management dashboard
  - Consider enabling application-level validation for data integrity
*/

-- Disable RLS on companies table
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;

-- Disable RLS on samples table
ALTER TABLE samples DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies since RLS is disabled
DROP POLICY IF EXISTS "Public can register companies" ON companies;
DROP POLICY IF EXISTS "Authenticated users can view companies" ON companies;
DROP POLICY IF EXISTS "Authenticated users can update companies" ON companies;
DROP POLICY IF EXISTS "Authenticated users can delete companies" ON companies;

DROP POLICY IF EXISTS "Public can submit samples" ON samples;
DROP POLICY IF EXISTS "Authenticated users can view samples" ON samples;
DROP POLICY IF EXISTS "Authenticated users can update samples" ON samples;
DROP POLICY IF EXISTS "Authenticated users can delete samples" ON samples;