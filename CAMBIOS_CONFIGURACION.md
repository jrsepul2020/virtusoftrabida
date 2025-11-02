# 📝 RESUMEN DE CAMBIOS - CONFIGURACIÓN DE CATADORES

## ✅ Cambios Implementados

### 1. **Roles actualizados**
- Antes: Catador Principal, Catador Auxiliar, Presidente, Secretario, Observador
- Ahora: **Administrador, Presidente, Catador** (3 roles fijos)

### 2. **Mesas configurables**
- Antes: Fijo 1-10 o basado en tabla `mesas`
- Ahora: **Configurable desde pantalla de Configuración** (por defecto 5)
- Se lee de la tabla `configuracion` con clave `numero_mesas`
- Puedes cambiar el número desde la nueva pantalla "Configuración" en el menú de administrador

### 3. **Puestos actualizados**
- Antes: 1 a 8
- Ahora: **1 a 5** (5 puestos por mesa)

### 4. **Tablets fijas**
- Antes: Variable según datos existentes
- Ahora: **1 a 25** (lista fija de tablets disponibles)

### 5. **Color de filas**
- **Sin mesa asignada**: Fondo blanco
- **Con mesa asignada**: Color alegre según número de mesa (10 colores rotando)

### 6. **Nueva pantalla: Configuración**
- Accesible desde el menú lateral de administrador
- Permite configurar el **número de mesas** (1-50)
- Muestra información de los parámetros fijos del sistema

## 📁 Archivos modificados

### Componentes React
1. `src/components/CatadoresManager.tsx`
   - Roles actualizados a 3 opciones
   - Puestos de 1-5
   - Tablets de 1-25
   - Mesas configurables desde BD
   - Color blanco si no tiene mesa

2. `src/components/ConfiguracionManager.tsx` (NUEVO)
   - Pantalla de configuración del sistema
   - Gestión del número de mesas
   - Información de parámetros fijos

3. `src/components/AdminDashboard.tsx`
   - Nueva opción "Configuración" en el menú
   - Ruta para el componente ConfiguracionManager

### Migraciones SQL
1. `supabase/migrations/20251102120000_create_configuracion_table.sql`
   - Crea tabla `configuracion`
   - Inserta valor por defecto `numero_mesas = 5`

2. `supabase/migrations/20251102120100_update_puesto_constraint.sql`
   - Actualiza constraint de `puesto` de 1-8 a 1-5

### Documentación
1. `CONFIGURACION_SQL.md` (NUEVO)
   - Instrucciones SQL para ejecutar en Supabase
   - Scripts de verificación

2. `MIGRACION_USUARIOS.md` (actualizado)
   - Documentación actualizada con nuevos valores

## 🚀 Cómo usar

### 1. Ejecutar SQL en Supabase
Abre el SQL Editor en Supabase y ejecuta los scripts en `CONFIGURACION_SQL.md`:

```sql
-- 1. Crear tabla configuracion
-- 2. Actualizar constraint de puesto
```

### 2. Acceder a Configuración
1. Inicia sesión como administrador
2. Ve al menú lateral
3. Click en "Configuración"
4. Ajusta el número de mesas (1-50)
5. Click en "Guardar Configuración"

### 3. Gestionar Catadores
1. Ve a "Catadores" en el menú
2. Los dropdowns ahora muestran:
   - **Rol**: Administrador, Presidente, Catador
   - **Mesa**: Dinámico según configuración (ej: 1-5)
   - **Puesto**: 1-5
   - **Tablet**: 1-25
3. Las filas sin mesa tienen fondo blanco
4. Las filas con mesa tienen colores alegres

## 🎨 Comportamiento visual

- **Fila sin mesa**: `bg-white` (blanco)
- **Fila con mesa 1**: `bg-rose-100` (rosa claro)
- **Fila con mesa 2**: `bg-orange-100` (naranja claro)
- **Fila con mesa 3**: `bg-amber-100` (ámbar claro)
- ... y así sucesivamente (10 colores rotan)

## ✅ Estado actual

- ✅ Roles: 3 opciones fijas
- ✅ Mesas: Configurables (por defecto 5)
- ✅ Puestos: 1-5 fijos
- ✅ Tablets: 1-25 fijos
- ✅ Color blanco para filas sin mesa
- ✅ Pantalla de configuración funcional
- ✅ TypeScript sin errores
- ✅ Servidor dev corriendo
