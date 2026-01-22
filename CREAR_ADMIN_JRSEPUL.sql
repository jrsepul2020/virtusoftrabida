-- ============================================
-- CREAR USUARIO ADMIN PARA: jrsepul2000@gmail.com
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- Insertar tu usuario como Administrador
INSERT INTO public.usuarios (id, email, rol, activo)
VALUES (
    '2f2a5d8d-6ce8-4ffb-a767-077d4c5736a6',
    'jrsepul2000@gmail.com',
    'Administrador',
    true
)
ON CONFLICT (id) 
DO UPDATE SET 
    rol = 'Administrador',
    activo = true;

-- Verificar que se creó correctamente
SELECT 
    id, 
    email, 
    rol, 
    activo,
    '✅ Usuario creado como Administrador' as resultado
FROM public.usuarios 
WHERE id = '2f2a5d8d-6ce8-4ffb-a767-077d4c5736a6';

-- ============================================
-- AHORA:
-- 1. Recarga la aplicación (Ctrl/Cmd + R)
-- 2. Haz login con jrsepul2000@gmail.com
-- 3. Deberías poder acceder sin problemas
-- ============================================
