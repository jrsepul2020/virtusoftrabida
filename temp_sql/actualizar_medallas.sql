-- ================================================================
-- ACTUALIZAR CONFIGURACIÓN DE MEDALLAS
-- Ejecutar en Supabase SQL Editor
-- ================================================================

-- Primero eliminar la configuración existente
DELETE FROM configuracion_medallas;

-- Insertar la nueva configuración con los valores correctos
INSERT INTO configuracion_medallas (medalla, puntuacion_minima, puntuacion_maxima, color_hex, orden, activo) VALUES
  ('Gran Oro', 94.00, 100.00, '#B8860B', 1, true),
  ('Oro', 90.00, 93.99, '#FFD700', 2, true),
  ('Plata', 87.00, 89.99, '#C0C0C0', 3, true);

-- Verificar la configuración
SELECT * FROM configuracion_medallas ORDER BY orden;

-- ================================================================
-- NOTA: Después de ejecutar esto, recarga la página de Puntuaciones
-- para ver los nuevos valores.
-- ================================================================
