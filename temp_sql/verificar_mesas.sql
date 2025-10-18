-- Verificar si existe la tabla mesas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'mesas';

-- Ver todas las mesas existentes
SELECT * FROM mesas ORDER BY numero;

-- Si no hay mesas, insertar datos de ejemplo
INSERT INTO mesas (numero, nombre, capacidad, ubicacion, activa) VALUES
(1, 'Mesa 1', 5, 'Sala Principal - Izquierda', true),
(2, 'Mesa 2', 5, 'Sala Principal - Centro', true),
(3, 'Mesa 3', 5, 'Sala Principal - Derecha', true),
(4, 'Mesa 4', 5, 'Sala Secundaria - Izquierda', true),
(5, 'Mesa 5', 5, 'Sala Secundaria - Derecha', true)
ON CONFLICT (numero) DO NOTHING;