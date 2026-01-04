import { useState } from 'react';
import { Sparkles, Loader2, CheckCircle, AlertCircle, Lightbulb } from 'lucide-react';
import Anthropic from '@anthropic-ai/sdk';

interface ClasificadorIAProps {
  muestraData: {
    nombre: string;
    origen?: string;
    pais?: string;
    tipo_uva?: string;
    tipo_aceituna?: string;
    anio?: number;
    grado_alcoholico?: number;
    azucar_residual?: number;
    descripcion?: string;
  };
  onSugerenciaAplicada: (categoria: string, subcategoria?: string) => void;
}

interface Sugerencia {
  categoria_principal: string;
  categoria_oiv?: string;
  categoria_cata?: string;
  confianza: number;
  razonamiento: string;
  sugerencias_adicionales?: string[];
}

export default function ClasificadorIA({ muestraData, onSugerenciaAplicada }: ClasificadorIAProps) {
  const [loading, setLoading] = useState(false);
  const [sugerencia, setSugerencia] = useState<Sugerencia | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clasificarConIA = async () => {
    setLoading(true);
    setError(null);
    setSugerencia(null);

    try {
      // Verificar si hay API key configurada
      const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new Error('API Key de Anthropic no configurada. Añade VITE_ANTHROPIC_API_KEY al archivo .env');
      }

      const anthropic = new Anthropic({
        apiKey,
        dangerouslyAllowBrowser: true // Solo para desarrollo
      });

      // Construir prompt con los datos de la muestra
      const prompt = `Analiza esta muestra de un concurso internacional de vinos y aceites y sugiere su clasificación:

DATOS DE LA MUESTRA:
- Nombre: ${muestraData.nombre}
${muestraData.origen ? `- Origen: ${muestraData.origen}` : ''}
${muestraData.pais ? `- País: ${muestraData.pais}` : ''}
${muestraData.tipo_uva ? `- Tipo de uva: ${muestraData.tipo_uva}` : ''}
${muestraData.tipo_aceituna ? `- Tipo de aceituna: ${muestraData.tipo_aceituna}` : ''}
${muestraData.anio ? `- Año: ${muestraData.anio}` : ''}
${muestraData.grado_alcoholico ? `- Grado alcohólico: ${muestraData.grado_alcoholico}°` : ''}
${muestraData.azucar_residual ? `- Azúcar residual: ${muestraData.azucar_residual} g/L` : ''}
${muestraData.descripcion ? `- Descripción: ${muestraData.descripcion}` : ''}

CATEGORÍAS DISPONIBLES:
Para VINOS:
- Vino Tinto
- Vino Blanco
- Vino Rosado
- Vino Espumoso
- Vino Dulce
- Vino Generoso

Para ACEITES:
- Aceite de Oliva Virgen Extra
- Aceite de Oliva Virgen
- Aceite de Oliva

Por favor, responde ÚNICAMENTE con un JSON válido (sin markdown, sin \`\`\`) con la siguiente estructura:
{
  "categoria_principal": "nombre de categoría",
  "categoria_oiv": "clasificación OIV si aplica",
  "categoria_cata": "tipo de cata sugerida",
  "confianza": 85,
  "razonamiento": "explicación breve",
  "sugerencias_adicionales": ["sugerencia 1", "sugerencia 2"]
}`;

      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const respuesta = message.content[0].type === 'text' ? message.content[0].text : '';
      
      // Parsear respuesta JSON
      const jsonMatch = respuesta.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('La IA no devolvió un formato JSON válido');
      }

      const resultado: Sugerencia = JSON.parse(jsonMatch[0]);
      setSugerencia(resultado);

    } catch (err: any) {
      console.error('Error en clasificación IA:', err);
      setError(err.message || 'Error al clasificar con IA');
    } finally {
      setLoading(false);
    }
  };

  const aplicarSugerencia = () => {
    if (sugerencia) {
      onSugerenciaAplicada(
        sugerencia.categoria_principal,
        sugerencia.categoria_oiv || sugerencia.categoria_cata
      );
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6 border-2 border-purple-200">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Clasificación Automática con IA
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Usa inteligencia artificial para sugerir la categoría más apropiada basándose en las características de la muestra.
          </p>

          {!sugerencia && !loading && (
            <button
              onClick={clasificarConIA}
              disabled={loading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Clasificar con IA
            </button>
          )}

          {loading && (
            <div className="flex items-center gap-3 text-purple-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm font-medium">Analizando muestra...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900">Error</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {sugerencia && (
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 border border-purple-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-gray-900">Sugerencia de Clasificación</span>
                  </div>
                  <div className="px-2 py-1 bg-purple-100 rounded text-sm font-medium text-purple-800">
                    {sugerencia.confianza}% confianza
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Categoría Principal:</p>
                    <p className="text-lg font-bold text-purple-900">{sugerencia.categoria_principal}</p>
                  </div>

                  {sugerencia.categoria_oiv && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Clasificación OIV:</p>
                      <p className="font-medium text-gray-900">{sugerencia.categoria_oiv}</p>
                    </div>
                  )}

                  {sugerencia.categoria_cata && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Tipo de Cata:</p>
                      <p className="font-medium text-gray-900">{sugerencia.categoria_cata}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Razonamiento:</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{sugerencia.razonamiento}</p>
                  </div>

                  {sugerencia.sugerencias_adicionales && sugerencia.sugerencias_adicionales.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="w-4 h-4 text-yellow-600" />
                        <p className="text-sm font-medium text-gray-900">Sugerencias adicionales:</p>
                      </div>
                      <ul className="space-y-1 ml-6">
                        {sugerencia.sugerencias_adicionales.map((sug, index) => (
                          <li key={index} className="text-sm text-gray-700 list-disc">
                            {sug}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={aplicarSugerencia}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
                >
                  Aplicar Sugerencia
                </button>
                <button
                  onClick={() => setSugerencia(null)}
                  className="px-4 py-2 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-50 border border-gray-300 transition-colors"
                >
                  Descartar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
