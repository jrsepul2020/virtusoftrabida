/*
  # Fix RLS for empresas and muestras tables

  ## Changes
  This migration ensures RLS is properly disabled on empresas and muestras tables
  after the table rename operation.

  ## Security Note
  - RLS is disabled to allow public access to registration forms
  - This is required for the contest registration system
*/

-- Disable RLS on empresas table
ALTER TABLE empresas DISABLE ROW LEVEL SECURITY;

-- Disable RLS on muestras table
ALTER TABLE muestras DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Anyone can register a company" ON empresas;
DROP POLICY IF EXISTS "Authenticated users can view all companies" ON empresas;
DROP POLICY IF EXISTS "Authenticated users can update companies" ON empresas;
DROP POLICY IF EXISTS "Authenticated users can delete companies" ON empresas;
DROP POLICY IF EXISTS "Public can register companies" ON empresas;

DROP POLICY IF EXISTS "Anyone can submit samples" ON muestras;
DROP POLICY IF EXISTS "Authenticated users can view all samples" ON muestras;
DROP POLICY IF EXISTS "Authenticated users can update samples" ON muestras;
DROP POLICY IF EXISTS "Authenticated users can delete samples" ON muestras;
DROP POLICY IF EXISTS "Public can submit samples" ON muestras;
