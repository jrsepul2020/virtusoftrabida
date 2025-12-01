-- Migration: Create muestras_mesas table
-- Created: 2025-12-01
-- Description: Creates table for assigning samples to mesas for tasting

-- 1. Create muestras_mesas table
CREATE TABLE IF NOT EXISTS muestras_mesas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  muestra_id INTEGER NOT NULL REFERENCES muestras(id) ON DELETE CASCADE,
  mesa_id INTEGER NOT NULL REFERENCES mesas(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Each sample can be assigned to each mesa only once
  CONSTRAINT unique_muestra_mesa UNIQUE(muestra_id, mesa_id)
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_muestras_mesas_muestra_id ON muestras_mesas(muestra_id);
CREATE INDEX IF NOT EXISTS idx_muestras_mesas_mesa_id ON muestras_mesas(mesa_id);

-- 2. Create function to update timestamp
CREATE OR REPLACE FUNCTION update_muestras_mesas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Apply timestamp trigger
DROP TRIGGER IF EXISTS update_muestras_mesas_updated_at ON muestras_mesas;
CREATE TRIGGER update_muestras_mesas_updated_at
  BEFORE UPDATE ON muestras_mesas
  FOR EACH ROW
  EXECUTE FUNCTION update_muestras_mesas_updated_at();

-- 4. Enable RLS
ALTER TABLE muestras_mesas ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Catadores can view assignments for their mesa" ON muestras_mesas;
DROP POLICY IF EXISTS "Admins can insert assignments" ON muestras_mesas;
DROP POLICY IF EXISTS "Admins can update assignments" ON muestras_mesas;
DROP POLICY IF EXISTS "Admins can delete assignments" ON muestras_mesas;

-- 5. RLS Policies for muestras_mesas
-- Catadores can view assignments for their mesa
CREATE POLICY "Catadores can view assignments for their mesa"
  ON muestras_mesas
  FOR SELECT
  USING (
    auth.uid()::text IN (
      SELECT u.id 
      FROM usuarios u
      WHERE u.rol = 'admin'
    )
    OR
    auth.uid()::text IN (
      SELECT id FROM usuarios WHERE rol = 'catador'
    )
  );

-- Only admins can insert/update/delete assignments
CREATE POLICY "Admins can insert assignments"
  ON muestras_mesas
  FOR INSERT
  WITH CHECK (auth.uid()::text IN (SELECT id FROM usuarios WHERE rol = 'admin'));

CREATE POLICY "Admins can update assignments"
  ON muestras_mesas
  FOR UPDATE
  USING (auth.uid()::text IN (SELECT id FROM usuarios WHERE rol = 'admin'));

CREATE POLICY "Admins can delete assignments"
  ON muestras_mesas
  FOR DELETE
  USING (auth.uid()::text IN (SELECT id FROM usuarios WHERE rol = 'admin'));

-- 6. Grant access
GRANT SELECT, INSERT, UPDATE, DELETE ON muestras_mesas TO authenticated;

COMMENT ON TABLE muestras_mesas IS 'Stores assignment of samples (muestras) to mesas for tasting';
COMMENT ON COLUMN muestras_mesas.muestra_id IS 'Reference to the sample to be tasted';
COMMENT ON COLUMN muestras_mesas.mesa_id IS 'Reference to the mesa where sample will be tasted';
