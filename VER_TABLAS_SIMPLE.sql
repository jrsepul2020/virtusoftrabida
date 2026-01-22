-- ============================================
-- VERIFICACIÓN SIN AUTENTICACIÓN
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- 1. ¿Existe la tabla dispositivos?
SELECT 
    'dispositivos' as tabla,
    CASE 
        WHEN EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'dispositivos')
        THEN '✅ EXISTE'
        ELSE '❌ NO EXISTE - EJECUTA CREAR_TABLA_DISPOSITIVOS.sql'
    END as estado;

-- 2. Ver TODOS los registros de dispositivos (sin filtro de usuario)
SELECT 
    id,
    device_fingerprint,
    user_id,
    activo,
    nombre_asignado,
    tablet_number,
    last_seen_at
FROM public.dispositivos
ORDER BY created_at DESC;

-- 3. ¿Existe la tabla usuarios?
SELECT 
    'usuarios' as tabla,
    CASE 
        WHEN EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'usuarios')
        THEN '✅ EXISTE'
        ELSE '❌ NO EXISTE'
    END as estado;

-- 4. Ver TODOS los usuarios
SELECT 
    id,
    email,
    nombre,
    rol,
    activo
FROM public.usuarios
ORDER BY created_at DESC;

-- 5. Ver políticas RLS
SELECT 
    tablename,
    policyname,
    permissive,
    cmd
FROM pg_policies 
WHERE tablename = 'dispositivos';

-- 6. ¿RLS está habilitado?
SELECT 
    tablename,
    CASE rowsecurity
        WHEN true THEN '✅ RLS HABILITADO'
        ELSE '❌ RLS DESHABILITADO'
    END as estado_rls
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'dispositivos';

-- 7. Ver usuarios de auth (tabla del sistema)
SELECT 
    id,
    email,
    created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- SI LA TABLA DISPOSITIVOS NO EXISTE:
-- Ejecuta: CREAR_TABLA_DISPOSITIVOS.sql
-- 
-- SI NO HAY USUARIOS EN LA TABLA:
-- Usa el siguiente INSERT más abajo
-- ============================================
