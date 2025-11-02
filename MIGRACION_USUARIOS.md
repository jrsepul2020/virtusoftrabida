# 📋 MIGRACIÓN A TABLA USUARIOS

## ✅ Cambios Realizados

### 1. Componente CatadoresManager.tsx
- ✅ Actualizado para leer de la tabla `usuarios`
- ✅ Muestra solo los 6 campos requeridos:
  - `codigocatador` (código del catador)
  - `nombre` (nombre completo)
  - `rol` (rol del catador: Administrador, Presidente, Catador)
  - `mesa` (número de mesa 1-5, configurable)
  - `puesto` (número de puesto 1-5)
  - `tablet` (ID de la tablet 1-25)

### 2. Funcionalidades
- ✅ Edición inline de todos los campos (excepto nombre)
- ✅ Formulario para crear/editar catadores
- ✅ Ordenamiento por cualquier campo
- ✅ Estadísticas: Total, Con Rol, Asignados a Mesa

## 🗄️ ACCIÓN REQUERIDA: Ejecutar en Supabase

Ve al **SQL Editor** de Supabase y ejecuta este script:

```sql
-- Renombrar tabla catadores a usuarios si existe
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'catadores') THEN
    ALTER TABLE public.catadores RENAME TO usuarios;
  END IF;
END $$;

-- Renombrar columna codigodecatador a codigocatador si existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'usuarios' AND column_name = 'codigodecatador'
  ) THEN
    ALTER TABLE public.usuarios RENAME COLUMN codigodecatador TO codigocatador;
  END IF;
END $$;

-- Crear tabla usuarios si no existe
CREATE TABLE IF NOT EXISTS public.usuarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  codigocatador TEXT,
  nombre TEXT NOT NULL,
  rol TEXT,
  mesa INTEGER,
  puesto INTEGER CHECK (puesto >= 1 AND puesto <= 8),
  tablet TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Deshabilitar RLS
ALTER TABLE public.usuarios DISABLE ROW LEVEL SECURITY;

-- Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_usuarios_nombre ON public.usuarios(nombre);
CREATE INDEX IF NOT EXISTS idx_usuarios_mesa ON public.usuarios(mesa);
```

## ⚠️ IMPORTANTE

Si tu tabla actual se llama `catadores` y tiene campos diferentes (como `email`, `telefono`, etc.), este script:

1. **Renombrará** la tabla de `catadores` a `usuarios`
2. **Mantendrá** todos los datos existentes
3. Los campos antiguos quedarán en la tabla pero NO se usarán en la pantalla

### Alternativa: Migrar datos manualmente

Si quieres crear la tabla `usuarios` limpia y migrar solo los datos necesarios:

```sql
-- Crear tabla usuarios nueva
CREATE TABLE IF NOT EXISTS public.usuarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  codigocatador TEXT,
  nombre TEXT NOT NULL,
  rol TEXT,
  mesa INTEGER,
  puesto INTEGER CHECK (puesto >= 1 AND puesto <= 8),
  tablet TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Deshabilitar RLS
ALTER TABLE public.usuarios DISABLE ROW LEVEL SECURITY;

-- Migrar datos de catadores a usuarios (si existe)
INSERT INTO public.usuarios (codigocatador, nombre, rol, mesa, puesto, tablet)
SELECT 
  codigocatador,
  nombre, 
  rol, 
  mesa, 
  puesto, 
  ntablet as tablet
FROM public.catadores
ON CONFLICT DO NOTHING;

-- Índices
CREATE INDEX IF NOT EXISTS idx_usuarios_nombre ON public.usuarios(nombre);
CREATE INDEX IF NOT EXISTS idx_usuarios_mesa ON public.usuarios(mesa);
```

## 🧪 Verificación

Después de ejecutar la migración, verifica:

```sql
-- Ver estructura de la tabla
\d usuarios

-- Ver datos
SELECT * FROM usuarios LIMIT 5;

-- Contar registros
SELECT COUNT(*) FROM usuarios;
```

## 🎯 Resultado Final

Una vez ejecutada la migración:

1. La pantalla "Catadores" cargará datos de la tabla `usuarios`
2. Mostrará solo los 6 campos: código, nombre, rol, mesa, puesto, tablet
3. Edición inline funcionará correctamente
4. No habrá más error "Error al cargar catadores"
