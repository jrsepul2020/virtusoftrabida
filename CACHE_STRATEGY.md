# Estrategia de Caché y Actualizaciones

## Problema
Los cambios no se veían inmediatamente después del deploy en Vercel. Los usuarios tenían que hacer Cmd+R (hard refresh) o esperar varios minutos.

## Causas
1. **Service Worker** cacheando JS/CSS agresivamente (Cache First)
2. **Caché del navegador** guardando archivos estáticos
3. **Vercel CDN** con caché en edge nodes
4. **Intervalos largos** de verificación (30 segundos)

## Soluciones Implementadas

### 1. Service Worker: Network First para código (sw.js)
```javascript
// HTML, JS y CSS siempre intentan red primero
if (event.request.destination === 'document' || 
    event.request.destination === 'script' || 
    event.request.destination === 'style') {
  fetch(event.request, { cache: 'no-cache' })
}
```

**Beneficio**: Siempre se descarga la última versión del código cuando hay conexión.

### 2. Verificación agresiva (UpdateNotification.tsx)
```typescript
// Check cada 10 segundos (antes 30s)
const updateInterval = setInterval(() => {
  reg.update();
}, 10000);

// Registro sin caché
navigator.serviceWorker.register('/sw.js', {
  updateViaCache: 'none'
});
```

**Beneficio**: Detecta nuevas versiones mucho más rápido.

### 3. Hash forzado en builds (vite.config.ts)
```typescript
entryFileNames: 'assets/[name]-[hash].js',
chunkFileNames: 'assets/[name]-[hash].js',
assetFileNames: 'assets/[name]-[hash].[ext]'
```

**Beneficio**: Cada build genera nombres únicos, evitando caché del navegador.

### 4. Headers anti-caché en desarrollo (vite.config.ts)
```typescript
server: {
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  }
}
```

**Beneficio**: En desarrollo local los cambios son instantáneos.

### 5. Headers en producción (vercel.json)
Ya configurados:
- `index.html`: no-cache (siempre fresco)
- `sw.js`: max-age=0 (siempre verifica)
- `/assets/*`: max-age=1año (inmutables por hash)

**Beneficio**: Balance entre velocidad y frescura.

### 6. Botón de actualización forzada
Badge de versión ahora es clickable:
- Limpia todas las cachés
- Desregistra service workers
- Recarga con bypass de caché

**Beneficio**: Usuario puede forzar actualización si algo falla.

### 7. Detección de cambios de versión
```typescript
const storedVersion = localStorage.getItem('app_version');
if (storedVersion && storedVersion !== APP_VERSION) {
  // Versión cambiada, limpiar y recargar opcional
}
```

**Beneficio**: Rastrea cambios entre visitas.

## Cómo Funciona Ahora

### Deploy Normal
1. Push a Vercel → Build con hash nuevo
2. Usuario recarga página (10-20s después)
3. Service Worker detecta nueva versión
4. Muestra banner rojo "Nueva versión disponible"
5. Usuario hace click → Recarga automática
6. **Todo listo en <1 minuto**

### Usuario Impaciente
1. Click en badge de versión (esquina inferior derecha)
2. Fuerza limpieza total de cachés
3. Recarga inmediata
4. **Actualización instantánea**

## Tiempos Esperados

| Escenario | Antes | Ahora |
|-----------|-------|-------|
| Deploy → Detección | 30-60s | 10-20s |
| Detección → Actualización | Manual | 1 click |
| Hard refresh manual | Siempre | Opcional |
| Vercel CDN propagación | 1-5 min | 1-5 min* |

*No podemos controlar el CDN de Vercel, pero el Service Worker fuerza bypass.

## Testing

### Desarrollo Local
```bash
npm run dev
# Cambios visibles inmediatamente sin recargar
```

### Testing de Actualizaciones
1. Build + commit + push
2. Espera 10-20 segundos
3. Debería aparecer banner rojo
4. Click "Actualizar"
5. Verificar cambios

### Forzar Actualización Manual
1. Click en badge "v2.2.0 • [Pantalla]" (esquina inferior derecha)
2. Página recarga automáticamente
3. Todo fresco

## Logs Útiles

En la consola del navegador:
```
[App] Service Worker registrado
[App] Verificando actualizaciones...
[App] Nueva versión detectada
[App] Nueva versión lista para instalar
[App] Nueva versión activada, recargando...
```

## Mantenimiento

### Incrementar Versión
1. `package.json`: "version": "2.3.0"
2. `public/sw.js`: `const APP_VERSION = '2.3.0';`
3. `src/components/UpdateNotification.tsx`: `const APP_VERSION = '2.3.0';`

### Ajustar Agresividad
En `UpdateNotification.tsx`, línea ~95:
```typescript
setInterval(() => reg.update(); }, 10000); // 10s = agresivo
                                           // 30s = normal
                                           // 60s = relajado
```

### Deshabilitar Auto-updates
Si quieres control total manual:
```typescript
// Comentar el setInterval
// const updateInterval = setInterval(() => { ... }, 10000);
```

## Problemas Conocidos

1. **Primera visita**: Siempre descarga todo (esperado)
2. **Offline**: Usa última versión cacheada (correcto)
3. **Vercel CDN**: Puede tomar 1-5min propagar (normal)
4. **Safari iOS**: A veces requiere cerrar/abrir app (limitación de iOS)

## Recomendaciones

✅ **Hacer siempre**: Incrementar versión antes de commit importante
✅ **Testing**: Probar en incógnito después de cada deploy
✅ **Usuarios**: Enseñarles el badge clickable para forzar updates
⚠️ **Producción**: Si hay problema crítico, comunicar hard refresh (Cmd+Shift+R)
