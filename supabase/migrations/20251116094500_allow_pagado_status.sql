-- Migration: Allow 'pagado' status for empresas
-- Adds 'pagado' to the allowed values for the status column check constraint

BEGIN;

-- Drop previous check constraints if they exist
DO $$
BEGIN
  ALTER TABLE IF EXISTS empresas DROP CONSTRAINT IF EXISTS companies_status_check;
  EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE IF EXISTS empresas DROP CONSTRAINT IF EXISTS empresas_status_check;
  EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Add new constraint that includes 'pagado'
ALTER TABLE IF EXISTS empresas
  ADD CONSTRAINT empresas_status_check CHECK (status IN ('pending', 'approved', 'rejected', 'pagado'));

COMMIT;

-- Note: If you prefer using 'paid' instead of 'pagado', update this constraint
-- and keep frontend labels in sync in CompaniesManager.tsx statusConfigs.
