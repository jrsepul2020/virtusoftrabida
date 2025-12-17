/*
  Add ON DELETE CASCADE constraints for related tables to avoid orphaned records.

  This migration is defensive: each ALTER runs only if the referenced table/column
  exists and the constraint is not already present.

  Targets (best-effort):
  - muestras.empresa_id -> empresas.id
  - puntuaciones.muestra_id -> muestras.id
  - muestras_mesas.muestra_uuid -> muestras.id (if UUID)
  - tanda_muestras.muestra_uuid -> muestras.id

  Review before applying to production and backup the DB.
*/

-- Add FK: muestras.empresa_id -> empresas.id ON DELETE CASCADE
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables t
    JOIN information_schema.columns c ON c.table_name = t.table_name
    WHERE t.table_name = 'muestras' AND c.column_name = 'empresa_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables t WHERE t.table_name = 'empresas'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = 'muestras'
      AND tc.constraint_name = 'fk_muestras_empresa'
    ) THEN
      ALTER TABLE muestras
      ADD CONSTRAINT fk_muestras_empresa FOREIGN KEY (empresa_id)
        REFERENCES empresas(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Add FK: puntuaciones.muestra_id -> muestras.id ON DELETE CASCADE
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables t
    JOIN information_schema.columns c ON c.table_name = t.table_name
    WHERE t.table_name = 'puntuaciones' AND c.column_name = 'muestra_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables t WHERE t.table_name = 'muestras'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = 'puntuaciones'
      AND tc.constraint_name = 'fk_puntuaciones_muestra'
    ) THEN
      ALTER TABLE puntuaciones
      ADD CONSTRAINT fk_puntuaciones_muestra FOREIGN KEY (muestra_id)
        REFERENCES muestras(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Add FK: muestras_mesas.muestra_uuid -> muestras(id) ON DELETE CASCADE (if column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables t
    JOIN information_schema.columns c ON c.table_name = t.table_name
    WHERE t.table_name = 'muestras_mesas' AND c.column_name = 'muestra_uuid'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables t WHERE t.table_name = 'muestras'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = 'muestras_mesas'
      AND tc.constraint_name = 'fk_muestras_mesas_muestra'
    ) THEN
      ALTER TABLE muestras_mesas
      ADD CONSTRAINT fk_muestras_mesas_muestra FOREIGN KEY (muestra_uuid)
        REFERENCES muestras(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Add FK: tanda_muestras.muestra_uuid -> muestras(id) ON DELETE CASCADE
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables t
    JOIN information_schema.columns c ON c.table_name = t.table_name
    WHERE t.table_name = 'tanda_muestras' AND c.column_name = 'muestra_uuid'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables t WHERE t.table_name = 'muestras'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = 'tanda_muestras'
      AND tc.constraint_name = 'fk_tanda_muestras_muestra'
    ) THEN
      ALTER TABLE tanda_muestras
      ADD CONSTRAINT fk_tanda_muestras_muestra FOREIGN KEY (muestra_uuid)
        REFERENCES muestras(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

/*
  Notes:
  - This migration only *adds* constraints when safe to do so. It does not drop
    or modify existing constraints.
  - If your schema uses different column names/types (e.g., integer IDs), review
    and adapt accordingly before applying.
  - Make a DB backup before running in production.
*/
