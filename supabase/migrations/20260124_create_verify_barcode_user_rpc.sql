-- =============================================================
-- FUNCIÓN PARA VERIFICAR USUARIOS - VERSION FINAL UNIVERSAL
-- =============================================================
-- Solución al error "cannot change return type of existing function"
-- Incluye DROP FUNCTION para permitir el cambio de tipo de retorno.

-- 1. Eliminar la versión anterior para permitir cambios de tipos
DROP FUNCTION IF EXISTS verify_barcode_user(text);

-- 2. Crear la función con tipos flexibles (ID como texto)
CREATE OR REPLACE FUNCTION verify_barcode_user(scanned_code text)
RETURNS TABLE (
  id text, -- ID como texto
  nombre text,
  rol text,
  mesa integer,
  tandaencurso integer,
  activo boolean
) SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id::text, 
    u.nombre::text, 
    u.rol::text, 
    u.mesa::integer, 
    u.tandaencurso::integer, 
    u.activo::boolean
  FROM public.usuarios u
  WHERE cast(u.codigo as text) ILIKE scanned_code
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- 3. Asignar permisos
GRANT EXECUTE ON FUNCTION verify_barcode_user(text) TO anon;
GRANT EXECUTE ON FUNCTION verify_barcode_user(text) TO authenticated;
