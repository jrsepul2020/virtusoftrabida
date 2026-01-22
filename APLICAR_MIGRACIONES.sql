-- ============================================
-- MIGRACIONES COMPLETAS - EJECUTAR EN ORDEN
-- Para aplicar en Supabase SQL Editor (local o producción)
-- ============================================

-- PASO 1: Verificar si la tabla dispositivos existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'dispositivos') THEN
        RAISE NOTICE 'Tabla dispositivos NO existe - creándola...';
        
        -- Crear tabla dispositivos
        CREATE TABLE public.dispositivos (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          device_fingerprint TEXT NOT NULL UNIQUE,
          tablet_number INTEGER CHECK (tablet_number >= 1 AND tablet_number <= 25),
          device_info JSONB,
          nombre_asignado TEXT,
          first_registered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          activo BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );

        -- Índices
        CREATE INDEX idx_dispositivos_fingerprint ON public.dispositivos(device_fingerprint);
        CREATE INDEX idx_dispositivos_tablet_number ON public.dispositivos(tablet_number);
        CREATE UNIQUE INDEX idx_dispositivos_unique_tablet 
        ON public.dispositivos(tablet_number) 
        WHERE activo = true AND tablet_number IS NOT NULL;

        -- Comentarios
        COMMENT ON TABLE public.dispositivos IS 'Registro de dispositivos para control de acceso';
        COMMENT ON COLUMN public.dispositivos.device_fingerprint IS 'SHA-256 hash del dispositivo';
        COMMENT ON COLUMN public.dispositivos.tablet_number IS 'Número de tablet (1-25), opcional';
        
        RAISE NOTICE 'Tabla dispositivos creada ✓';
    ELSE
        RAISE NOTICE 'Tabla dispositivos ya existe ✓';
    END IF;
END $$;

-- PASO 2: Agregar columna user_id si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'dispositivos' 
        AND column_name = 'user_id'
    ) THEN
        RAISE NOTICE 'Agregando columna user_id...';
        
        ALTER TABLE public.dispositivos 
        ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        
        CREATE INDEX idx_dispositivos_user_id ON public.dispositivos(user_id);
        
        RAISE NOTICE 'Columna user_id agregada ✓';
    ELSE
        RAISE NOTICE 'Columna user_id ya existe ✓';
    END IF;
END $$;

-- PASO 3: Hacer tablet_number nullable
DO $$ 
BEGIN
    ALTER TABLE public.dispositivos 
    ALTER COLUMN tablet_number DROP NOT NULL;
    
    RAISE NOTICE 'tablet_number ahora es nullable ✓';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'tablet_number ya era nullable o no existe';
END $$;

-- PASO 4: Habilitar RLS
ALTER TABLE public.dispositivos ENABLE ROW LEVEL SECURITY;

-- PASO 5: Eliminar policies antiguas
DROP POLICY IF EXISTS "dispositivos_auth_all" ON public.dispositivos;
DROP POLICY IF EXISTS "dispositivos_insert" ON public.dispositivos;
DROP POLICY IF EXISTS "dispositivos_select" ON public.dispositivos;
DROP POLICY IF EXISTS "dispositivos_update" ON public.dispositivos;
DROP POLICY IF EXISTS "dispositivos_delete" ON public.dispositivos;

-- PASO 6: Crear policies nuevas
-- INSERT: Usuarios autenticados pueden insertar sus propios dispositivos
CREATE POLICY "dispositivos_insert" ON public.dispositivos
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = user_id::text OR user_id IS NULL);

-- SELECT: Usuarios ven sus dispositivos, admins ven todos
CREATE POLICY "dispositivos_select" ON public.dispositivos
FOR SELECT
TO authenticated
USING (
  auth.uid()::text = user_id::text
  OR EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE usuarios.id::text = auth.uid()::text
    AND usuarios.rol IN ('Administrador', 'Presidente', 'Supervisor')
  )
);

-- UPDATE: Usuarios actualizan sus dispositivos, admins todos
CREATE POLICY "dispositivos_update" ON public.dispositivos
FOR UPDATE
TO authenticated
USING (
  auth.uid()::text = user_id::text
  OR EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE usuarios.id::text = auth.uid()::text
    AND usuarios.rol IN ('Administrador', 'Presidente', 'Supervisor')
  )
)
WITH CHECK (
  auth.uid()::text = user_id::text
  OR EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE usuarios.id::text = auth.uid()::text
    AND usuarios.rol IN ('Administrador', 'Presidente', 'Supervisor')
  )
);

-- DELETE: Solo admins pueden eliminar
CREATE POLICY "dispositivos_delete" ON public.dispositivos
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE usuarios.id::text = auth.uid()::text
    AND usuarios.rol IN ('Administrador', 'Presidente', 'Supervisor')
  )
);

-- PASO 7: Verificación final
SELECT 
    'dispositivos' as tabla,
    COUNT(*) as registros,
    COUNT(*) FILTER (WHERE activo = true) as activos,
    COUNT(*) FILTER (WHERE user_id IS NOT NULL) as con_usuario
FROM dispositivos;

SELECT 
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'dispositivos'
ORDER BY policyname;

-- ============================================
-- RESULTADO ESPERADO:
-- ✓ Tabla dispositivos existe
-- ✓ Columna user_id agregada
-- ✓ tablet_number es nullable
-- ✓ RLS habilitado
-- ✓ 4 policies creadas (insert, select, update, delete)
-- ============================================
