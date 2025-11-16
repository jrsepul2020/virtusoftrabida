# Guía de Integración de Consultas Supabase

## 📋 Resumen

Esta guía explica cómo realizar consultas a Supabase dentro de tu aplicación React de forma eficiente y mantenible.

## 🔑 Conceptos Importantes

### ❌ MCP NO es para aplicaciones en producción
- **MCP (Model Context Protocol)** es solo para herramientas de desarrollo (VS Code, Cursor)
- **NO** se puede integrar directamente en tu aplicación React
- **SÍ** debes usar `@supabase/supabase-js` (ya lo tienes instalado)

### ✅ Ya tienes la configuración correcta

Tu archivo `src/lib/supabase.ts` ya está configurado correctamente:

```typescript
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

## 🚀 Nuevas Herramientas Creadas

### 1. **Query Helpers** (`src/lib/supabaseQueries.ts`)

Funciones reutilizables para todas tus consultas:

```typescript
import * as queries from './lib/supabaseQueries';

// Obtener todas las empresas
const companies = await queries.getAllCompanies();

// Crear una muestra
const sample = await queries.createSample({
  nombre: 'Muestra 1',
  empresa_id: '123'
});

// Buscar empresas
const results = await queries.searchCompanies('aceite');
```

**Beneficios:**
- ✅ Type-safe (TypeScript)
- ✅ Manejo consistente de errores
- ✅ Código reutilizable
- ✅ Fácil de mantener

### 2. **React Hooks** (`src/lib/useSupabaseQuery.ts`)

Hooks personalizados para usar en componentes React:

```typescript
import { useCompanies, useSamples } from './lib/useSupabaseQuery';

function MyComponent() {
  const { data, loading, error, refetch } = useCompanies();

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data?.map(company => (
        <div key={company.id}>{company.name}</div>
      ))}
    </div>
  );
}
```

**Beneficios:**
- ✅ Manejo automático de loading/error
- ✅ Revalidación con `refetch()`
- ✅ Sintaxis React estándar
- ✅ Actualización automática del componente

## 📚 Ejemplos de Uso

### Ejemplo 1: Listar Empresas

```typescript
import { useCompanies } from './lib/useSupabaseQuery';

function CompaniesList() {
  const { data: companies, loading, error } = useCompanies();

  if (loading) return <p>Cargando...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <ul>
      {companies?.map(c => <li key={c.id}>{c.name}</li>)}
    </ul>
  );
}
```

### Ejemplo 2: Crear Muestra

```typescript
import { createSample } from './lib/supabaseQueries';

async function handleCreateSample(data) {
  try {
    const sample = await createSample({
      nombre: data.nombre,
      categoria: data.categoria,
      empresa_id: data.empresaId
    });
    
    alert('Muestra creada!');
  } catch (error) {
    alert('Error: ' + error.message);
  }
}
```

### Ejemplo 3: Búsqueda en Tiempo Real

```typescript
import { useState } from 'react';
import { useSearchCompanies } from './lib/useSupabaseQuery';

function SearchCompanies() {
  const [query, setQuery] = useState('');
  const { data: results, loading } = useSearchCompanies(query);

  return (
    <div>
      <input 
        value={query} 
        onChange={(e) => setQuery(e.target.value)} 
        placeholder="Buscar..."
      />
      {loading && <p>Buscando...</p>}
      {results?.map(r => <div key={r.id}>{r.name}</div>)}
    </div>
  );
}
```

### Ejemplo 4: Realtime Subscriptions

```typescript
import { useEffect } from 'react';
import { supabase } from './lib/supabase';
import { useSamples } from './lib/useSupabaseQuery';

function RealtimeSamples() {
  const { data: samples, refetch } = useSamples();

  useEffect(() => {
    const channel = supabase
      .channel('samples-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'muestras'
      }, () => {
        refetch(); // Recargar cuando hay cambios
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [refetch]);

  return (
    <div>
      {samples?.map(s => <div key={s.id}>{s.nombre}</div>)}
    </div>
  );
}
```

## 🎯 Funciones Disponibles

### Empresas (Companies)

| Función | Descripción |
|---------|-------------|
| `getAllCompanies()` | Obtener todas las empresas |
| `getCompanyById(id)` | Obtener empresa por ID |
| `getMyCompany()` | Obtener empresa del usuario autenticado |
| `createCompany(data)` | Crear nueva empresa |
| `updateCompany(id, data)` | Actualizar empresa |
| `deleteCompany(id)` | Eliminar empresa |
| `searchCompanies(query)` | Buscar por nombre o email |

### Muestras (Samples)

| Función | Descripción |
|---------|-------------|
| `getAllSamples()` | Obtener todas las muestras |
| `getSampleById(id)` | Obtener muestra por ID |
| `getSamplesByCompany(companyId)` | Muestras de una empresa |
| `getSamplesWithCompany()` | Muestras con datos de empresa |
| `createSample(data)` | Crear nueva muestra |
| `updateSample(id, data)` | Actualizar muestra |
| `deleteSample(id)` | Eliminar muestra |
| `searchSamples(query)` | Buscar por nombre o código |
| `getSamplesByTanda(tanda)` | Obtener por tanda |

### Catadores (Tasters)

| Función | Descripción |
|---------|-------------|
| `getAllCatadores()` | Obtener todos los catadores |
| `getActiveCatadores()` | Obtener solo activos |
| `createCatador(data)` | Crear nuevo catador |
| `updateCatador(id, data)` | Actualizar catador |

### Estadísticas

| Función | Descripción |
|---------|-------------|
| `getGeneralStats()` | Estadísticas generales |
| `getSamplesByCategory()` | Agrupar por categoría |

### Autenticación

| Función | Descripción |
|---------|-------------|
| `getCurrentUser()` | Obtener usuario actual |
| `isAuthenticated()` | Verificar autenticación |
| `signOut()` | Cerrar sesión |

## 🎨 Hooks Disponibles

| Hook | Descripción |
|------|-------------|
| `useCompanies()` | Lista de empresas |
| `useCompany(id)` | Empresa por ID |
| `useMyCompany()` | Empresa del usuario |
| `useSearchCompanies(query)` | Búsqueda de empresas |
| `useSamples()` | Lista de muestras |
| `useSample(id)` | Muestra por ID |
| `useCompanySamples(companyId)` | Muestras de empresa |
| `useSamplesWithCompany()` | Muestras con empresa |
| `useSearchSamples(query)` | Búsqueda de muestras |
| `useSamplesByTanda(tanda)` | Muestras por tanda |
| `useCatadores()` | Lista de catadores |
| `useActiveCatadores()` | Catadores activos |
| `useGeneralStats()` | Estadísticas generales |
| `useSamplesByCategory()` | Muestras por categoría |
| `useAuth()` | Usuario autenticado |

## 📖 Documentación Oficial

- [Supabase JS Client](https://supabase.com/docs/reference/javascript/introduction)
- [Queries](https://supabase.com/docs/reference/javascript/select)
- [Realtime](https://supabase.com/docs/guides/realtime)
- [Authentication](https://supabase.com/docs/guides/auth)

## 🔒 Seguridad

Recuerda que:

1. **RLS (Row Level Security)** debe estar habilitado en producción
2. Solo usa `VITE_SUPABASE_ANON_KEY` en el frontend (no service role key)
3. Las políticas RLS controlan qué datos puede acceder cada usuario
4. Nunca expongas credenciales sensibles en el código

## 💡 Mejores Prácticas

1. **Usa los hooks** para componentes React
2. **Usa las funciones** para lógica fuera de componentes
3. **Centraliza** todas las consultas en `supabaseQueries.ts`
4. **Maneja errores** siempre con try/catch
5. **Type safety** usa los tipos de `src/lib/supabase.ts`
6. **Realtime** solo donde sea necesario (consume recursos)

## 🚨 Errores Comunes

### Error: "Missing Supabase environment variables"
**Solución:** Verifica que `.env` tenga `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`

### Error: "Row level security policy violation"
**Solución:** Aplica la migración de seguridad o verifica las políticas RLS

### Error: "Cannot read property 'map' of null"
**Solución:** Usa optional chaining: `data?.map(...)` en lugar de `data.map(...)`

## 📞 Soporte

Si necesitas ayuda:
1. Revisa la documentación de Supabase
2. Verifica los ejemplos en `src/examples/SupabaseQueryExamples.tsx`
3. Usa las devtools del navegador para ver errores de red
4. Revisa los logs de Supabase en el dashboard
