-- MIGRACIÓN MANUAL PARA MESAS Y CATADORES
-- Ejecuta este SQL en tu consola de Supabase (SQL Editor)

-- 1. Crear tabla de mesas
CREATE TABLE IF NOT EXISTS public.mesas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    numero INTEGER NOT NULL UNIQUE,
    nombre TEXT,
    capacidad INTEGER DEFAULT 8,
    ubicacion TEXT,
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Crear tabla de catadores  
CREATE TABLE IF NOT EXISTS public.catadores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre TEXT NOT NULL,
    rol TEXT,
    mesa INTEGER,
    puesto INTEGER CHECK (puesto >= 1 AND puesto <= 8),
    ntablet TEXT,
    estado TEXT DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo', 'presente', 'ausente')),
    email TEXT,
    telefono TEXT,
    especialidad TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_mesas_numero ON public.mesas(numero);
CREATE INDEX IF NOT EXISTS idx_catadores_nombre ON public.catadores(nombre);

-- 4. Deshabilitar RLS para acceso público (como en otras tablas)
ALTER TABLE public.mesas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.catadores DISABLE ROW LEVEL SECURITY;

-- 5. Insertar datos de ejemplo para mesas
INSERT INTO public.mesas (numero, nombre, capacidad, ubicacion) VALUES
(1, 'Mesa Principal', 8, 'Sala A'),
(2, 'Mesa Secundaria', 8, 'Sala A'),
(3, 'Mesa Terciaria', 6, 'Sala B'),
(4, 'Mesa Cuarta', 8, 'Sala B'),
(5, 'Mesa Quinta', 4, 'Sala C')
ON CONFLICT (numero) DO NOTHING;

-- 6. Insertar datos de ejemplo para catadores
INSERT INTO public.catadores (nombre, rol, mesa, puesto, ntablet, estado, email, especialidad) VALUES
('Ana García', 'Catador Principal', 1, 1, 'TAB001', 'presente', 'ana.garcia@email.com', 'Aceites Frutados'),
('Carlos López', 'Catador Principal', 1, 2, 'TAB002', 'presente', 'carlos.lopez@email.com', 'Aceites Suaves'),
('María Rodríguez', 'Presidente', 2, 1, 'TAB003', 'presente', 'maria.rodriguez@email.com', 'Aceites Intensos'),
('José Martínez', 'Catador Auxiliar', 2, 2, 'TAB004', 'ausente', 'jose.martinez@email.com', 'Aceites Ecológicos'),
('Laura Sánchez', 'Secretario', 3, 1, 'TAB005', 'presente', 'laura.sanchez@email.com', 'Aceites Premium'),
('Antonio Ruiz', 'Observador', 3, 2, 'TAB006', 'presente', 'antonio.ruiz@email.com', 'Análisis Sensorial')
ON CONFLICT DO NOTHING;