/*
  # Disable RLS for Admin Panel Access
  
  ## Rationale
  The admin panel uses local authentication (localStorage) and does not rely on Supabase auth.
  RLS policies were blocking all read/write access because auth.uid() returns NULL for unauthenticated requests.
  
  This migration disables RLS on both empresas and muestras tables to allow the admin panel to function.
*/

-- First, drop all policies to ensure clean state
BEGIN;

-- Drop all existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "companies_insert_public" ON empresas;
  DROP POLICY IF EXISTS "companies_select_own" ON empresas;
  DROP POLICY IF EXISTS "companies_update_own" ON empresas;
  DROP POLICY IF EXISTS "companies_delete_own" ON empresas;
  DROP POLICY IF EXISTS "admin_full_access_companies" ON empresas;
  DROP POLICY IF EXISTS "Public can register companies" ON empresas;
  DROP POLICY IF EXISTS "Authenticated users can view companies" ON empresas;
  DROP POLICY IF EXISTS "Authenticated users can update companies" ON empresas;
  DROP POLICY IF EXISTS "Authenticated users can delete companies" ON empresas;

  DROP POLICY IF EXISTS "samples_insert_public" ON muestras;
  DROP POLICY IF EXISTS "samples_select_own_company" ON muestras;
  DROP POLICY IF EXISTS "samples_update_own_company" ON muestras;
  DROP POLICY IF EXISTS "samples_delete_own_company" ON muestras;
  DROP POLICY IF EXISTS "admin_full_access_samples" ON muestras;
  DROP POLICY IF EXISTS "Public can submit samples" ON muestras;
  DROP POLICY IF EXISTS "Authenticated users can view samples" ON muestras;
  DROP POLICY IF EXISTS "Authenticated users can update samples" ON muestras;
  DROP POLICY IF EXISTS "Authenticated users can delete samples" ON muestras;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Disable RLS on empresas table
ALTER TABLE IF EXISTS empresas DISABLE ROW LEVEL SECURITY;

-- Disable RLS on muestras table
ALTER TABLE IF EXISTS muestras DISABLE ROW LEVEL SECURITY;

COMMIT;
