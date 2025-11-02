-- Actualizar constraint de puesto para que sea 1-5
ALTER TABLE public.usuarios 
DROP CONSTRAINT IF EXISTS usuarios_puesto_check;

ALTER TABLE public.usuarios 
ADD CONSTRAINT usuarios_puesto_check 
CHECK (puesto >= 1 AND puesto <= 5);
