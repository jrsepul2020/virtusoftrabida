/*
  # Fix remaining references to old table names

  1. Changes
    - Update trigger function to reference empresas instead of companies
    - Recreate trigger with correct table name
  
  2. Notes
    - Fixes any remaining database objects referencing old table names
*/

-- Drop and recreate the auto-fill empresa function with updated table reference
DROP FUNCTION IF EXISTS fill_empresa_name() CASCADE;

CREATE OR REPLACE FUNCTION fill_empresa_name()
RETURNS TRIGGER AS $$
BEGIN
  NEW.empresa := (
    SELECT name
    FROM empresas
    WHERE id = NEW.ididempresa
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger on muestras table
DROP TRIGGER IF EXISTS trigger_fill_empresa_name ON muestras;

CREATE TRIGGER trigger_fill_empresa_name
  BEFORE INSERT OR UPDATE ON muestras
  FOR EACH ROW
  EXECUTE FUNCTION fill_empresa_name();