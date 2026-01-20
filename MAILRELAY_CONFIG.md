# Configuración de Mailrelay

Este documento explica cómo configurar la sincronización con Mailrelay para enviar contactos automáticamente.

## Variables de Entorno Necesarias

Debes configurar estas variables en **Vercel** (no en el código):

### 1. MAILRELAY_API_KEY
**¿Qué es?** El token de API de tu cuenta Mailrelay.

**¿Dónde lo obtengo?**
1. Inicia sesión en tu cuenta de Mailrelay
2. Ve a **Configuración** → **API**
3. Copia tu **API Key**

**Ejemplo:** `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

---

### 2. MAILRELAY_API_BASE
**¿Qué es?** La URL base de la API de Mailrelay de tu cuenta.

**Valor:** `https://TUSUBDOMINIO.ip-zone.com/api/v1`

Reemplaza `TUSUBDOMINIO` con el subdominio de tu cuenta Mailrelay.

**Ejemplo:** `https://miempresa.ip-zone.com/api/v1`

---

### 3. MAILRELAY_LIST_ID
**¿Qué es?** El ID de la lista de contactos donde quieres agregar los inscritos.

**¿Dónde lo obtengo?**
1. En Mailrelay, ve a **Contactos** → **Listas**
2. El ID aparece en la URL o en los detalles de la lista

**Ejemplo:** `12345`

---

### 4. MAILRELAY_ADMIN_SECRET ⚠️ **ESTE ES EL QUE NECESITAS**
**¿Qué es?** Una contraseña de seguridad que **TÚ DEFINES** para proteger el endpoint de sincronización.

**NO ES** el API Key de Mailrelay. Es una contraseña secreta que tú inventas para que solo personas autorizadas puedan ejecutar la sincronización.

**Cómo crearlo:**
- Inventa una contraseña segura y única
- Puede ser cualquier texto: `mi-secreto-super-seguro-2025`
- Guárdala en Vercel como variable de entorno
- Usa esta misma contraseña cuando te la pida el sistema

**Ejemplo:** `virtus-mailrelay-secret-2026-XyZ123`

---

## Configuración en Vercel

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com)
2. Navega a **Settings** → **Environment Variables**
3. Añade las 4 variables:

```
MAILRELAY_API_KEY=tu_api_key_de_mailrelay
MAILRELAY_API_BASE=https://tusubdominio.ip-zone.com/api/v1
MAILRELAY_LIST_ID=12345
MAILRELAY_ADMIN_SECRET=virtus-mailrelay-secret-2026-XyZ123
```

4. Guarda los cambios
5. Redespliega tu aplicación (Vercel lo hace automáticamente)

---

## Uso del Sistema

### Desde la Interfaz Web

1. Ve al panel de administración
2. Haz click en la pestaña **Mailrelay**
3. Cuando te pida el "secret", introduce el valor que definiste en `MAILRELAY_ADMIN_SECRET`
4. Haz click en **Sincronizar**

### Alternativa para Desarrollo (Opcional)

Si trabajas en desarrollo local y no quieres introducir el secreto cada vez:

1. Crea un archivo `.env.local` en la raíz del proyecto
2. Añade:
```
VITE_MAILRELAY_ADMIN_SECRET=virtus-mailrelay-secret-2026-XyZ123
```

⚠️ **NUNCA** subas este archivo a GitHub. Ya está en `.gitignore`.

---

## Solución de Problemas

### "Unauthorized: missing or invalid admin secret"
- Verifica que hayas configurado `MAILRELAY_ADMIN_SECRET` en Vercel
- Asegúrate de introducir exactamente el mismo valor cuando te lo pida
- Las contraseñas distinguen entre mayúsculas y minúsculas

### "Missing Mailrelay env"
- Verifica que `MAILRELAY_API_KEY` y `MAILRELAY_API_BASE` estén configurados en Vercel

### "Error syncing empresa"
- Verifica que el `MAILRELAY_API_KEY` sea válido
- Verifica que la URL base sea correcta
- Verifica que el `MAILRELAY_LIST_ID` exista en tu cuenta

---

## Seguridad

- ✅ Todas las credenciales deben estar en Vercel, NUNCA en el código
- ✅ El `MAILRELAY_ADMIN_SECRET` protege el endpoint de accesos no autorizados
- ✅ Solo personas con acceso al panel de admin pueden sincronizar
- ✅ El secreto debe ser diferente de tus otras contraseñas

---

## Flujo de Sincronización

1. Los usuarios se inscriben en el concurso
2. Sus datos se guardan en la base de datos Supabase
3. El admin va a la sección Mailrelay y ejecuta la sincronización
4. El sistema:
   - Lee las empresas de Supabase que aún no se han sincronizado
   - Las envía a Mailrelay usando la API
   - Marca las empresas como sincronizadas para no duplicarlas
5. Los contactos aparecen en tu lista de Mailrelay

---

## Recursos Adicionales

- [Documentación API Mailrelay](https://mailrelay.com/es/api)
- [Gestor de API Keys en Mailrelay](https://app.mailrelay.com/settings/api)

---

**Última actualización:** 20 de enero de 2026
