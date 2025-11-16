-- Crear tabla dispositivos para registro automático de tablets
CREATE TABLE IF NOT EXISTS public.dispositivos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_fingerprint TEXT NOT NULL UNIQUE,
  tablet_number INTEGER NOT NULL CHECK (tablet_number >= 1 AND tablet_number <= 25),
  device_info JSONB,
  nombre_asignado TEXT,
  first_registered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_dispositivos_fingerprint ON public.dispositivos(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_dispositivos_tablet_number ON public.dispositivos(tablet_number);

-- Asegurar que no haya dos dispositivos con el mismo número de tablet activos
CREATE UNIQUE INDEX IF NOT EXISTS idx_dispositivos_unique_tablet 
ON public.dispositivos(tablet_number) 
WHERE activo = true;

-- Deshabilitar RLS para acceso público
ALTER TABLE public.dispositivos DISABLE ROW LEVEL SECURITY;

-- Comentarios
COMMENT ON TABLE public.dispositivos IS 'Registro de tablets/dispositivos para identificación automática';
COMMENT ON COLUMN public.dispositivos.device_fingerprint IS 'Huella digital única del dispositivo basada en características del navegador';
COMMENT ON COLUMN public.dispositivos.tablet_number IS 'Número asignado a la tablet (1-25)';
COMMENT ON COLUMN public.dispositivos.device_info IS 'Información técnica del dispositivo (User Agent, resolución, etc.)';
COMMENT ON COLUMN public.dispositivos.nombre_asignado IS 'Nombre o descripción asignada al dispositivo';
