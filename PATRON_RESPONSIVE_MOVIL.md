# 📱 PATRÓN RESPONSIVE MÓVIL - VIRTUS

## ❌ PROBLEMAS IDENTIFICADOS

### 1. Scroll Lateral (Overflow Horizontal)
- **Causa**: Anchos fijos (`w-96`, `w-80`, `w-64`) que exceden el ancho del dispositivo (393px)
- **Solución**: Usar `w-full` o clases responsive (`min-w-[140px]`, `flex-1`)

### 2. Contenedor Principal
- **Problema**: Falta `overflow-x-hidden` y `w-full`
- **Solución**: 
  ```tsx
  <div className="space-y-4 p-2 sm:p-4 w-full overflow-x-hidden">
  ```

### 3. Inputs y Selects
- **Problema**: Sin `w-full`, causan overflow
- **Solución**:
  ```tsx
  <input className="w-full px-3 py-2 border..." />
  <select className="w-full px-3 py-2 border..." />
  // O con flex:
  <select className="flex-1 min-w-[140px] px-3 py-2..." />
  ```

### 4. Botones
- **Problema**: Textos largos sin `whitespace-nowrap`, padding excesivo
- **Solución**:
  ```tsx
  <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 ... whitespace-nowrap">
  ```
  - Ocultar texto en móvil:
  ```tsx
  <span className="hidden sm:inline">Texto</span>
  ```

### 5. Gaps y Padding
- **Problema**: Valores grandes sin responsive
- **Solución**:
  ```tsx
  gap-2 sm:gap-4        // En lugar de gap-4
  p-2 sm:p-4            // En lugar de p-4
  gap-1 sm:gap-2        // Para elementos pequeños
  ```

### 6. Tamaños de Fuente e Iconos
- **Problema**: Tamaños fijos demasiado grandes para móvil
- **Solución**:
  ```tsx
  text-xs sm:text-sm md:text-base    // Textos
  text-xl sm:text-2xl                // Títulos
  w-3 h-3 sm:w-4 sm:h-4             // Iconos pequeños
  w-5 h-5 sm:w-6 sm:h-6             // Iconos normales
  ```

### 7. Layout Horizontal vs Vertical
- **Problema**: `flex` horizontal causa overflow
- **Solución**:
  ```tsx
  // De:
  <div className="flex gap-4 items-center justify-between">
  
  // A:
  <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
  
  // O agrupar verticalmente:
  <div className="space-y-3">
  ```

### 8. Grids
- **Problema**: Demasiadas columnas en móvil
- **Solución**:
  ```tsx
  grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4
  // NO usar grid-cols-4 directamente
  ```

### 9. Textos Largos
- **Problema**: Sin truncamiento
- **Solución**:
  ```tsx
  <span className="truncate max-w-[180px]">...</span>
  ```

## ✅ PATRÓN CORRECTO

### Estructura Base de Manager
```tsx
export default function MiManager() {
  return (
    <div className="space-y-4 p-2 sm:p-4 w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Título</h1>
            <p className="text-xs sm:text-sm text-gray-600">Subtítulo</p>
          </div>
        </div>
        <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 whitespace-nowrap">
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          Acción Principal
        </button>
      </div>

      {/* Filtros y acciones */}
      <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 w-full">
        <div className="space-y-3">
          {/* Búsqueda */}
          <input
            type="text"
            placeholder="Buscar..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          
          {/* Filtros */}
          <div className="flex flex-wrap gap-2">
            <select className="flex-1 min-w-[140px] px-3 py-2 border rounded-lg text-sm">
              <option>Filtro 1</option>
            </select>
            <select className="flex-1 min-w-[140px] px-3 py-2 border rounded-lg text-sm">
              <option>Filtro 2</option>
            </select>
          </div>
          
          {/* Acciones */}
          <div className="flex flex-wrap gap-2">
            <button className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs sm:text-sm">
              <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Acción</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cards móviles */}
      <div className="lg:hidden">
        <div className="space-y-3">
          {/* Card individual */}
        </div>
      </div>

      {/* Tabla desktop */}
      <div className="hidden lg:block bg-white rounded-lg shadow overflow-hidden">
        <table>...</table>
      </div>
    </div>
  );
}
```

### Cards Móviles
```tsx
<div className="bg-white rounded-lg shadow-sm p-3 sm:p-4">
  {/* Cabecera */}
  <div className="flex items-start justify-between gap-2 mb-3">
    <span className="text-sm sm:text-base font-semibold truncate">
      Título
    </span>
    <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full flex-shrink-0">
      Estado
    </span>
  </div>

  {/* Info en grid 2 columnas */}
  <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3">
    <div>
      <p className="text-xs text-gray-500">Campo</p>
      <p className="text-sm font-medium text-gray-900">Valor</p>
    </div>
  </div>

  {/* Acciones */}
  <div className="flex flex-wrap gap-2">
    <button className="flex-1 px-3 py-1.5 text-xs rounded bg-blue-600 text-white">
      Ver
    </button>
  </div>
</div>
```

## 📋 CHECKLIST PRE-COMMIT

Antes de hacer commit de cualquier pantalla, verificar:

- [ ] Contenedor principal tiene `w-full overflow-x-hidden`
- [ ] Padding responsive: `p-2 sm:p-4`
- [ ] NO hay anchos fijos (`w-96`, `w-80`, etc.)
- [ ] Todos los inputs/selects tienen `w-full`
- [ ] Gaps responsive: `gap-2 sm:gap-4`
- [ ] Tamaños de fuente responsive: `text-xs sm:text-sm`
- [ ] Iconos responsive: `w-3 h-3 sm:w-4 sm:h-4`
- [ ] Botones con `whitespace-nowrap`
- [ ] Headers con `flex-col sm:flex-row`
- [ ] Grids empiezan en `grid-cols-1`
- [ ] Cards móviles con `lg:hidden`
- [ ] Tablas desktop con `hidden lg:block`
- [ ] Textos largos con `truncate`
- [ ] Probado en 393px de ancho

## 🎯 ANCHO DE REFERENCIA

- **Móvil estándar**: 393px
- **Tablet**: 768px (sm)
- **Desktop**: 1024px (lg)

## 🚀 APLICADO A

- ✅ InscripcionesManager
- ✅ UsuariosManager
- ✅ CatadoresManager
- ✅ MesasManager
- ✅ DispositivosManager
- ✅ Estadisticas2
- ✅ HeroLanding

## 📝 NOTAS

- Siempre probar en móvil 393px antes de commit
- Usar DevTools responsive mode para verificar
- NO usar `min-w-full` - causa overflow
- Preferir `flex-wrap` sobre scroll horizontal
- En duda, usar `w-full` en lugar de ancho fijo
