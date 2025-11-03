/*
  # Corregir codigotexto para máximo 4 dígitos

  ## Cambios
  - Códigos manuales (1-999): Se rellenan con ceros a la izquierda hasta 4 dígitos (0001, 0002, 0999)
  - Códigos automáticos (1000-9999): Se mantienen sin ceros adicionales (1000, 1234, 9999)
  - Actualiza la función assign_sample_codigo para generar codigotexto correctamente
  - Actualiza registros existentes para aplicar el nuevo formato
*/

-- Actualizar función de códigos para generar codigotexto con máximo 4 dígitos
DROP FUNCTION IF EXISTS assign_sample_codigo() CASCADE;

CREATE OR REPLACE FUNCTION assign_sample_codigo()
RETURNS TRIGGER AS $$
DECLARE
  nuevo_codigo INTEGER;
  intentos INTEGER := 0;
  max_intentos INTEGER := 100;
BEGIN
  -- Si es manual, validar que tenga código entre 1-999
  IF NEW.manual = true THEN
    IF NEW.codigo IS NULL OR NEW.codigo < 1 OR NEW.codigo > 999 THEN
      RAISE EXCEPTION 'El código debe estar entre 1 y 999 para muestras manuales';
    END IF;
  ELSE
    -- Si es automático y no tiene código, generar uno entre 1000-9999
    IF NEW.codigo IS NULL THEN
      LOOP
        nuevo_codigo := floor(random() * 9000 + 1000)::integer;
        
        -- Verificar que no exista
        IF NOT EXISTS (SELECT 1 FROM muestras WHERE codigo = nuevo_codigo) THEN
          NEW.codigo := nuevo_codigo;
          EXIT;
        END IF;
        
        intentos := intentos + 1;
        IF intentos >= max_intentos THEN
          RAISE EXCEPTION 'No se pudo generar un código único después de % intentos', max_intentos;
        END IF;
      END LOOP;
    END IF;
  END IF;
  
  -- Generar codigotexto con formato correcto (máximo 4 dígitos)
  IF NEW.codigotexto IS NULL AND NEW.codigo IS NOT NULL THEN
    IF NEW.codigo < 1000 THEN
      -- Códigos manuales (1-999): Rellenar con ceros hasta 4 dígitos
      NEW.codigotexto := LPAD(NEW.codigo::text, 4, '0');
    ELSE
      -- Códigos automáticos (1000-9999): Sin ceros adicionales
      NEW.codigotexto := NEW.codigo::text;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recrear trigger de códigos
DROP TRIGGER IF EXISTS trigger_assign_sample_codigo ON muestras;
CREATE TRIGGER trigger_assign_sample_codigo
  BEFORE INSERT ON muestras
  FOR EACH ROW
  EXECUTE FUNCTION assign_sample_codigo();

-- Eliminar el trigger antiguo de formateo de codigotexto (ya no es necesario)
DROP TRIGGER IF EXISTS trigger_format_codigotexto ON muestras;
DROP FUNCTION IF EXISTS format_codigotexto() CASCADE;

-- Actualizar registros existentes para aplicar el nuevo formato
UPDATE muestras
SET codigotexto = CASE
  WHEN codigo < 1000 THEN LPAD(codigo::text, 4, '0')  -- Manuales: 0001, 0002, 0999
  ELSE codigo::text                                     -- Automáticos: 1000, 1234, 9999
END
WHERE codigo IS NOT NULL;

-- Verificar resultados
SELECT 
  codigo,
  codigotexto,
  manual,
  CASE 
    WHEN codigo < 1000 THEN 'Manual (rellenado con ceros)'
    ELSE 'Automático (sin ceros)'
  END as tipo
FROM muestras
ORDER BY codigo
LIMIT 20;
