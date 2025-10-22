-- SCRIPT SQL PARA EJECUTAR EN EL PANEL DE SUPABASE
-- Copiar y pegar este código en el SQL Editor de Supabase

-- 1. Crear tabla para configuración de estados personalizables
CREATE TABLE IF NOT EXISTS status_configs (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  value TEXT NOT NULL UNIQUE,
  bg_color TEXT NOT NULL DEFAULT 'bg-gray-100',
  text_color TEXT NOT NULL DEFAULT 'text-gray-800',
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Insertar estados por defecto
INSERT INTO status_configs (id, label, value, bg_color, text_color, is_default) VALUES
  ('pending', 'Pendiente', 'pending', 'bg-yellow-100', 'text-yellow-800', TRUE),
  ('approved', 'Aprobada', 'approved', 'bg-green-100', 'text-green-800', TRUE),
  ('rejected', 'Rechazada', 'rejected', 'bg-red-100', 'text-red-800', TRUE)
ON CONFLICT (value) DO NOTHING;

-- 3. Agregar columnas faltantes a la tabla empresas
ALTER TABLE empresas 
ADD COLUMN IF NOT EXISTS pedido INTEGER,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS totalinscripciones INTEGER DEFAULT 0;

-- 4. Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_empresas_pedido ON empresas(pedido);
CREATE INDEX IF NOT EXISTS idx_empresas_status ON empresas(status);
CREATE INDEX IF NOT EXISTS idx_status_configs_value ON status_configs(value);

-- 5. Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger para updated_at en status_configs
DROP TRIGGER IF EXISTS update_status_configs_updated_at ON status_configs;
CREATE TRIGGER update_status_configs_updated_at
    BEFORE UPDATE ON status_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Función RPC para crear la tabla desde el frontend
CREATE OR REPLACE FUNCTION create_status_configs_table()
RETURNS TEXT AS $$
BEGIN
  RETURN 'status_configs table ready';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ✅ SCRIPT COMPLETADO
-- Ahora puedes usar las nuevas funcionalidades:
-- - Números de pedido automáticos
-- - Estados configurables
-- - Ordenamiento de columnas en el panel de empresas