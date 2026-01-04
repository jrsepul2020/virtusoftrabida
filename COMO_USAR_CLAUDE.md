# 🤖 Cómo Usar Claude Code en VS Code

## ✅ Estado: TODO LISTO
- ✓ API Key configurada en `.env`
- ✓ Claude CLI versión 2.0.75 funcionando
- ✓ Listo para usar



**Paso 1:** Abre el terminal en VS Code (presiona `Ctrl + Ñ` o `Cmd + Ñ`)

**Paso 2:** Carga tu API key:
```bash
export ANTHROPIC_API_KEY="$(grep '^ANTHROPIC_API_KEY=' .env | cut -d'=' -f2-)"
```

**Paso 3:** Usa Claude directamente:

#### 💬 Hacer una pregunta rápida:
```bash
npx @anthropic-ai/claude-code -p "¿Cómo funciona React hooks?"
```

#### 🔍 Analizar un archivo:
```bash
npx @anthropic-ai/claude-code -p "Resume este archivo" < src/App.tsx
```

#### 💻 Chat interactivo (como ChatGPT):
```bash
npx @anthropic-ai/claude-code
```
(Escribe tus preguntas y presiona Enter. Escribe `exit` para salir)

#### 🛠️ Ayuda con código del proyecto:
```bash
npx @anthropic-ai/claude-code "Revisa el componente Header y sugiere mejoras"
```

---

### 2️⃣ FORMA AUTOMÁTICA: Atajo de Teclado


1. Abre la paleta de comandos: `Cmd + Shift + P`
2. Busca: "Tasks: Configure Task"
3. Selecciona "Create tasks.json from template"
4. Copia esto dentro de `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Preguntar a Claude",
      "type": "shell",
      "command": "export ANTHROPIC_API_KEY=\"$(grep '^ANTHROPIC_API_KEY=' .env | cut -d'=' -f2-)\" && npx @anthropic-ai/claude-code",
      "problemMatcher": [],
      "presentation": {
        "reveal": "always",
        "panel": "new"
      }
    },
    {
      "label": "Claude: Pregunta rápida",
      "type": "shell",
      "command": "export ANTHROPIC_API_KEY=\"$(grep '^ANTHROPIC_API_KEY=' .env | cut -d'=' -f2-)\" && npx @anthropic-ai/claude-code -p \"${input:pregunta}\"",
      "problemMatcher": []
    }
  ],
  "inputs": [
    {
      "id": "pregunta",
      "type": "promptString",
      "description": "¿Qué quieres preguntarle a Claude?"
    }
  ]
}
```

5. Ahora puedes usar:
   - `Cmd + Shift + P` → "Tasks: Run Task" → "Preguntar a Claude"

---

### 3️⃣ USAR CON ARCHIVOS ESPECÍFICOS

1. Selecciona código en VS Code
2. En el terminal:
```bash
# Copia el código y pregunta
npx @anthropic-ai/claude-code -p "Explica este código: $(pbpaste)"
```

#### Revisar todo un archivo:
```bash
npx @anthropic-ai/claude-code -p "Revisa este archivo y encuentra problemas" < src/components/Header.tsx
```

---

## 📝 Ejemplos Prácticos para tu Proyecto

```bash
npx @anthropic-ai/claude-code -p "Analiza este componente y sugiere mejoras de rendimiento" < src/components/UnifiedInscriptionForm.tsx
```

### Generar tests:
```bash
npx @anthropic-ai/claude-code -p "Genera tests de Vitest para este archivo" < src/lib/supabaseQueries.ts
```

### Documentar código:
```bash
npx @anthropic-ai/claude-code -p "Añade JSDoc a todas las funciones" < src/lib/validationSchemas.ts
```

### Encontrar bugs:
```bash
npx @anthropic-ai/claude-code -p "Busca posibles errores en este código" < src/components/CatadorDashboard.tsx
```

### Optimizar consultas:
```bash
npx @anthropic-ai/claude-code -p "¿Cómo puedo optimizar estas queries de Supabase?" < src/lib/supabaseQueries.ts
```

---

## 🎯 Tips Útiles

   ```bash
   # Claude API - cargar cuando estés en el proyecto
   if [ -f "$PWD/.env" ]; then
     export ANTHROPIC_API_KEY="$(grep '^ANTHROPIC_API_KEY=' .env 2>/dev/null | cut -d'=' -f2-)"
   fi
   ```

2. **Alias rápido:** Añade a `~/.zshrc`:
   ```bash
   alias claude='npx @anthropic-ai/claude-code'
   alias ask='npx @anthropic-ai/claude-code -p'
   ```
   Luego solo escribe: `ask "tu pregunta"`

3. **Ver historial:** Claude guarda tus conversaciones. Continúa la última con:
   ```bash
   npx @anthropic-ai/claude-code --continue
   ```

4. **Usar modelo específico:**
   ```bash
   npx @anthropic-ai/claude-code --model sonnet "tu pregunta"
   ```

---

## ⚡ Diferencia entre `-p` y sin `-p`
- **CON `-p`** (print): Pregunta rápida, respuesta y sale
  ```bash
  npx @anthropic-ai/claude-code -p "¿Qué es React?"
  ```

- **SIN `-p`**: Chat continuo (como ChatGPT)
  ```bash
  npx @anthropic-ai/claude-code
  ```

---

## 🔒 Seguridad
✅ Tu API key está en `.env` que ya está en `.gitignore`  
✅ Nunca subas `.env` a GitHub  
✅ Si compartes código, asegúrate de que `.env` no esté incluido

---

## 🆘 Solución de Problemas
**Si dice "API key not found":**
```bash
# Verifica que esté en .env
grep ANTHROPIC_API_KEY .env

# Carga manualmente
export ANTHROPIC_API_KEY="tu-api-key-aqui"
```

**Si es muy lento:**
- Usa el modelo "haiku" (más rápido): `--model haiku`

**Si quieres respuestas más cortas:**
npx @anthropic-ai/claude-code -p "Responde en máximo 3 líneas: tu pregunta"
```

---

## 📚 Más Información
- Documentación oficial: https://docs.anthropic.com/
- Ayuda del CLI: `npx @anthropic-ai/claude-code --help`
- Ver versión: `npx @anthropic-ai/claude-code --version`
## 🎉 ¡Ya Estás Listo!
Empieza probando esto en tu terminal:
```bash
export ANTHROPIC_API_KEY="$(grep '^ANTHROPIC_API_KEY=' .env | cut -d'=' -f2-)"
npx @anthropic-ai/claude-code -p "Hola Claude! Explícame en 2 líneas qué es TypeScript"
```

¡Diviértete programando con Claude! 🚀
