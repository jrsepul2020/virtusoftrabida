/*
  # Add totalinscripciones field to companies table

  1. Changes
    - Add `totalinscripciones` column to `companies` table
      - Type: integer
      - Default: 0
      - Not null
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'totalinscripciones'
  ) THEN
    ALTER TABLE companies ADD COLUMN totalinscripciones integer DEFAULT 0 NOT NULL;
  END IF;
END $$;
