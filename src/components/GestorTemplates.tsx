import { useState } from "react";
import {
  Download,
  Upload,
  Copy,
  Save,
  Package,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { supabase } from "../lib/supabase";

interface Template {
  nombre: string;
  descripcion: string;
  tipo_competicion: string;
  fecha_creacion: string;
  configuracion: {
    categorias: any[];
    mesas: any[];
    catadores: any[];
    configuracion_general: Record<string, any>;
  };
}

export default function GestorTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const exportarConfiguracion = async () => {
    setExporting(true);
    try {
      // Obtener todas las configuraciones
      const [categorias, mesas, catadores, config] = await Promise.all([
        supabase.from("categorias").select("*"),
        supabase.from("mesas").select("*"),
        supabase.from("usuarios").select("*").eq("rol", "Catador"),
        supabase.from("configuracion").select("*"),
      ]);

      const template: Template = {
        nombre: `Template ${new Date().toLocaleDateString("es-ES")}`,
        descripcion: "Configuración exportada",
        tipo_competicion: "Vinos y Aceites",
        fecha_creacion: new Date().toISOString(),
        configuracion: {
          categorias: categorias.data || [],
          mesas: mesas.data || [],
          catadores: (catadores.data || []).map((c) => ({
            ...c,
            id: undefined, // Remover IDs para importación
            created_at: undefined,
          })),
          configuracion_general: (config.data || []).reduce(
            (acc, item) => {
              acc[item.clave] = item.valor;
              return acc;
            },
            {} as Record<string, any>,
          ),
        },
      };

      // Descargar como JSON
      const blob = new Blob([JSON.stringify(template, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `template-virtus-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);

      alert("✅ Configuración exportada correctamente");
    } catch (error) {
      console.error("Error exportando:", error);
      alert("❌ Error al exportar configuración");
    } finally {
      setExporting(false);
    }
  };

  const importarConfiguracion = async (file: File) => {
    setImporting(true);
    try {
      const text = await file.text();
      const template: Template = JSON.parse(text);

      // Confirmar antes de importar
      const confirmar = window.confirm(
        `¿Deseas importar la configuración "${template.nombre}"?\n\n` +
          `- ${template.configuracion.categorias.length} categorías\n` +
          `- ${template.configuracion.mesas.length} mesas\n` +
          `- ${template.configuracion.catadores.length} catadores\n\n` +
          `⚠️ Esta acción sobrescribirá la configuración actual.`,
      );

      if (!confirmar) {
        setImporting(false);
        return;
      }

      // Importar categorías
      if (template.configuracion.categorias.length > 0) {
        const { error: catError } = await supabase
          .from("categorias")
          .upsert(template.configuracion.categorias);
        if (catError) throw catError;
      }

      // Importar mesas
      if (template.configuracion.mesas.length > 0) {
        const { error: mesasError } = await supabase
          .from("mesas")
          .upsert(template.configuracion.mesas);
        if (mesasError) throw mesasError;
      }

      // Importar configuración general
      const configEntries = Object.entries(
        template.configuracion.configuracion_general,
      );
      for (const [clave, valor] of configEntries) {
        await supabase
          .from("configuracion")
          .upsert({ clave, valor, descripcion: `Importado desde template` });
      }

      alert("✅ Configuración importada correctamente");
      window.location.reload();
    } catch (error: any) {
      console.error("Error importando:", error);
      alert("❌ Error al importar: " + error.message);
    } finally {
      setImporting(false);
    }
  };

  const duplicarConfiguracionActual = async () => {
    const confirmar = window.confirm(
      "¿Deseas duplicar la configuración actual para una nueva edición?\n\n" +
        "Esto creará una copia de categorías, mesas y catadores.",
    );

    if (!confirmar) return;

    setLoading(true);
    try {
      // Lógica de duplicación
      const anioActual = new Date().getFullYear();
      const nuevoAnio = anioActual + 1;

      // Aquí podrías implementar lógica específica de duplicación
      alert(`Preparando configuración para el año ${nuevoAnio}...`);

      // Por ahora solo exportamos
      await exportarConfiguracion();
    } catch (error) {
      console.error("Error duplicando:", error);
      alert("❌ Error al duplicar configuración");
    } finally {
      setLoading(false);
    }
  };

  const plantillasPredefinidas = [
    {
      nombre: "Concurso Básico Vinos",
      descripcion: "Template con categorías básicas de vinos",
      categorias: [
        "Vino Tinto Joven",
        "Vino Tinto Crianza",
        "Vino Blanco Joven",
        "Vino Blanco Fermentado en Barrica",
        "Vino Rosado",
        "Vino Espumoso",
      ],
      mesas: 3,
      catadores: 8,
    },
    {
      nombre: "Concurso Básico Aceites",
      descripcion: "Template con categorías de aceites de oliva virgen extra",
      categorias: [
        "AOVE Frutado Verde Intenso",
        "AOVE Frutado Verde Medio",
        "AOVE Frutado Verde Ligero",
        "AOVE Frutado Maduro Intenso",
        "AOVE Frutado Maduro Medio",
        "AOVE Ecológico",
      ],
      mesas: 2,
      catadores: 6,
    },
    {
      nombre: "Concurso Completo Virtus",
      descripcion:
        "Template completo con vinos, aceites y categorías especiales",
      categorias: [
        "Vino Tinto Joven",
        "Vino Tinto Crianza",
        "Vino Tinto Reserva",
        "Vino Blanco Joven",
        "Vino Blanco Fermentado en Barrica",
        "Vino Rosado",
        "Vino Espumoso",
        "Vino Dulce",
        "AOVE Frutado Verde Intenso",
        "AOVE Frutado Verde Medio",
        "AOVE Frutado Maduro",
        "AOVE Ecológico",
      ],
      mesas: 5,
      catadores: 10,
    },
    {
      nombre: "Solo Vinos Premium",
      descripcion: "Categorías premium para vinos de alta gama",
      categorias: [
        "Vino Tinto Gran Reserva",
        "Vino Tinto Reserva",
        "Vino Tinto Crianza",
        "Vino Blanco Fermentado en Barrica",
        "Vino Espumoso Brut Nature",
        "Vino Dulce de Pasificación",
      ],
      mesas: 3,
      catadores: 9,
    },
  ];

  const cargarPlantilla = async (
    plantilla: (typeof plantillasPredefinidas)[0],
  ) => {
    const confirmar = window.confirm(
      `¿Cargar la plantilla "${plantilla.nombre}"?\n\n` +
        `${plantilla.descripcion}\n\n` +
        `- ${plantilla.categorias.length} categorías\n` +
        `- ${plantilla.mesas} mesas\n` +
        `- ${plantilla.catadores} catadores por mesa\n\n` +
        `⚠️ Esto sobrescribirá las categorías y mesas existentes.`,
    );

    if (!confirmar) return;

    setLoading(true);
    try {
      // 1. Eliminar categorías y mesas existentes
      await supabase.from("categorias").delete().neq("id", 0);
      await supabase.from("mesas").delete().neq("id", 0);

      // 2. Crear categorías según la plantilla
      const categoriasData = plantilla.categorias.map((nombre, index) => ({
        nombre,
        descripcion: `Categoría ${nombre}`,
        orden: index + 1,
        activa: true,
      }));

      const { error: catError } = await supabase
        .from("categorias")
        .insert(categoriasData);

      if (catError) throw catError;

      // 3. Crear mesas
      const mesasData = Array.from({ length: plantilla.mesas }, (_, i) => ({
        numero: i + 1,
        nombre: `Mesa ${i + 1}`,
        capacidad_catadores: plantilla.catadores,
        activa: true,
      }));

      const { error: mesasError } = await supabase
        .from("mesas")
        .insert(mesasData);

      if (mesasError) throw mesasError;

      alert(
        `✅ Plantilla "${plantilla.nombre}" cargada correctamente:\n\n` +
          `✓ ${categoriasData.length} categorías creadas\n` +
          `✓ ${mesasData.length} mesas creadas`,
      );

      window.location.reload();
    } catch (error: any) {
      console.error("Error cargando plantilla:", error);
      alert("❌ Error al cargar la plantilla: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Gestor de Templates</h2>
        <p className="text-indigo-100">
          Exporta, importa y gestiona configuraciones predefinidas para
          competiciones
        </p>
      </div>

      {/* Acciones principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={exportarConfiguracion}
          disabled={exporting}
          className="p-6 bg-white rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:shadow-md transition-all disabled:opacity-50"
        >
          <Download className="w-10 h-10 text-blue-600 mx-auto mb-3" />
          <p className="font-semibold text-gray-900 mb-1">
            Exportar Configuración
          </p>
          <p className="text-sm text-gray-600">
            Descarga la configuración actual como JSON
          </p>
          {exporting && (
            <div className="flex items-center justify-center gap-2 mt-3">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span className="text-sm text-blue-600">Exportando...</span>
            </div>
          )}
        </button>

        <label className="p-6 bg-white rounded-lg border-2 border-dashed border-gray-300 hover:border-green-500 hover:bg-green-50 transition-all cursor-pointer">
          <Upload className="w-10 h-10 text-green-600 mx-auto mb-3" />
          <p className="font-semibold text-gray-900 mb-1">
            Importar Configuración
          </p>
          <p className="text-sm text-gray-600">
            Carga una configuración desde archivo
          </p>
          <input
            type="file"
            accept=".json"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) importarConfiguracion(file);
            }}
            className="hidden"
            disabled={importing}
          />
          {importing && (
            <div className="flex items-center justify-center gap-2 mt-3">
              <Loader2 className="w-4 h-4 animate-spin text-green-600" />
              <span className="text-sm text-green-600">Importando...</span>
            </div>
          )}
        </label>

        <button
          onClick={duplicarConfiguracionActual}
          disabled={loading}
          className="p-6 bg-white rounded-lg border-2 border-gray-200 hover:border-purple-500 hover:shadow-md transition-all disabled:opacity-50"
        >
          <Copy className="w-10 h-10 text-purple-600 mx-auto mb-3" />
          <p className="font-semibold text-gray-900 mb-1">
            Duplicar para Nueva Edición
          </p>
          <p className="text-sm text-gray-600">
            Crea configuración para próximo año
          </p>
        </button>
      </div>

      {/* Plantillas predefinidas */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center gap-3">
          <Package className="w-5 h-5 text-gray-700" />
          <h3 className="font-semibold text-gray-900">
            Plantillas Predefinidas
          </h3>
        </div>

        <div className="divide-y divide-gray-200">
          {plantillasPredefinidas.map((plantilla, index) => (
            <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">
                    {plantilla.nombre}
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">
                    {plantilla.descripcion}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                      {plantilla.categorias.length} categorías
                    </span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                      {plantilla.mesas} mesas
                    </span>
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded">
                      {plantilla.catadores} catadores/mesa
                    </span>
                  </div>

                  <div className="mt-3 text-xs text-gray-500">
                    <p className="font-medium mb-1">Categorías incluidas:</p>
                    <p>{plantilla.categorias.join(", ")}</p>
                  </div>
                </div>

                <button
                  onClick={() => cargarPlantilla(plantilla)}
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Cargando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Usar Template
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Instrucciones */}
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-2">
              Cómo usar los templates
            </h4>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>
                Exporta tu configuración actual antes de importar una nueva
              </li>
              <li>Los templates sobrescriben la configuración existente</li>
              <li>
                Puedes editar los archivos JSON manualmente antes de importar
              </li>
              <li>
                Usa "Duplicar" para preparar la siguiente edición del concurso
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
