# Configuración Bucket Supabase para Fotos de Botellas

## ⚠️ IMPORTANTE: Ejecutar en Supabase

### 1. Aplicar Migración SQL

Ejecuta la migración en el SQL Editor de Supabase:
```sql
-- Archivo: supabase/migrations/20251130000000_add_foto_botella_to_muestras.sql

ALTER TABLE muestras 
ADD COLUMN IF NOT EXISTS foto_botella TEXT;

COMMENT ON COLUMN muestras.foto_botella IS 'URL de la imagen de la botella subida a Supabase Storage (bucket: bottle-images)';
```

### 2. Crear Bucket de Storage (si no existe)

Ve a **Storage** en Supabase Dashboard y crea un bucket:

**Nombre:** `bottle-images`

**Configuración:**
- ✅ **Public bucket**: Sí (las URLs deben ser públicas)
- ✅ **File size limit**: 5MB
- ✅ **Allowed MIME types**: image/jpeg, image/png, image/webp

### 3. Configurar Políticas RLS del Bucket

Ejecuta estas políticas en SQL Editor:

```sql
-- Permitir a todos subir imágenes (necesario para formulario público)
CREATE POLICY "Anyone can upload bottle images"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'bottle-images');

-- Permitir a todos leer imágenes (público)
CREATE POLICY "Anyone can view bottle images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'bottle-images');

-- Permitir a admin eliminar imágenes
CREATE POLICY "Admin can delete bottle images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'bottle-images');
```

### 4. Verificar Configuración

En el formulario de inscripción:
1. Ir a la sección de Muestras
2. Intentar subir una foto de botella
3. Verificar que se sube correctamente
4. Verificar en la tabla `muestras` que el campo `foto_botella` tiene la URL

### 5. Verificar URL Pública

Las URLs deben tener este formato:
```
https://[project-ref].supabase.co/storage/v1/object/public/bottle-images/[filename]
```

## Solución de Problemas

### Error: "Bucket not found"
- Crear el bucket `bottle-images` en Storage

### Error: "Permission denied"
- Verificar políticas RLS del bucket
- Asegurarse de que el bucket es público

### Error: "File too large"
- Límite: 5MB por imagen
- Reducir tamaño de imagen antes de subir

### La URL no se guarda en la DB
- Verificar que la migración se ejecutó correctamente
- Verificar con: `SELECT column_name FROM information_schema.columns WHERE table_name = 'muestras';`
- Debe aparecer `foto_botella` en la lista

## Campos Actualizados

**UnifiedInscriptionForm.tsx:**
```typescript
foto_botella: sample.foto_botella || null,  // URL de la imagen subida
```

**ImageUploader.tsx:**
- Ya configurado correctamente
- Sube a bucket `bottle-images`
- Retorna URL pública
- Callback: `onImageUploaded(url)`

**MuestrasScreen.tsx:**
- Ya configurado correctamente
- Campo opcional
- Handler: `onImageChange(idx, url)`
