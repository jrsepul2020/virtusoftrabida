# Acceso de Administrador - Sistema Simplificado

## Resumen
Sistema de acceso directo mediante **link secreto** - sin necesidad de email/contraseña. Los administradores solo necesitan guardar el link como marcador.

---

## Para Administradores: Cómo Acceder

### Opción 1: Link Secreto (Recomendado - MÁS SIMPLE)
El técnico te proporcionará un link personalizado del tipo:

```
https://www.internationalawardsvirtus.com/?admin_token=tu-token-secreto-aqui
```

**Instrucciones:**
1. Abre el link en tu navegador
2. Acceso **inmediato** al panel de administración (sin login)
3. Guarda el link como marcador/favorito para acceso con un click

**Ventajas:**
- ✅ No necesitas recordar contraseñas
- ✅ Acceso en un solo click
- ✅ Funciona desde cualquier dispositivo con el link
- ✅ La sesión persiste ~7 días (te mantiene logueado)

**Seguridad:**
- ⚠️ NO compartas este link con nadie
- ⚠️ Si crees que el link ha sido comprometido, pide al técnico que genere uno nuevo
- 💡 Guarda el link en un gestor de contraseñas o marcador privado del navegador

---

### Opción 2: Login Tradicional (Backup)
Si prefieres usar email/contraseña:

```
https://www.internationalawardsvirtus.com/#admin
```

El técnico habrá creado credenciales para ti en Supabase.

---

## Para Técnicos: Configuración Inicial

### Paso 1: Generar Token de Acceso
Crea un token secreto único y fuerte:

```bash
# Generar token aleatorio de 32 caracteres
openssl rand -hex 32

# O con Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Guarda este token de forma segura** - lo necesitarás en el siguiente paso.

### Paso 2: Configurar Variables de Entorno

**En Desarrollo (`.env.local`):**
```bash
# Token para acceso directo admin
ADMIN_ACCESS_TOKEN=token-generado-en-paso-1

# Supabase credentials
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key

# URL de la app (para redirects)
VITE_APP_URL=http://localhost:3000
```

**En Producción (Vercel/Host):**
1. Ve al panel de tu hosting
2. Settings → Environment Variables
3. Añade las mismas variables (con valores de producción)
4. `VITE_APP_URL` debe ser tu dominio real: `https://www.internationalawardsvirtus.com`

### Paso 3: Crear Usuario Admin en Supabase

Aunque el acceso es por token, necesitas al menos un usuario admin en la base de datos:

**Opción A - Script Automático:**
```bash
node crear-admin.mjs admin@internationalvirtus.es "Administrador Principal"
```

**Opción B - Manual en Supabase Dashboard:**
1. Authentication → Users → "Add User"
2. Email: `admin@internationalvirtus.es`
3. Password: (cualquiera, no se usará)
4. Confirmar email: ✓
5. Table Editor → `usuarios` → INSERT:
   ```sql
   INSERT INTO usuarios (id, email, nombre, rol)
   VALUES ('UUID-del-usuario', 'admin@internationalvirtus.es', 'Admin', 'Administrador');
   ```

### Paso 4: Generar Links para Administradores

Una vez configurado, genera el link para cada administrador:

```
https://www.internationalawardsvirtus.com/?admin_token=TOKEN_DEL_PASO_1
```

**Importante:**
- Usa el mismo `ADMIN_ACCESS_TOKEN` para todos los admins (es un token compartido)
- Si quieres tokens individuales por admin, genera múltiples tokens y configúralos en el endpoint

**Compartir el link de forma segura:**
- Enviarlo por mensaje cifrado (Signal, WhatsApp con mensajes temporales)
- Usar gestor de contraseñas compartido (1Password Teams)
- NO enviar por email sin cifrar

### Paso 5: Verificar Acceso

1. Abre el link generado en tu navegador
2. Debe redirigir al panel admin inmediatamente
3. La sesión debe persistir ~7 días
4. Tras expirar, el admin solo hace click en el marcador de nuevo

---

## Cómo Funciona (Técnico)

1. Admin abre URL con `?admin_token=SECRET`
2. Frontend detecta el parámetro y llama a `/api/admin-auth?token=SECRET`
3. Endpoint valida token contra `ADMIN_ACCESS_TOKEN`
4. Si válido, genera sesión Supabase para el primer usuario admin de la DB
5. Devuelve `access_token` + `refresh_token` al frontend
6. Frontend establece sesión con `supabase.auth.setSession()`
7. Redirige a panel admin
8. URL se limpia (elimina `admin_token` por seguridad)

**Archivo clave:** `api/admin-auth.ts`

---

## Seguridad

### Token de Acceso
- El token es un secreto compartido entre todos los administradores
- Si se compromete, genera uno nuevo y actualiza la variable de entorno
- No expongas el token en repositorios públicos, logs o mensajes sin cifrar

### Rotación de Token
Si necesitas cambiar el token (por seguridad):

1. Genera nuevo token: `openssl rand -hex 32`
2. Actualiza `ADMIN_ACCESS_TOKEN` en el servidor
3. Redeploy la aplicación
4. Genera nuevos links y distribúyelos a los admins
5. Los links antiguos dejarán de funcionar

### Sesiones
- Las sesiones generadas duran ~7 días por defecto
- Tras expirar, el admin hace click en el link guardado
- No se requiere re-autenticación manual

### Recuperación de Acceso
Si un admin pierde su link:
- El técnico genera un nuevo link con el mismo token
- O envía el link original de nuevo de forma segura

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

### Error: "Token inválido"
- Verifica que el link tiene el token completo (no truncado)
- Confirma que `ADMIN_ACCESS_TOKEN` está configurado en el servidor
- Verifica que el token en el link coincide con el del servidor

### Error: "No admin user configured"
- No hay usuarios con rol `Administrador` o `Presidente` en la tabla `usuarios`
- Ejecuta `node crear-admin.mjs` o crea un usuario manualmente

### El link no hace nada
- Abre DevTools (F12) → Console → busca errores
- Verifica que `/api/admin-auth` responde (Network tab)
- Confirma que las variables de Supabase están configuradas

### La sesión expira muy rápido
- Sesiones por defecto duran 7 días
- Si expira antes: verificar configuración de Supabase Auth
- El admin simplemente hace click en el link de nuevo

### Acceso desde múltiples dispositivos
- El mismo link funciona desde cualquier dispositivo
- Cada dispositivo tendrá su propia sesión
- El token es compartido, las sesiones son independientes

---

## Variables de Entorno (Técnico)

### Local (`.env.local`)
```bash
# Token de acceso admin (genera con: openssl rand -hex 32)
ADMIN_ACCESS_TOKEN=tu-token-secreto-aqui

# Supabase
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key

# URL de la aplicación
VITE_APP_URL=http://localhost:3000

# Brevo (opcional, para emails)
BREVO_API_KEY=tu-brevo-key
SENDER_EMAIL=info@internationalvirtus.es
```

### Producción (Vercel/Host)
Asegura que estas variables están configuradas en el panel del hosting:
- `ADMIN_ACCESS_TOKEN` ⚠️ **CRÍTICO**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **CRÍTICO - Service Role**
- `VITE_APP_URL` (tu dominio de producción)

---

## Ejemplo de Uso Completo

### Setup Inicial (Técnico)
```bash
# 1. Generar token
TOKEN=$(openssl rand -hex 32)
echo "Token generado: $TOKEN"

# 2. Añadir a .env.local
echo "ADMIN_ACCESS_TOKEN=$TOKEN" >> .env.local

# 3. Crear usuario admin
node crear-admin.mjs admin@internationalvirtus.es "Administrador Principal"

# 4. Generar link para admin
echo "Link de acceso: https://www.internationalawardsvirtus.com/?admin_token=$TOKEN"
```

### Uso Diario (Admin)
1. Click en marcador guardado: `https://.../?admin_token=xxx`
2. Acceso inmediato al panel
3. Trabajar normalmente
4. Cerrar navegador (sesión persiste)

---

## Contacto Soporte Técnico
Para problemas de acceso o creación de usuarios, contactar al equipo técnico con:
- Email del administrador
- Captura de pantalla del error (si aplica)
- Navegador y dispositivo usado

---

**Última actualización:** Diciembre 2025
