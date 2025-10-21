# Debug: Diferencias Local vs Vercel

## Cambios Realizados

### 1. Cache Busting
- Actualizado Service Worker a versión `v1.2`
- Cambiado `base: './'` a `base: '/'` en vite.config.ts
- Añadido `emptyOutDir: true` para limpiar dist/

### 2. Variables de Entorno
✅ Verificadas - son idénticas en local y Vercel:
```
VITE_SUPABASE_URL=https://cfpawqoegitgtsjygbqp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Configuración Vercel
✅ vercel.json optimizado para PWA

## Posibles Causas de Diferencias

### A. Cache del Navegador
- Vercel puede estar sirviendo versión antigua en caché
- **Solución**: Hard refresh (Cmd+Shift+R) en Vercel

### B. Service Worker Anterior
- Service Worker v1 puede estar activo en producción
- **Solución**: Actualizar SW o limpiar storage

### C. Headers de Cache
- Vercel puede tener headers de cache diferentes
- **Verificar**: Network tab en DevTools

### D. Assets Estáticos
- Rutas de imágenes o fuentes pueden diferir
- **Verificar**: Console errors en producción

## Pasos de Verificación

1. **Abrir Vercel en modo incógnito** (sin cache)
2. **Verificar Console** (F12 → Console tab)
3. **Verificar Network** (F12 → Network tab)
4. **Verificar Application** (F12 → Application → Service Workers)

## Comandos para Debug

```bash
# Limpiar caché local
npm run build && rm -rf dist && npm run build

# Verificar diferencias en build
ls -la dist/
ls -la dist/assets/

# Verificar Service Worker
# En DevTools: Application → Service Workers → Update
```

## Deployment Status
- ✅ Build local: Exitoso
- ✅ Git push: Completado
- 🔄 Vercel redeploy: En progreso
- ⏳ Verificación: Pendiente

## Próximos Pasos
1. Esperar 2-3 minutos para redeploy de Vercel
2. Probar en modo incógnito
3. Verificar que Service Worker se actualice a v1.2
4. Comparar Network requests entre local y producción