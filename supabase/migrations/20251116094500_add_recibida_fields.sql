-- Add recibida columns to muestras
ALTER TABLE public.muestras
  ADD COLUMN IF NOT EXISTS recibida boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS recibida_at timestamptz;

-- Optional index for faster lookup by recibida
CREATE INDEX IF NOT EXISTS idx_muestras_recibida ON public.muestras (recibida);
