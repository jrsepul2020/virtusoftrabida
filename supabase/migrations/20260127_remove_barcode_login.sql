-- ============================================================
-- ELIMINAR SISTEMA DE LOGIN POR CÓDIGO DE BARRAS
-- ============================================================
-- Esta migración elimina la función RPC verify_barcode_user
-- que se utilizaba para autenticación por código de barras/pistola.
-- El campo 'codigo' en la tabla usuarios se mantiene por compatibilidad
-- pero ya no se utiliza para autenticación.

-- Eliminar función RPC de verificación por código de barras
DROP FUNCTION IF EXISTS verify_barcode_user(text);

-- Comentario informativo
COMMENT ON COLUMN public.usuarios.codigo IS 
  'Campo legacy - ya no se utiliza para autenticación. Mantenido por compatibilidad.';
