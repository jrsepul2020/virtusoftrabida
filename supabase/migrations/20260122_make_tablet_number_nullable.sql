-- Migration: Make tablet_number nullable for device-based access control
-- Date: 2026-01-22

-- Make tablet_number nullable (some devices may not need a tablet number)
ALTER TABLE public.dispositivos 
ALTER COLUMN tablet_number DROP NOT NULL;

-- Update unique constraint to handle NULL tablet_numbers
-- Drop old constraint
DROP INDEX IF EXISTS idx_dispositivos_unique_tablet;

-- Create new constraint that only enforces uniqueness for non-NULL tablet_numbers
CREATE UNIQUE INDEX idx_dispositivos_unique_tablet 
ON public.dispositivos(tablet_number) 
WHERE activo = true AND tablet_number IS NOT NULL;

-- Add comment
COMMENT ON COLUMN public.dispositivos.tablet_number IS 'Número asignado a la tablet (1-25), opcional para dispositivos generales';
