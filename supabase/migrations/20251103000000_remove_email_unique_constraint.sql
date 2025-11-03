/*
  # Eliminar restricción UNIQUE del campo email en empresas

  1. Cambios
    - Elimina la restricción UNIQUE del campo email en la tabla empresas
    - Permite múltiples empresas con el mismo email
  
  2. Notas
    - Esta migración permite duplicados de email intencionalmente
    - Se mantiene la columna email como NOT NULL pero sin restricción de unicidad
*/

-- Eliminar la restricción UNIQUE del email en la tabla empresas
ALTER TABLE empresas DROP CONSTRAINT IF EXISTS empresas_email_key;
ALTER TABLE empresas DROP CONSTRAINT IF EXISTS companies_email_key;

-- Verificar que el campo email siga siendo NOT NULL (sin UNIQUE)
-- No es necesario hacer nada más, la columna sigue existiendo sin la restricción
