-- ============================================================
-- ARREGLO DE PERMISOS PARA SESIONES DE TABLETS
-- ============================================================
-- Ejecuta este SQL para asegurar que las tablets puedan registrar
-- sus sesiones aunque no estén autenticadas en Supabase Auth.

-- 1. Asegurar que los roles anónimos y autenticados tengan permisos
GRANT ALL ON TABLE public.active_tablet_sessions TO anon, authenticated;
GRANT ALL ON SEQUENCE public.active_tablet_sessions_id_seq TO anon, authenticated;

-- 2. Asegurar que RLS permita todo a todos (las tablets no tienen usuario de auth)
DROP POLICY IF EXISTS "Allow read active sessions" ON public.active_tablet_sessions;
DROP POLICY IF EXISTS "Allow insert own session" ON public.active_tablet_sessions;
DROP POLICY IF EXISTS "Allow update own session" ON public.active_tablet_sessions;
DROP POLICY IF EXISTS "Allow delete own session" ON public.active_tablet_sessions;

CREATE POLICY "public_select_sessions" ON public.active_tablet_sessions FOR SELECT USING (true);
CREATE POLICY "public_insert_sessions" ON public.active_tablet_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "public_update_sessions" ON public.active_tablet_sessions FOR UPDATE USING (true);
CREATE POLICY "public_delete_sessions" ON public.active_tablet_sessions FOR DELETE USING (true);

-- 3. Habilitar tiempo real para esta tabla (crítico para los indicadores)
ALTER publication supabase_realtime ADD TABLE public.active_tablet_sessions;
