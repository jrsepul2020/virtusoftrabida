/*
  # Add payment status to samples table

  1. Changes
    - Add `pagada` (boolean) column to `samples` table
    - Default value is `false` (not paid)
    - This allows admins to track which samples have been paid for

  2. Notes
    - Non-destructive change (adding a column with default value)
    - Existing records will have `pagada = false` by default
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'samples' AND column_name = 'pagada'
  ) THEN
    ALTER TABLE samples ADD COLUMN pagada boolean DEFAULT false;
  END IF;
END $$;
