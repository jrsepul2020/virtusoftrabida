-- Crear tabla de configuración
CREATE TABLE IF NOT EXISTS public.configuracion (
  clave TEXT PRIMARY KEY,
  valor TEXT NOT NULL,
  descripcion TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Deshabilitar RLS para acceso público
ALTER TABLE public.configuracion DISABLE ROW LEVEL SECURITY;

-- Insertar configuración inicial
INSERT INTO public.configuracion (clave, valor, descripcion) 
VALUES ('numero_mesas', '5', 'Número total de mesas disponibles')
ON CONFLICT (clave) DO NOTHING;

-- Índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_configuracion_clave ON public.configuracion(clave);
