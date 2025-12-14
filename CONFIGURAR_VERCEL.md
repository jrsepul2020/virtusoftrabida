# Configuración de Variables de Entorno en Vercel

## ⚠️ URGENTE: Error "Invalid API key" en Recuperación de Contraseña

El error "Invalid API key" al intentar recuperar la contraseña indica que las variables de entorno de Supabase no están correctamente configuradas en Vercel.

## Paso 1: Verificar Variables de Entorno en Vercel

1. Ve a tu proyecto en Vercel: https://vercel.com/dashboard
2. Selecciona tu proyecto `virtusoftrabida`
3. Ve a Settings → Environment Variables
4. **Verifica que existan estas variables:**

### Variables de Supabase (CRÍTICAS)

```
VITE_SUPABASE_URL=https://cfpawqoegitgtsjygbqp.supabase.co
VITE_SUPABASE_ANON_KEY=<TU_ANON_KEY_AQUI>
```

**Nota**: Obtén tu `VITE_SUPABASE_ANON_KEY` de tu archivo `.env.local` local o desde Supabase Dashboard → Settings → API.

### Variables de Email (Brevo)

```
BREVO_API_KEY=<TU_BREVO_API_KEY_AQUI>
SENDER_EMAIL=info@internationalvirtus.es
SENDER_NAME=International Virtus La Rábida
ADMIN_EMAIL=jrsepul2000@gmail.com
```

**Nota**: Obtén tu `BREVO_API_KEY` de tu archivo `.env.local` local o desde el panel de Brevo.

### Variables de Seguridad

```
SUPABASE_SERVICE_ROLE_KEY=<TU_SERVICE_ROLE_KEY_AQUI>
ADMIN_ACCESS_SECRET=<TU_ADMIN_SECRET_AQUI>
ADMIN_ACCESS_TOKEN=<TU_ADMIN_TOKEN_AQUI>
VITE_MAILRELAY_ADMIN_SECRET=<TU_MAILRELAY_SECRET_AQUI>
```

**Nota**: Obtén estas claves de tu archivo `.env.local` local.

## Paso 2: Configurar Supabase Auth para Reset de Contraseña

1. Ve a tu proyecto de Supabase: https://supabase.com/dashboard/project/cfpawqoegitgtsjygbqp
2. Ve a Authentication → URL Configuration
3. **Verifica que la Redirect URL esté configurada:**
   - Site URL: `https://www.internationalawardsvirtus.com`
   - Redirect URLs: 
     - `https://www.internationalawardsvirtus.com`
     - `https://www.internationalawardsvirtus.com/#admin`
     - `http://localhost:3000` (para desarrollo)

## Paso 3: Verificar Email Templates en Supabase

1. En Supabase, ve a Authentication → Email Templates
2. Verifica que el template "Reset Password" esté configurado
3. El template debe incluir: `{{ .ConfirmationURL }}`

## Paso 4: Verificar que las Variables NO tengan Espacios o Saltos de Línea

⚠️ **MUY IMPORTANTE**: Las variables de entorno en Vercel **NO deben tener espacios, saltos de línea o caracteres especiales** al inicio o final.

**CORRECTO:**
```
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**INCORRECTO:**
```
VITE_SUPABASE_ANON_KEY= eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
(Nota el espacio después del `=`)

## Paso 5: Redeploy

Después de agregar/corregir las variables:

1. Ve a Deployments en Vercel
2. Click en los tres puntos (...) del último deployment
3. Click en "Redeploy"
4. Marca la casilla "Use existing Build Cache" (opcional, acelera el build)
5. Click en "Redeploy"

## Verificación Local

Para verificar que las variables estén bien configuradas localmente:

```bash
# En el directorio del proyecto
cat .env.local | grep SUPABASE
```

Deberías ver:
```
VITE_SUPABASE_URL=https://cfpawqoegitgtsjygbqp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Troubleshooting Adicional

### Si el error persiste después de configurar las variables:

1. **Verifica que Supabase Auth esté habilitado:**
   - En Supabase Dashboard → Authentication
   - Verifica que "Enable email confirmations" esté habilitado

2. **Verifica que la API key no haya expirado:**
   - En Supabase Dashboard → Settings → API
   - Copia la clave `anon` / `public` y reemplázala en Vercel

3. **Verifica los Rate Limits:**
   - Supabase Auth tiene límites de tasa
   - Espera unos minutos y vuelve a intentar

4. **Revisa los logs de Vercel:**
   ```bash
   vercel logs <deployment-url>
   ```

## Rotación de Claves (URGENTE - Por Seguridad)

⚠️ **IMPORTANTE**: Como las claves fueron expuestas en el repositorio, debes rotarlas:

1. En Supabase Dashboard → Settings → API
2. Click en "Reset" junto a `service_role` key
3. Copia la nueva clave y actualízala en:
   - `.env.local` (local)
   - Vercel Environment Variables (producción)
4. Redeploy en Vercel

## Soporte

Si el problema persiste:
1. Verifica los logs del navegador (F12 → Console)
2. Verifica los logs de Vercel
3. Contacta al soporte de Supabase si el problema es con su servicio de Auth
