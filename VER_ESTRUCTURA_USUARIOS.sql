-- ============================================
-- VERIFICAR ESTRUCTURA DE TABLA USUARIOS
-- ============================================

-- 1. Ver columnas de la tabla usuarios
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'usuarios'
ORDER BY ordinal_position;

-- 2. Ver foreign keys de dispositivos
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name = 'dispositivos';

-- 3. Ver qué campo de usuarios corresponde a auth.users
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'usuarios'
AND column_name IN ('id', 'user_id')
ORDER BY ordinal_position;
