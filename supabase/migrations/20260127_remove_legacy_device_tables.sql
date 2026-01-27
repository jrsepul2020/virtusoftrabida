-- Migration to remove unused device management tables and related objects
-- Created: 2026-01-27
-- Purpose: Clean up legacy device management system (DispositivosManager and AuthorizedDevicesManager)

-- Drop the dispositivos table and its related objects
DROP INDEX IF EXISTS public.idx_dispositivos_unique_tablet;
DROP INDEX IF EXISTS public.idx_dispositivos_tablet_number;
DROP INDEX IF EXISTS public.idx_dispositivos_fingerprint;
DROP TABLE IF EXISTS public.dispositivos CASCADE;

-- Drop the authorized_devices table if it exists (no migration found, but component referenced it)
DROP TABLE IF EXISTS public.authorized_devices CASCADE;

-- Note: The active_tablet_sessions table is still in use by TabletSessionsManager
-- and should NOT be dropped. It's part of the new tablet login system.

COMMENT ON SCHEMA public IS 'Removed legacy device management tables: dispositivos and authorized_devices. The new tablet system uses active_tablet_sessions instead.';
