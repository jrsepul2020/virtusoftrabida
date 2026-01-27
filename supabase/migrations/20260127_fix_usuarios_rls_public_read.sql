-- ============================================================
-- CORRECCIÓN: PERMITIR LECTURA PÚBLICA DE USUARIOS
-- ============================================================
-- Necesario para que el sistema de tablets pueda identificar 
-- qué usuario tiene asignado cada puesto antes de loguearse.

-- Asegurar que RLS esté activo
ALTER TABLE IF EXISTS public.usuarios ENABLE ROW LEVEL SECURITY;

-- Eliminar política si ya existe para evitar errores
DROP POLICY IF EXISTS "usuarios_public_select" ON public.usuarios;

-- Crear política de lectura pública
CREATE POLICY "usuarios_public_select" ON public.usuarios
    FOR SELECT USING (true);

-- Comentario explicativo
COMMENT ON POLICY "usuarios_public_select" ON public.usuarios IS 
  'Permite a las tablets consultar asignaciones de mesa/puesto sin estar autenticadas';
