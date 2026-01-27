# Sistema de Login por Tablets - Documentación

## Resumen

Sistema de autenticación simplificado para tablets **sin usar Supabase Auth**. El login se basa únicamente en:

- Número de tablet (1-25)
- Consulta directa a la tabla `usuarios`
- Almacenamiento en `localStorage`

## Arquitectura

### Cálculo Automático de Mesa y Puesto

Cada tablet tiene asignada automáticamente una mesa y un puesto:

```typescript
mesa = Math.floor((tabletNumber - 1) / 5) + 1;
puesto = ((tabletNumber - 1) % 5) + 1;
es_presidente = puesto === 1;
```

**Distribución:**

- **Mesa 1**: Tablets 1-5 (Tablet 1 = Presidente)
- **Mesa 2**: Tablets 6-10 (Tablet 6 = Presidente)
- **Mesa 3**: Tablets 11-15 (Tablet 11 = Presidente)
- **Mesa 4**: Tablets 16-20 (Tablet 16 = Presidente)
- **Mesa 5**: Tablets 21-25 (Tablet 21 = Presidente)

### Flujo de Login

1. **Usuario pulsa botón de tablet** (ej: Tablet 7)
2. **Se calcula**: Mesa 2, Puesto 2, No es presidente
3. **Se consulta Supabase**:
   ```sql
   SELECT id, nombre, rol, mesa, puesto, tablet, tandaencurso
   FROM usuarios
   WHERE mesa = 2 AND puesto = 2 AND activo = true
   LIMIT 1
   ```
4. **Se guarda en localStorage**:
   ```json
   {
     "tablet_id": 7,
     "mesa": 2,
     "puesto": 2,
     "usuario_id": "uuid-del-usuario",
     "nombre": "Juan Pérez",
     "rol": "Catador",
     "es_presidente": false,
     "tandaencurso": 1
   }
   ```
5. **Redirección** a la pantalla principal

## Componentes

### TabletLoginView.tsx

Componente principal con 25 botones en grid 5x5.

**Props:**

```typescript
type Props = {
  onLogin: (success: boolean, role: string) => void;
};
```

**Funcionalidad:**

- Grid responsive de 25 botones
- Cálculo automático de mesa/puesto
- Consulta directa a tabla `usuarios`
- Feedback visual durante login
- Manejo de errores

### tabletAuth.ts

Módulo de utilidades para gestión de sesiones.

**Funciones principales:**

```typescript
// Verificar si hay sesión guardada
hasTabletSession(): boolean

// Obtener datos de sesión
getTabletSession(): TabletSession | null

// Limpiar sesión
clearTabletSession(): void

// Auto-login al cargar app
tryAutoLogin(): boolean

// Calcular mesa/puesto
calculateMesaPuesto(tabletNumber: number)

// Normalizar rol
normalizeRole(rol: string): "Admin" | "Catador"
```

## Datos en localStorage

El sistema guarda los siguientes datos:

| Key              | Tipo   | Descripción                   |
| ---------------- | ------ | ----------------------------- |
| `tablet_session` | JSON   | Objeto completo de sesión     |
| `tablet_id`      | string | Número de tablet (1-25)       |
| `userRole`       | string | Rol del usuario               |
| `authMethod`     | string | Siempre "tablet"              |
| `userRoleData`   | JSON   | Datos adicionales del usuario |

## Tabla usuarios en Supabase

**Campos relevantes:**

```sql
usuarios (
  id text PRIMARY KEY,
  nombre text,
  rol text,
  mesa bigint,
  puesto bigint,
  tablet text,
  tandaencurso bigint,
  activo boolean DEFAULT true,
  ...
)
```

**Requisitos:**

- Debe existir un usuario con `activo = true` para cada combinación mesa/puesto
- El campo `tablet` puede contener el número de tablet asignado (opcional)

## Uso en la Aplicación

### Implementar Auto-Login

En tu componente principal (ej: `App.tsx`):

```typescript
import { tryAutoLogin, getTabletSession } from "./lib/tabletAuth";

useEffect(() => {
  // Intentar auto-login al cargar
  if (tryAutoLogin()) {
    const session = getTabletSession();
    if (session) {
      setIsAuthenticated(true);
      setUserRole(normalizeRole(session.rol));
      // Redirigir a dashboard
    }
  }
}, []);
```

### Cerrar Sesión

```typescript
import { clearTabletSession } from "./lib/tabletAuth";

const handleLogout = () => {
  clearTabletSession();
  setIsAuthenticated(false);
  // Redirigir a login
};
```

## Ventajas del Sistema

✅ **Sin autenticación formal** - No requiere Supabase Auth  
✅ **Offline-ready** - Funciona con datos en localStorage  
✅ **Auto-login** - Mantiene sesión entre recargas  
✅ **Cálculo automático** - Mesa y puesto se calculan del número de tablet  
✅ **Validación robusta** - Solo usuarios activos pueden acceder  
✅ **Feedback claro** - Mensajes de error descriptivos

## Manejo de Errores

El sistema maneja los siguientes casos:

1. **Tablet sin usuario asignado**:

   ```
   "No se encontró usuario activo para Mesa X, Puesto Y"
   ```

2. **Error de base de datos**:

   ```
   "Error al consultar la base de datos"
   ```

3. **Usuario inactivo**:
   - No se devuelve en la consulta (filtro `activo = true`)

## Ejemplo Completo

```typescript
// Usuario pulsa Tablet 11
// Sistema calcula:
const mesa = Math.floor((11 - 1) / 5) + 1;  // = 3
const puesto = ((11 - 1) % 5) + 1;          // = 1
const es_presidente = puesto === 1;          // = true

// Consulta Supabase:
// SELECT * FROM usuarios
// WHERE mesa = 3 AND puesto = 1 AND activo = true

// Resultado:
{
  id: "abc-123",
  nombre: "María García",
  rol: "Presidente",
  mesa: 3,
  puesto: 1,
  tandaencurso: 2
}

// Guarda en localStorage y redirige
// Mensaje: "Bienvenido/a María García - Mesa 3, Puesto 1 (Presidente)"
```

## Configuración Inicial

Para que el sistema funcione, asegúrate de:

1. **Crear usuarios en la tabla `usuarios`** con:
   - `mesa` y `puesto` correctamente asignados
   - `activo = true`
   - Todos los campos requeridos

2. **Verificar que hay 25 usuarios** (uno por cada tablet)

3. **Configurar RLS en Supabase** (si es necesario):
   ```sql
   -- Permitir lectura pública de usuarios activos
   CREATE POLICY "Allow read active users"
   ON usuarios FOR SELECT
   USING (activo = true);
   ```

## Próximos Pasos

- [ ] Implementar auto-login en `App.tsx`
- [ ] Añadir botón de logout
- [ ] Crear pantalla de gestión de usuarios/tablets
- [ ] Añadir sincronización periódica con Supabase
- [ ] Implementar modo offline completo
