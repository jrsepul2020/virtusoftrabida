# Acceso de Administrador - Guía Completa

## Resumen
Sistema de acceso simplificado para administradores. Solo requiere crear usuarios en Supabase Auth y acceder vía URL directa.

---

## Para Administradores: Cómo Acceder

### Opción 1: URL Directa (Recomendado)
Añade `#admin` al final de la URL principal y guarda como marcador:

```
https://www.internationalawardsvirtus.com/#admin
```

Esto abre **directamente** el formulario de login sin pasos intermedios.

**Instrucciones:**
1. Abre la URL en tu navegador
2. Introduce tu email y contraseña (creados por el técnico en Supabase)
3. Acceso inmediato al panel de administración

**Tip:** Guarda esta URL como marcador/favorito para acceso con un click.

---

### Opción 2: Botón Desarrollo (Solo en entorno local)
Si trabajas en desarrollo local (`npm run dev`):
- El header muestra un botón "Admin local"
- Click → acceso directo al login

---

### Opción 3: Página de Desbloqueo (Backup)
Si necesitas usar el sistema antiguo:
```
https://www.internationalawardsvirtus.com/admin-unlock.html
```
Introduce el `ADMIN_ACCESS_SECRET` → redirige al login.

---

## Para Técnicos: Crear Usuarios Admin

### Paso 1: Acceder a Supabase Dashboard
1. Abre https://supabase.com/dashboard
2. Selecciona el proyecto: **virtusoftrabida** (o el nombre correspondiente)
3. Ve a **Authentication** → **Users**

### Paso 2: Crear Usuario Admin
Click en **"Add User"** o **"Invite User"** y completa:

- **Email:** `admin@internationalvirtus.es` (o el email del administrador)
- **Password:** Genera una contraseña segura (mínimo 8 caracteres, mayúsculas/minúsculas/números)
- **Email Confirm:** Marca como confirmado (bypass confirmation email)

**Importante:** Guarda la contraseña de forma segura (gestor de contraseñas).

### Paso 3: Asignar Rol en Base de Datos
Una vez creado el usuario, obtén su UUID desde la tabla de usuarios de Supabase Auth:

1. En Dashboard → **Authentication** → **Users** → Click en el usuario → Copia el **UUID**
2. Ve a **Table Editor** → Tabla `usuarios`
3. Inserta un registro:
   ```sql
   INSERT INTO usuarios (id, rol, nombre, email)
   VALUES (
     'UUID-DEL-USUARIO',  -- UUID copiado del Auth
     'Administrador',      -- Rol exacto (mayúscula)
     'Nombre Admin',
     'admin@internationalvirtus.es'
   );
   ```

**Roles válidos:**
- `Administrador` - acceso completo
- `Presidente` - acceso de supervisión
- `Supervisor` - gestión de catas
- `Catador` - solo panel de cata

### Paso 4: Verificar Acceso
1. Abre `https://www.internationalawardsvirtus.com/#admin`
2. Login con email/password del usuario creado
3. Debe redirigir al panel admin

---

## Seguridad

### Contraseñas
- Mínimo 8 caracteres
- Mezcla de mayúsculas, minúsculas, números y símbolos
- Nunca compartas contraseñas por email/chat sin cifrar
- Usa gestores de contraseñas (1Password, Bitwarden, LastPass)

### Recuperación de Contraseña
Si un admin olvida su contraseña:

1. **Vía Supabase Email (automático):**
   - En el login, usar función "Recuperar contraseña" (si implementada)
   
2. **Vía Dashboard (manual):**
   - Técnico accede a Supabase → Authentication → Users
   - Click en el usuario → **"Reset Password"**
   - Se envía email de recuperación al correo del usuario

---

## Dispositivos Fijos (Opcional)

Para administradores que usan siempre los mismos dispositivos:

### Navegador: Guardar Contraseña
- Chrome/Edge/Safari ofrecen guardar credenciales
- Marca "Recordar en este dispositivo" al hacer login
- La sesión de Supabase persiste ~7 días por defecto

### PWA: Instalar como App
La aplicación es PWA (Progressive Web App):
1. En Chrome/Edge móvil: Menú → "Añadir a pantalla de inicio"
2. En Safari iOS: Compartir → "Añadir a pantalla de inicio"
3. El ícono aparece como app nativa
4. Acceso rápido sin navegador

---

## Troubleshooting

### Error: "Email o contraseña incorrectos"
- Verifica email (no confundir mayúsculas/minúsculas)
- Verifica contraseña (copiar/pegar para evitar errores)
- Si persiste: resetear contraseña vía Dashboard

### Error: "Usuario sin rol asignado"
- El usuario existe en Auth pero NO en tabla `usuarios`
- Sigue **Paso 3** arriba para asignar rol

### No redirige a admin tras login
- Abre DevTools (F12) → Console → busca errores
- Verifica que el rol en DB sea exactamente `Administrador` (con mayúscula)
- Cierra sesión y vuelve a intentar

### Sesión expira constantemente
- Sesiones de Supabase duran ~7 días por defecto
- Si expira antes: problema de configuración de Supabase (contactar soporte)

---

## Variables de Entorno (Técnico)

### Local (`.env.local`)
```bash
# Supabase
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key

# Admin unlock (opcional, para admin-unlock.html)
ADMIN_ACCESS_SECRET=tu-secret-fuerte-aqui
```

### Producción (Vercel/Host)
Asegura que estas variables están configuradas en el panel del hosting:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `ADMIN_ACCESS_SECRET` (para endpoint de unlock, opcional)

---

## Contacto Soporte Técnico
Para problemas de acceso o creación de usuarios, contactar al equipo técnico con:
- Email del administrador
- Captura de pantalla del error (si aplica)
- Navegador y dispositivo usado

---

**Última actualización:** Diciembre 2025
