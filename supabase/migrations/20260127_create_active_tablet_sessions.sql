-- ============================================================
-- SISTEMA DE GESTIÓN DE SESIONES DE TABLETS
-- ============================================================
-- Esta migración crea la tabla para trackear sesiones activas
-- de tablets en tiempo real, permitiendo control y monitoreo.

-- Tabla de sesiones activas de tablets
CREATE TABLE IF NOT EXISTS public.active_tablet_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tablet_id integer NOT NULL UNIQUE,
  mesa integer NOT NULL,
  puesto integer NOT NULL,
  usuario_id text NOT NULL,
  usuario_nombre text NOT NULL,
  usuario_rol text NOT NULL,
  es_presidente boolean NOT NULL DEFAULT false,
  logged_in_at timestamptz NOT NULL DEFAULT now(),
  last_heartbeat timestamptz NOT NULL DEFAULT now(),
  device_info jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_active_sessions_tablet_id 
  ON public.active_tablet_sessions(tablet_id);

CREATE INDEX IF NOT EXISTS idx_active_sessions_usuario_id 
  ON public.active_tablet_sessions(usuario_id);

CREATE INDEX IF NOT EXISTS idx_active_sessions_heartbeat 
  ON public.active_tablet_sessions(last_heartbeat);

-- Habilitar Row Level Security
ALTER TABLE public.active_tablet_sessions ENABLE ROW LEVEL SECURITY;

-- Política: Todos pueden leer sesiones activas
CREATE POLICY "Allow read active sessions"
  ON public.active_tablet_sessions
  FOR SELECT
  USING (true);

-- Política: Solo el usuario puede insertar su propia sesión
CREATE POLICY "Allow insert own session"
  ON public.active_tablet_sessions
  FOR INSERT
  WITH CHECK (true);

-- Política: Solo el usuario puede actualizar su propia sesión
CREATE POLICY "Allow update own session"
  ON public.active_tablet_sessions
  FOR UPDATE
  USING (true);

-- Política: Solo el usuario puede eliminar su propia sesión
CREATE POLICY "Allow delete own session"
  ON public.active_tablet_sessions
  FOR DELETE
  USING (true);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_active_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_active_sessions_updated_at 
  ON public.active_tablet_sessions;

CREATE TRIGGER trigger_update_active_sessions_updated_at
  BEFORE UPDATE ON public.active_tablet_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_active_sessions_updated_at();

-- Función para limpiar sesiones inactivas (más de 30 minutos sin heartbeat)
CREATE OR REPLACE FUNCTION cleanup_inactive_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM public.active_tablet_sessions
  WHERE last_heartbeat < now() - interval '30 minutes';
END;
$$ LANGUAGE plpgsql;

-- Comentarios
COMMENT ON TABLE public.active_tablet_sessions IS 
  'Tabla para trackear sesiones activas de tablets en tiempo real';

COMMENT ON COLUMN public.active_tablet_sessions.tablet_id IS 
  'Número de tablet (1-25) - debe ser único mientras esté activa';

COMMENT ON COLUMN public.active_tablet_sessions.last_heartbeat IS 
  'Última señal de vida de la sesión - se actualiza cada minuto';
