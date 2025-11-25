-- Migration: Convert integer FK columns (muestra_id) to uuid references to public.muestras(id)
-- Date: 2025-11-17
-- Purpose: Add uuid columns (muestra_uuid) to tables that currently store integer muestra_id,
-- populate them by matching the integer code to muestras.codigo, and add FK constraints to muestras(id).
-- IMPORTANT: This migration is **non-destructive**: it will NOT drop the old integer columns.
-- Run in STAGING first, verify the mapping counts, and only after manual verification consider dropping old columns.

BEGIN;

-- 1) Add uuid columns if not present
ALTER TABLE IF EXISTS public.catas
  ADD COLUMN IF NOT EXISTS muestra_uuid uuid;

ALTER TABLE IF EXISTS public.tanda_muestras
  ADD COLUMN IF NOT EXISTS muestra_uuid uuid;

-- 2) Populate the new uuid columns by joining on muestras.codigo (integer)
--    If your integer FK refers to a different field, adjust the JOIN accordingly.
UPDATE public.catas AS c
SET muestra_uuid = m.id
FROM public.muestras AS m
WHERE c.muestra_id IS NOT NULL
  AND m.codigo IS NOT NULL
  AND m.codigo = c.muestra_id;

UPDATE public.tanda_muestras AS t
SET muestra_uuid = m.id
FROM public.muestras AS m
WHERE t.muestra_id IS NOT NULL
  AND m.codigo IS NOT NULL
  AND m.codigo = t.muestra_id;

-- 3) Create indexes on the new columns to speed lookups
CREATE INDEX IF NOT EXISTS idx_catas_muestra_uuid ON public.catas (muestra_uuid);
CREATE INDEX IF NOT EXISTS idx_tanda_muestras_muestra_uuid ON public.tanda_muestras (muestra_uuid);

-- 4) Add foreign key constraints referencing public.muestras(id)
-- Use ON DELETE SET NULL to avoid accidental cascading deletes; change to CASCADE if desired.
ALTER TABLE IF EXISTS public.catas
  ADD CONSTRAINT IF NOT EXISTS catas_muestra_uuid_fkey FOREIGN KEY (muestra_uuid) REFERENCES public.muestras(id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS public.tanda_muestras
  ADD CONSTRAINT IF NOT EXISTS tanda_muestras_muestra_uuid_fkey FOREIGN KEY (muestra_uuid) REFERENCES public.muestras(id) ON DELETE SET NULL;

COMMIT;

-- =====================================================================
-- Post-migration verification steps (run manually in staging after migration):
-- 1) Check unmapped rows (rows where integer column exists but no uuid mapping was found):
--    SELECT COUNT(*) AS unmapped_catas FROM public.catas WHERE muestra_id IS NOT NULL AND muestra_uuid IS NULL;
--    SELECT COUNT(*) AS unmapped_tanda FROM public.tanda_muestras WHERE muestra_id IS NOT NULL AND muestra_uuid IS NULL;
--
-- 2) Spot-check some rows to confirm mapping logic (example):
--    SELECT c.muestra_id, c.muestra_uuid, m.codigo, m.id FROM public.catas c LEFT JOIN public.muestras m ON c.muestra_id = m.codigo LIMIT 20;
--
-- 3) If unmapped counts are zero (or acceptable), you can start updating application code to use the new *_muestra_uuid columns
--    and after a safe period consider dropping the old integer columns and renaming the uuid columns to `muestra_id`.

-- Rollback notes (manual):
-- To rollback this migration (if needed) you can drop the FK constraints and the new columns:
-- ALTER TABLE public.catas DROP CONSTRAINT IF EXISTS catas_muestra_uuid_fkey;
-- ALTER TABLE public.tanda_muestras DROP CONSTRAINT IF EXISTS tanda_muestras_muestra_uuid_fkey;
-- ALTER TABLE public.catas DROP COLUMN IF EXISTS muestra_uuid;
-- ALTER TABLE public.tanda_muestras DROP COLUMN IF EXISTS muestra_uuid;

-- IMPORTANT: Do NOT drop the old integer columns until you have verified all application code and scripts
-- have been updated to use the new uuid columns and there are no unmapped rows.
