-- Migration: Add consent columns to empresas and create mailrelay_sync table
-- Date: 2025-12-11

BEGIN;

-- Añadir campos de consentimiento a la tabla empresas
ALTER TABLE IF EXISTS empresas
  ADD COLUMN IF NOT EXISTS acepto_reglamento boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS consentimiento_marketing boolean NOT NULL DEFAULT false;

-- Crear tabla para marcar sincronizaciones con Mailrelay
CREATE TABLE IF NOT EXISTS mailrelay_sync (
  empresa_id uuid PRIMARY KEY,
  mailrelay_id text,
  synced boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

COMMIT;
