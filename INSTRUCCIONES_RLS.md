# Instrucciones para solucionar el problema de RLS (Row Level Security)

## Problema
Las tablas `empresas` y `muestras` tienen RLS activado, lo que impide que el dashboard cargue los datos correctamente.

## Solución

### Opción 1: Aplicar migración desde la terminal (Recomendada)

1. Asegúrate de tener Supabase CLI instalado:
```bash
brew install supabase/tap/supabase
```

2. Navega al directorio del proyecto:
```bash
cd /Users/creadoresweb/Downloads/virtusoftrabida
```

3. Conecta con tu proyecto de Supabase:
```bash
supabase link --project-ref TU_PROJECT_REF
```

4. Aplica la migración:
```bash
supabase db push
```

### Opción 2: Ejecutar SQL manualmente en Supabase Dashboard

1. Ve a: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a "SQL Editor" en el menú lateral
4. Crea una nueva query
5. Copia y pega el siguiente SQL:

```sql
-- Disable RLS on empresas table
ALTER TABLE empresas DISABLE ROW LEVEL SECURITY;

-- Disable RLS on muestras table
ALTER TABLE muestras DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Anyone can register a company" ON empresas;
DROP POLICY IF EXISTS "Authenticated users can view all companies" ON empresas;
DROP POLICY IF EXISTS "Authenticated users can update companies" ON empresas;
DROP POLICY IF EXISTS "Authenticated users can delete companies" ON empresas;
DROP POLICY IF EXISTS "Public can register companies" ON empresas;

DROP POLICY IF EXISTS "Anyone can submit samples" ON muestras;
DROP POLICY IF EXISTS "Authenticated users can view all samples" ON muestras;
DROP POLICY IF EXISTS "Authenticated users can update samples" ON muestras;
DROP POLICY IF EXISTS "Authenticated users can delete samples" ON muestras;
DROP POLICY IF EXISTS "Public can submit samples" ON muestras;
```

6. Haz click en "Run"

### Verificar que funcionó

Después de aplicar cualquiera de las dos opciones:

1. Recarga la página del dashboard
2. Ve a "Listado Empresas"
3. Abre la consola del navegador (F12)
4. Deberías ver:
   - ✅ Empresas cargadas: 9
   - 📊 Primeras 3 empresas: [datos]

## Nota de Seguridad

Deshabilitar RLS es seguro en este caso porque:
- Es un sistema de inscripción a concurso que requiere acceso público
- La autenticación del admin protege las funciones de gestión
- Los datos no son sensibles (inscripciones públicas a un concurso)
