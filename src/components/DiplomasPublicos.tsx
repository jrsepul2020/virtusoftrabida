import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Trophy, Lock, Medal, Eye, EyeOff, Download, FileText } from 'lucide-react';
import { jsPDF } from 'jspdf';

interface MuestraConMedalla {
  id: string;
  nombre: string;
  categoriadecata: string | null;
  categoria: string | null;
  pais: string | null;
  medalla: string | null;
  puntuacion_total: number | null;
}

export default function DiplomasPublicos() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [muestras, setMuestras] = useState<MuestraConMedalla[]>([]);
  const [generating, setGenerating] = useState<string | null>(null);

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
        .select('id, nombre, categoriadecata, categoria, pais, medalla, puntuacion_total')
        .not('medalla', 'is', null)
        .neq('medalla', '');

      if (error) throw error;
      
      // Filtrar por categoría de cata que contenga "tranquilo" (case insensitive)
      const filtered = data?.filter(m => 
        m.categoriadecata?.toLowerCase().includes('tranquilo')
      ) || [];
      
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

  const generateDiploma = async (muestra: MuestraConMedalla) => {
    setGenerating(muestra.id);
    
    try {
      // Crear PDF en formato horizontal A4
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Colores según medalla
      const medalColors: Record<string, { primary: string; secondary: string; accent: string }> = {
        'Gran Oro': { primary: '#8B6914', secondary: '#DAA520', accent: '#FFD700' },
        'Oro': { primary: '#B8860B', secondary: '#FFD700', accent: '#FFF8DC' },
        'Plata': { primary: '#5A5A5A', secondary: '#C0C0C0', accent: '#E8E8E8' },
        'Bronce': { primary: '#8B4513', secondary: '#CD7F32', accent: '#DEB887' }
      };
      
      const colors = medalColors[muestra.medalla || 'Oro'] || medalColors['Oro'];

      // Fondo degradado (simulado con rectángulos)
      doc.setFillColor(255, 253, 245);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');

      // Borde decorativo exterior
      doc.setDrawColor(colors.primary);
      doc.setLineWidth(3);
      doc.rect(8, 8, pageWidth - 16, pageHeight - 16, 'S');
      
      // Borde interior
      doc.setLineWidth(1);
      doc.rect(12, 12, pageWidth - 24, pageHeight - 24, 'S');

      // Líneas decorativas en esquinas
      doc.setDrawColor(colors.secondary);
      doc.setLineWidth(0.5);
      // Esquina superior izquierda
      doc.line(15, 20, 40, 20);
      doc.line(20, 15, 20, 40);
      // Esquina superior derecha
      doc.line(pageWidth - 40, 20, pageWidth - 15, 20);
      doc.line(pageWidth - 20, 15, pageWidth - 20, 40);
      // Esquina inferior izquierda
      doc.line(15, pageHeight - 20, 40, pageHeight - 20);
      doc.line(20, pageHeight - 40, 20, pageHeight - 15);
      // Esquina inferior derecha
      doc.line(pageWidth - 40, pageHeight - 20, pageWidth - 15, pageHeight - 20);
      doc.line(pageWidth - 20, pageHeight - 40, pageWidth - 20, pageHeight - 15);

      // Título del concurso
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(colors.primary);
      doc.text('INTERNATIONAL AWARDS VIRTUS', pageWidth / 2, 35, { align: 'center' });

      // Subtítulo
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text('Concurso Internacional de Vinos', pageWidth / 2, 43, { align: 'center' });

      // Línea decorativa
      doc.setDrawColor(colors.secondary);
      doc.setLineWidth(1);
      doc.line(pageWidth / 2 - 60, 50, pageWidth / 2 + 60, 50);

      // DIPLOMA
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(36);
      doc.setTextColor(colors.primary);
      doc.text('DIPLOMA', pageWidth / 2, 70, { align: 'center' });

      // Medalla obtenida
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(28);
      doc.setTextColor(colors.secondary);
      doc.text(`MEDALLA DE ${(muestra.medalla || 'ORO').toUpperCase()}`, pageWidth / 2, 85, { align: 'center' });

      // Texto "Se otorga a:"
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(14);
      doc.setTextColor(80, 80, 80);
      doc.text('Se otorga el presente diploma a:', pageWidth / 2, 100, { align: 'center' });

      // Nombre del vino (destacado)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(24);
      doc.setTextColor(colors.primary);
      const nombreVino = muestra.nombre || 'Vino Sin Nombre';
      doc.text(nombreVino, pageWidth / 2, 115, { align: 'center' });

      // Línea bajo el nombre
      const nombreWidth = doc.getTextWidth(nombreVino);
      doc.setDrawColor(colors.secondary);
      doc.setLineWidth(0.5);
      doc.line(pageWidth / 2 - nombreWidth / 2 - 10, 120, pageWidth / 2 + nombreWidth / 2 + 10, 120);

      // Información adicional
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(14);
      doc.setTextColor(60, 60, 60);
      
      let yPos = 135;
      
      if (muestra.categoria) {
        doc.text(`Categoría: ${muestra.categoria}`, pageWidth / 2, yPos, { align: 'center' });
        yPos += 10;
      }
      
      if (muestra.categoriadecata) {
        doc.text(`Categoría de Cata: ${muestra.categoriadecata}`, pageWidth / 2, yPos, { align: 'center' });
        yPos += 10;
      }
      
      if (muestra.pais) {
        doc.text(`País: ${muestra.pais}`, pageWidth / 2, yPos, { align: 'center' });
        yPos += 10;
      }

      if (muestra.puntuacion_total) {
        doc.setFont('helvetica', 'bold');
        doc.text(`Puntuación: ${muestra.puntuacion_total.toFixed(2)} / 100`, pageWidth / 2, yPos, { align: 'center' });
      }

      // Fecha y lugar
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(11);
      doc.setTextColor(100, 100, 100);
      doc.text('Huelva, España - Diciembre 2025', pageWidth / 2, pageHeight - 35, { align: 'center' });

      // Firma
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.line(pageWidth / 2 - 40, pageHeight - 25, pageWidth / 2 + 40, pageHeight - 25);
      doc.text('Presidente del Jurado', pageWidth / 2, pageHeight - 20, { align: 'center' });

      // Guardar el PDF
      const fileName = `Diploma_${muestra.medalla}_${muestra.nombre?.replace(/[^a-zA-Z0-9]/g, '_') || 'vino'}.pdf`;
      doc.save(fileName);

    } catch (err) {
      console.error('Error generating diploma:', err);
      alert('Error al generar el diploma');
    } finally {
      setGenerating(null);
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
              <FileText className="w-8 h-8 text-[#3C542E]" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Diplomas - Vinos Tranquilos
            </h1>
            <p className="text-gray-600">
              Ingrese la clave de acceso para descargar diplomas
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
            <FileText className="w-10 h-10" />
            <h1 className="text-3xl font-bold">Diplomas - Vinos Tranquilos</h1>
          </div>
          <p className="text-center text-white/80">
            Descarga los diplomas de las medallas obtenidas
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-500">Total Diplomas</div>
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
              <p className="text-gray-600">Cargando diplomas...</p>
            </div>
          </div>
        ) : muestras.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Sin diplomas disponibles</h3>
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
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Diploma
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
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => generateDiploma(muestra)}
                          disabled={generating === muestra.id}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-[#3C542E] hover:bg-[#2d4022] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {generating === muestra.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                              Generando...
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4" />
                              Descargar
                            </>
                          )}
                        </button>
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
