/*
  # Add grado column to muestras table
  Motivo: el frontend inserta el campo `grado` en `public.muestras`.
  Si no existe, PostgREST devuelve "Could not find the 'grado' column of 'muestras' in the schema cache".
*/

ALTER TABLE public.muestras
  ADD COLUMN IF NOT EXISTS grado numeric;

COMMENT ON COLUMN public.muestras.grado IS 'Grado alcohólico (% vol). Campo numérico opcional.';


