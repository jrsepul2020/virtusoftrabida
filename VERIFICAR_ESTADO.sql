-- ============================================
-- VERIFICAR ESTADO COMPLETO DEL SISTEMA
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- 1. ¿Existe la tabla dispositivos?
SELECT 
    'dispositivos' as tabla,
    CASE 
        WHEN EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'dispositivos')
        THEN '✅ EXISTE'
        ELSE '❌ NO EXISTE'
    END as estado;

-- 2. ¿Cuántos registros hay?
SELECT 
    'Registros en dispositivos' as info,
    COUNT(*) as total
FROM public.dispositivos;

-- 3. ¿Existe la tabla usuarios?
SELECT 
    'usuarios' as tabla,
    CASE 
        WHEN EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'usuarios')
        THEN '✅ EXISTE'
        ELSE '❌ NO EXISTE'
    END as estado;

-- 4. ¿Cuántos usuarios hay?
SELECT 
    'Registros en usuarios' as info,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE rol = 'Administrador') as admins
FROM public.usuarios;

-- 5. Ver estructura de dispositivos
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'dispositivos'
ORDER BY ordinal_position;

-- 6. Ver políticas RLS de dispositivos
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'dispositivos';

-- 7. ¿RLS está habilitado?
SELECT 
    tablename,
    rowsecurity as rls_habilitado
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'dispositivos';

-- 8. Ver tu usuario actual (si estás autenticado)
SELECT 
    auth.uid() as mi_user_id,
    auth.role() as mi_rol;

-- 9. ¿Tu usuario está en la tabla usuarios?
SELECT 
    u.id,
    u.email,
    u.nombre,
    u.rol,
    u.activo,
    'Usuario encontrado en tabla usuarios' as estado
FROM public.usuarios u
WHERE u.id::text = auth.uid()::text;

-- ============================================
-- DIAGNÓSTICO ESPERADO:
-- ✅ dispositivos existe
-- ✅ usuarios existe  
-- ✅ RLS habilitado
-- ✅ Política "dispositivos_all_authenticated" existe
-- ✅ Tu usuario aparece en usuarios con rol Administrador
-- ============================================
