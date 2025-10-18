import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Users, MapPin, Layers } from 'lucide-react';

type Mesa = {
  id: string;
  numero: number;
  nombre?: string;
  capacidad?: number;
  ubicacion?: string;
  activa?: boolean;
  created_at: string;
};

type Catador = {
  id: string;
  nombre: string;
  email?: string;
  telefono?: string;
  especialidad?: string;
  activo?: boolean;
  created_at: string;
};

type Asignacion = {
  id: string;
  catador_id: string;
  mesa_id: string;
  puesto: number;
  fecha_asignacion: string;
  activa: boolean;
  catador?: Catador;
};

export default function MesasVisualizacion() {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Obtener mesas
      const { data: mesasData, error: mesasError } = await supabase
        .from('mesas')
        .select('*')
        .eq('activa', true)
        .order('numero', { ascending: true });

      if (mesasError) throw mesasError;

      // Obtener asignaciones con datos del catador
      const { data: asignacionesData, error: asignacionesError } = await supabase
        .from('asignaciones_mesas')
        .select(`
          *,
          catador:catadores(*)
        `)
        .eq('activa', true);

      if (asignacionesError) throw asignacionesError;

      setMesas(mesasData || []);
      setAsignaciones(asignacionesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPuestosOcupados = (mesaId: string) => {
    return asignaciones
      .filter(a => a.mesa_id === mesaId && a.activa)
      .reduce((acc, asignacion) => {
        acc[asignacion.puesto] = asignacion;
        return acc;
      }, {} as Record<number, Asignacion>);
  };

  const getMesaStatus = (mesa: Mesa) => {
    const puestosOcupados = getPuestosOcupados(mesa.id);
    const ocupados = Object.keys(puestosOcupados).length;
    const capacidad = mesa.capacidad || 8;
    
    return {
      ocupados,
      capacidad,
      estaCompleta: ocupados === capacidad,
      porcentajeOcupacion: Math.round((ocupados / capacidad) * 100)
    };
  };

  const renderPuesto = (capacidad: number, puestoNum: number, puestosOcupados: Record<number, Asignacion>) => {
    const asignacion = puestosOcupados[puestoNum];
    const estaOcupado = !!asignacion;
    
    // Calcular posición del puesto alrededor de la mesa circular
    const angle = (360 / capacidad) * (puestoNum - 1);
    const radius = 45; // Radio en porcentaje
    const x = 50 + radius * Math.cos((angle - 90) * Math.PI / 180);
    const y = 50 + radius * Math.sin((angle - 90) * Math.PI / 180);

    return (
      <div
        key={puestoNum}
        className="absolute transform -translate-x-1/2 -translate-y-1/2"
        style={{
          left: `${x}%`,
          top: `${y}%`,
        }}
        title={estaOcupado ? `Puesto ${puestoNum}: ${asignacion.catador?.nombre}` : `Puesto ${puestoNum}: Libre`}
      >
        <div className={`
          w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 flex items-center justify-center text-xs sm:text-sm font-semibold transition-all duration-200 hover:scale-110
          ${estaOcupado 
            ? 'bg-green-500 border-green-600 text-white shadow-lg' 
            : 'bg-red-500 border-red-600 text-white shadow-lg'
          }
        `}>
          {puestoNum}
        </div>
      </div>
    );
  };

  const renderMesa = (mesa: Mesa) => {
    const puestosOcupados = getPuestosOcupados(mesa.id);
    const status = getMesaStatus(mesa);
    const capacidad = mesa.capacidad || 8;

    return (
      <div key={mesa.id} className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
        {/* Header de la mesa */}
        <div className="text-center mb-4">
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-1">
            Mesa {mesa.numero}
          </h3>
          {mesa.nombre && (
            <p className="text-sm text-gray-600">{mesa.nombre}</p>
          )}
          <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium mt-2 ${
            status.estaCompleta 
              ? 'bg-green-100 text-green-800' 
              : 'bg-orange-100 text-orange-800'
          }`}>
            <Users className="w-3 h-3" />
            {status.ocupados}/{status.capacidad} ({status.porcentajeOcupacion}%)
          </div>
        </div>

        {/* Visualización de la mesa */}
        <div className="relative mx-auto" style={{ width: '200px', height: '200px' }}>
          {/* Mesa central */}
          <div className={`
            absolute inset-0 rounded-full border-4 flex items-center justify-center transition-all duration-300
            ${status.estaCompleta 
              ? 'bg-green-50 border-green-300' 
              : 'bg-amber-50 border-amber-300'
            }
          `}>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-gray-800">
                {mesa.numero}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {status.estaCompleta ? 'COMPLETA' : 'DISPONIBLE'}
              </div>
            </div>
          </div>

          {/* Puestos alrededor de la mesa */}
          {Array.from({ length: capacidad }, (_, i) => i + 1).map(puestoNum =>
            renderPuesto(capacidad, puestoNum, puestosOcupados)
          )}
        </div>

        {/* Información adicional */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2 text-xs text-gray-600">
            {mesa.ubicacion && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {mesa.ubicacion}
              </div>
            )}
            <div className="flex items-center gap-1">
              <Layers className="w-3 h-3" />
              Capacidad: {capacidad}
            </div>
          </div>
        </div>

        {/* Lista de catadores asignados */}
        {status.ocupados > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Catadores asignados:</h4>
            <div className="space-y-1">
              {Object.entries(puestosOcupados).map(([puesto, asignacion]) => (
                <div key={asignacion.id} className="text-xs text-gray-600 flex items-center gap-2">
                  <span className="w-4 h-4 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                    {puesto}
                  </span>
                  <span>{asignacion.catador?.nombre}</span>
                  {asignacion.catador?.especialidad && (
                    <span className="text-gray-400">• {asignacion.catador.especialidad}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-80 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const mesasCompletas = mesas.filter(mesa => getMesaStatus(mesa).estaCompleta);
  const mesasDisponibles = mesas.filter(mesa => !getMesaStatus(mesa).estaCompleta);

  return (
    <div className="space-y-6">
      {/* Estadísticas generales */}
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">Distribución de Mesas</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{mesas.length}</div>
            <div className="text-sm text-blue-800">Total Mesas</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{mesasCompletas.length}</div>
            <div className="text-sm text-green-800">Completas</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{mesasDisponibles.length}</div>
            <div className="text-sm text-orange-800">Disponibles</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{asignaciones.length}</div>
            <div className="text-sm text-purple-800">Catadores</div>
          </div>
        </div>
      </div>

      {/* Visualización de mesas */}
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-gray-800">Distribución Visual de Mesas</h3>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
          >
            Actualizar
          </button>
        </div>

        {mesas.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay mesas configuradas</h3>
            <p className="text-gray-500">Crea algunas mesas para comenzar a visualizar la distribución.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {mesas.map(renderMesa)}
          </div>
        )}
      </div>

      {/* Leyenda */}
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Leyenda</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">1</div>
            <span className="text-sm text-gray-600">Puesto Ocupado</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">2</div>
            <span className="text-sm text-gray-600">Puesto Libre</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-4 border-green-300 bg-green-50 rounded-full"></div>
            <span className="text-sm text-gray-600">Mesa Completa</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-4 border-amber-300 bg-amber-50 rounded-full"></div>
            <span className="text-sm text-gray-600">Mesa Disponible</span>
          </div>
        </div>
      </div>
    </div>
  );
}