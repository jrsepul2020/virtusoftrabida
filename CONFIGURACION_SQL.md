# 🔧 INSTRUCCIONES SQL PARA SUPABASE

## Ejecuta estos scripts en el SQL Editor de Supabase

### 1. Crear tabla de configuración

```sql
-- Crear tabla de configuración
CREATE TABLE IF NOT EXISTS public.configuracion (
  clave TEXT PRIMARY KEY,
  valor TEXT NOT NULL,
  descripcion TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Deshabilitar RLS para acceso público
ALTER TABLE public.configuracion DISABLE ROW LEVEL SECURITY;

-- Insertar configuración inicial
INSERT INTO public.configuracion (clave, valor, descripcion) 
VALUES ('numero_mesas', '5', 'Número total de mesas disponibles')
ON CONFLICT (clave) DO NOTHING;

-- Índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_configuracion_clave ON public.configuracion(clave);
```

### 2. Actualizar constraint de puesto (1-5 en lugar de 1-8)

```sql
-- Actualizar constraint de puesto para que sea 1-5
ALTER TABLE public.usuarios 
DROP CONSTRAINT IF EXISTS usuarios_puesto_check;

ALTER TABLE public.usuarios 
ADD CONSTRAINT usuarios_puesto_check 
CHECK (puesto >= 1 AND puesto <= 5);
```

## ✅ Verificación

Después de ejecutar, verifica:

```sql
-- Ver configuración
SELECT * FROM configuracion;

-- Ver constraint de puesto
SELECT conname, contype, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'usuarios'::regclass 
AND conname = 'usuarios_puesto_check';
```

## 📋 Resumen de cambios

1. **Tabla configuracion**: Nueva tabla para parámetros configurables
2. **Número de mesas**: Ahora configurable desde la pantalla de Configuración (por defecto 5)
3. **Puesto**: Actualizado de 1-8 a 1-5
4. **Roles fijos**: Administrador, Presidente, Catador
5. **Tablets fijas**: 1 a 25
6. **Color de fila**: Blanco si no tiene mesa asignada
