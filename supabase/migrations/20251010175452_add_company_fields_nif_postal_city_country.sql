/*
  # Add New Company Fields

  1. Changes to `companies` table
    - Add `nif` (text) - Tax identification number
    - Add `codigo_postal` (text) - Postal code
    - Add `poblacion` (text) - Town/locality
    - Add `ciudad` (text) - City
    - Add `pais` (text) - Country
    - Add `observaciones` (text) - Observations/notes
    - Remove the `status` field from the type definition (will be handled in form)
  
  2. Notes
    - All new fields are optional (nullable)
    - These fields enhance the company registration information
    - The status field will remain in the database but won't be editable in the public form
*/

-- Add new fields to companies table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'nif'
  ) THEN
    ALTER TABLE companies ADD COLUMN nif text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'codigo_postal'
  ) THEN
    ALTER TABLE companies ADD COLUMN codigo_postal text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'poblacion'
  ) THEN
    ALTER TABLE companies ADD COLUMN poblacion text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'ciudad'
  ) THEN
    ALTER TABLE companies ADD COLUMN ciudad text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'pais'
  ) THEN
    ALTER TABLE companies ADD COLUMN pais text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'observaciones'
  ) THEN
    ALTER TABLE companies ADD COLUMN observaciones text;
  END IF;
END $$;