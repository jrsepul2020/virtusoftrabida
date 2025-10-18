# 📋 INSTRUCCIONES PARA COMPLETAR LA CONFIGURACIÓN

## 🗄️ 1. CREAR TABLAS EN SUPABASE

### Opción A: SQL Editor de Supabase
1. Ve a tu proyecto en [supabase.com](https://supabase.com)
2. Ve a **SQL Editor** en el panel izquierdo
3. Crea una nueva query
4. Copia y pega el contenido del archivo `CREATE_TABLES.sql`
5. Ejecuta la query (botón RUN)

### Opción B: Comando a comando
Puedes ejecutar estos comandos uno por uno en el SQL Editor:

```sql
-- Crear tabla mesas
CREATE TABLE public.mesas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    numero INTEGER NOT NULL UNIQUE,
    nombre TEXT,
    capacidad INTEGER DEFAULT 8,
    ubicacion TEXT,
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear tabla catadores
CREATE TABLE public.catadores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre TEXT NOT NULL,
    rol TEXT,
    mesa INTEGER,
    puesto INTEGER,
    ntablet TEXT,
    estado TEXT DEFAULT 'activo',
    email TEXT,
    telefono TEXT,
    especialidad TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Deshabilitar RLS
ALTER TABLE public.mesas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.catadores DISABLE ROW LEVEL SECURITY;
```

## 🎯 2. VERIFICAR FUNCIONAMIENTO

### En la aplicación (http://localhost:5173/):
1. Accede al **Panel de Administración**
2. Ve a **"Catadores"** - deberías ver la nueva estructura con los campos:
   - **Línea principal**: Catador, Rol, Mesa, Puesto, Tablet, Estado
   - **Línea secundaria**: Email, teléfono, especialidad (menos destacados)
3. Ve a **"Mesas"** - deberías ver las mesas creadas en Supabase

## ✨ 3. NUEVAS FUNCIONALIDADES IMPLEMENTADAS

### 👥 Pantalla de Catadores:
- **Campos principales**: nombre, rol, mesa, puesto, ntablet, estado
- **Campos secundarios**: email, teléfono, especialidad (en línea menos destacada)
- **Roles disponibles**: Catador Principal, Catador Auxiliar, Presidente, Secretario, Observador
- **Estados**: activo, inactivo, presente, ausente
- **Asignación**: mesa y puesto específicos
- **Tablet**: número identificativo de tablet

### 🍽️ Pantalla de Mesas:
- **CRUD completo**: crear, editar, eliminar mesas
- **Campos**: número, nombre, capacidad, ubicación, estado
- **Búsqueda**: por número, nombre o ubicación
- **Responsive**: tabla en desktop, cards en mobile

## 🔧 4. DATOS DE PRUEBA

Si ejecutaste el script completo, ya tienes datos de ejemplo:

### Mesas:
- Mesa 1: Mesa Principal (8 puestos, Sala A)
- Mesa 2: Mesa Secundaria (8 puestos, Sala A)
- Mesa 3: Mesa Terciaria (6 puestos, Sala B)
- Mesa 4: Mesa Cuarta (8 puestos, Sala B)
- Mesa 5: Mesa Quinta (4 puestos, Sala C)

### Catadores:
- Ana García (Catador Principal, Mesa 1, Puesto 1, TAB001)
- Carlos López (Catador Principal, Mesa 1, Puesto 2, TAB002)
- María Rodríguez (Presidente, Mesa 2, Puesto 1, TAB003)
- José Martínez (Catador Auxiliar, Mesa 2, Puesto 2, TAB004)
- Laura Sánchez (Secretario, Mesa 3, Puesto 1, TAB005)
- Antonio Ruiz (Observador, Mesa 3, Puesto 2, TAB006)

## ❗ 5. SOLUCIÓN DE PROBLEMAS

### Si las mesas aparecen vacías:
1. Verifica que las tablas se crearon en Supabase
2. Revisa que RLS esté deshabilitado
3. Comprueba la conexión a Supabase en `src/lib/supabase.ts`

### Si hay errores en catadores:
1. Asegúrate de que la tabla tiene todos los nuevos campos
2. Refresca la página después de crear las tablas

## 🎯 6. RESULTADO FINAL

Una vez completado, tendrás:
- ✅ Dos pantallas separadas en el menú admin
- ✅ Catadores con información de rol, mesa, puesto y tablet
- ✅ Mesas funcionando con datos de Supabase
- ✅ Formularios completos para crear/editar
- ✅ Diseño responsive en ambas pantallas