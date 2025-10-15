/*
  # Rename tables to Spanish

  1. Changes
    - Rename table `companies` to `empresas`
    - Rename table `samples` to `muestras`
    - Update foreign key constraint to reference new table name
  
  2. Notes
    - All existing data will be preserved
    - All columns and indexes remain unchanged
    - RLS policies remain unchanged
*/

-- Rename companies table to empresas
ALTER TABLE IF EXISTS companies RENAME TO empresas;

-- Rename samples table to muestras
ALTER TABLE IF EXISTS samples RENAME TO muestras;

-- Update the foreign key constraint name to reflect new table names
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'samples_ididempresa_fkey'
  ) THEN
    ALTER TABLE muestras 
    RENAME CONSTRAINT samples_ididempresa_fkey TO muestras_ididempresa_fkey;
  END IF;
END $$;