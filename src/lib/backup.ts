/**
 * Sistema de Respaldos y Audit Log
 * Permite exportar datos y registrar cambios
 */
import { supabase } from './supabase';

// ============================================
// EXPORTACIÓN DE DATOS
// ============================================

export interface BackupData {
  empresas: any[];
  muestras: any[];
  catadores: any[];
  mesas: any[];
  timestamp: string;
  version: string;
}

/**
 * Exportar todos los datos a JSON
 */
export async function exportToJSON(): Promise<BackupData> {
  const [empresasRes, muestrasRes, catadoresRes, mesasRes] = await Promise.all([
    supabase.from('empresas').select('*'),
    supabase.from('muestras').select('*'),
    supabase.from('usuarios').select('id, nombre, email, pais, rol, activo, mesa, puesto, tablet, codigocatador, created_at'),
    supabase.from('mesas').select('*'),
  ]);

  const backup: BackupData = {
    empresas: empresasRes.data || [],
    muestras: muestrasRes.data || [],
    catadores: catadoresRes.data || [],
    mesas: mesasRes.data || [],
    timestamp: new Date().toISOString(),
    version: '1.0',
  };

  return backup;
}

/**
 * Descargar backup como archivo JSON
 */
export async function downloadBackupJSON(): Promise<void> {
  const backup = await exportToJSON();
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup_virtus_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exportar tabla específica a CSV
 */
export async function exportTableToCSV(tableName: 'empresas' | 'muestras' | 'usuarios' | 'mesas'): Promise<void> {
  let query;
  
  switch (tableName) {
    case 'usuarios':
      query = supabase.from(tableName).select('id, nombre, email, pais, rol, activo, mesa, puesto, tablet, codigocatador, created_at');
      break;
    default:
      query = supabase.from(tableName).select('*');
  }

  const { data, error } = await query;
  
  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error('No hay datos para exportar');
  }

  // Convertir a CSV
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return String(value);
      }).join(',')
    )
  ];

  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${tableName}_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ============================================
// AUDIT LOG
// ============================================

export interface AuditLogEntry {
  id?: string;
  tabla: string;
  accion: 'crear' | 'actualizar' | 'eliminar';
  registro_id: string;
  datos_anteriores?: any;
  datos_nuevos?: any;
  usuario?: string;
  timestamp: string;
}

// Almacenamiento local de audit log (en memoria y localStorage)
const AUDIT_LOG_KEY = 'virtus_audit_log';

/**
 * Obtener audit log desde localStorage
 */
export function getAuditLog(): AuditLogEntry[] {
  try {
    const stored = localStorage.getItem(AUDIT_LOG_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Guardar entrada en el audit log
 */
export function logAuditEntry(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): void {
  const logs = getAuditLog();
  const newEntry: AuditLogEntry = {
    ...entry,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    usuario: localStorage.getItem('userRole') || 'admin',
  };
  
  // Mantener solo los últimos 500 registros
  const updatedLogs = [newEntry, ...logs].slice(0, 500);
  localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(updatedLogs));
}

/**
 * Limpiar audit log
 */
export function clearAuditLog(): void {
  localStorage.removeItem(AUDIT_LOG_KEY);
}

/**
 * Exportar audit log a JSON
 */
export function exportAuditLog(): void {
  const logs = getAuditLog();
  const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `audit_log_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ============================================
// HELPER PARA REGISTRAR CAMBIOS
// ============================================

/**
 * Wrapper para operaciones de Supabase con audit log
 */
export async function supabaseWithAudit<T>(
  tabla: string,
  accion: 'crear' | 'actualizar' | 'eliminar',
  registroId: string,
  operation: () => Promise<{ data: T | null; error: any }>,
  datosAnteriores?: any
): Promise<{ data: T | null; error: any }> {
  const result = await operation();
  
  if (!result.error) {
    logAuditEntry({
      tabla,
      accion,
      registro_id: registroId,
      datos_anteriores: datosAnteriores,
      datos_nuevos: result.data,
    });
  }
  
  return result;
}
