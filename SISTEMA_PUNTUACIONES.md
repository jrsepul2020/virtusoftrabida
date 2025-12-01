# Sistema de Puntuaciones y Medallas

## Descripción General

Sistema completo para la cata y puntuación de muestras de vino, con asignación automática de medallas según criterios configurables.

## Estructura de Base de Datos

### Tabla: `puntuaciones_catadores`
Almacena las puntuaciones individuales de cada catador para cada muestra.

```sql
- id: UUID (PK)
- muestra_id: INTEGER (FK → muestras)
- catador_id: UUID (FK → catadores)
- mesa_id: INTEGER (FK → mesas)
- puntuacion: DECIMAL(4,2) [0-100]
- notas: TEXT
- created_at, updated_at: TIMESTAMPTZ
- CONSTRAINT UNIQUE(muestra_id, catador_id) -- Un catador puntúa cada muestra una sola vez
```

### Tabla: `configuracion_medallas`
Define los criterios de puntuación para otorgar medallas.

```sql
- id: SERIAL (PK)
- medalla: VARCHAR(20) UNIQUE (ej: 'Oro', 'Plata', 'Bronce')
- puntuacion_minima: DECIMAL(5,2)
- puntuacion_maxima: DECIMAL(5,2)
- color_hex: VARCHAR(7) (ej: '#FFD700')
- orden: INTEGER (prioridad de asignación)
- activo: BOOLEAN
- created_at, updated_at: TIMESTAMPTZ
```

**Valores por defecto:**
- Oro: 90.00 - 100.00 (#FFD700)
- Plata: 80.00 - 89.99 (#C0C0C0)
- Bronce: 70.00 - 79.99 (#CD7F32)

### Campos agregados a `muestras`

```sql
- puntuacion_total: DECIMAL(5,2) -- Promedio automático de las 5 puntuaciones
- medalla: VARCHAR(20) -- Asignada automáticamente según configuracion_medallas
- num_puntuaciones: INTEGER -- Contador de puntuaciones recibidas
- catada: BOOLEAN -- TRUE cuando num_puntuaciones >= 5
```

## Funcionamiento Automático

### Trigger: `trigger_calcular_puntuacion`
Se ejecuta automáticamente después de cada INSERT/UPDATE/DELETE en `puntuaciones_catadores`:

1. Cuenta el número total de puntuaciones para la muestra
2. Calcula el promedio de todas las puntuaciones
3. Actualiza `muestras.num_puntuaciones` con el contador
4. Actualiza `muestras.puntuacion_total` con el promedio
5. Si `num_puntuaciones >= 5`:
   - Marca `muestras.catada = TRUE`
   - Asigna medalla según `configuracion_medallas` (busca por orden donde el promedio esté en el rango)
6. Si `num_puntuaciones < 5`:
   - `muestras.medalla = NULL`

### Vista: `vista_puntuaciones_resumen`
Proporciona una vista consolidada de todas las muestras con sus puntuaciones:

```sql
SELECT * FROM vista_puntuaciones_resumen;
```

Retorna:
- Información de la muestra (codigo, nombre, categoria)
- Información de empresa
- num_puntuaciones, puntuacion_total, medalla, catada
- puntuaciones_detalle: JSON array con todas las puntuaciones individuales (catador, puntuacion, notas, fecha)

## Configuración en Pantalla de Administración

### Ubicación
`ConfiguracionManager.tsx` → Sección "Configuración de Medallas"

### Funcionalidades

1. **Ver Medallas Configuradas**
   - Lista de todas las medallas con su rango de puntos
   - Indicador visual del color
   - Estado activo/inactivo

2. **Editar Medalla**
   - Cambiar nombre
   - Ajustar puntuación mínima/máxima
   - Modificar color (selector de color + input hex)
   - Cambiar orden de prioridad

3. **Crear Nueva Medalla**
   - Formulario para añadir nuevas categorías
   - Validación de rangos (min < max, 0-100)
   - Asignación automática de orden

4. **Activar/Desactivar Medalla**
   - Toggle rápido sin eliminar configuración
   - Solo medallas activas se consideran en la asignación

5. **Eliminar Medalla**
   - Confirmación antes de borrar
   - Afecta futuras asignaciones, no retroactivo

## Políticas de Seguridad (RLS)

### `puntuaciones_catadores`
- **Catadores**: Pueden ver y crear sus propias puntuaciones
- **Catadores**: Pueden actualizar sus propias puntuaciones (útil si se permite corrección)
- **Admins**: Acceso total (SELECT, INSERT, UPDATE, DELETE)

### `configuracion_medallas`
- **Todos**: Pueden leer la configuración (SELECT)
- **Solo Admins**: Pueden modificar (INSERT, UPDATE, DELETE)

## Flujo de Trabajo

1. **Inscripción**: Empresas inscriben muestras
2. **Recepción**: Admin marca muestras como recibidas (Chequeo)
3. **Asignación**: Admin asigna muestras a mesas y catadores
4. **Cata**: Catadores acceden a su dashboard y puntúan muestras
5. **Cálculo Automático**: Trigger calcula promedio al llegar a 5 puntuaciones
6. **Asignación de Medalla**: Sistema asigna medalla según `configuracion_medallas`
7. **Consulta**: Admin ve resultados en gestión de muestras (puntuacion_total, medalla)

## Próximos Pasos

Para completar el sistema, se necesita:

1. **Interfaz de Catador** (CatadorDashboard.tsx):
   - Mostrar muestras asignadas a su mesa
   - Formulario de puntuación (0-100, textarea para notas)
   - Guardar en `puntuaciones_catadores`

2. **Vista de Resultados** (Admin):
   - Tabla con muestras, puntuación total y medalla
   - Filtros por medalla, categoría
   - Exportar resultados a Excel/PDF
   - Detalle de puntuaciones individuales por muestra

3. **Estadísticas**:
   - Gráficas de distribución de medallas
   - Promedio por categoría
   - Consistencia de catadores (desviación estándar)

## Archivos Creados/Modificados

- `supabase/migrations/20251130000001_create_puntuaciones_system.sql` ✅
- `src/components/ConfiguracionManager.tsx` ✅
- `SISTEMA_PUNTUACIONES.md` ✅ (este archivo)

## Comandos SQL para Ejecutar

```sql
-- En Supabase SQL Editor:
-- 1. Ejecutar la migración completa
\i supabase/migrations/20251130000001_create_puntuaciones_system.sql

-- 2. Verificar tablas creadas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('puntuaciones_catadores', 'configuracion_medallas');

-- 3. Verificar medallas por defecto
SELECT * FROM configuracion_medallas ORDER BY orden;

-- 4. Verificar columnas en muestras
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'muestras' 
AND column_name IN ('puntuacion_total', 'medalla', 'num_puntuaciones', 'catada');
```

## Ejemplo de Uso

```typescript
// Catador puntúa una muestra
const { data, error } = await supabase
  .from('puntuaciones_catadores')
  .insert({
    muestra_id: 123,
    catador_id: 'uuid-catador',
    mesa_id: 5,
    puntuacion: 87.5,
    notas: 'Excelente equilibrio, aroma intenso a frutas rojas.'
  });

// El trigger automáticamente:
// 1. Actualiza num_puntuaciones en muestras
// 2. Recalcula puntuacion_total (promedio)
// 3. Asigna medalla si num_puntuaciones >= 5

// Consultar resultados
const { data: results } = await supabase
  .from('vista_puntuaciones_resumen')
  .select('*')
  .eq('catada', true)
  .order('puntuacion_total', { ascending: false });
```
