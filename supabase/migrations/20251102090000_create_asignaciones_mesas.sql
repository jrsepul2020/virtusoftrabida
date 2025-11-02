
-- Renombrar tabla catadores a usuarios si existe
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'catadores') THEN
    ALTER TABLE public.catadores RENAME TO usuarios;
  END IF;
END $$;

-- Renombrar columna codigodecatador a codigocatador si existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'usuarios' AND column_name = 'codigodecatador'
  ) THEN
    ALTER TABLE public.usuarios RENAME COLUMN codigodecatador TO codigocatador;
  END IF;
END $$;

-- Crear tabla usuarios si no existe
CREATE TABLE IF NOT EXISTS public.usuarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  codigocatador TEXT,
  nombre TEXT NOT NULL,
  rol TEXT,
  mesa INTEGER,
  puesto INTEGER CHECK (puesto >= 1 AND puesto <= 8),
  tablet TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Deshabilitar RLS
ALTER TABLE public.usuarios DISABLE ROW LEVEL SECURITY;

-- Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_usuarios_nombre ON public.usuarios(nombre);
CREATE INDEX IF NOT EXISTS idx_usuarios_mesa ON public.usuarios(mesa);
