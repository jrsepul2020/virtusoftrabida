import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getOrCreateFingerprint, getDeviceInfo } from '../lib/deviceFingerprint';
import { Smartphone, CheckCircle } from 'lucide-react';

interface DeviceRegistrationProps {
  onDeviceRegistered: (tabletNumber: number) => void;
}

export default function DeviceRegistration({ onDeviceRegistered }: DeviceRegistrationProps) {
  const [selectedNumber, setSelectedNumber] = useState<number>(1);
  const [availableNumbers, setAvailableNumbers] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [deviceName, setDeviceName] = useState('');

  useEffect(() => {
    checkExistingDevice();
  }, []);

  /**
   * Verifica si este dispositivo ya está registrado
   */
  const checkExistingDevice = async () => {
    try {
      setChecking(true);
      
      console.log('Verificando dispositivo existente...');
      const fingerprint = await getOrCreateFingerprint();
      console.log('Fingerprint obtenido:', fingerprint.substring(0, 20) + '...');
      
      // Buscar dispositivo existente
      const { data: existingDevice, error: searchError } = await supabase
        .from('dispositivos')
        .select('*')
        .eq('device_fingerprint', fingerprint)
        .eq('activo', true)
        .single();

      if (searchError && searchError.code !== 'PGRST116') {
        // PGRST116 = no rows found, es normal para dispositivos nuevos
        console.error('Error buscando dispositivo:', searchError);
      }

      if (existingDevice) {
        console.log('Dispositivo ya registrado:', existingDevice);
        // Dispositivo ya registrado - actualizar last_seen_at
        await supabase
          .from('dispositivos')
          .update({ last_seen_at: new Date().toISOString() })
          .eq('id', existingDevice.id);
        
        // Notificar que el dispositivo está registrado
        onDeviceRegistered(existingDevice.tablet_number);
        return;
      }

      console.log('Dispositivo nuevo, cargando números disponibles...');
      // Dispositivo nuevo - cargar números disponibles
      await loadAvailableNumbers();
    } catch (error) {
      console.error('Error verificando dispositivo:', error);
      await loadAvailableNumbers();
    } finally {
      setChecking(false);
    }
  };

  /**
   * Carga los números de tablet disponibles (1-25)
   */
  const loadAvailableNumbers = async () => {
    try {
      // Obtener tablets ocupadas
      const { data: dispositivos } = await supabase
        .from('dispositivos')
        .select('tablet_number')
        .eq('activo', true);

      const occupiedNumbers = dispositivos?.map(d => d.tablet_number) || [];
      
      // Generar lista de números disponibles
      const available = [];
      for (let i = 1; i <= 25; i++) {
        if (!occupiedNumbers.includes(i)) {
          available.push(i);
        }
      }

      setAvailableNumbers(available);
      if (available.length > 0) {
        setSelectedNumber(available[0]);
      }
    } catch (error) {
      console.error('Error cargando números disponibles:', error);
    }
  };

  /**
   * Registra el dispositivo con el número seleccionado
   */
  const handleRegister = async () => {
    if (!selectedNumber) {
      alert('Por favor selecciona un número de tablet');
      return;
    }

    try {
      setLoading(true);
      const fingerprint = await getOrCreateFingerprint();
      const deviceInfo = getDeviceInfo();

      console.log('Intentando registrar dispositivo...', {
        fingerprint: fingerprint.substring(0, 10) + '...',
        tablet_number: selectedNumber,
        nombre: deviceName || `Tablet ${selectedNumber}`
      });

      // Registrar dispositivo
      const { data, error } = await supabase
        .from('dispositivos')
        .insert({
          device_fingerprint: fingerprint,
          tablet_number: selectedNumber,
          device_info: deviceInfo,
          nombre_asignado: deviceName || `Tablet ${selectedNumber}`,
          activo: true,
        })
        .select();

      if (error) {
        console.error('Error de Supabase:', error);
        throw error;
      }

      console.log('Dispositivo registrado exitosamente:', data);

      // Notificar registro exitoso
      onDeviceRegistered(selectedNumber);
    } catch (error: any) {
      console.error('Error registrando dispositivo:', error);
      
      // Mostrar error específico
      let errorMessage = 'Error al registrar el dispositivo.';
      
      if (error.code === '23505') {
        errorMessage = 'Este número de tablet ya está en uso. Por favor selecciona otro.';
        await loadAvailableNumbers();
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      } else if (error.code === '42P01') {
        errorMessage = 'La tabla "dispositivos" no existe en la base de datos. Por favor contacta al administrador.';
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando dispositivo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Smartphone className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Registro de Dispositivo
          </h1>
          <p className="text-gray-600">
            Primera vez usando esta tablet. Asigna un número único.
          </p>
        </div>

        {availableNumbers.length === 0 ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800 text-center">
              No hay números de tablet disponibles. Contacta al administrador.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del dispositivo (opcional)
              </label>
              <input
                type="text"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                placeholder={`Tablet ${selectedNumber}`}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Tablet
              </label>
              <select
                value={selectedNumber}
                onChange={(e) => setSelectedNumber(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
              >
                {availableNumbers.map(num => (
                  <option key={num} value={num}>
                    Tablet {num}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-2">
                {availableNumbers.length} de 25 tablets disponibles
              </p>
            </div>

            <button
              onClick={handleRegister}
              disabled={loading || !selectedNumber}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Registrando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Registrar Dispositivo
                </>
              )}
            </button>

            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">
                <strong>Nota:</strong> Este número se asociará permanentemente a este dispositivo. 
                Las siguientes veces que uses esta tablet, se identificará automáticamente.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
