# Configurar Variables de Entorno en Vercel

## Problema Actual
El magic link responde con error 500: "Failed to create session"
Esto indica que faltan las variables de Supabase en Vercel.

## Solución: Añadir Variables en Vercel (5 minutos)

### Paso 1: Acceder a Vercel Dashboard
1. Ve a https://vercel.com/dashboard
2. Selecciona tu proyecto: **virtusoftrabida** (o el nombre que tenga)
3. Click en **Settings** (en el menú superior)
4. Click en **Environment Variables** (menú lateral izquierdo)

### Paso 2: Añadir las Variables (una por una)

Para cada variable, click en **"Add New"** y completa:

#### Variable 1: VITE_SUPABASE_URL
- **Name:** `VITE_SUPABASE_URL`
- **Value:** `https://cfpawqoegitgtsjygbqp.supabase.co`
- **Environments:** Marca las 3 opciones (Production, Preview, Development)
- Click **Save**

#### Variable 2: VITE_SUPABASE_ANON_KEY
- **Name:** `VITE_SUPABASE_ANON_KEY`
- **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmcGF3cW9lZ2l0Z3RzanlnYnFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1OTkwNTEsImV4cCI6MjA3NTE3NTA1MX0.IlLa3fIh3xR0hfbZeaChDpTWqQT3sjrYE7Ew7PXd7mU`
- **Environments:** Marca las 3 opciones
- Click **Save**

#### Variable 3: SUPABASE_SERVICE_ROLE_KEY ⚠️ CRÍTICA
- **Name:** `SUPABASE_SERVICE_ROLE_KEY`
- **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmcGF3cW9lZ2l0Z3RzanlnYnFwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTU5OTA1MSwiZXhwIjoyMDc1MTc1MDUxfQ.K1CbCr9A2KJOlqLpWUTu99345pNVfmdH3Oaewtn_Xik`
- **Environments:** Marca las 3 opciones
- Click **Save**

#### Variable 4: ADMIN_ACCESS_TOKEN ⚠️ CRÍTICA
- **Name:** `ADMIN_ACCESS_TOKEN`
- **Value:** `e516e3722eb37288ec94c632a0d1f5b774e050c2f298c64a54e5491755a18488`
- **Environments:** Marca las 3 opciones
- Click **Save**

#### Variable 5: VITE_APP_URL
- **Name:** `VITE_APP_URL`
- **Value:** `https://www.internationalawardsvirtus.com`
- **Environments:** Solo marca **Production**
- Click **Save**

### Paso 3: Redeploy (Automático o Manual)

**Opción A - Automático:**
Vercel suele redesplegar automáticamente tras añadir variables. Espera 1-2 minutos.

**Opción B - Manual (más rápido):**
1. Ve a **Deployments** (menú superior)
2. Click en el último deployment
3. Click en el menú **⋮** (tres puntos)
4. Click **Redeploy**

### Paso 4: Verificar que Funciona

Abre tu link de admin:
```
https://www.internationalawardsvirtus.com/?admin_token=e516e3722eb37288ec94c632a0d1f5b774e050c2f298c64a54e5491755a18488
```

Debe redirigir automáticamente al panel admin.

---

## Alternativa Rápida: Usar Login Tradicional

Mientras configuras Vercel, puedes acceder con:

**URL:**
```
https://www.internationalawardsvirtus.com/#admin
```

**Credenciales:**
- Email: `admin@internationalvirtus.es`
- Password: `rn$ggc4R2DnBd4pM`

---

## Troubleshooting

### Error: "Token inválido o expirado"
- Las variables no están configuradas en Vercel
- Sigue los pasos de arriba

### Error: "Failed to create session"
- Falta `SUPABASE_SERVICE_ROLE_KEY` en Vercel
- Asegúrate de copiar el valor completo (es largo)

### Error: "No admin user configured"
- El usuario admin no existe en la base de datos
- Ya lo creamos, no debería ocurrir

### El link no hace nada
- Refresca el cache del navegador: Ctrl+F5 (Windows) o Cmd+Shift+R (Mac)
- Espera que termine el redeploy en Vercel

---

## Captura de Pantalla de Referencia

Tu panel de Environment Variables debería verse así:

```
VITE_SUPABASE_URL               https://cfpawqoegitgtsjygbqp.supabase.co     Production, Preview, Development
VITE_SUPABASE_ANON_KEY          eyJhbGciOiJIUzI1NiIs...                      Production, Preview, Development
SUPABASE_SERVICE_ROLE_KEY       eyJhbGciOiJIUzI1NiIs...                      Production, Preview, Development
ADMIN_ACCESS_TOKEN              e516e3722eb37288ec94...                      Production, Preview, Development
VITE_APP_URL                    https://www.internationalawardsvirtus.com    Production
```

---

**¿Necesitas ayuda?** Comparte captura del error o del panel de Environment Variables.
