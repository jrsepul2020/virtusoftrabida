import { useState, useEffect } from 'react';
import { supabase, type Sample, type PuntuacionCatador } from '../lib/supabase';
import { Wine, Star, MessageSquare, CheckCircle, Clock, Save, AlertCircle, LogOut } from 'lucide-react';

interface CatadorInfo {
  id: string;
  nombre: string;
  mesa: number;
}

interface CatadorDashboardProps {
  onLogout?: () => void;
}

export default function CatadorDashboard({ onLogout }: CatadorDashboardProps) {
  const [catador, setCatador] = useState<CatadorInfo | null>(null);
  const [muestras, setMuestras] = useState<Sample[]>([]);
  const [puntuaciones, setPuntuaciones] = useState<Map<number, PuntuacionCatador>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Estado temporal para el formulario de puntuación
  const [editingScore, setEditingScore] = useState<{
    muestra_id: number;
    puntuacion: number;
    notas: string;
  } | null>(null);

  useEffect(() => {
    loadCatadorInfo();
  }, []);

  useEffect(() => {
    if (catador) {
      loadMuestrasAsignadas();
      loadPuntuacionesExistentes();
    }
  }, [catador]);

  const loadCatadorInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nombre, mesa')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setCatador(data);
    } catch (error) {
      console.error('Error loading catador info:', error);
      showMessage('error', 'Error al cargar información del catador');
    } finally {
      setLoading(false);
    }
  };

  const loadMuestrasAsignadas = async () => {
    if (!catador?.mesa) return;

    try {
      // Obtener muestras asignadas a la mesa del catador
      const { data: asignaciones, error: assignError } = await supabase
        .from('muestras_mesas')
        .select('muestra_id')
        .eq('mesa_id', catador.mesa);

      if (assignError) throw assignError;

      const muestraIds = asignaciones?.map(a => a.muestra_id) || [];

      if (muestraIds.length === 0) {
        setMuestras([]);
        return;
      }

      // Obtener detalles de las muestras
      const { data: muestrasData, error: samplesError } = await supabase
        .from('muestras')
        .select(`
          *,
          empresas:empresa_id (name)
        `)
        .in('id', muestraIds)
        .order('codigo', { ascending: true });

      if (samplesError) throw samplesError;

      const muestrasConEmpresa = muestrasData?.map(m => ({
        ...m,
        empresa_nombre: m.empresas?.name || 'Sin empresa'
      })) || [];

      setMuestras(muestrasConEmpresa);
    } catch (error) {
      console.error('Error loading muestras:', error);
      showMessage('error', 'Error al cargar las muestras');
    }
  };

  const loadPuntuacionesExistentes = async () => {
    if (!catador?.id) return;

    try {
      const { data, error } = await supabase
        .from('puntuaciones_catadores')
        .select('*')
        .eq('catador_id', catador.id);

      if (error) throw error;

      const puntuacionesMap = new Map<number, PuntuacionCatador>();
      data?.forEach(p => {
        puntuacionesMap.set(p.muestra_id, p);
      });
      setPuntuaciones(puntuacionesMap);
    } catch (error) {
      console.error('Error loading puntuaciones:', error);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleStartScoring = (muestra: Sample) => {
    const existingScore = puntuaciones.get(Number(muestra.id));
    setEditingScore({
      muestra_id: Number(muestra.id),
      puntuacion: existingScore?.puntuacion || 50,
      notas: existingScore?.notas || ''
    });
  };

  const handleSaveScore = async () => {
    if (!editingScore || !catador) return;

    setSaving(editingScore.muestra_id);
    try {
      const existingScore = puntuaciones.get(editingScore.muestra_id);

      if (existingScore) {
        // Actualizar puntuación existente
        const { error } = await supabase
          .from('puntuaciones_catadores')
          .update({
            puntuacion: editingScore.puntuacion,
            notas: editingScore.notas
          })
          .eq('id', existingScore.id);

        if (error) throw error;
        showMessage('success', 'Puntuación actualizada correctamente');
      } else {
        // Insertar nueva puntuación
        const { error } = await supabase
          .from('puntuaciones_catadores')
          .insert({
            muestra_id: editingScore.muestra_id,
            catador_id: catador.id,
            mesa_id: catador.mesa,
            puntuacion: editingScore.puntuacion,
            notas: editingScore.notas
          });

        if (error) throw error;
        showMessage('success', 'Puntuación guardada correctamente');
      }

      // Recargar puntuaciones
      await loadPuntuacionesExistentes();
      setEditingScore(null);
    } catch (error: any) {
      console.error('Error saving score:', error);
      if (error.code === '23505') {
        showMessage('error', 'Ya has puntuado esta muestra');
      } else {
        showMessage('error', 'Error al guardar la puntuación');
      }
    } finally {
      setSaving(null);
    }
  };

  const getMuestraStatus = (muestraId: number) => {
    const puntuacion = puntuaciones.get(muestraId);
    if (puntuacion) {
      return { status: 'scored', icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-50' };
    }
    return { status: 'pending', icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!catador?.mesa) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md">
          <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">
            No tienes mesa asignada
          </h2>
          <p className="text-gray-600 text-center">
            Contacta con el administrador para que te asigne a una mesa de cata.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Wine className="w-8 h-8 text-primary-600" />
                Panel de Catador
              </h1>
              <p className="text-gray-600 mt-1">
                {catador.nombre} - Mesa {catador.mesa}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-500">Muestras asignadas</div>
                <div className="text-3xl font-bold text-primary-600">{muestras.length}</div>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Salir
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Message Alert */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Wine className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Total Muestras</div>
                <div className="text-2xl font-bold text-gray-900">{muestras.length}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Puntuadas</div>
                <div className="text-2xl font-bold text-gray-900">{puntuaciones.size}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Pendientes</div>
                <div className="text-2xl font-bold text-gray-900">{muestras.length - puntuaciones.size}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Muestras List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-900">Muestras para Catar</h2>
          </div>

          {muestras.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Wine className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>No hay muestras asignadas a tu mesa</p>
            </div>
          ) : (
            <div className="divide-y">
              {muestras.map((muestra) => {
                const { status, icon: StatusIcon, color, bgColor } = getMuestraStatus(Number(muestra.id));
                const existingScore = puntuaciones.get(Number(muestra.id));
                const isEditing = editingScore?.muestra_id === Number(muestra.id);

                return (
                  <div key={muestra.id} className={`p-6 hover:bg-gray-50 transition-colors ${isEditing ? 'bg-blue-50' : ''}`}>
                    <div className="flex items-start gap-4">
                      {/* Status Icon */}
                      <div className={`p-3 rounded-lg ${bgColor}`}>
                        <StatusIcon className={`w-6 h-6 ${color}`} />
                      </div>

                      {/* Muestra Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              #{muestra.codigotexto || muestra.codigo} - {muestra.nombre}
                            </h3>
                            <p className="text-sm text-gray-600">{muestra.empresa_nombre}</p>
                            {muestra.categoria && (
                              <span className="inline-block mt-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                {muestra.categoria}
                              </span>
                            )}
                          </div>
                          {existingScore && !isEditing && (
                            <div className="text-right">
                              <div className="flex items-center gap-1">
                                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                <span className="text-2xl font-bold text-gray-900">{existingScore.puntuacion}</span>
                                <span className="text-gray-500">/100</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Scoring Form */}
                        {isEditing ? (
                          <div className="mt-4 space-y-4 bg-white p-4 rounded-lg border-2 border-blue-200">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Puntuación (0-100)
                              </label>
                              <div className="flex items-center gap-4">
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  step="0.5"
                                  value={editingScore.puntuacion}
                                  onChange={(e) => setEditingScore({ ...editingScore, puntuacion: parseFloat(e.target.value) })}
                                  className="flex-1"
                                />
                                <div className="flex items-center gap-1 min-w-[100px]">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.5"
                                    value={editingScore.puntuacion}
                                    onChange={(e) => setEditingScore({ ...editingScore, puntuacion: parseFloat(e.target.value) || 0 })}
                                    className="w-20 px-3 py-2 border rounded-lg text-center font-bold text-xl"
                                  />
                                  <span className="text-gray-500">/100</span>
                                </div>
                              </div>
                            </div>

                            <div>
                              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <MessageSquare className="w-4 h-4" />
                                Notas de Cata (Opcional)
                              </label>
                              <textarea
                                value={editingScore.notas}
                                onChange={(e) => setEditingScore({ ...editingScore, notas: e.target.value })}
                                rows={3}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Aromas, sabores, textura, equilibrio..."
                              />
                            </div>

                            <div className="flex gap-3">
                              <button
                                onClick={handleSaveScore}
                                disabled={saving === editingScore.muestra_id}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium"
                              >
                                <Save className="w-4 h-4" />
                                {saving === editingScore.muestra_id ? 'Guardando...' : 'Guardar Puntuación'}
                              </button>
                              <button
                                onClick={() => setEditingScore(null)}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {existingScore?.notas && (
                              <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-700">
                                  <span className="font-medium">Notas:</span> {existingScore.notas}
                                </p>
                              </div>
                            )}
                            <button
                              onClick={() => handleStartScoring(muestra)}
                              className={`mt-3 px-4 py-2 rounded-lg font-medium ${
                                status === 'scored'
                                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                  : 'bg-primary-600 text-white hover:bg-primary-700'
                              }`}
                            >
                              {status === 'scored' ? 'Editar Puntuación' : 'Puntuar Muestra'}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
