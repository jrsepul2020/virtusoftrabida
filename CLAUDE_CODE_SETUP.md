# Configuración de Claude Code

## 📋 Descripción

Este documento explica cómo configurar Claude Code (o herramientas compatibles con MCP) para trabajar con este repositorio.

## 🔑 Obtener una API Key de Anthropic

1. Ve a [Anthropic Console](https://console.anthropic.com/settings/keys)
2. Inicia sesión o crea una cuenta
3. Navega a **Settings → API Keys**
4. Haz clic en **Create Key**
5. Copia la clave generada (comienza con `sk-ant-api03-...`)

⚠️ **Importante**: Guarda la clave de forma segura. Solo se muestra una vez.

## 🛠️ Configuración Local

### Opción 1: Variables de Entorno del Sistema

#### En Linux/macOS:

Añade a tu archivo `~/.bashrc`, `~/.zshrc` o equivalente:

```bash
export ANTHROPIC_API_KEY="sk-ant-api03-tu-clave-aqui"
export VITE_SUPABASE_URL="https://your-project-ref.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="tu-service-role-key-aqui"
```

Luego recarga:
```bash
source ~/.bashrc  # o ~/.zshrc
```

#### En Windows (PowerShell):

```powershell
$env:ANTHROPIC_API_KEY="sk-ant-api03-tu-clave-aqui"
$env:VITE_SUPABASE_URL="https://your-project-ref.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="tu-service-role-key-aqui"
```

Para hacerlo permanente, usa las variables de entorno del sistema:
1. Busca "Variables de entorno" en el menú inicio
2. Añade las variables en "Variables de usuario"

### Opción 2: Archivo `.env.local`

1. Copia el archivo de ejemplo:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edita `.env.local` y completa los valores:
   ```bash
   ANTHROPIC_API_KEY=sk-ant-api03-tu-clave-aqui
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui
   ```

3. El archivo `.env.local` está en `.gitignore` y **nunca** se subirá a Git

## 🔧 Configuración de MCP Servers

El archivo `.mcp.json` ya está configurado para usar variables de entorno:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-filesystem"]
    },
    "supabase": {
      "command": "npx",
      "args": ["mcp-supabase-db"],
      "env": {
        "SUPABASE_URL": "${VITE_SUPABASE_URL}",
        "SUPABASE_SERVICE_ROLE_KEY": "${SUPABASE_SERVICE_ROLE_KEY}"
      }
    }
  }
}
```

## 🧪 Verificar la Configuración

### Verificar Variables de Entorno

```bash
# Linux/macOS
echo $ANTHROPIC_API_KEY
echo $VITE_SUPABASE_URL

# Windows PowerShell
echo $env:ANTHROPIC_API_KEY
echo $env:VITE_SUPABASE_URL
```

### Probar Claude Code

1. Abre tu editor compatible con MCP (VS Code con extensión Claude, Cursor, etc.)
2. Inicia una conversación con Claude Code
3. Pide a Claude que realice una operación simple (ej: "lista los archivos del proyecto")
4. Si funciona, la configuración es correcta ✅

## 🐛 Solución de Problemas

### Error: "Missing API key"

**Causa**: La variable `ANTHROPIC_API_KEY` no está configurada o no es accesible.

**Solución**:
1. Verifica que hayas exportado la variable correctamente
2. Reinicia tu terminal/editor
3. Verifica con `echo $ANTHROPIC_API_KEY` (Linux/macOS) o `echo $env:ANTHROPIC_API_KEY` (Windows)

### Error: "Invalid API key"

**Causa**: La clave API es incorrecta o ha expirado.

**Solución**:
1. Genera una nueva clave en [Anthropic Console](https://console.anthropic.com/settings/keys)
2. Actualiza la variable de entorno con la nueva clave
3. Reinicia tu editor

### Error: "Cannot connect to Supabase"

**Causa**: Las credenciales de Supabase no están configuradas o son incorrectas.

**Solución**:
1. Verifica que `VITE_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` estén configuradas
2. Las credenciales de Supabase se encuentran en [Supabase Dashboard](https://supabase.com/dashboard) → Settings → API

## 🔒 Seguridad

⚠️ **Importante**:

- **Nunca** subas archivos `.env`, `.env.local` o `.env.production` a Git
- **Nunca** compartas tu `ANTHROPIC_API_KEY` o `SUPABASE_SERVICE_ROLE_KEY` públicamente
- **Nunca** hardcodees credenciales en el código fuente
- Si accidentalmente expones una clave, **revócala inmediatamente** y genera una nueva

## 📚 Recursos Adicionales

- [Documentación de Anthropic](https://docs.anthropic.com/)
- [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)
- [Supabase API Documentation](https://supabase.com/docs/reference/javascript/introduction)
- [Variables de Entorno en Node.js](https://nodejs.org/en/learn/command-line/how-to-read-environment-variables-from-nodejs)

## 💬 Soporte

Si tienes problemas con la configuración:

1. Revisa este documento completo
2. Verifica los logs de tu editor/terminal
3. Consulta la documentación oficial de Anthropic y MCP
4. Contacta al equipo de desarrollo del proyecto
