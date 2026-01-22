-- ============================================
-- VERIFICAR POLÍTICAS RLS DE TABLA USUARIOS
-- ============================================

-- 1. ¿Tabla usuarios tiene RLS habilitado?
SELECT 
    tablename,
    rowsecurity as rls_habilitado
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'usuarios';

-- 2. Ver políticas de usuarios
SELECT 
    policyname,
    permissive,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'usuarios';

-- 3. Ver todos los usuarios
SELECT * FROM public.usuarios ORDER BY created_at DESC;
