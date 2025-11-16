import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getOrCreateFingerprint } from '../lib/deviceFingerprint';
import { LogIn, User, AlertCircle } from 'lucide-react';

interface Catador {
  id: string;
  nombre: string;
  codigocatador: string;
  tablet: number | null;
  rol: string;
  mesa: number | null;
  puesto: number | null;
}

interface CatadorLoginProps {
  tabletNumber: number;
  onLoginSuccess: (catador: Catador) => void;
}

export default function CatadorLogin({ tabletNumber, onLoginSuccess }: CatadorLoginProps) {
  const [catadores, setCatadores] = useState<Catador[]>([]);
  const [selectedCatadorId, setSelectedCatadorId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadCatadores();
  }, []);

  /**
   * Carga todos los catadores disponibles
   */
  const loadCatadores = async () => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('nombre');

      if (error) throw error;
      setCatadores(data || []);
    } catch (error) {
      console.error('Error cargando catadores:', error);
    }
  };

  /**
   * Actualiza last_seen_at del dispositivo
   */
  const updateDeviceLastSeen = async () => {
    try {
      const fingerprint = await getOrCreateFingerprint();
      await supabase
        .from('dispositivos')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('device_fingerprint', fingerprint);
    } catch (error) {
      console.error('Error actualizando last_seen:', error);
    }
  };

  /**
   * Maneja el login del catador
   */
  const handleLogin = async () => {
    if (!selectedCatadorId) {
      setError('Por favor selecciona un catador');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const catador = catadores.find(c => c.id === selectedCatadorId);
      if (!catador) {
        setError('Catador no encontrado');
        return;
      }

      console.log('🔍 Validación de tablet:', {
        catadorNombre: catador.nombre,
        tabletAsignada: catador.tablet,
        tabletActual: tabletNumber,
        tipoTabletAsignada: typeof catador.tablet,
        tipoTabletActual: typeof tabletNumber
      });

      // Convertir a número para comparación
      const catadorTablet = catador.tablet !== null ? Number(catador.tablet) : null;
      const currentTablet = Number(tabletNumber);

      // Validar que el catador está asignado a esta tablet
      if (catadorTablet !== null && catadorTablet !== currentTablet) {
        setError(
          `Este catador está asignado a la Tablet ${catadorTablet}, no a la Tablet ${currentTablet}. ` +
          `Por favor contacta al administrador o selecciona otro catador.`
        );
        setLoading(false);
        return;
      }

      // Si el catador no tiene tablet asignada, mostrar advertencia
      if (catadorTablet === null) {
        const confirmar = window.confirm(
          `${catador.nombre} no tiene una tablet asignada. ¿Deseas continuar de todos modos?`
        );
        if (!confirmar) {
          setLoading(false);
          return;
        }
      }

      // Actualizar dispositivo
      await updateDeviceLastSeen();

      // Guardar sesión
      sessionStorage.setItem('catador_id', catador.id);
      sessionStorage.setItem('catador_nombre', catador.nombre);
      sessionStorage.setItem('tablet_number', String(tabletNumber));

      // Login exitoso
      onLoginSuccess(catador);
    } catch (error) {
      console.error('Error en login:', error);
      setError('Error al iniciar sesión. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <User className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Iniciar Sesión
          </h1>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 rounded-full">
            <span className="text-sm font-medium text-blue-800">
              Tablet {tabletNumber}
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Selecciona tu nombre
          </label>
          <select
            value={selectedCatadorId}
            onChange={(e) => {
              setSelectedCatadorId(e.target.value);
              setError('');
            }}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
          >
            <option value="">-- Selecciona un catador --</option>
            {catadores.map(catador => (
              <option key={catador.id} value={catador.id}>
                {catador.nombre}
                {catador.tablet !== null && ` (Tablet ${catador.tablet})`}
                {catador.rol && ` - ${catador.rol}`}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleLogin}
          disabled={loading || !selectedCatadorId}
          className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Iniciando sesión...
            </>
          ) : (
            <>
              <LogIn className="w-5 h-5" />
              Iniciar Sesión
            </>
          )}
        </button>

        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 text-center">
            Si no encuentras tu nombre o tienes problemas de acceso, 
            contacta al administrador.
          </p>
        </div>
      </div>
    </div>
  );
}
