/*
  # Add azucar column to muestras table

  Motivo:
  El frontend inserta/consulta el campo `azucar` en `public.muestras`.
  Si la columna no existe, PostgREST devuelve:
  "Could not find the 'azucar' column of 'muestras' in the schema cache"

  Este script es seguro (IF NOT EXISTS) y no borra datos.
*/

ALTER TABLE public.muestras
  ADD COLUMN IF NOT EXISTS azucar numeric;

COMMENT ON COLUMN public.muestras.azucar IS 'Azúcar (g/L). Campo numérico opcional.';


