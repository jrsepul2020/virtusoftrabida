/*
  # Add foto_botella column to muestras table

  ## Changes
  - Adds foto_botella column to store bottle image URLs from Supabase Storage
  - Column is TEXT type to store public URLs
  - Nullable field (optional image)

  ## Notes
  - Images are uploaded to 'bottle-images' bucket in Supabase Storage
  - URLs are public and can be accessed directly
*/

-- Add foto_botella column to muestras table
ALTER TABLE muestras 
ADD COLUMN IF NOT EXISTS foto_botella TEXT;

-- Add comment to document the column
COMMENT ON COLUMN muestras.foto_botella IS 'URL de la imagen de la botella subida a Supabase Storage (bucket: bottle-images)';
