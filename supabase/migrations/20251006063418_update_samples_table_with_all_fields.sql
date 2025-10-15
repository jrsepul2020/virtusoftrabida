/*
  # Update Samples Table with Complete Fields

  ## Changes
  - Adds all required fields for sample management
  - Sets up automatic codigo generation
  - Maintains relationship with companies table

  ## Fields Added
  - codigo: Random number between 999-9999 (auto-generated)
  - nombre: Sample name
  - categoria: Category
  - empresa: Company name (auto-filled from companies)
  - codigotexto: Text code
  - origen: Origin
  - igp: IGP designation
  - pais: Country
  - azucar: Sugar content
  - grado: Degree/Grade
  - existencias: Stock/Inventory
  - año: Year
  - tipouva: Grape type
  - tipoaceituna: Olive type
  - destilado: Distillate
  - fecha: Date
  - pedido: Order
  - manual: Manual entry flag
  - creada: Created timestamp
  - ididempresa: Company ID reference
  - categoriaoiv: OIV Category
  - categoriadecata: Tasting category
*/

-- Drop existing samples table
DROP TABLE IF EXISTS samples CASCADE;

-- Create new samples table with all fields
CREATE TABLE samples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo integer UNIQUE NOT NULL DEFAULT floor(random() * 9000 + 1000)::integer,
  nombre text NOT NULL,
  categoria text,
  empresa text,
  codigotexto text,
  origen text,
  igp text,
  pais text,
  azucar numeric,
  grado numeric,
  existencias integer DEFAULT 0,
  año integer,
  tipouva text,
  tipoaceituna text,
  destilado text,
  fecha date DEFAULT CURRENT_DATE,
  pedido text,
  manual boolean DEFAULT false,
  creada timestamptz DEFAULT now(),
  ididempresa uuid REFERENCES companies(id) ON DELETE CASCADE,
  categoriaoiv text,
  categoriadecata text,
  created_at timestamptz DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_samples_company ON samples(ididempresa);
CREATE INDEX idx_samples_codigo ON samples(codigo);
CREATE INDEX idx_samples_categoria ON samples(categoria);

-- Create function to auto-fill empresa field from companies
CREATE OR REPLACE FUNCTION fill_empresa_name()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ididempresa IS NOT NULL THEN
    SELECT company_name INTO NEW.empresa
    FROM companies
    WHERE id = NEW.ididempresa;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically fill empresa field
CREATE TRIGGER trigger_fill_empresa_name
  BEFORE INSERT OR UPDATE ON samples
  FOR EACH ROW
  EXECUTE FUNCTION fill_empresa_name();