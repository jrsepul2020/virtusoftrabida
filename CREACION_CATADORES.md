# Sistema de Puntuaciones - Guía de Creación de Catadores

## 🔐 IMPORTANTE: Creación de Usuarios

### ¿Cómo funcionan los usuarios ahora?

El sistema ahora crea usuarios **automáticamente en dos lugares**:

1. **Supabase Authentication** (para login)
2. **Tabla `usuarios`** (para datos adicionales: mesa, puesto, rol)

---

## 📝 PASOS PARA CREAR CATADORES

### Opción 1: Desde la Aplicación (RECOMENDADO)

1. **Login como Admin**
   - http://localhost:3004
   - Email: `jrsepu2000@gmail.com`
   - Password: [tu contraseña]

2. **Ir a "Catadores"**
   - Menú lateral → Icono 👥 "Catadores"

3. **Click "Nuevo Catador"**

4. **Completar formulario:**
   - **Email*** (obligatorio): `catador1@test.com`
   - **Contraseña*** (obligatorio, mín 6 caracteres): `test123`
   - **Nombre*** (obligatorio): `Ana García`
   - Código: (opcional)
   - País: `España`
   - **Rol**: `Catador`
   - **Mesa**: `1`
   - **Puesto**: `1`
   - Tablet: (opcional)

5. **Guardar**
   - ✅ Se crea usuario en Supabase Auth automáticamente
   - ✅ Se guarda en tabla `usuarios` con ID sincronizado
   - ✅ Puede hacer login inmediatamente

6. **Repetir para 4 catadores más** (Mesa 1, Puestos 2-5)

---

### Opción 2: Manualmente en Supabase (NO RECOMENDADO)

⚠️ **Solo si tienes problemas con la aplicación:**

**Paso 1: Crear en Authentication**
1. Supabase Dashboard → Authentication → Users
2. Click "Add user" → Email → "Create user"
3. Email: `catador1@test.com`
4. Password: `test123`
5. Auto Confirm User: `ON`
6. **Anotar el User ID** (ej: `a1b2c3d4-...`)

**Paso 2: Insertar en tabla `usuarios`**
```sql
INSERT INTO usuarios (id, nombre, email, rol, mesa, puesto)
VALUES (
  'a1b2c3d4-...', -- User ID de Authentication
  'Ana García',
  'catador1@test.com',
  'Catador',
  1,
  1
);
```

**Paso 3: Repetir para otros catadores**

---

## ✅ VERIFICACIÓN

### 1. Verificar en Supabase Authentication

**Dashboard → Authentication → Users**

Deberías ver:
```
✉️ catador1@test.com  →  ✓ Confirmed
✉️ catador2@test.com  →  ✓ Confirmed
✉️ catador3@test.com  →  ✓ Confirmed
✉️ catador4@test.com  →  ✓ Confirmed
✉️ catador5@test.com  →  ✓ Confirmed
```

### 2. Verificar en tabla `usuarios`

**SQL Editor:**
```sql
SELECT id, nombre, email, rol, mesa, puesto 
FROM usuarios 
WHERE rol = 'Catador'
ORDER BY mesa, puesto;
```

Deberías ver:
```
id                | nombre        | email              | rol     | mesa | puesto
------------------|---------------|-------------------|---------|------|-------
a1b2c3d4-...      | Ana García    | catador1@test.com | Catador | 1    | 1
e5f6g7h8-...      | Pedro López   | catador2@test.com | Catador | 1    | 2
i9j0k1l2-...      | María Ruiz    | catador3@test.com | Catador | 1    | 3
m3n4o5p6-...      | Juan Martín   | catador4@test.com | Catador | 1    | 4
q7r8s9t0-...      | Laura Sánchez | catador5@test.com | Catador | 1    | 5
```

### 3. Probar Login

1. Logout del admin
2. Click "Administración"
3. Email: `catador1@test.com`
4. Password: `test123`
5. ✅ Deberías ver **CatadorDashboard** (no AdminDashboard)
6. ✅ Header muestra: "Ana García - Mesa 1"

---

## 🔧 SOLUCIÓN DE PROBLEMAS

### Error: "Invalid login credentials"

**Causa:** Usuario no existe en Supabase Auth o email no confirmado

**Solución:**
1. Verificar en Authentication → Users que el email existe
2. Verificar que "Confirmed" está en `✓`
3. Si no está confirmado:
   ```sql
   -- En SQL Editor (requiere permisos admin)
   UPDATE auth.users 
   SET email_confirmed_at = NOW() 
   WHERE email = 'catador1@test.com';
   ```

### Error: "User not found" al puntuar

**Causa:** Usuario existe en Auth pero no en tabla `usuarios`

**Solución:**
```sql
-- Obtener User ID de Authentication
SELECT id FROM auth.users WHERE email = 'catador1@test.com';

-- Insertar en tabla usuarios con ese ID
INSERT INTO usuarios (id, nombre, email, rol, mesa, puesto)
VALUES (
  '[USER_ID_OBTENIDO]',
  'Ana García',
  'catador1@test.com',
  'Catador',
  1,
  1
);
```

### Error: "No tienes mesa asignada"

**Causa:** Campo `mesa` es NULL

**Solución:**
```sql
UPDATE usuarios 
SET mesa = 1 
WHERE email = 'catador1@test.com';
```

### Error al crear: "duplicate key value violates unique constraint"

**Causa:** El email ya existe en Authentication

**Solución:**
1. Eliminar usuario existente en Authentication → Users
2. O usar otro email diferente

---

## 📋 CAMPOS DEL FORMULARIO

| Campo       | Tipo      | Obligatorio | Editable | Notas                              |
|-------------|-----------|-------------|----------|-------------------------------------|
| Email       | text      | Sí (nuevo)  | No       | Solo para nuevos usuarios          |
| Contraseña  | password  | Sí (nuevo)  | No       | Solo aparece al crear, mín 6 chars |
| Nombre      | text      | Sí          | Sí       | Nombre completo del catador        |
| Código      | text      | No          | Sí       | Código interno opcional            |
| País        | text      | No          | Sí       | País de origen                     |
| Rol         | select    | No          | Sí       | Admin / Presidente / Catador       |
| Mesa        | select    | No          | Sí       | Mesa asignada (1-5)                |
| Puesto      | select    | No          | Sí       | Puesto en la mesa (1-5)            |
| Tablet      | select    | No          | Sí       | Tablet asignada (1-25)             |

---

## 🚀 FLUJO COMPLETO DE PRUEBA

**1. Crear 5 catadores** (según instrucciones arriba)

**2. Inscribir muestra:**
   - Admin → "Nueva Inscripción"
   - Nombre: "Vino Reserva 2024"
   - Empresa: Cualquiera
   - Categoría: "Crianza"

**3. Asignar a Mesa 1:**
   - Admin → "Mesas"
   - Arrastrar muestra a Mesa 1

**4. Puntuar como cada catador:**
   - Login → catador1@test.com / test123
   - Puntuar: 95 pts + notas
   - Logout
   - Repetir con catadores 2-5

**5. Ver resultados:**
   - Login como admin
   - "Resultados Catas" 🏆
   - Ver promedio y medalla
   - Exportar CSV

---

## 🎯 RESUMEN

**ANTES:** Solo se creaba registro en tabla `usuarios` → No podían hacer login

**AHORA:** 
1. Se crea usuario en **Supabase Auth** (para autenticación)
2. Se crea registro en tabla **usuarios** (para datos adicionales)
3. Ambos usan el **mismo ID** (sincronizados)
4. Los catadores pueden **hacer login inmediatamente**

**Email y contraseña solo se piden al CREAR** un nuevo catador, no al editar.

---

## 📞 SOPORTE

Si encuentras errores:
1. Revisar consola del navegador (F12)
2. Revisar logs de Supabase (Dashboard → Logs)
3. Verificar políticas RLS están activas
4. Confirmar que la migración SQL se ejecutó correctamente
