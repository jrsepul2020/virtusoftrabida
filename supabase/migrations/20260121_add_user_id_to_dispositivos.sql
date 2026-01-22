-- Migration: Add user_id to dispositivos and update RLS
-- Date: 2026-01-21

-- Add user_id column to dispositivos table
ALTER TABLE IF EXISTS public.dispositivos 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for user_id lookups
CREATE INDEX IF NOT EXISTS idx_dispositivos_user_id ON public.dispositivos(user_id);

-- Enable RLS on dispositivos
ALTER TABLE public.dispositivos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "dispositivos_auth_all" ON public.dispositivos;
DROP POLICY IF EXISTS "dispositivos_insert" ON public.dispositivos;
DROP POLICY IF EXISTS "dispositivos_select" ON public.dispositivos;
DROP POLICY IF EXISTS "dispositivos_update" ON public.dispositivos;
DROP POLICY IF EXISTS "dispositivos_delete" ON public.dispositivos;

-- Policy: Users can insert their own device
CREATE POLICY "dispositivos_insert" ON public.dispositivos
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own devices, admins can view all
CREATE POLICY "dispositivos_select" ON public.dispositivos
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE usuarios.id = auth.uid() 
    AND usuarios.rol IN ('Administrador', 'Presidente', 'Supervisor')
  )
);

-- Policy: Users can update their own device last_seen, admins can update all fields
CREATE POLICY "dispositivos_update" ON public.dispositivos
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE usuarios.id = auth.uid() 
    AND usuarios.rol IN ('Administrador', 'Presidente', 'Supervisor')
  )
)
WITH CHECK (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE usuarios.id = auth.uid() 
    AND usuarios.rol IN ('Administrador', 'Presidente', 'Supervisor')
  )
);

-- Policy: Only admins can delete devices
CREATE POLICY "dispositivos_delete" ON public.dispositivos
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE usuarios.id = auth.uid() 
    AND usuarios.rol IN ('Administrador', 'Presidente', 'Supervisor')
  )
);

-- Add comment
COMMENT ON COLUMN public.dispositivos.user_id IS 'Usuario al que pertenece el dispositivo';
