-- Crear una secuencia para números de pedido
CREATE SEQUENCE IF NOT EXISTS pedido_seq START WITH 1 INCREMENT BY 1;

-- Añadir campo pedido a la tabla empresas si no existe
-- (ya existe, pero esta línea asegura que tenga el tipo correcto)
ALTER TABLE empresas 
  ALTER COLUMN pedido SET DEFAULT nextval('pedido_seq');

-- Función para asignar número de pedido automáticamente
CREATE OR REPLACE FUNCTION assign_pedido_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo asignar si no se ha proporcionado un pedido manualmente
  IF NEW.pedido IS NULL THEN
    NEW.pedido := nextval('pedido_seq');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger que ejecuta la función antes de insertar
DROP TRIGGER IF EXISTS trigger_assign_pedido ON empresas;
CREATE TRIGGER trigger_assign_pedido
  BEFORE INSERT ON empresas
  FOR EACH ROW
  EXECUTE FUNCTION assign_pedido_number();

-- Opcional: Actualizar empresas existentes sin número de pedido
-- Esto asigna números correlativos a las empresas que no tienen pedido
DO $$
DECLARE
  empresa_record RECORD;
BEGIN
  FOR empresa_record IN 
    SELECT id FROM empresas WHERE pedido IS NULL ORDER BY created_at
  LOOP
    UPDATE empresas 
    SET pedido = nextval('pedido_seq') 
    WHERE id = empresa_record.id;
  END LOOP;
END $$;

-- Reiniciar la secuencia al siguiente número disponible
-- (en caso de que ya existan pedidos asignados manualmente)
SELECT setval('pedido_seq', COALESCE((SELECT MAX(pedido) FROM empresas), 0) + 1, false);
