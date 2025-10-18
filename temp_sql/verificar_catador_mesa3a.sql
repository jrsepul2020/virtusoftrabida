-- Script para verificar el catador específico mesa3a@gmail.com
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar si existe el catador con ese email
SELECT * FROM catadores WHERE email = 'mesa3a@gmail.com';

-- 2. Verificar todos los campos incluyendo la clave
SELECT 
    id,
    nombre,
    email,
    mesa,
    puesto,
    clave,
    rol,
    created_at
FROM catadores 
WHERE email = 'mesa3a@gmail.com';

-- 3. Verificar si la clave coincide exactamente
SELECT * FROM catadores 
WHERE email = 'mesa3a@gmail.com' 
AND clave = 'Mesa3Puesto1_160';

-- 4. Ver todos los catadores para comparar formato de claves
SELECT email, mesa, puesto, clave FROM catadores 
ORDER BY mesa, puesto;

-- 5. Si necesitas actualizar la clave del catador específico:
-- UPDATE catadores 
-- SET clave = 'Mesa3Puesto1_160' 
-- WHERE email = 'mesa3a@gmail.com';