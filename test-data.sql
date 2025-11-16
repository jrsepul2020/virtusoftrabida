-- Script para insertar empresas y muestras de prueba
-- Ejecutar en el SQL Editor de Supabase

-- 1. Insertar empresas de prueba
INSERT INTO empresas (name, email, phone, nif, postal, ciudad, pais, status, totalinscripciones, pedido)
VALUES 
  ('Bodegas Ejemplo 1', 'bodega1@example.com', '600111222', 'B12345678', '28001', 'Madrid', 'España', 'approved', 0, 1),
  ('Aceites Premium SL', 'aceites@example.com', '600222333', 'B87654321', '41001', 'Sevilla', 'España', 'approved', 0, 2),
  ('Vinos del Norte SA', 'vinos@example.com', '600333444', 'A11223344', '26001', 'Logroño', 'España', 'approved', 0, 3),
  ('Destilerías Test', 'destilerias@example.com', '600444555', 'B99887766', '03001', 'Alicante', 'España', 'approved', 0, 4)
ON CONFLICT (email) DO NOTHING;

-- 2. Obtener los IDs de las empresas insertadas (para usar en las muestras)
-- Nota: Reemplaza estos UUIDs con los IDs reales después de la inserción de empresas

-- 3. Insertar muestras AUTOMÁTICAS (manual = false, el trigger asignará código entre 1000-9999)
INSERT INTO muestras (
  nombre, 
  categoria, 
  categoriadecata,
  empresa_id,
  empresa,
  pais,
  manual,
  pagada,
  codigotexto,
  origen,
  azucar,
  grado,
  anio
)
SELECT
  'Vino Tinto Reserva 2019',
  'Vino',
  'Tinto Reserva',
  e.id,
  e.name,
  'España',
  false, -- automático, el trigger asignará código
  true,
  NULL, -- el trigger asignará codigotexto
  'D.O. Rioja',
  2.5,
  13.5,
  2019
FROM empresas e WHERE e.email = 'bodega1@example.com'
UNION ALL
SELECT
  'Aceite Virgen Extra Premium',
  'Aceite',
  'Virgen Extra',
  e.id,
  e.name,
  'España',
  false,
  true,
  NULL,
  'D.O. Priego de Córdoba',
  0,
  0,
  2024
FROM empresas e WHERE e.email = 'aceites@example.com'
UNION ALL
SELECT
  'Vino Blanco Albariño',
  'Vino',
  'Blanco Albariño',
  e.id,
  e.name,
  'España',
  false,
  false,
  NULL,
  'D.O. Rías Baixas',
  3.2,
  12.5,
  2023
FROM empresas e WHERE e.email = 'vinos@example.com'
UNION ALL
SELECT
  'Ginebra Premium Artesanal',
  'Destilado',
  'Ginebra',
  e.id,
  e.name,
  'España',
  false,
  true,
  NULL,
  'Alicante',
  0,
  40.0,
  2024
FROM empresas e WHERE e.email = 'destilerias@example.com'
UNION ALL
SELECT
  'Vino Rosado Navarra',
  'Vino',
  'Rosado',
  e.id,
  e.name,
  'España',
  false,
  true,
  NULL,
  'D.O. Navarra',
  4.0,
  12.0,
  2024
FROM empresas e WHERE e.email = 'bodega1@example.com';

-- 4. Insertar muestras MANUALES (manual = true, código entre 1-999)
INSERT INTO muestras (
  codigo,
  nombre, 
  categoria, 
  categoriadecata,
  empresa_id,
  empresa,
  pais,
  manual,
  pagada,
  codigotexto,
  origen,
  azucar,
  grado,
  anio
)
SELECT
  100,
  'Vino Tinto Crianza MANUAL',
  'Vino',
  'Tinto Crianza',
  e.id,
  e.name,
  'España',
  true, -- manual
  true,
  '000100',
  'D.O. Ribera del Duero',
  2.0,
  14.0,
  2020
FROM empresas e WHERE e.email = 'bodega1@example.com'
UNION ALL
SELECT
  150,
  'Aceite Ecológico MANUAL',
  'Aceite',
  'Ecológico',
  e.id,
  e.name,
  'España',
  true,
  false,
  '000150',
  'Jaén',
  0,
  0,
  2024
FROM empresas e WHERE e.email = 'aceites@example.com'
UNION ALL
SELECT
  200,
  'Ron Añejo MANUAL',
  'Destilado',
  'Ron',
  e.id,
  e.name,
  'España',
  true,
  true,
  '000200',
  'Canarias',
  0,
  38.0,
  2018
FROM empresas e WHERE e.email = 'destilerias@example.com'
UNION ALL
SELECT
  50,
  'Vino Espumoso MANUAL',
  'Vino',
  'Espumoso',
  e.id,
  e.name,
  'España',
  true,
  false,
  '000050',
  'D.O. Cava',
  1.5,
  11.5,
  2023
FROM empresas e WHERE e.email = 'vinos@example.com'
UNION ALL
SELECT
  300,
  'Aceite Arbequina MANUAL',
  'Aceite',
  'Arbequina',
  e.id,
  e.name,
  'España',
  true,
  true,
  '000300',
  'Cataluña',
  0,
  0,
  2024
FROM empresas e WHERE e.email = 'aceites@example.com';

-- 5. Verificar las inserciones
SELECT 
  m.codigo,
  m.codigotexto,
  m.nombre,
  e.name as empresa_nombre,
  m.categoria,
  m.categoriadecata,
  m.pais,
  m.manual,
  m.pagada,
  m.created_at
FROM muestras m
LEFT JOIN empresas e ON m.empresa_id = e.id
ORDER BY m.manual DESC, m.codigo ASC;

-- Resumen por tipo
SELECT 
  CASE WHEN manual THEN 'Manual (1-999)' ELSE 'Automático (1000-9999)' END as tipo,
  COUNT(*) as total,
  MIN(codigo) as codigo_minimo,
  MAX(codigo) as codigo_maximo
FROM muestras
GROUP BY manual
ORDER BY manual DESC;
