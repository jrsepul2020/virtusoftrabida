-- ============================================
-- CREAR TABLA DISPOSITIVOS - PASO 1
-- Ejecutar PRIMERO antes de las políticas
-- ============================================

-- Crear tabla dispositivos
CREATE TABLE IF NOT EXISTS public.dispositivos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_fingerprint TEXT NOT NULL UNIQUE,
  user_id UUID,
  tablet_number INTEGER CHECK (tablet_number >= 1 AND tablet_number <= 25),
  device_info JSONB,
  nombre_asignado TEXT,
  first_registered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  activo BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Agregar foreign key si auth.users existe
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    ALTER TABLE public.dispositivos 
    DROP CONSTRAINT IF EXISTS dispositivos_user_id_fkey;
    
    ALTER TABLE public.dispositivos
    ADD CONSTRAINT dispositivos_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_dispositivos_fingerprint ON public.dispositivos(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_dispositivos_user_id ON public.dispositivos(user_id);
CREATE INDEX IF NOT EXISTS idx_dispositivos_tablet_number ON public.dispositivos(tablet_number);

-- Índice único para tablet activas
DROP INDEX IF EXISTS idx_dispositivos_unique_tablet;
CREATE UNIQUE INDEX idx_dispositivos_unique_tablet 
ON public.dispositivos(tablet_number) 
WHERE activo = true AND tablet_number IS NOT NULL;

-- Comentarios
COMMENT ON TABLE public.dispositivos IS 'Registro de dispositivos para control de acceso';
COMMENT ON COLUMN public.dispositivos.device_fingerprint IS 'SHA-256 hash del dispositivo';
COMMENT ON COLUMN public.dispositivos.tablet_number IS 'Número de tablet (1-25), opcional';
COMMENT ON COLUMN public.dispositivos.user_id IS 'Usuario dueño del dispositivo';

-- Habilitar RLS
ALTER TABLE public.dispositivos ENABLE ROW LEVEL SECURITY;

-- Política permisiva (desarrollo local)
DROP POLICY IF EXISTS "dispositivos_all_authenticated" ON public.dispositivos;

CREATE POLICY "dispositivos_all_authenticated" ON public.dispositivos
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Verificar creación
SELECT 
    'dispositivos' as tabla_creada,
    COUNT(*) as registros_existentes
FROM public.dispositivos;

SELECT 
    tablename,
    policyname
FROM pg_policies 
WHERE tablename = 'dispositivos';

-- ✅ Listo para usar
