-- ============================================
-- SOLUCIÓN RÁPIDA: Acceso Inmediato
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- OPCIÓN A: Activar todos los dispositivos existentes
UPDATE dispositivos 
SET activo = true 
WHERE activo = false;

SELECT 'Dispositivos activados:' as resultado, COUNT(*) as total 
FROM dispositivos WHERE activo = true;

-- ============================================
-- OPCIÓN B: Eliminar todos los dispositivos
-- (Forzará el bypass del primer admin)
-- ============================================

-- ⚠️ DESCOMENTA SOLO SI QUIERES ESTA OPCIÓN:
-- DELETE FROM dispositivos;
-- SELECT 'Dispositivos eliminados - próximo login será primer admin' as resultado;

-- ============================================
-- OPCIÓN C: Verificar y crear usuario admin
-- ============================================

-- 1. Ver usuarios actuales
SELECT id, email, rol, activo FROM usuarios;

-- 2. Actualizar usuario existente a admin (REEMPLAZA el ID)
-- UPDATE usuarios 
-- SET rol = 'Administrador', activo = true 
-- WHERE id = 'REEMPLAZA-CON-TU-USER-ID';

-- 3. O crear nuevo usuario admin (si no existe)
-- INSERT INTO usuarios (id, email, rol, activo)
-- VALUES (
--   'REEMPLAZA-CON-TU-USER-ID',
--   'admin@ejemplo.com',
--   'Administrador',
--   true
-- )
-- ON CONFLICT (id) DO UPDATE 
-- SET rol = 'Administrador', activo = true;

-- ============================================
-- OPCIÓN D: Desactivar RLS temporalmente
-- (NO RECOMENDADO EN PRODUCCIÓN)
-- ============================================

-- ALTER TABLE dispositivos DISABLE ROW LEVEL SECURITY;
-- SELECT 'RLS desactivado en dispositivos' as resultado;

-- ============================================
-- VERIFICACIÓN: Comprobar estado
-- ============================================

SELECT 
  'dispositivos' as tabla,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE activo = true) as activos,
  COUNT(*) FILTER (WHERE activo = false) as inactivos
FROM dispositivos

UNION ALL

SELECT 
  'usuarios' as tabla,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE rol = 'Administrador') as admins,
  COUNT(*) FILTER (WHERE activo = true) as activos
FROM usuarios;

-- ============================================
-- Ver información detallada
-- ============================================

SELECT 
  d.id,
  d.device_fingerprint,
  d.activo,
  d.nombre_asignado,
  d.tablet_number,
  u.email,
  u.rol
FROM dispositivos d
LEFT JOIN usuarios u ON d.user_id = u.id
ORDER BY d.created_at DESC;
