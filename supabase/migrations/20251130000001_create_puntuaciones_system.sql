-- Migration: Create scoring system for wine tasting
-- Created: 2025-11-30
-- Description: Creates tables and triggers for the wine tasting scoring system

-- 1. Create puntuaciones_catadores table
CREATE TABLE IF NOT EXISTS puntuaciones_catadores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  muestra_id INTEGER NOT NULL REFERENCES muestras(id) ON DELETE CASCADE,
  catador_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE SET NULL,
  mesa_id INTEGER REFERENCES mesas(id) ON DELETE SET NULL,
  puntuacion DECIMAL(4,2) NOT NULL CHECK (puntuacion >= 0 AND puntuacion <= 100),
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Each catador scores each sample only once
  CONSTRAINT unique_catador_muestra UNIQUE(muestra_id, catador_id)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_puntuaciones_muestra_id ON puntuaciones_catadores(muestra_id);
CREATE INDEX IF NOT EXISTS idx_puntuaciones_catador_id ON puntuaciones_catadores(catador_id);
CREATE INDEX IF NOT EXISTS idx_puntuaciones_mesa_id ON puntuaciones_catadores(mesa_id);

-- 2. Add scoring fields to muestras table
ALTER TABLE muestras 
  ADD COLUMN IF NOT EXISTS puntuacion_total DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS medalla VARCHAR(20),
  ADD COLUMN IF NOT EXISTS num_puntuaciones INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS catada BOOLEAN DEFAULT FALSE;

-- Index for medal queries
CREATE INDEX IF NOT EXISTS idx_muestras_medalla ON muestras(medalla) WHERE medalla IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_muestras_catada ON muestras(catada) WHERE catada = TRUE;

-- 3. Create configuracion_medallas table
CREATE TABLE IF NOT EXISTS configuracion_medallas (
  id SERIAL PRIMARY KEY,
  medalla VARCHAR(20) NOT NULL UNIQUE,
  puntuacion_minima DECIMAL(5,2) NOT NULL,
  puntuacion_maxima DECIMAL(5,2) NOT NULL,
  color_hex VARCHAR(7) NOT NULL,
  orden INTEGER NOT NULL,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT check_puntuacion_range CHECK (puntuacion_minima >= 0 AND puntuacion_maxima <= 100 AND puntuacion_minima < puntuacion_maxima)
);

-- Insert default medal configuration
INSERT INTO configuracion_medallas (medalla, puntuacion_minima, puntuacion_maxima, color_hex, orden) VALUES
  ('Gran Oro', 94.00, 100.00, '#B8860B', 1),
  ('Oro', 90.00, 93.99, '#FFD700', 2),
  ('Plata', 87.00, 89.99, '#C0C0C0', 3)
ON CONFLICT (medalla) DO NOTHING;

-- 4. Create function to calculate average and assign medal
CREATE OR REPLACE FUNCTION calcular_puntuacion_y_medalla()
RETURNS TRIGGER AS $$
DECLARE
  v_promedio DECIMAL(5,2);
  v_count INTEGER;
  v_medalla VARCHAR(20);
BEGIN
  -- Count total scores for this sample
  SELECT COUNT(*), AVG(puntuacion)
  INTO v_count, v_promedio
  FROM puntuaciones_catadores
  WHERE muestra_id = NEW.muestra_id;

  -- Update muestras table
  UPDATE muestras
  SET 
    num_puntuaciones = v_count,
    puntuacion_total = v_promedio,
    catada = (v_count >= 5),
    medalla = CASE
      WHEN v_count >= 5 THEN (
        SELECT m.medalla
        FROM configuracion_medallas m
        WHERE m.activo = TRUE
          AND v_promedio >= m.puntuacion_minima
          AND v_promedio <= m.puntuacion_maxima
        ORDER BY m.orden
        LIMIT 1
      )
      ELSE NULL
    END,
    updated_at = NOW()
  WHERE id = NEW.muestra_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create trigger for automatic calculation
DROP TRIGGER IF EXISTS trigger_calcular_puntuacion ON puntuaciones_catadores;
CREATE TRIGGER trigger_calcular_puntuacion
  AFTER INSERT OR UPDATE OR DELETE ON puntuaciones_catadores
  FOR EACH ROW
  EXECUTE FUNCTION calcular_puntuacion_y_medalla();

-- 6. Create function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Apply timestamp trigger to tables
DROP TRIGGER IF EXISTS update_puntuaciones_updated_at ON puntuaciones_catadores;
CREATE TRIGGER update_puntuaciones_updated_at
  BEFORE UPDATE ON puntuaciones_catadores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_config_medallas_updated_at ON configuracion_medallas;
CREATE TRIGGER update_config_medallas_updated_at
  BEFORE UPDATE ON configuracion_medallas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 8. Enable RLS
ALTER TABLE puntuaciones_catadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion_medallas ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies for puntuaciones_catadores
-- Catadores can read their own scores
CREATE POLICY "Catadores can view their own scores"
  ON puntuaciones_catadores
  FOR SELECT
  USING (
    auth.uid()::text IN (SELECT id FROM usuarios WHERE id = catador_id)
    OR
    auth.uid()::text IN (SELECT id FROM usuarios WHERE rol = 'admin')
  );

-- Catadores can insert their own scores
CREATE POLICY "Catadores can insert their own scores"
  ON puntuaciones_catadores
  FOR INSERT
  WITH CHECK (
    auth.uid()::text = catador_id
  );

-- Catadores can update their own scores (within time limit if needed)
CREATE POLICY "Catadores can update their own scores"
  ON puntuaciones_catadores
  FOR UPDATE
  USING (auth.uid()::text = catador_id)
  WITH CHECK (auth.uid()::text = catador_id);

-- Admins have full access
CREATE POLICY "Admins have full access to scores"
  ON puntuaciones_catadores
  FOR ALL
  USING (auth.uid()::text IN (SELECT id FROM usuarios WHERE rol = 'admin'));

-- 10. RLS Policies for configuracion_medallas
-- Everyone can read medal configuration
CREATE POLICY "Everyone can view medal configuration"
  ON configuracion_medallas
  FOR SELECT
  USING (TRUE);

-- Only admins can modify medal configuration
CREATE POLICY "Only admins can modify medal configuration"
  ON configuracion_medallas
  FOR ALL
  USING (auth.uid()::text IN (SELECT id FROM usuarios WHERE rol = 'admin'));

-- 11. Create view for scoring summary
CREATE OR REPLACE VIEW vista_puntuaciones_resumen AS
SELECT 
  m.id AS muestra_id,
  m.codigo,
  m.codigotexto,
  m.nombre,
  m.categoria,
  m.num_puntuaciones,
  m.puntuacion_total,
  m.medalla,
  m.catada,
  e.name AS empresa_nombre,
  COALESCE(
    json_agg(
      json_build_object(
        'catador_id', p.catador_id,
        'catador_nombre', c.nombre,
        'puntuacion', p.puntuacion,
        'notas', p.notas,
        'created_at', p.created_at
      ) ORDER BY p.created_at
    ) FILTER (WHERE p.id IS NOT NULL),
    '[]'::json
  ) AS puntuaciones_detalle
FROM muestras m
LEFT JOIN empresas e ON m.empresa_id = e.id
LEFT JOIN puntuaciones_catadores p ON m.id = p.muestra_id
LEFT JOIN usuarios c ON p.catador_id = c.id
GROUP BY m.id, m.codigo, m.codigotexto, m.nombre, m.categoria, m.num_puntuaciones, 
         m.puntuacion_total, m.medalla, m.catada, e.name;

-- Grant access to view
GRANT SELECT ON vista_puntuaciones_resumen TO authenticated;

COMMENT ON TABLE puntuaciones_catadores IS 'Stores individual scores from each catador for each sample';
COMMENT ON TABLE configuracion_medallas IS 'Configurable medal criteria based on score ranges';
COMMENT ON COLUMN muestras.puntuacion_total IS 'Average score from all catadores (calculated automatically)';
COMMENT ON COLUMN muestras.medalla IS 'Medal awarded based on puntuacion_total and configuracion_medallas';
COMMENT ON COLUMN muestras.num_puntuaciones IS 'Number of scores received';
COMMENT ON COLUMN muestras.catada IS 'TRUE when sample has received 5 or more scores';
