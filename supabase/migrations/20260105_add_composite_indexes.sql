/*
  # Añadir Índices Compuestos para Optimización de Performance
  
  Fecha: 2026-01-05
  Descripción: Añade índices compuestos en columnas frecuentemente consultadas juntas
               para mejorar performance de queries comunes.
*/

-- ==========================================
-- ÍNDICES COMPUESTOS PARA MUESTRAS
-- ==========================================

-- Detectar columna FK de empresa en muestras (puede ser empresa_id o ididempresa o company_id según migraciones antiguas)
DO $$
DECLARE
  empresa_fk_col text;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'muestras' AND column_name = 'empresa_id'
  ) THEN
    empresa_fk_col := 'empresa_id';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'muestras' AND column_name = 'ididempresa'
  ) THEN
    empresa_fk_col := 'ididempresa';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'muestras' AND column_name = 'company_id'
  ) THEN
    empresa_fk_col := 'company_id';
  ELSE
    RAISE EXCEPTION 'No se encontró columna de empresa en public.muestras (empresa_id / ididempresa / company_id)';
  END IF;

  -- Búsqueda de muestras por empresa y código (muy común en listados)
  EXECUTE format(
    'CREATE INDEX IF NOT EXISTS idx_muestras_empresa_codigo ON public.muestras(%I, codigo)',
    empresa_fk_col
  );

  -- Búsqueda de muestras por empresa y catada (si existe la columna catada)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'muestras' AND column_name = 'catada'
  ) THEN
    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS idx_muestras_empresa_catada ON public.muestras(%I, catada) WHERE catada = true',
      empresa_fk_col
    );
  END IF;
END $$;

-- Búsqueda de muestras por empresa y catada (si existe la columna catada)
-- (se crea arriba dentro del bloque que detecta empresa_fk_col)

-- Búsqueda de muestras por categoría y medalla (para resultados) si existen columnas
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'muestras' AND column_name = 'categoria'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'muestras' AND column_name = 'medalla'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_muestras_categoria_medalla ON public.muestras(categoria, medalla) WHERE medalla IS NOT NULL';
  END IF;
END $$;

-- Búsqueda de muestras por tanda (para gestión de tandas) si existe columna tanda
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'muestras' AND column_name = 'tanda'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_muestras_tanda_codigo ON public.muestras(tanda, codigo) WHERE tanda IS NOT NULL';
  END IF;
END $$;

-- ==========================================
-- ÍNDICES COMPUESTOS PARA PUNTUACIONES
-- ==========================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'puntuaciones_catadores') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_puntuaciones_muestra_catador ON public.puntuaciones_catadores(muestra_id, catador_id)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_puntuaciones_catador_created ON public.puntuaciones_catadores(catador_id, created_at DESC)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_puntuaciones_mesa_created ON public.puntuaciones_catadores(mesa_id, created_at DESC) WHERE mesa_id IS NOT NULL';
  END IF;
END $$;

-- ==========================================
-- ÍNDICES COMPUESTOS PARA EMPRESAS
-- ==========================================

-- Status + fecha (listados filtrados) si existe columna status
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'empresas' AND column_name = 'status'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_empresas_status_created ON public.empresas(status, created_at DESC)';
  END IF;
END $$;

-- País + fecha (estadísticas) si existe pais
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'empresas' AND column_name = 'pais'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_empresas_pais_created ON public.empresas(pais, created_at DESC) WHERE pais IS NOT NULL';
  END IF;
END $$;

-- Pedido (búsquedas rápidas) si existe pedido
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'empresas' AND column_name = 'pedido'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_empresas_pedido ON public.empresas(pedido) WHERE pedido IS NOT NULL';
  END IF;
END $$;

-- ==========================================
-- ÍNDICES PARA ASIGNACIONES DE MESAS
-- ==========================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'asignaciones_mesas') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_asignaciones_mesa_activa ON public.asignaciones_mesas(mesa_id, activa) WHERE activa = true';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_asignaciones_catador_activa ON public.asignaciones_mesas(catador_id, activa) WHERE activa = true';
  END IF;
END $$;

-- ==========================================
-- ÍNDICES PARA USUARIOS
-- ==========================================

-- Email para login (si existe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'usuarios' AND column_name = 'email'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_usuarios_email ON public.usuarios(email) WHERE email IS NOT NULL';
  END IF;
END $$;

-- Rol (si existe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'usuarios' AND column_name = 'rol'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON public.usuarios(rol)';
  END IF;
END $$;

-- ==========================================
-- ÍNDICES PARA DISPOSITIVOS
-- ==========================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'dispositivos') THEN
    -- El esquema real usa device_fingerprint (no device_id) y activo (no autorizado)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'dispositivos' AND column_name = 'device_fingerprint'
    ) THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS idx_dispositivos_fingerprint ON public.dispositivos(device_fingerprint)';
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'dispositivos' AND column_name = 'tablet_number'
    ) THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS idx_dispositivos_tablet_number ON public.dispositivos(tablet_number)';
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'dispositivos' AND column_name = 'activo'
    ) THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS idx_dispositivos_activo ON public.dispositivos(activo) WHERE activo = true';
    END IF;
  END IF;
END $$;

-- ==========================================
-- ANALYZE (actualizar estadísticas)
-- ==========================================

ANALYZE public.empresas;
ANALYZE public.muestras;
ANALYZE public.usuarios;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'puntuaciones_catadores') THEN
    EXECUTE 'ANALYZE public.puntuaciones_catadores';
  END IF;
END $$;

-- ==========================================
-- VERIFICACIÓN: mostrar índices principales
-- ==========================================

SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('empresas', 'muestras', 'usuarios', 'puntuaciones_catadores')
ORDER BY tablename, indexname;


