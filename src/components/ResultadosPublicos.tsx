import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Trophy, Lock, Medal, Wine, Eye, EyeOff } from 'lucide-react';

interface MuestraConMedalla {
  id: string;
  nombre: string;
  categoriadecata: string | null;
  categoria: string | null;
  pais: string | null;
  medalla: string | null;
}

export default function ResultadosPublicos() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [muestras, setMuestras] = useState<MuestraConMedalla[]>([]);

  const ACCESS_CODE = '1234';

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ACCESS_CODE) {
      setAuthenticated(true);
      setError('');
      fetchMuestras();
    } else {
      setError('Clave incorrecta');
    }
  };

  const fetchMuestras = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('muestras')
        .select('id, nombre, categoriadecata, categoria, pais, medalla')
        .not('medalla', 'is', null)
        .neq('medalla', '');

      if (error) throw error;
      
      // Filtrar por categoría de cata que contenga "tranquilo" (case insensitive)
      const filtered = data?.filter(m => 
        m.categoriadecata?.toLowerCase().includes('tranquilo')
      ) || [];
      
      console.log('Muestras con medalla:', data);
      console.log('Filtradas (Vinos tranquilos):', filtered);
      
      // Si no hay filtradas, mostrar todas las que tienen medalla
      const result = filtered.length > 0 ? filtered : (data || []);
      
      // Ordenar: Gran Oro > Oro > Plata > Bronce, y dentro de cada medalla por nombre alfabético
      const medalOrder: Record<string, number> = {
        'Gran Oro': 1,
        'Oro': 2,
        'Plata': 3,
        'Bronce': 4
      };
      
      result.sort((a, b) => {
        const orderA = medalOrder[a.medalla || ''] || 99;
        const orderB = medalOrder[b.medalla || ''] || 99;
        
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        // Mismo tipo de medalla: ordenar por nombre alfabético
        return (a.nombre || '').localeCompare(b.nombre || '', 'es');
      });
      
      setMuestras(result);
    } catch (err: any) {
      console.error('Error fetching muestras:', err);
    } finally {
      setLoading(false);
    }
  };

  const getMedalColor = (medalla: string | null) => {
    switch (medalla) {
      case 'Gran Oro':
        return 'bg-amber-100 text-amber-900 border-amber-400';
      case 'Oro':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Plata':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'Bronce':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      default:
        return 'bg-gray-50 text-gray-500 border-gray-200';
    }
  };

  const getMedalIcon = (medalla: string | null) => {
    const baseClass = "w-5 h-5";
    switch (medalla) {
      case 'Gran Oro':
        return <Trophy className={`${baseClass} text-amber-600`} />;
      case 'Oro':
        return <Medal className={`${baseClass} text-yellow-600`} />;
      case 'Plata':
        return <Medal className={`${baseClass} text-gray-500`} />;
      case 'Bronce':
        return <Medal className={`${baseClass} text-orange-600`} />;
      default:
        return null;
    }
  };

  const stats = {
    total: muestras.length,
    granOro: muestras.filter(m => m.medalla === 'Gran Oro').length,
    oro: muestras.filter(m => m.medalla === 'Oro').length,
    plata: muestras.filter(m => m.medalla === 'Plata').length,
    bronce: muestras.filter(m => m.medalla === 'Bronce').length,
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#3C542E]/10 to-[#7A694E]/10 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#3C542E]/10 rounded-full mb-4">
              <Trophy className="w-8 h-8 text-[#3C542E]" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Resultados - Vinos Tranquilos
            </h1>
            <p className="text-gray-600">
              Ingrese la clave de acceso para ver los resultados
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Lock className="w-4 h-4 inline mr-1" />
                Clave de Acceso
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingrese la clave"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3C542E] focus:border-transparent pr-10"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-[#3C542E] hover:bg-[#2d4022] text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              Acceder
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#3C542E] to-[#7A694E] text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Wine className="w-10 h-10" />
            <h1 className="text-3xl font-bold">Resultados - Vinos Tranquilos</h1>
          </div>
          <p className="text-center text-white/80">
            Medallas obtenidas en la categoría de cata
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-500">Total Premiados</div>
          </div>
          <div className="bg-amber-50 rounded-lg shadow p-4 text-center border border-amber-300">
            <div className="text-3xl font-bold text-amber-800">{stats.granOro}</div>
            <div className="text-sm text-amber-700 flex items-center justify-center gap-1">
              <Trophy className="w-4 h-4" /> Gran Oro
            </div>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow p-4 text-center border border-yellow-200">
            <div className="text-3xl font-bold text-yellow-700">{stats.oro}</div>
            <div className="text-sm text-yellow-600 flex items-center justify-center gap-1">
              <Medal className="w-4 h-4" /> Oro
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg shadow p-4 text-center border border-gray-200">
            <div className="text-3xl font-bold text-gray-700">{stats.plata}</div>
            <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
              <Medal className="w-4 h-4" /> Plata
            </div>
          </div>
          <div className="bg-orange-50 rounded-lg shadow p-4 text-center border border-orange-200">
            <div className="text-3xl font-bold text-orange-700">{stats.bronce}</div>
            <div className="text-sm text-orange-600 flex items-center justify-center gap-1">
              <Medal className="w-4 h-4" /> Bronce
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3C542E] mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando resultados...</p>
            </div>
          </div>
        ) : muestras.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Sin resultados</h3>
            <p className="text-gray-500">
              Aún no hay muestras con medallas en la categoría Vinos Tranquilos
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Categoría de Cata
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Categoría
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      País
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Medalla
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {muestras.map((muestra) => (
                    <tr key={muestra.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {muestra.nombre}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {muestra.categoriadecata || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {muestra.categoria || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {muestra.pais || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${getMedalColor(muestra.medalla)}`}>
                          {getMedalIcon(muestra.medalla)}
                          {muestra.medalla}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
