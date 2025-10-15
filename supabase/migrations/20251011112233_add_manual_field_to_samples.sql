/*
  # Add Manual Entry Support for Samples

  1. Changes
    - Update codigo generation logic to support manual entries (1-999) and automatic (1000-9999)
    - Ensure manual field is properly set
    - Update trigger to handle manual codigo assignment

  2. Security
    - No RLS changes needed (existing policies apply)
*/

-- Update the default codigo generation to only generate between 1000-9999
-- Manual entries will use 1-999 range
ALTER TABLE samples 
ALTER COLUMN codigo SET DEFAULT floor(random() * 9000 + 1000)::integer;

-- Create function to handle manual codigo assignment
CREATE OR REPLACE FUNCTION assign_sample_codigo()
RETURNS TRIGGER AS $$
BEGIN
  -- If manual is true and codigo is provided, validate it's in the 1-999 range
  IF NEW.manual = true THEN
    IF NEW.codigo IS NULL OR NEW.codigo < 1 OR NEW.codigo > 999 THEN
      RAISE EXCEPTION 'Manual entries must have a codigo between 1 and 999';
    END IF;
  ELSE
    -- For non-manual entries, if codigo is not provided, generate one in 1000-9999 range
    IF NEW.codigo IS NULL THEN
      NEW.codigo := floor(random() * 9000 + 1000)::integer;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate and assign codigo
DROP TRIGGER IF EXISTS trigger_assign_sample_codigo ON samples;
CREATE TRIGGER trigger_assign_sample_codigo
  BEFORE INSERT ON samples
  FOR EACH ROW
  EXECUTE FUNCTION assign_sample_codigo();