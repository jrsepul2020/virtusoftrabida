# Sistema de Registro de Dispositivos - Tablets para Catadores

## 📱 Descripción General

Sistema automático de identificación y registro de tablets para catadores, que elimina la necesidad de introducir números manualmente. Cada tablet se registra una sola vez y luego se identifica automáticamente.

## 🎯 Características

- **Registro automático**: Primera vez que se usa una tablet, se registra automáticamente
- **Identificación única**: Cada tablet tiene una huella digital única basada en características del navegador
- **Validación de asignación**: Al hacer login, el sistema valida que el catador esté asignado a esa tablet
- **Gestión centralizada**: El admin puede ver y gestionar todos los dispositivos registrados
- **Persistencia**: La tablet se identifica automáticamente en futuros usos

## 🔄 Flujo de Uso

### Primera Vez (Tablet Nueva)

1. **Acceder al modo tablet**: Ir a la URL `/tablet` o añadir `?tablet=true`
   - Ejemplo: `https://tudominio.com/tablet`
   - Ejemplo: `https://tudominio.com/?tablet=true`

2. **Registro automático del dispositivo**:
   - El sistema detecta que es un dispositivo nuevo
   - Muestra pantalla de registro
   - Seleccionar número de tablet (1-25)
   - Opcionalmente asignar un nombre descriptivo
   - Hacer clic en "Registrar Dispositivo"

3. **Login del catador**:
   - Seleccionar el nombre del catador de la lista
   - El sistema valida que el catador esté asignado a esa tablet
   - Si no hay asignación o hay conflicto, muestra advertencia

4. **Acceso al dashboard de cata**:
   - Una vez validado, el catador accede a su panel de cata

### Usos Posteriores

1. **Identificación automática**:
   - El sistema detecta automáticamente el número de tablet
   - Muestra directamente la pantalla de login

2. **Login rápido**:
   - Solo seleccionar el nombre del catador
   - El sistema valida automáticamente

3. **Sesión persistente**:
   - La sesión se mantiene hasta cerrar sesión manualmente

## 🔧 Tabla de Base de Datos

### Tabla: `dispositivos`

```sql
CREATE TABLE dispositivos (
  id UUID PRIMARY KEY,
  device_fingerprint TEXT UNIQUE,    -- Huella digital única del dispositivo
  tablet_number INTEGER (1-25),       -- Número asignado a la tablet
  device_info JSONB,                  -- Información técnica del dispositivo
  nombre_asignado TEXT,               -- Nombre descriptivo (ej: "Tablet 1 - Sala A")
  first_registered_at TIMESTAMP,      -- Primera vez que se registró
  last_seen_at TIMESTAMP,             -- Última conexión
  activo BOOLEAN                      -- Estado activo/inactivo
);
```

## 👨‍💼 Panel de Administración

### Acceso

Ir al panel de admin → "Dispositivos"

### Funcionalidades

1. **Ver dispositivos registrados**:
   - Lista completa de tablets registradas
   - Estado de conexión (verde = conectado recientemente)
   - Última vez vista

2. **Estadísticas**:
   - Total de dispositivos
   - Activos vs Inactivos
   - Conectados actualmente

3. **Acciones**:
   - **Ver detalles**: Información técnica completa del dispositivo
   - **Activar/Desactivar**: Deshabilitar temporalmente una tablet
   - **Eliminar**: Eliminar registro (permite re-registrar)

## 🔐 Validaciones

### En Login de Catador

1. **Catador asignado a otra tablet**:
   ```
   Error: "Este catador está asignado a la Tablet X, no a la Tablet Y"
   ```
   → Contactar al administrador

2. **Catador sin tablet asignada**:
   ```
   Advertencia: "Nombre no tiene tablet asignada. ¿Continuar?"
   ```
   → Puede continuar pero se recomienda asignar

### En Gestión de Catadores

El admin puede asignar/cambiar el número de tablet en el panel de "Catadores"

## 🛠️ Tecnología

### Huella Digital del Dispositivo

Se genera combinando:
- User Agent (navegador y sistema operativo)
- Plataforma
- Resolución de pantalla
- Profundidad de color
- Zona horaria
- Soporte táctil
- Núcleos de CPU
- Memoria del dispositivo

Se hashea con SHA-256 para crear un identificador único.

### Almacenamiento Dual

1. **Base de datos (Supabase)**: 
   - Registro permanente
   - Gestión centralizada

2. **localStorage**:
   - Backup local
   - Recuperación rápida

## 📱 URLs de Acceso

### Usuarios Públicos (Inscripciones)
```
https://tudominio.com/
```

### Tablets de Catadores
```
https://tudominio.com/tablet
```
o
```
https://tudominio.com/?tablet=true
```

### Administrador
```
https://tudominio.com/
→ Hacer clic en "Acceso Administrador"
```

## 🚨 Solución de Problemas

### Tablet no se identifica

1. **Verificar modo tablet**: Comprobar que la URL incluye `/tablet` o `?tablet=true`
2. **Limpiar caché**: Borrar localStorage y cookies
3. **Re-registrar**: Eliminar el dispositivo desde el panel admin y volver a registrar

### Conflicto de tablet

1. Ir al panel de **Catadores**
2. Buscar al catador
3. Cambiar el número de tablet asignado
4. Guardar cambios

### Tablet desconectada

Si una tablet aparece como "inactiva" en el panel:
- Verificar conexión a internet
- Comprobar que la URL sea correcta
- Verificar que el dispositivo esté "Activo" en panel admin

## 📊 Monitoreo

### Indicadores de Conexión

- **Punto verde pulsante**: Conectado en los últimos 5 minutos
- **Tiempo relativo**: "2m", "1h", "3d" desde última conexión
- **Estado**: Activo/Inactivo

### Información en Tiempo Real

El campo `last_seen_at` se actualiza automáticamente cada vez que:
- Se registra el dispositivo
- Se hace login
- Se navega en la aplicación

## 🔄 Migraciones de Base de Datos

Para aplicar la nueva tabla `dispositivos`:

```bash
# Aplicar migración en Supabase
supabase db push
```

O copiar el contenido de:
```
supabase/migrations/20251109000000_create_dispositivos_table.sql
```

Y ejecutarlo en el editor SQL de Supabase.

## 📝 Notas Importantes

1. **Privacidad**: La huella digital NO contiene información personal
2. **Estabilidad**: La huella puede cambiar si se actualiza el navegador o sistema operativo
3. **Backup**: El localStorage sirve como respaldo si la huella cambia ligeramente
4. **Límite**: Sistema diseñado para 25 tablets máximo (configurable)

## 🎨 Personalización

Para cambiar el número máximo de tablets, editar en:

```typescript
// src/components/DeviceRegistration.tsx
const maxTablets = 25; // Cambiar aquí

// supabase/migrations/...sql
CHECK (tablet_number >= 1 AND tablet_number <= 25) -- Cambiar aquí
```
