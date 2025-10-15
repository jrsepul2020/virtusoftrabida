/*
  # Fix fill_empresa_name function

  1. Changes
    - Drop and recreate the fill_empresa_name function with correct column name
    - Change from 'company_name' to 'name' which is the actual column in companies table
*/

DROP FUNCTION IF EXISTS fill_empresa_name() CASCADE;

CREATE OR REPLACE FUNCTION fill_empresa_name()
RETURNS TRIGGER AS $$
BEGIN
  SELECT name
  INTO NEW.empresa
  FROM companies
  WHERE id = NEW.ididempresa;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_empresa_name
  BEFORE INSERT OR UPDATE ON samples
  FOR EACH ROW
  EXECUTE FUNCTION fill_empresa_name();
