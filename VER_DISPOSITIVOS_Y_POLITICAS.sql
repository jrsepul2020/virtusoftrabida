-- ============================================
-- VERIFICAR DISPOSITIVOS Y POLÍTICAS RLS
-- Ejecutar CADA QUERY POR SEPARADO en SQL Editor
-- ============================================

-- QUERY 1: ¿Hay dispositivos registrados?
SELECT COUNT(*) as total_dispositivos FROM public.dispositivos;

-- QUERY 2: Ver todos los dispositivos
SELECT * FROM public.dispositivos ORDER BY created_at DESC;

-- QUERY 3: Ver políticas RLS de dispositivos
SELECT 
    policyname,
    permissive,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'dispositivos';

-- QUERY 4: ¿RLS está habilitado?
SELECT 
    tablename,
    rowsecurity as rls_habilitado
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'dispositivos';
