-- SCRIPT SIMPLE PARA CREAR TABLAS
-- Copia y pega en SQL Editor de Supabase

-- Eliminar tablas si existen (opcional, solo si quieres empezar limpio)
-- DROP TABLE IF EXISTS public.catadores CASCADE;
-- DROP TABLE IF EXISTS public.mesas CASCADE;

-- Crear tabla mesas
CREATE TABLE public.mesas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    numero INTEGER NOT NULL UNIQUE,
    nombre TEXT,
    capacidad INTEGER DEFAULT 8,
    ubicacion TEXT,
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear tabla catadores con nuevos campos
CREATE TABLE public.catadores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre TEXT NOT NULL,
    rol TEXT,
    mesa INTEGER,
    puesto INTEGER,
    ntablet TEXT,
    estado TEXT DEFAULT 'activo',
    email TEXT,
    telefono TEXT,
    especialidad TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Deshabilitar RLS
ALTER TABLE public.mesas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.catadores DISABLE ROW LEVEL SECURITY;

-- Insertar datos de prueba para mesas
INSERT INTO public.mesas (numero, nombre, capacidad, ubicacion) VALUES
(1, 'Mesa Principal', 8, 'Sala A'),
(2, 'Mesa Secundaria', 8, 'Sala A'),
(3, 'Mesa Terciaria', 6, 'Sala B'),
(4, 'Mesa Cuarta', 8, 'Sala B'),
(5, 'Mesa Quinta', 4, 'Sala C');

-- Insertar datos de prueba para catadores
INSERT INTO public.catadores (nombre, rol, mesa, puesto, ntablet, estado, email, especialidad) VALUES
('Ana García', 'Catador Principal', 1, 1, 'TAB001', 'presente', 'ana.garcia@email.com', 'Aceites Frutados'),
('Carlos López', 'Catador Principal', 1, 2, 'TAB002', 'presente', 'carlos.lopez@email.com', 'Aceites Suaves'),
('María Rodríguez', 'Presidente', 2, 1, 'TAB003', 'presente', 'maria.rodriguez@email.com', 'Aceites Intensos'),
('José Martínez', 'Catador Auxiliar', 2, 2, 'TAB004', 'ausente', 'jose.martinez@email.com', 'Aceites Ecológicos'),
('Laura Sánchez', 'Secretario', 3, 1, 'TAB005', 'presente', 'laura.sanchez@email.com', 'Aceites Premium'),
('Antonio Ruiz', 'Observador', 3, 2, 'TAB006', 'presente', 'antonio.ruiz@email.com', 'Análisis Sensorial');