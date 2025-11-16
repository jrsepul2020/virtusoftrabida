# 🧪 Datos de Prueba - Sistema de Códigos de Muestras

Este documento explica cómo insertar y verificar datos de prueba para comprobar el funcionamiento del sistema de códigos de muestras.

## 📋 Descripción del Sistema de Códigos

El sistema maneja dos tipos de muestras:

### 🔴 Muestras Manuales (manual = true)
- **Rango de códigos**: 1-999
- **Asignación**: Manual por el administrador
- **Validación**: El trigger de Supabase valida que el código esté en el rango permitido
- **Visualización**: Fondo rojo claro en el listado

### 🔵 Muestras Automáticas (manual = false)
- **Rango de códigos**: 1000-9999
- **Asignación**: Automática por el trigger de Supabase
- **Validación**: El trigger genera un código único aleatorio en el rango
- **Visualización**: Fondo blanco/gris alternado en el listado

## 🚀 Cómo Insertar Datos de Prueba

### Método 1: Desde la Aplicación (Recomendado)

1. Inicia sesión como administrador
2. Ve a la sección **"🧪 Datos de Prueba"** en el menú lateral
3. Haz clic en **"Insertar Datos de Prueba"**
4. Espera a que se complete el proceso
5. Haz clic en **"Verificar Datos"** para ver el resumen

Esto insertará:
- ✅ 4 empresas de ejemplo
- ✅ 5 muestras automáticas (códigos 1000-9999)
- ✅ 5 muestras manuales (códigos específicos: 50, 100, 150, 200, 300)

### Método 2: Desde SQL Editor de Supabase

1. Abre el SQL Editor en tu dashboard de Supabase
2. Copia el contenido del archivo `test-data.sql`
3. Ejecuta el script
4. Verifica los resultados con las queries de verificación incluidas

## 📊 Datos Insertados

### Empresas
1. **Bodegas Ejemplo 1** (bodega1@example.com)
2. **Aceites Premium SL** (aceites@example.com)
3. **Vinos del Norte SA** (vinos@example.com)
4. **Destilerías Test** (destilerias@example.com)

### Muestras Automáticas (5)
- Vino Tinto Reserva 2019
- Aceite Virgen Extra Premium
- Vino Blanco Albariño
- Ginebra Premium Artesanal
- Vino Rosado Navarra

### Muestras Manuales (5)
- Código 50: Vino Espumoso MANUAL
- Código 100: Vino Tinto Crianza MANUAL
- Código 150: Aceite Ecológico MANUAL
- Código 200: Ron Añejo MANUAL
- Código 300: Aceite Arbequina MANUAL

## ✅ Verificación

### En la Aplicación
1. Ve a **"Listado Muestras"**
2. Las muestras manuales aparecen con **fondo rojo claro**
3. Verifica que los códigos de manuales estén entre 1-999
4. Verifica que los códigos de automáticas estén entre 1000-9999

### En Supabase SQL Editor
```sql
-- Ver todas las muestras con sus códigos
SELECT 
  m.codigo,
  m.codigotexto,
  m.nombre,
  e.name as empresa_nombre,
  m.manual,
  m.created_at
FROM muestras m
LEFT JOIN empresas e ON m.empresa_id = e.id
ORDER BY m.manual DESC, m.codigo ASC;

-- Resumen por tipo
SELECT 
  CASE WHEN manual THEN 'Manual (1-999)' ELSE 'Automático (1000-9999)' END as tipo,
  COUNT(*) as total,
  MIN(codigo) as codigo_minimo,
  MAX(codigo) as codigo_maximo
FROM muestras
GROUP BY manual
ORDER BY manual DESC;
```

## 🗑️ Eliminar Datos de Prueba

### Desde la Aplicación
1. Ve a **"🧪 Datos de Prueba"**
2. Haz clic en **"Eliminar Datos de Prueba"**
3. Confirma la acción

### Desde SQL
```sql
-- Eliminar muestras de empresas de prueba
DELETE FROM muestras 
WHERE empresa_id IN (
  SELECT id FROM empresas 
  WHERE email IN (
    'bodega1@example.com',
    'aceites@example.com',
    'vinos@example.com',
    'destilerias@example.com'
  )
);

-- Eliminar empresas de prueba
DELETE FROM empresas 
WHERE email IN (
  'bodega1@example.com',
  'aceites@example.com',
  'vinos@example.com',
  'destilerias@example.com'
);
```

## 🔍 Pruebas Recomendadas

1. **Insertar muestra manual con código < 1000**
   - Debe funcionar correctamente
   
2. **Insertar muestra manual con código > 999**
   - Debe rechazarse con error del trigger
   
3. **Insertar muestra automática**
   - Debe asignar código entre 1000-9999 automáticamente
   
4. **Verificar visualización en listado**
   - Manuales: fondo rojo claro
   - Automáticas: fondo normal
   
5. **Verificar formato de código**
   - codigotexto debe mostrar 6 dígitos
   - Ejemplo: 000100, 001234

## 📝 Notas Importantes

- Los códigos son únicos en toda la tabla muestras
- El trigger `assign_sample_codigo()` se ejecuta en BEFORE INSERT
- Las muestras manuales requieren un código explícito
- Las muestras automáticas NO deben incluir el campo codigo en el INSERT
- El campo `codigotexto` puede usarse para formateo visual

## 🐛 Troubleshooting

**Error: "El código debe estar entre 1 y 999 para muestras manuales"**
- Solución: Usa un código en el rango 1-999

**Error: "El código ya existe"**
- Solución: Usa otro código o permite que se genere automáticamente

**Las muestras automáticas no tienen código**
- Solución: Verifica que el trigger `assign_sample_codigo` esté activo en Supabase

**No veo el fondo rojo en muestras manuales**
- Solución: Verifica que el campo `manual` sea true en la base de datos
