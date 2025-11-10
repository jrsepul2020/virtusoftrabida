# 📸 Configuración del Bucket de Supabase para Fotos de Botellas

## 🎯 Objetivo
Configurar un bucket de almacenamiento en Supabase para guardar las fotos de las botellas inscritas.

---

## 📋 Pasos para Configurar el Bucket

### 1️⃣ **Acceder a Supabase Storage**

1. Ve a tu proyecto en [Supabase](https://supabase.com/dashboard)
2. En el menú lateral, haz clic en **"Storage"**
3. Haz clic en **"Create a new bucket"**

---

### 2️⃣ **Crear el Bucket**

**Configuración del bucket:**
- **Name**: `bottle-images`
- **Public bucket**: ✅ **SÍ** (marcar como público)
- **File size limit**: `5 MB` (opcional)
- **Allowed MIME types**: `image/*` (opcional, para restringir solo a imágenes)

Haz clic en **"Create bucket"**

---

### 3️⃣ **Configurar Políticas de Acceso (RLS)**

Por defecto, el bucket está protegido. Necesitamos crear políticas para permitir:
- ✅ **Subir imágenes** (INSERT)
- ✅ **Ver imágenes** (SELECT)
- ❌ **NO permitir eliminar** (DELETE) - opcional, según tu caso

#### **Opción A: Acceso Público Completo (Recomendado para Desarrollo)**

1. En el bucket `bottle-images`, ve a **"Policies"**
2. Haz clic en **"New Policy"**
3. Selecciona **"Full customization"**

**Política para SUBIR imágenes:**
```sql
CREATE POLICY "Permitir subir imágenes públicamente"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'bottle-images');
```

**Política para VER imágenes:**
```sql
CREATE POLICY "Permitir ver imágenes públicamente"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'bottle-images');
```

**Política para ELIMINAR imágenes (opcional):**
```sql
CREATE POLICY "Permitir eliminar imágenes públicamente"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'bottle-images');
```

---

#### **Opción B: Acceso Solo para Usuarios Autenticados (Más Seguro)**

Si prefieres que solo usuarios autenticados puedan subir fotos:

**Política para SUBIR (solo autenticados):**
```sql
CREATE POLICY "Permitir subir imágenes a usuarios autenticados"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'bottle-images');
```

**Política para VER (público):**
```sql
CREATE POLICY "Permitir ver imágenes a todos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'bottle-images');
```

---

### 4️⃣ **Verificar la Configuración**

1. Ve a **Storage** → **bottle-images**
2. Intenta subir una imagen manualmente haciendo clic en **"Upload file"**
3. Si se sube correctamente, haz clic en la imagen
4. Copia la **Public URL** y pégala en el navegador
5. Si se ve la imagen, ✅ **todo está configurado correctamente**

---

## 🧪 Prueba desde la Aplicación

1. Ejecuta el servidor de desarrollo:
   ```bash
   npm run dev
   ```

2. Ve al formulario de inscripción de muestras

3. En cada muestra, verás el campo **"Foto de la Botella (Opcional)"**

4. Haz clic en:
   - **"Tomar Foto"** (en móvil activa la cámara)
   - **"Seleccionar Archivo"** (en escritorio selecciona una imagen)

5. La imagen se subirá automáticamente a Supabase

6. Verás un preview de la imagen subida

7. Al guardar la muestra, la URL de la imagen se guardará en el campo `foto_botella`

---

## 🗃️ Estructura de la Base de Datos

Ya he añadido el campo `foto_botella` al tipo `SampleData` en el código. Si necesitas añadirlo también a la tabla de Supabase:

```sql
ALTER TABLE muestras 
ADD COLUMN foto_botella TEXT;
```

Esto guardará la URL pública de la imagen subida.

---

## 🔧 Funcionalidades Implementadas

### ✅ Componente `ImageUploader`
- 📷 Tomar foto desde cámara (móvil)
- 📁 Seleccionar archivo (escritorio)
- 👁️ Preview de la imagen
- ❌ Eliminar imagen
- ⚠️ Validaciones (tamaño máx 5MB, solo imágenes)
- ⏳ Indicador de carga
- 🚨 Mensajes de error

### ✅ Integración en el Formulario
- Añadido en cada muestra del formulario
- Se guarda automáticamente con los datos de la muestra
- Campo opcional (no obligatorio)
- URL se almacena en `foto_botella`

---

## 🎨 Características Técnicas

### **Formato de Nombres de Archivo**
Los archivos se guardan con nombres únicos:
```
1699999999999-abc123.jpg
[timestamp]-[random].[ext]
```

### **Validaciones**
- ✅ Tamaño máximo: 5MB
- ✅ Solo imágenes: JPG, PNG, WebP, etc.
- ✅ URL pública generada automáticamente

### **Seguridad**
- 🔒 Bucket público para URLs accesibles
- 🔐 Políticas RLS para controlar acceso
- 🛡️ Validación en frontend

---

## 🚀 Próximos Pasos Opcionales

### 1. **Optimización de Imágenes**
Puedes usar transformaciones de Supabase para optimizar imágenes:
```typescript
const { data: urlData } = supabase.storage
  .from('bottle-images')
  .getPublicUrl(filePath, {
    transform: {
      width: 800,
      height: 800,
      resize: 'contain',
      quality: 80
    }
  });
```

### 2. **Eliminar Imágenes Antiguas**
Cuando se actualiza una muestra con nueva foto, puedes eliminar la antigua:
```typescript
const oldPath = sample.foto_botella?.split('/').pop();
if (oldPath) {
  await supabase.storage
    .from('bottle-images')
    .remove([oldPath]);
}
```

### 3. **Galería de Imágenes**
Puedes crear una vista para mostrar todas las fotos de botellas en un panel de admin.

---

## ❓ Solución de Problemas

### **Error: "new row violates row-level security policy"**
➡️ Verifica que las políticas RLS estén creadas correctamente

### **Error: "The resource already exists"**
➡️ El archivo ya existe, usa `upsert: true` en la función de upload

### **Las imágenes no se ven**
➡️ Verifica que el bucket esté marcado como **Public**

### **Error 413: Payload Too Large**
➡️ La imagen es muy grande, reduce el tamaño o aumenta el límite

---

## 📞 Soporte

Si tienes problemas:
1. Revisa la consola del navegador para ver errores
2. Verifica las políticas RLS en Supabase
3. Comprueba que el bucket sea público
4. Asegúrate de que el nombre del bucket sea exactamente `bottle-images`

---

✅ **¡Listo!** Ahora tu aplicación puede guardar fotos de botellas en Supabase Storage.
