-- Crear tabla de mesas
CREATE TABLE IF NOT EXISTS public.mesas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    numero INTEGER NOT NULL UNIQUE,
    nombre TEXT,
    capacidad INTEGER DEFAULT 8,
    ubicacion TEXT,
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Crear tabla de catadores  
CREATE TABLE IF NOT EXISTS public.catadores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre TEXT NOT NULL,
    email TEXT,
    telefono TEXT,
    especialidad TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Crear tabla de asignaciones (relación catador-mesa-puesto)
CREATE TABLE IF NOT EXISTS public.asignaciones_mesas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    catador_id UUID REFERENCES public.catadores(id) ON DELETE CASCADE,
    mesa_id UUID REFERENCES public.mesas(id) ON DELETE CASCADE,
    puesto INTEGER NOT NULL CHECK (puesto >= 1 AND puesto <= 8),
    fecha_asignacion TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    activa BOOLEAN DEFAULT true,
    UNIQUE(mesa_id, puesto, activa) WHERE activa = true
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_mesas_numero ON public.mesas(numero);
CREATE INDEX IF NOT EXISTS idx_catadores_nombre ON public.catadores(nombre);
CREATE INDEX IF NOT EXISTS idx_asignaciones_mesa_puesto ON public.asignaciones_mesas(mesa_id, puesto);
CREATE INDEX IF NOT EXISTS idx_asignaciones_catador ON public.asignaciones_mesas(catador_id);

-- Deshabilitar RLS para acceso público (como en otras tablas)
ALTER TABLE public.mesas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.catadores DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.asignaciones_mesas DISABLE ROW LEVEL SECURITY;

-- Insertar datos de ejemplo
INSERT INTO public.mesas (numero, nombre, capacidad, ubicacion) VALUES
(1, 'Mesa Principal', 8, 'Sala A'),
(2, 'Mesa Secundaria', 8, 'Sala A'),
(3, 'Mesa Terciaria', 6, 'Sala B'),
(4, 'Mesa Cuarta', 8, 'Sala B'),
(5, 'Mesa Quinta', 4, 'Sala C')
ON CONFLICT (numero) DO NOTHING;

INSERT INTO public.catadores (nombre, email, especialidad) VALUES
('Ana García', 'ana.garcia@email.com', 'Aceites Frutados'),
('Carlos López', 'carlos.lopez@email.com', 'Aceites Suaves'),
('María Rodríguez', 'maria.rodriguez@email.com', 'Aceites Intensos'),
('José Martínez', 'jose.martinez@email.com', 'Aceites Ecológicos'),
('Laura Sánchez', 'laura.sanchez@email.com', 'Aceites Premium'),
('Antonio Ruiz', 'antonio.ruiz@email.com', 'Análisis Sensorial')
ON CONFLICT DO NOTHING;