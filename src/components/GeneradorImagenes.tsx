import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Trophy, Medal, Download, Image, RefreshCw, ImagePlus } from 'lucide-react';

interface MuestraConMedalla {
  id: string;
  nombre: string;
  categoriadecata: string | null;
  categoria: string | null;
  pais: string | null;
  medalla: string | null;
  puntuacion_total: number | null;
  foto_botella: string | null;
}

export default function GeneradorImagenes() {
  const [muestras, setMuestras] = useState<MuestraConMedalla[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetchMuestras();
  }, []);

  const fetchMuestras = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('muestras')
        .select('id, nombre, categoriadecata, categoria, pais, medalla, puntuacion_total, foto_botella')
        .not('medalla', 'is', null)
        .neq('medalla', '');

      if (error) throw error;
      
      const result = data || [];
      
      // Ordenar: Gran Oro > Oro > Plata > Bronce
      const medalOrder: Record<string, number> = {
        'Gran Oro': 1,
        'Oro': 2,
        'Plata': 3,
        'Bronce': 4
      };
      
      result.sort((a, b) => {
        const orderA = medalOrder[a.medalla || ''] || 99;
        const orderB = medalOrder[b.medalla || ''] || 99;
        if (orderA !== orderB) return orderA - orderB;
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
      case 'Gran Oro': return 'bg-amber-100 text-amber-900 border-amber-400';
      case 'Oro': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Plata': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-50 text-gray-500 border-gray-200';
    }
  };

  const getMedalIcon = (medalla: string | null) => {
    const baseClass = "w-5 h-5";
    switch (medalla) {
      case 'Gran Oro': return <Trophy className={`${baseClass} text-amber-600`} />;
      case 'Oro': return <Medal className={`${baseClass} text-yellow-600`} />;
      case 'Plata': return <Medal className={`${baseClass} text-gray-500`} />;
      default: return null;
    }
  };

  const getMedalImage = (medalla: string | null): string => {
    switch (medalla) {
      case 'Gran Oro': return '/great gold.png';
      case 'Oro': return '/gold.png';
      case 'Plata': return '/silver.png';
      default: return '/gold.png';
    }
  };

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.src = src;
    });
  };

  const generateImage = async (muestra: MuestraConMedalla) => {
    if (!canvasRef.current) return;
    
    setGenerating(muestra.id);
    
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Dimensiones del canvas 800x800
      const width = 800;
      const height = 800;
      canvas.width = width;
      canvas.height = height;

      // Fondo transparente
      ctx.clearRect(0, 0, width, height);

      // Borde dorado/plateado según medalla
      const borderColors: Record<string, string> = {
        'Gran Oro': '#DAA520',
        'Oro': '#FFD700',
        'Plata': '#C0C0C0'
      };
      const borderColor = borderColors[muestra.medalla || 'Oro'] || '#FFD700';
      
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 6;
      ctx.strokeRect(15, 15, width - 30, height - 30);

      // Cargar y dibujar logo
      try {
        const logoImg = await loadImage('/favicon.svg');
        const logoSize = 60;
        ctx.drawImage(logoImg, width / 2 - logoSize / 2, 25, logoSize, logoSize);
      } catch (err) {
        console.log('No se pudo cargar el logo');
      }

      // Logo/Título del concurso
      ctx.fillStyle = '#1a1a2e';
      ctx.font = 'bold 28px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('INTERNATIONAL VIRTUS AWARDS', width / 2, 110);

      ctx.font = '18px Arial';
      ctx.fillStyle = '#555555';
      ctx.fillText('Concurso Internacional de Vinos 2025', width / 2, 135);

      // Cargar y dibujar foto del vino (si existe)
      let bottleLoaded = false;
      if (muestra.foto_botella) {
        try {
          const bottleImg = await loadImage(muestra.foto_botella);
          
          // Calcular dimensiones para mantener proporción
          const maxBottleHeight = 380;
          const maxBottleWidth = 280;
          let bWidth = bottleImg.width;
          let bHeight = bottleImg.height;
          
          if (bHeight > maxBottleHeight) {
            const ratio = maxBottleHeight / bHeight;
            bHeight = maxBottleHeight;
            bWidth = bWidth * ratio;
          }
          if (bWidth > maxBottleWidth) {
            const ratio = maxBottleWidth / bWidth;
            bWidth = maxBottleWidth;
            bHeight = bHeight * ratio;
          }

          // Posición centrada
          const bX = (width - bWidth) / 2;
          const bY = 160;

          // Sombra
          ctx.shadowColor = 'rgba(0,0,0,0.3)';
          ctx.shadowBlur = 20;
          ctx.shadowOffsetX = 8;
          ctx.shadowOffsetY = 8;
          
          ctx.drawImage(bottleImg, bX, bY, bWidth, bHeight);
          
          // Reset sombra
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;

          bottleLoaded = true;
        } catch (err) {
          console.log('No se pudo cargar la imagen de la botella');
        }
      }

      // Si no hay foto, mostrar placeholder
      if (!bottleLoaded) {
        ctx.strokeStyle = '#CCCCCC';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(width/2 - 80, 180, 160, 320);
        ctx.setLineDash([]);
        
        ctx.fillStyle = '#999999';
        ctx.font = '16px Arial';
        ctx.fillText('Sin imagen', width / 2, 350);
      }

      // Cargar y dibujar medalla
      try {
        const medalImg = await loadImage(getMedalImage(muestra.medalla));
        const medalSize = 140;
        const medalX = width - medalSize - 40;
        const medalY = 160;
        
        // Brillo detrás de la medalla
        const glowGradient = ctx.createRadialGradient(
          medalX + medalSize/2, medalY + medalSize/2, 0,
          medalX + medalSize/2, medalY + medalSize/2, medalSize
        );
        glowGradient.addColorStop(0, `${borderColor}30`);
        glowGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGradient;
        ctx.fillRect(medalX - 30, medalY - 30, medalSize + 60, medalSize + 60);
        
        ctx.drawImage(medalImg, medalX, medalY, medalSize, medalSize);
      } catch (err) {
        console.log('No se pudo cargar la imagen de la medalla');
        // Dibujar medalla con texto
        ctx.fillStyle = borderColor;
        ctx.beginPath();
        ctx.arc(width - 110, 230, 60, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(muestra.medalla || 'ORO', width - 110, 235);
      }

      // Texto de la medalla
      ctx.fillStyle = borderColor;
      ctx.font = 'bold 26px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`MEDALLA DE ${(muestra.medalla || 'ORO').toUpperCase()}`, width / 2, height - 200);

      // Nombre del vino
      ctx.fillStyle = '#1a1a2e';
      ctx.font = 'bold 32px Arial';
      
      // Manejar nombres largos
      const nombreVino = muestra.nombre || 'Vino';
      if (nombreVino.length > 25) {
        ctx.font = 'bold 24px Arial';
      }
      ctx.fillText(nombreVino, width / 2, height - 155);

      // Información adicional
      ctx.font = '20px Arial';
      ctx.fillStyle = '#555555';
      
      let infoY = height - 115;
      
      if (muestra.categoria) {
        ctx.fillText(muestra.categoria, width / 2, infoY);
        infoY += 30;
      }
      
      if (muestra.pais) {
        ctx.fillText(muestra.pais, width / 2, infoY);
      }

      // Descargar imagen
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `Vino_${muestra.medalla}_${muestra.nombre?.replace(/[^a-zA-Z0-9]/g, '_') || 'vino'}.png`;
      link.href = dataUrl;
      link.click();

    } catch (err) {
      console.error('Error generating image:', err);
      alert('Error al generar la imagen');
    } finally {
      setGenerating(null);
    }
  };

  const stats = {
    total: muestras.length,
    conFoto: muestras.filter(m => m.foto_botella).length,
    granOro: muestras.filter(m => m.medalla === 'Gran Oro').length,
    oro: muestras.filter(m => m.medalla === 'Oro').length,
    plata: muestras.filter(m => m.medalla === 'Plata').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando muestras...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Canvas oculto para generar imágenes */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ImagePlus className="w-8 h-8 text-primary-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Generador de Imágenes</h1>
              <p className="text-gray-500">Crea imágenes promocionales de vinos premiados</p>
            </div>
          </div>
          <button
            onClick={fetchMuestras}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-500">Total</div>
        </div>
        <div className="bg-blue-50 rounded-lg shadow p-4 text-center border border-blue-200">
          <div className="text-2xl font-bold text-blue-700">{stats.conFoto}</div>
          <div className="text-sm text-blue-600 flex items-center justify-center gap-1">
            <Image className="w-4 h-4" /> Con Foto
          </div>
        </div>
        <div className="bg-amber-50 rounded-lg shadow p-4 text-center border border-amber-300">
          <div className="text-2xl font-bold text-amber-800">{stats.granOro}</div>
          <div className="text-sm text-amber-700 flex items-center justify-center gap-1">
            <Trophy className="w-4 h-4" /> Gran Oro
          </div>
        </div>
        <div className="bg-yellow-50 rounded-lg shadow p-4 text-center border border-yellow-200">
          <div className="text-2xl font-bold text-yellow-700">{stats.oro}</div>
          <div className="text-sm text-yellow-600 flex items-center justify-center gap-1">
            <Medal className="w-4 h-4" /> Oro
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg shadow p-4 text-center border border-gray-200">
          <div className="text-2xl font-bold text-gray-700">{stats.plata}</div>
          <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
            <Medal className="w-4 h-4" /> Plata
          </div>
        </div>
      </div>

      {/* Table */}
      {muestras.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg shadow">
          <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Sin muestras premiadas</h3>
          <p className="text-gray-500">
            No hay muestras con medallas para generar imágenes
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Foto</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Nombre</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Categoría</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">País</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Puntuación</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Medalla</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Generar</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {muestras.map((muestra) => (
                  <tr key={muestra.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      {muestra.foto_botella ? (
                        <img 
                          src={muestra.foto_botella} 
                          alt={muestra.nombre || 'Botella'}
                          className="w-12 h-16 object-cover rounded shadow"
                        />
                      ) : (
                        <div className="w-12 h-16 bg-gray-100 rounded flex items-center justify-center">
                          <Image className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{muestra.nombre}</div>
                      <div className="text-xs text-gray-500">{muestra.categoriadecata}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {muestra.categoria || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {muestra.pais || '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm font-medium text-gray-900">
                        {muestra.puntuacion_total?.toFixed(2) || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getMedalColor(muestra.medalla)}`}>
                        {getMedalIcon(muestra.medalla)}
                        {muestra.medalla}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => generateImage(muestra)}
                        disabled={generating === muestra.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        {generating === muestra.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            <span>...</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            <span>Imagen</span>
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
  );
}
