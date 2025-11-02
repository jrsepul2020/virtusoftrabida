# Fix: Columna empresa_id en tabla muestras

## Error
```
Could not find the 'ididempresa' column of 'muestras' in the schema cache
```

## Causa
El código estaba usando `ididempresa` pero el campo correcto en la base de datos es `empresa_id`.

## Solución

✅ **Ya corregido en el código** - El campo ahora usa `empresa_id` correctamente.

### Archivos actualizados:
- `src/components/UnifiedInscriptionForm.tsx` - Inserción de muestras
- `src/components/CompaniesManager.tsx` - Consultas y eliminación
- `src/components/UserDashboard.tsx` - Consulta de muestras

## Verificación en Supabase

Si quieres verificar que la columna existe correctamente, ejecuta en el **SQL Editor**:

```sql
-- Ver estructura de la tabla muestras
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'muestras'
ORDER BY ordinal_position;

-- Ver foreign keys
SELECT
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'muestras' AND tc.constraint_type = 'FOREIGN KEY';
```

## Después del fix

1. ✅ El código ya usa `empresa_id` correctamente
2. 🔄 Refresca el navegador
3. ✅ Intenta enviar una inscripción - debería funcionar ahora
