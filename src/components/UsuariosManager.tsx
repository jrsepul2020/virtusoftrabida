import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Users, Plus, Search, RefreshCw, Shield, User, Mail, 
  Calendar, Edit2, Trash2, Save, X,
  Eye, EyeOff, AlertTriangle, Lock, KeyRound, QrCode, Clock3, Activity
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  mesa?: number;
  puesto?: number;
  codigocatador?: string;
  created_at: string;
}

interface NuevoUsuario {
  email: string;
  password: string;
  nombre: string;
  rol: string;
}

interface AuditLog {
  id?: number;
  action: string;
  user_id?: string | null;
  actor_email?: string | null;
  details?: string | null;
  created_at?: string;
}

export default function UsuariosManager() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRol, setFilterRol] = useState<string>('todos');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [mfaFactors, setMfaFactors] = useState<any[]>([]);
  const [loadingMfa, setLoadingMfa] = useState(false);
  const [enrollingMfa, setEnrollingMfa] = useState(false);
  const [enrollData, setEnrollData] = useState<{ factorId: string; uri?: string; qr?: string } | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [mfaError, setMfaError] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  
  const [nuevoUsuario, setNuevoUsuario] = useState<NuevoUsuario>({
    email: '',
    password: '',
    nombre: '',
    rol: 'Catador'
  });

  const roles = ['Admin', 'Presidente', 'Supervisor', 'Catador'];

  useEffect(() => {
    fetchUsuarios();
    fetchMfaFactors();
    fetchAuditLogs();
  }, []);

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsuarios(data || []);
    } catch (error: any) {
      console.error('Error cargando usuarios:', error);
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    setLoadingAudit(true);
    setAuditError(null);
    try {
      const { data, error } = await supabase
        .from('auditoria_usuarios')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      setAuditLogs(data || []);
    } catch (error: any) {
      console.error('Error cargando auditoría:', error);
      if (error?.code === '42P01') {
        setAuditError('Tabla auditoria_usuarios no existe. Puedes crearla para registrar acciones.');
      } else {
        setAuditError('No se pudo cargar el historial de acciones');
      }
    } finally {
      setLoadingAudit(false);
    }
  };

  const logAudit = async (entry: AuditLog) => {
    try {
      const { error } = await supabase.from('auditoria_usuarios').insert(entry);
      if (error) throw error;
      fetchAuditLogs();
    } catch (error: any) {
      if (error?.code === '42P01') {
        setAuditError('Tabla auditoria_usuarios no existe.');
      } else {
        console.warn('No se pudo registrar auditoría:', error.message);
      }
    }
  };

  const handleCreateUser = async () => {
    if (!nuevoUsuario.email || !nuevoUsuario.password || !nuevoUsuario.nombre) {
      toast.error('Completa todos los campos obligatorios');
      return;
    }

    if (nuevoUsuario.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      // 1. Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: nuevoUsuario.email,
        password: nuevoUsuario.password,
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('No se pudo crear el usuario');
      }

      // 2. Crear registro en tabla usuarios
      const { error: dbError } = await supabase
        .from('usuarios')
        .insert({
          id: authData.user.id,
          email: nuevoUsuario.email,
          nombre: nuevoUsuario.nombre,
          rol: nuevoUsuario.rol
        });

      if (dbError) throw dbError;

      logAudit({ action: 'create_user', user_id: authData.user.id, actor_email: authData.user.email, details: `Rol: ${nuevoUsuario.rol}` });

      toast.success('Usuario creado correctamente');
      setShowCreateModal(false);
      setNuevoUsuario({ email: '', password: '', nombre: '', rol: 'Catador' });
      fetchUsuarios();
    } catch (error: any) {
      console.error('Error creando usuario:', error);
      if (error.message?.includes('already registered')) {
        toast.error('Este email ya está registrado');
      } else {
        toast.error(error.message || 'Error al crear usuario');
      }
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      const { error } = await supabase
        .from('usuarios')
        .update({
          nombre: editingUser.nombre,
          rol: editingUser.rol,
          mesa: editingUser.mesa,
          puesto: editingUser.puesto,
          codigocatador: editingUser.codigocatador
        })
        .eq('id', editingUser.id);

      if (error) throw error;

      logAudit({ action: 'update_user', user_id: editingUser.id, details: `Rol: ${editingUser.rol}, Mesa: ${editingUser.mesa}, Puesto: ${editingUser.puesto}` });

      toast.success('Usuario actualizado');
      setEditingUser(null);
      fetchUsuarios();
    } catch (error: any) {
      console.error('Error actualizando usuario:', error);
      toast.error('Error al actualizar usuario');
    }
  };

  const handleDeleteUser = async (usuario: Usuario) => {
    if (!confirm(`¿Estás seguro de eliminar a ${usuario.nombre}? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      // Solo eliminar de la tabla usuarios (no podemos eliminar de auth sin admin)
      const { error } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', usuario.id);

      if (error) throw error;

      logAudit({ action: 'delete_user', user_id: usuario.id, details: `Email: ${usuario.email}` });

      toast.success('Usuario eliminado de la base de datos');
      fetchUsuarios();
    } catch (error: any) {
      console.error('Error eliminando usuario:', error);
      toast.error('Error al eliminar usuario');
    }
  };

  const fetchMfaFactors = async () => {
    setLoadingMfa(true);
    setMfaError(null);
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      setMfaFactors(data?.all || []);
    } catch (error: any) {
      console.error('Error listando factores MFA:', error);
      setMfaError('No se pudo cargar el estado de 2FA. Verifica que MFA esté habilitado en Supabase.');
    } finally {
      setLoadingMfa(false);
    }
  };

  const startTotpEnrollment = async () => {
    setEnrollingMfa(true);
    setMfaError(null);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
      if (error) throw error;

      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: data.id });
      if (challengeError) throw challengeError;

      setEnrollData({ factorId: data.id, uri: data.totp?.uri, qr: data.totp?.qr_code });
      setChallengeId(challenge.id);
      toast.success('Escanea el QR y valida el código para activar 2FA');
    } catch (error: any) {
      console.error('Error iniciando enrolamiento 2FA:', error);
      setMfaError(error.message || 'No se pudo iniciar el enrolamiento');
    } finally {
      setEnrollingMfa(false);
    }
  };

  const verifyTotpEnrollment = async () => {
    if (!enrollData?.factorId || !challengeId || verificationCode.length < 6) {
      setMfaError('Ingresa el código de 6 dígitos');
      return;
    }
    setLoadingMfa(true);
    setMfaError(null);
    try {
      const { error } = await supabase.auth.mfa.verify({
        factorId: enrollData.factorId,
        code: verificationCode,
        challengeId
      });
      if (error) throw error;
      toast.success('2FA activada');
      setEnrollData(null);
      setChallengeId(null);
      setVerificationCode('');
      fetchMfaFactors();
    } catch (error: any) {
      console.error('Error verificando 2FA:', error);
      setMfaError(error.message || 'Código incorrecto');
    } finally {
      setLoadingMfa(false);
    }
  };

  const disableTotp = async () => {
    const totpFactor = mfaFactors.find((f) => f.factor_type === 'totp');
    if (!totpFactor) {
      toast.error('No hay 2FA TOTP activo');
      return;
    }
    setLoadingMfa(true);
    setMfaError(null);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId: totpFactor.id });
      if (error) throw error;
      toast.success('2FA desactivada');
      fetchMfaFactors();
    } catch (error: any) {
      console.error('Error desactivando 2FA:', error);
      setMfaError(error.message || 'No se pudo desactivar 2FA');
    } finally {
      setLoadingMfa(false);
    }
  };

  // Filtrar usuarios
  const usuariosFiltrados = usuarios.filter(u => {
    const matchSearch = 
      u.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const normalizedRol = u.rol?.toLowerCase();
    const matchRol = filterRol === 'todos' || 
      (filterRol === 'Admin' && normalizedRol === 'admin') ||
      (filterRol === 'Presidente' && normalizedRol === 'presidente') ||
      (filterRol === 'Supervisor' && normalizedRol === 'supervisor') ||
      (filterRol === 'Catador' && normalizedRol === 'catador');
    return matchSearch && matchRol;
  });

  // Normalizar rol para mostrar
  const normalizeRol = (rol: string) => {
    if (rol?.toLowerCase() === 'admin') return 'Admin';
    if (rol?.toLowerCase() === 'presidente') return 'Presidente';
    if (rol?.toLowerCase() === 'supervisor') return 'Supervisor';
    if (rol?.toLowerCase() === 'catador') return 'Catador';
    return rol;
  };

  // Estadísticas
  const stats = {
    total: usuarios.length,
    admins: usuarios.filter(u => u.rol?.toLowerCase() === 'admin').length,
    catadores: usuarios.filter(u => u.rol?.toLowerCase() === 'catador').length
  };

  const getRolBadge = (rol: string) => {
    const roleLower = rol?.toLowerCase();
    const displayRol = normalizeRol(rol);
    let classes = 'bg-blue-100 text-blue-700';
    let Icon = User;
    if (roleLower === 'admin') {
      classes = 'bg-purple-100 text-purple-700';
      Icon = Shield;
    } else if (roleLower === 'presidente') {
      classes = 'bg-orange-100 text-orange-700';
      Icon = Shield;
    } else if (roleLower === 'supervisor') {
      classes = 'bg-teal-100 text-teal-700';
      Icon = Shield;
    }
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${classes}`}>
        <Icon className="w-3 h-3" />
        {displayRol}
      </span>
    );
  };

  const totpEnabled = mfaFactors.some((f) => f.factor_type === 'totp');
  const recentActivity = [...usuarios]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-7 h-7 text-purple-600" />
            Gestión de Usuarios
          </h1>
          <p className="text-gray-500 mt-1">Administra los usuarios del sistema</p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={fetchUsuarios}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nuevo Usuario
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Users className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">{stats.admins}</p>
              <p className="text-sm text-gray-500">Admins</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{stats.catadores}</p>
              <p className="text-sm text-gray-500">Catadores</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filterRol}
            onChange={(e) => setFilterRol(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="todos">Todos los roles</option>
            <option value="Admin">Admin</option>
            <option value="Presidente">Presidente</option>
            <option value="Supervisor">Supervisor</option>
            <option value="Catador">Catador</option>
          </select>
        </div>
      </div>

      {/* Seguridad (2FA) y actividad */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">Seguridad y 2FA</h3>
            </div>
            <span className={`px-2 py-1 text-xs rounded-full ${totpEnabled ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
              {totpEnabled ? '2FA activa' : '2FA no activa'}
            </span>
          </div>

          <p className="text-sm text-gray-500 mb-3">Protege el acceso de admins con TOTP (Google Authenticator, 1Password, etc.).</p>

          <div className="space-y-3">
            <div className="border border-gray-100 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
                <Shield className="w-4 h-4 text-purple-600" />
                <span>Factores configurados</span>
              </div>
              {mfaFactors.length === 0 ? (
                <p className="text-sm text-gray-500">No hay factores 2FA registrados.</p>
              ) : (
                <ul className="space-y-1 text-sm text-gray-700">
                  {mfaFactors.map((f) => (
                    <li key={f.id} className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-purple-600" />
                      <span className="font-medium">{f.factor_type?.toUpperCase() || 'TOTP'}</span>
                      {f.created_at && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock3 className="w-3 h-3" />
                          {new Date(f.created_at).toLocaleString('es-ES')}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {mfaError && (
              <div className="bg-red-50 text-red-700 text-sm rounded-lg p-2 border border-red-100">{mfaError}</div>
            )}

            {enrollData && (
              <div className="border border-dashed border-purple-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2">
                  <QrCode className="w-4 h-4 text-purple-600" />
                  Escanea el código y valida
                </div>
                <div className="flex gap-3 items-start flex-wrap">
                  {enrollData.uri ? (
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(enrollData.uri)}`}
                      alt="QR 2FA"
                      className="w-40 h-40 border border-gray-100 rounded"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="w-40 h-40 bg-gray-50 border border-gray-100 rounded flex items-center justify-center text-xs text-gray-500">
                      QR no disponible
                    </div>
                  )}
                  <div className="flex-1 min-w-[220px] space-y-2">
                    <p className="text-xs text-gray-500">Si no puedes escanear, usa el secreto:</p>
                    <div className="font-mono text-sm bg-gray-50 border border-gray-100 rounded px-3 py-2 break-all">
                      {enrollData.uri || 'otpauth://...'}
                    </div>
                    <label className="block text-sm font-medium text-gray-700">Código de 6 dígitos</label>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                      maxLength={6}
                      placeholder="123456"
                    />
                    <button
                      onClick={verifyTotpEnrollment}
                      disabled={loadingMfa}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-60"
                    >
                      Validar y activar
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              {!totpEnabled ? (
                <button
                  onClick={startTotpEnrollment}
                  disabled={enrollingMfa}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-60"
                >
                  {enrollingMfa ? 'Generando QR...' : 'Habilitar 2FA TOTP'}
                </button>
              ) : (
                <button
                  onClick={disableTotp}
                  disabled={loadingMfa}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60"
                >
                  Desactivar 2FA
                </button>
              )}
              <button
                onClick={fetchMfaFactors}
                className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Actualizar estado
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Clock3 className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Historial reciente</h3>
          </div>
          <p className="text-sm text-gray-500 mb-3">Altas recientes (ordenadas por fecha de creación).</p>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-gray-500">No hay actividad reciente.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {recentActivity.map((u) => (
                <li key={u.id} className="py-2 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-700">
                    {u.nombre?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{u.nombre || 'Sin nombre'}</p>
                    <p className="text-xs text-gray-500 truncate">{u.email}</p>
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(u.created_at).toLocaleDateString('es-ES')}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-semibold text-gray-900">Auditoría de acciones</h3>
            </div>
            <button
              onClick={fetchAuditLogs}
              className="text-sm text-indigo-600 hover:underline"
            >
              Refrescar
            </button>
          </div>
          {auditError && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm rounded-lg p-2 mb-2">
              {auditError}
            </div>
          )}
          {loadingAudit ? (
            <p className="text-sm text-gray-500">Cargando auditoría...</p>
          ) : auditLogs.length === 0 ? (
            <p className="text-sm text-gray-500">Sin registros de acciones.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {auditLogs.map((log) => (
                <li key={log.id ?? `${log.action}-${log.created_at}`} className="py-2 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center text-xs font-semibold">
                    {log.action?.slice(0,2).toUpperCase() || 'AC'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{log.action}</p>
                    <p className="text-xs text-gray-500 truncate">{log.details}</p>
                    <p className="text-[11px] text-gray-500 truncate">{log.actor_email || '—'}</p>
                  </div>
                  <div className="text-[11px] text-gray-500 whitespace-nowrap">
                    {log.created_at ? new Date(log.created_at).toLocaleString('es-ES') : ''}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Lista de usuarios */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-2" />
            <p className="text-gray-500">Cargando usuarios...</p>
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">No se encontraron usuarios</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mesa/Puesto</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Creado</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {usuariosFiltrados.map((usuario) => (
                  <tr key={usuario.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-purple-100">
                          <span className="text-lg font-semibold text-purple-600">
                            {usuario.nombre?.charAt(0).toUpperCase() || '?'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{usuario.nombre || 'Sin nombre'}</p>
                          {usuario.codigocatador && (
                            <p className="text-xs text-gray-500">Código: {usuario.codigocatador}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{usuario.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {getRolBadge(usuario.rol)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {usuario.mesa && usuario.puesto 
                        ? `Mesa ${usuario.mesa} / Puesto ${usuario.puesto}`
                        : '-'
                      }
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(usuario.created_at).toLocaleDateString('es-ES')}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingUser(usuario)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(usuario)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Crear Usuario */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-purple-600" />
                  Nuevo Usuario
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  value={nuevoUsuario.nombre}
                  onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, nombre: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Juan García"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={nuevoUsuario.email}
                  onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="usuario@email.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={nuevoUsuario.password}
                    onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, password: e.target.value })}
                    className="w-full px-4 py-2 pr-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="Mínimo 6 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rol *
                </label>
                <select
                  value={nuevoUsuario.rol}
                  onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, rol: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  {roles.map(rol => (
                    <option key={rol} value={rol}>{rol}</option>
                  ))}
                </select>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-700">
                    El usuario recibirá un email de confirmación. Debe confirmar su cuenta antes de poder iniciar sesión.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateUser}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Crear Usuario
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Usuario */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-blue-600" />
                  Editar Usuario
                </h2>
                <button
                  onClick={() => setEditingUser(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre completo
                </label>
                <input
                  type="text"
                  value={editingUser.nombre || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, nombre: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email (no editable)
                </label>
                <input
                  type="email"
                  value={editingUser.email}
                  disabled
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rol
                </label>
                <select
                  value={editingUser.rol}
                  onChange={(e) => setEditingUser({ ...editingUser, rol: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {roles.map(rol => (
                    <option key={rol} value={rol}>{rol}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mesa
                  </label>
                  <input
                    type="number"
                    value={editingUser.mesa || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, mesa: parseInt(e.target.value) || undefined })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: 1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Puesto
                  </label>
                  <input
                    type="number"
                    value={editingUser.puesto || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, puesto: parseInt(e.target.value) || undefined })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: 1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código Catador
                </label>
                <input
                  type="text"
                  value={editingUser.codigocatador || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, codigocatador: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: CAT001"
                />
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setEditingUser(null)}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateUser}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
