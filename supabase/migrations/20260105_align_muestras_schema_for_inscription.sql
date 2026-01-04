/*
  # Align muestras schema for inscription form

  Motivo:
  El formulario de inscripción inserta estos campos en `public.muestras`:
  - nombre, categoria, origen, igp, pais
  - azucar (numeric), grado (numeric)
  - existencias (int), anio (int)
  - tipouva, tipoaceituna, destilado (text)
  - foto_botella (text url)
  - empresa_id (uuid FK a empresas.id)
  - manual (boolean), codigo (int opcional)

  Este script añade columnas de forma segura (IF NOT EXISTS) y NO borra datos.
*/

-- Columnas principales usadas por el frontend
ALTER TABLE public.muestras
  ADD COLUMN IF NOT EXISTS nombre text,
  ADD COLUMN IF NOT EXISTS categoria text,
  ADD COLUMN IF NOT EXISTS origen text,
  ADD COLUMN IF NOT EXISTS igp text,
  ADD COLUMN IF NOT EXISTS pais text,
  ADD COLUMN IF NOT EXISTS azucar numeric,
  ADD COLUMN IF NOT EXISTS grado numeric,
  ADD COLUMN IF NOT EXISTS existencias integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS anio integer,
  ADD COLUMN IF NOT EXISTS tipouva text,
  ADD COLUMN IF NOT EXISTS tipoaceituna text,
  ADD COLUMN IF NOT EXISTS destilado text,
  ADD COLUMN IF NOT EXISTS foto_botella text,
  ADD COLUMN IF NOT EXISTS empresa_id uuid,
  ADD COLUMN IF NOT EXISTS manual boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS codigo integer;

COMMENT ON COLUMN public.muestras.azucar IS 'Azúcar (g/L). Campo numérico opcional.';
COMMENT ON COLUMN public.muestras.grado IS 'Grado alcohólico (% vol). Campo numérico opcional.';
COMMENT ON COLUMN public.muestras.foto_botella IS 'URL de la imagen de la botella subida a Storage.';

-- FK empresa_id -> empresas(id) (solo si existe la tabla empresas y no existe ya un FK)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'empresas'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'muestras' AND column_name = 'empresa_id'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.table_constraints tc
      WHERE tc.table_schema = 'public'
        AND tc.table_name = 'muestras'
        AND tc.constraint_type = 'FOREIGN KEY'
        AND tc.constraint_name = 'fk_muestras_empresa_id'
    ) THEN
      BEGIN
        ALTER TABLE public.muestras
          ADD CONSTRAINT fk_muestras_empresa_id
          FOREIGN KEY (empresa_id) REFERENCES public.empresas(id)
          ON DELETE CASCADE;
      EXCEPTION
        WHEN others THEN
          -- Si ya existe otro FK equivalente o hay un esquema distinto, no bloquear el deploy.
          NULL;
      END;
    END IF;
  END IF;
END $$;


