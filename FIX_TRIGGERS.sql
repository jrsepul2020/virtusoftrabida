-- ============================================
-- FIX: Actualizar triggers y columnas de muestras
-- ============================================
-- Ejecuta esto en el SQL Editor de Supabase

-- 1. Verificar si existe columna empresa_id, si no renombrar ididempresa
DO $$
BEGIN
  -- Si existe ididempresa pero no empresa_id, renombrar
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'muestras' AND column_name = 'ididempresa'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'muestras' AND column_name = 'empresa_id'
  ) THEN
    ALTER TABLE muestras RENAME COLUMN ididempresa TO empresa_id;
    RAISE NOTICE 'Columna ididempresa renombrada a empresa_id';
  END IF;
END $$;

-- 2. Actualizar función fill_empresa_name para usar empresa_id
DROP FUNCTION IF EXISTS fill_empresa_name() CASCADE;

CREATE OR REPLACE FUNCTION fill_empresa_name()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.empresa_id IS NOT NULL THEN
    NEW.empresa := (
      SELECT name
      FROM empresas
      WHERE id = NEW.empresa_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recrear trigger
DROP TRIGGER IF EXISTS trigger_fill_empresa_name ON muestras;
CREATE TRIGGER trigger_fill_empresa_name
  BEFORE INSERT OR UPDATE ON muestras
  FOR EACH ROW
  EXECUTE FUNCTION fill_empresa_name();

-- 3. Actualizar función de códigos automáticos
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

-- 4. Verificar triggers creados
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'muestras'
ORDER BY trigger_name;

-- 5. Mostrar estructura de la tabla
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'muestras'
ORDER BY ordinal_position;
