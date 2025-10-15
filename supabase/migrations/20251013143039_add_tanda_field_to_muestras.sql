/*
  # Add tanda field to muestras table

  1. Changes
    - Add `tanda` column to `muestras` table
      - Type: integer (1-25)
      - Nullable: true (samples can exist without assigned tanda)
      - Default: null

  2. Notes
    - Tanda represents the batch/round number (1-25) for sample organization
    - Will be used to group samples for evaluation/tasting sessions
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'muestras' AND column_name = 'tanda'
  ) THEN
    ALTER TABLE muestras ADD COLUMN tanda integer;
    
    -- Add check constraint to ensure tanda is between 1 and 25
    ALTER TABLE muestras ADD CONSTRAINT tanda_range_check 
      CHECK (tanda IS NULL OR (tanda >= 1 AND tanda <= 25));
  END IF;
END $$;