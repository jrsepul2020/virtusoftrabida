-- Función para formatear codigotexto automáticamente
-- Si tiene 3 caracteres, añade un cero al principio
CREATE OR REPLACE FUNCTION format_codigotexto()
RETURNS TRIGGER AS $$
BEGIN
  -- Si codigotexto tiene exactamente 3 caracteres, añadir un 0 al principio
  IF NEW.codigotexto IS NOT NULL AND LENGTH(TRIM(NEW.codigotexto)) = 3 THEN
    NEW.codigotexto := '0' || TRIM(NEW.codigotexto);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger que se ejecuta antes de insertar o actualizar
DROP TRIGGER IF EXISTS trigger_format_codigotexto ON muestras;
CREATE TRIGGER trigger_format_codigotexto
  BEFORE INSERT OR UPDATE OF codigotexto ON muestras
  FOR EACH ROW
  EXECUTE FUNCTION format_codigotexto();

-- Actualizar registros existentes que tengan 3 caracteres
UPDATE muestras
SET codigotexto = '0' || codigotexto
WHERE codigotexto IS NOT NULL 
  AND LENGTH(TRIM(codigotexto)) = 3;
