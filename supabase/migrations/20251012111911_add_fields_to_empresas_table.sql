/*
  # Add new fields to empresas table

  1. Changes
    - Add `movil` field (text) - Mobile phone number
    - Add `conocimiento` field (text) - How they heard about us
    - Add `pagina_web` field (text) - Website URL
  
  2. Notes
    - All fields are optional
    - Existing data remains unchanged
*/

-- Add new fields to empresas table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'empresas' AND column_name = 'movil'
  ) THEN
    ALTER TABLE empresas ADD COLUMN movil text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'empresas' AND column_name = 'conocimiento'
  ) THEN
    ALTER TABLE empresas ADD COLUMN conocimiento text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'empresas' AND column_name = 'pagina_web'
  ) THEN
    ALTER TABLE empresas ADD COLUMN pagina_web text;
  END IF;
END $$;