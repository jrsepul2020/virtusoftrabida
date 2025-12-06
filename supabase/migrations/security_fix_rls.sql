-- ===========================================
-- CORRECCIÓN DE SEGURIDAD: Reactivar RLS
-- Ejecutar en Supabase SQL Editor
-- Versión 2 - Solo tablas existentes
-- ===========================================

-- PRIMERO: Ver qué tablas existen en tu base de datos
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- ===========================================
-- PASO 1: HABILITAR RLS EN TABLAS PRINCIPALES
-- (Ejecutar solo las tablas que existan)
-- ===========================================

ALTER TABLE IF EXISTS empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS muestras ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS dispositivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS configuracion ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS mesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS catas ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS asignaciones_mesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS status_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS configuracion_medallas ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS configuracion_paypal ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS categoriasdecata ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- PASO 2: ELIMINAR POLÍTICAS ANTIGUAS
-- ===========================================

-- Empresas
DROP POLICY IF EXISTS "Allow public read empresas" ON empresas;
DROP POLICY IF EXISTS "Allow authenticated write empresas" ON empresas;
DROP POLICY IF EXISTS "empresas_public_read" ON empresas;
DROP POLICY IF EXISTS "empresas_public_insert" ON empresas;
DROP POLICY IF EXISTS "empresas_auth_update" ON empresas;
DROP POLICY IF EXISTS "empresas_auth_delete" ON empresas;

-- Muestras
DROP POLICY IF EXISTS "Allow public read muestras" ON muestras;
DROP POLICY IF EXISTS "Allow authenticated write muestras" ON muestras;
DROP POLICY IF EXISTS "muestras_public_read" ON muestras;
DROP POLICY IF EXISTS "muestras_public_insert" ON muestras;
DROP POLICY IF EXISTS "muestras_auth_update" ON muestras;
DROP POLICY IF EXISTS "muestras_auth_delete" ON muestras;

-- Usuarios
DROP POLICY IF EXISTS "Allow authenticated all usuarios" ON usuarios;
DROP POLICY IF EXISTS "usuarios_auth_all" ON usuarios;

-- Dispositivos
DROP POLICY IF EXISTS "dispositivos_auth_all" ON dispositivos;

-- Configuracion
DROP POLICY IF EXISTS "configuracion_public_read" ON configuracion;
DROP POLICY IF EXISTS "configuracion_auth_write" ON configuracion;
DROP POLICY IF EXISTS "configuracion_auth_insert" ON configuracion;
DROP POLICY IF EXISTS "configuracion_auth_update" ON configuracion;
DROP POLICY IF EXISTS "configuracion_auth_delete" ON configuracion;

-- ===========================================
-- PASO 3: POLÍTICAS PARA EMPRESAS
-- ===========================================

-- Lectura pública (para el formulario de inscripción)
CREATE POLICY "empresas_public_read" ON empresas
    FOR SELECT USING (true);

-- Inserción pública (para nuevas inscripciones)
CREATE POLICY "empresas_public_insert" ON empresas
    FOR INSERT WITH CHECK (true);

-- Actualización solo autenticados
CREATE POLICY "empresas_auth_update" ON empresas
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Eliminación solo autenticados
CREATE POLICY "empresas_auth_delete" ON empresas
    FOR DELETE USING (auth.role() = 'authenticated');

-- ===========================================
-- PASO 4: POLÍTICAS PARA MUESTRAS
-- ===========================================

CREATE POLICY "muestras_public_read" ON muestras
    FOR SELECT USING (true);

CREATE POLICY "muestras_public_insert" ON muestras
    FOR INSERT WITH CHECK (true);

CREATE POLICY "muestras_auth_update" ON muestras
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "muestras_auth_delete" ON muestras
    FOR DELETE USING (auth.role() = 'authenticated');

-- ===========================================
-- PASO 5: POLÍTICAS PARA USUARIOS
-- ===========================================

CREATE POLICY "usuarios_auth_all" ON usuarios
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- ===========================================
-- PASO 6: POLÍTICAS PARA DISPOSITIVOS
-- ===========================================

CREATE POLICY "dispositivos_auth_all" ON dispositivos
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- ===========================================
-- PASO 7: POLÍTICAS PARA CONFIGURACIÓN
-- ===========================================

CREATE POLICY "configuracion_public_read" ON configuracion
    FOR SELECT USING (true);

CREATE POLICY "configuracion_auth_insert" ON configuracion
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "configuracion_auth_update" ON configuracion
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "configuracion_auth_delete" ON configuracion
    FOR DELETE USING (auth.role() = 'authenticated');

-- ===========================================
-- PASO 8: POLÍTICAS PARA MESAS (si existe)
-- ===========================================

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'mesas') THEN
        EXECUTE 'DROP POLICY IF EXISTS "mesas_auth_all" ON mesas';
        EXECUTE 'CREATE POLICY "mesas_auth_all" ON mesas FOR ALL USING (auth.role() = ''authenticated'') WITH CHECK (auth.role() = ''authenticated'')';
    END IF;
END $$;

-- ===========================================
-- VERIFICACIÓN FINAL
-- ===========================================

SELECT 
    tablename as "Tabla",
    CASE WHEN rowsecurity THEN '✅ RLS Activo' ELSE '❌ RLS Desactivado' END as "Estado RLS"
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('empresas', 'muestras', 'usuarios', 'dispositivos', 'configuracion', 'mesas', 'catas')
ORDER BY tablename;

-- ===========================================
-- NOTAS IMPORTANTES:
-- ===========================================
-- ✅ Lectura pública: empresas, muestras, configuracion (formulario inscripción)
-- ✅ Escritura pública (INSERT): empresas, muestras (nuevas inscripciones)
-- ✅ Update/Delete: Solo usuarios autenticados
-- ✅ usuarios, dispositivos: Solo autenticados
-- ===========================================
