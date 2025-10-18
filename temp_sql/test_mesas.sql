-- Script para verificar datos en tabla mesas
SELECT * FROM mesas ORDER BY numero;

-- Script para insertar datos de ejemplo si no existen
INSERT INTO mesas (numero, nombre, capacidad, ubicacion, activa) VALUES
(1, 'Mesa 1', 5, 'Sala Principal - Izquierda', true),
(2, 'Mesa 2', 5, 'Sala Principal - Centro', true),
(3, 'Mesa 3', 5, 'Sala Principal - Derecha', true),
(4, 'Mesa 4', 5, 'Sala Secundaria - Izquierda', true),
(5, 'Mesa 5', 5, 'Sala Secundaria - Derecha', true)
ON CONFLICT (numero) DO NOTHING;