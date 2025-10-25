# Migración: Sistema Automático de Números de Pedido

## 📋 Descripción

Esta migración implementa un sistema automático de generación de números de pedido para las empresas, garantizando:

- ✅ **Números únicos y secuenciales**: Cada empresa recibe un número de pedido consecutivo
- ✅ **Seguridad en concurrencia**: No hay duplicados aunque múltiples usuarios se inscriban simultáneamente
- ✅ **Asignación automática**: El número se asigna automáticamente al crear la empresa
- ✅ **Retrocompatibilidad**: Las empresas existentes sin número de pedido recibirán uno automáticamente

## 🔧 Componentes

### 1. Secuencia PostgreSQL (`pedido_seq`)
- Genera números secuenciales comenzando en 1
- Se incrementa automáticamente

### 2. Trigger (`trigger_assign_pedido`)
- Se ejecuta **ANTES** de insertar una nueva empresa
- Asigna el siguiente número de pedido si no se ha proporcionado uno manualmente

### 3. Función (`assign_pedido_number()`)
- Lógica que asigna el número usando `nextval('pedido_seq')`
- Solo asigna si el campo `pedido` es NULL

## 📝 Cómo Aplicar la Migración

### Opción 1: SQL Editor de Supabase (Recomendado)

1. Accede a tu proyecto en [supabase.com](https://supabase.com)
2. Ve a **SQL Editor**
3. Crea una nueva query
4. Copia y pega el contenido de `20251025100000_add_pedido_sequence.sql`
5. Haz clic en **Run** o presiona `Ctrl/Cmd + Enter`

### Opción 2: Supabase CLI

```bash
# Si tienes Supabase CLI instalado y configurado
supabase db push
```

## ✅ Verificación

Después de aplicar la migración, verifica que funciona correctamente:

```sql
-- Verificar que la secuencia existe
SELECT * FROM pedido_seq;

-- Verificar que el trigger existe
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_assign_pedido';

-- Insertar una empresa de prueba (debería recibir un número de pedido automáticamente)
INSERT INTO empresas (name, email, status) 
VALUES ('Empresa Test', 'test@example.com', 'pending')
RETURNING pedido;

-- Verificar empresas existentes
SELECT id, name, pedido, created_at 
FROM empresas 
ORDER BY pedido;
```

## 🔄 Comportamiento

### Inscripciones Nuevas
```javascript
// En UnifiedInscriptionForm.tsx
const empresaData = {
  name: "Mi Empresa",
  email: "info@miempresa.com",
  // NO se incluye 'pedido' - Supabase lo asignará automáticamente
};

// Después del INSERT, la empresa tendrá su número de pedido asignado
```

### Empresas Existentes
La migración actualiza automáticamente todas las empresas que no tienen número de pedido, asignándoles números correlativos basados en su fecha de creación.

## ⚠️ Importante

- **No reinicies la secuencia manualmente** a menos que sepas lo que estás haciendo
- Si necesitas resetear los números, contacta al administrador de la base de datos
- La secuencia se ajusta automáticamente al número máximo existente + 1

## 🎯 Ventajas de este Enfoque

1. **Rendimiento**: Más rápido que consultar el máximo desde la aplicación
2. **Atomicidad**: Parte de la transacción de la base de datos
3. **Escalabilidad**: Funciona correctamente con múltiples usuarios simultáneos
4. **Mantenibilidad**: Toda la lógica está en la base de datos
5. **Simplicidad**: El código de la aplicación no necesita generar el número

## 📚 Referencias

- [PostgreSQL Sequences](https://www.postgresql.org/docs/current/sql-createsequence.html)
- [PostgreSQL Triggers](https://www.postgresql.org/docs/current/sql-createtrigger.html)
- [Supabase Database Functions](https://supabase.com/docs/guides/database/functions)
