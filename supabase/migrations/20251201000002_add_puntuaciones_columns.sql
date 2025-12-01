-- Migration: Add p1-p5 columns to muestras for manual scoring
-- Created: 2025-12-01
-- Description: Adds 5 individual score columns for manual scoring by admin

-- Add scoring columns to muestras table
ALTER TABLE muestras 
  ADD COLUMN IF NOT EXISTS p1 DECIMAL(5,2) CHECK (p1 >= 0 AND p1 <= 100),
  ADD COLUMN IF NOT EXISTS p2 DECIMAL(5,2) CHECK (p2 >= 0 AND p2 <= 100),
  ADD COLUMN IF NOT EXISTS p3 DECIMAL(5,2) CHECK (p3 >= 0 AND p3 <= 100),
  ADD COLUMN IF NOT EXISTS p4 DECIMAL(5,2) CHECK (p4 >= 0 AND p4 <= 100),
  ADD COLUMN IF NOT EXISTS p5 DECIMAL(5,2) CHECK (p5 >= 0 AND p5 <= 100);

-- Ensure puntuacion_total, medalla, num_puntuaciones, catada columns exist
ALTER TABLE muestras 
  ADD COLUMN IF NOT EXISTS puntuacion_total DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS medalla VARCHAR(20),
  ADD COLUMN IF NOT EXISTS num_puntuaciones INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS catada BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN muestras.p1 IS 'Puntuación del catador 1 (0-100)';
COMMENT ON COLUMN muestras.p2 IS 'Puntuación del catador 2 (0-100)';
COMMENT ON COLUMN muestras.p3 IS 'Puntuación del catador 3 (0-100)';
COMMENT ON COLUMN muestras.p4 IS 'Puntuación del catador 4 (0-100)';
COMMENT ON COLUMN muestras.p5 IS 'Puntuación del catador 5 (0-100)';
