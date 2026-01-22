-- ============================================
-- ALTERNATIVA: POLÍTICAS PERMISIVAS (Para desarrollo local)
-- Usar solo si las políticas con cast siguen dando error
-- ============================================

-- Eliminar policies anteriores
DROP POLICY IF EXISTS "dispositivos_insert" ON public.dispositivos;
DROP POLICY IF EXISTS "dispositivos_select" ON public.dispositivos;
DROP POLICY IF EXISTS "dispositivos_update" ON public.dispositivos;
DROP POLICY IF EXISTS "dispositivos_delete" ON public.dispositivos;

-- OPCIÓN A: Acceso completo para usuarios autenticados (MÁS SIMPLE)
CREATE POLICY "dispositivos_all_authenticated" ON public.dispositivos
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- VERIFICAR
SELECT 
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'dispositivos';

-- ============================================
-- NOTA: Esta política permite que cualquier usuario autenticado
-- pueda ver y modificar todos los dispositivos.
-- Solo usar en desarrollo local.
-- ============================================
