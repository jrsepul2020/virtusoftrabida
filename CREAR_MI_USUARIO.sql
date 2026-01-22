-- ============================================
-- CREAR TU USUARIO COMO ADMIN
-- Ejecutar en Supabase SQL Editor
-- REEMPLAZA el email con el tuyo
-- ============================================

-- Primero, ver qué usuarios existen en auth
SELECT id, email FROM auth.users;

-- Copia tu ID de la consulta anterior y úsalo aquí:
-- REEMPLAZA 'TU-USER-ID-AQUI' con el ID real

INSERT INTO public.usuarios (id, email, rol, activo)
VALUES (
    'TU-USER-ID-AQUI'::uuid,  -- ← CAMBIAR ESTO
    'tu-email@ejemplo.com',    -- ← CAMBIAR ESTO
    'Administrador',
    true
)
ON CONFLICT (id) 
DO UPDATE SET 
    rol = 'Administrador',
    activo = true;

-- Verificar que se creó
SELECT id, email, rol, activo 
FROM public.usuarios 
WHERE email = 'tu-email@ejemplo.com';  -- ← CAMBIAR ESTO

-- ============================================
-- Ahora recarga la app e intenta hacer login
-- ============================================
