import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Database, TestTube, Trash2, RefreshCw } from 'lucide-react';

export default function TestDataInserter() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const insertTestData = async () => {
    setLoading(true);
    setMessage('Insertando datos de prueba...');

    try {
      // 1. Insertar empresas de prueba
      const empresasData = [
        {
          name: 'Bodegas Ejemplo 1',
          email: 'bodega1@example.com',
          phone: '600111222',
          nif: 'B12345678',
          codigo_postal: '28001',
          ciudad: 'Madrid',
          pais: 'España',
          status: 'approved' as const,
          totalinscripciones: 0,
        },
        {
          name: 'Aceites Premium SL',
          email: 'aceites@example.com',
          phone: '600222333',
          nif: 'B87654321',
          codigo_postal: '41001',
          ciudad: 'Sevilla',
          pais: 'España',
          status: 'approved' as const,
          totalinscripciones: 0,
        },
        {
          name: 'Vinos del Norte SA',
          email: 'vinos@example.com',
          phone: '600333444',
          nif: 'A11223344',
          codigo_postal: '26001',
          ciudad: 'Logroño',
          pais: 'España',
          status: 'approved' as const,
          totalinscripciones: 0,
        },
        {
          name: 'Destilerías Test',
          email: 'destilerias@example.com',
          phone: '600444555',
          nif: 'B99887766',
          codigo_postal: '03001',
          ciudad: 'Alicante',
          pais: 'España',
          status: 'approved' as const,
          totalinscripciones: 0,
        },
      ];

      const empresasInsertadas: Record<string, string> = {};

      for (const empresa of empresasData) {
        // Primero verificar si ya existe
        const { data: existente } = await supabase
          .from('empresas')
          .select('id, email')
          .eq('email', empresa.email)
          .single();

        if (existente) {
          // Ya existe, usar ese ID
          empresasInsertadas[existente.email] = existente.id;
        } else {
          // No existe, insertarla
          const { data, error } = await supabase
            .from('empresas')
            .insert(empresa)
            .select('id, email')
            .single();

          if (error) {
            console.error('Error insertando empresa:', error);
            setMessage(`❌ Error insertando empresa ${empresa.name}: ${error.message}`);
            setLoading(false);
            return;
          } else if (data) {
            empresasInsertadas[data.email] = data.id;
          }
        }
      }

      console.log('Empresas insertadas:', empresasInsertadas);
      setMessage(`✅ ${Object.keys(empresasInsertadas).length} empresas listas. Insertando muestras...`);

      // 2. Insertar muestras AUTOMÁTICAS (manual = false, código 1000-9999)
      const muestrasAutomaticas = [
        {
          nombre: 'Vino Tinto Reserva 2019',
          categoria: 'Vino',
          categoriadecata: 'Tinto Reserva',
          empresa_id: empresasInsertadas['bodega1@example.com'],
          empresa: 'Bodegas Ejemplo 1',
          pais: 'España',
          manual: false,
          origen: 'D.O. Rioja',
          azucar: 2.5,
          grado: 13.5,
          anio: 2019,
        },
        {
          nombre: 'Aceite Virgen Extra Premium',
          categoria: 'Aceite',
          categoriadecata: 'Virgen Extra',
          empresa_id: empresasInsertadas['aceites@example.com'],
          empresa: 'Aceites Premium SL',
          pais: 'España',
          manual: false,
          origen: 'D.O. Priego de Córdoba',
          azucar: 0,
          grado: 0,
          anio: 2024,
        },
        {
          nombre: 'Vino Blanco Albariño',
          categoria: 'Vino',
          categoriadecata: 'Blanco Albariño',
          empresa_id: empresasInsertadas['vinos@example.com'],
          empresa: 'Vinos del Norte SA',
          pais: 'España',
          manual: false,
          origen: 'D.O. Rías Baixas',
          azucar: 3.2,
          grado: 12.5,
          anio: 2023,
        },
        {
          nombre: 'Ginebra Premium Artesanal',
          categoria: 'Destilado',
          categoriadecata: 'Ginebra',
          empresa_id: empresasInsertadas['destilerias@example.com'],
          empresa: 'Destilerías Test',
          pais: 'España',
          manual: false,
          origen: 'Alicante',
          azucar: 0,
          grado: 40.0,
          anio: 2024,
        },
        {
          nombre: 'Vino Rosado Navarra',
          categoria: 'Vino',
          categoriadecata: 'Rosado',
          empresa_id: empresasInsertadas['bodega1@example.com'],
          empresa: 'Bodegas Ejemplo 1',
          pais: 'España',
          manual: false,
          origen: 'D.O. Navarra',
          azucar: 4.0,
          grado: 12.0,
          anio: 2024,
        },
      ];

      const { error: errorAuto } = await supabase
        .from('muestras')
        .insert(muestrasAutomaticas);

      if (errorAuto) {
        console.error('Error insertando muestras automáticas:', errorAuto);
        setMessage(`❌ Error insertando muestras automáticas: ${errorAuto.message}`);
        setLoading(false);
        return;
      }

      console.log('✅ Muestras automáticas insertadas');
      setMessage(`✅ Muestras automáticas insertadas. Insertando muestras manuales...`);

      // 3. Insertar muestras MANUALES (manual = true, código 1-999)
      const muestrasManuales = [
        {
          codigo: 100,
          codigotexto: '000100',
          nombre: 'Vino Tinto Crianza MANUAL',
          categoria: 'Vino',
          categoriadecata: 'Tinto Crianza',
          empresa_id: empresasInsertadas['bodega1@example.com'],
          empresa: 'Bodegas Ejemplo 1',
          pais: 'España',
          manual: true,
          origen: 'D.O. Ribera del Duero',
          azucar: 2.0,
          grado: 14.0,
          anio: 2020,
        },
        {
          codigo: 150,
          codigotexto: '000150',
          nombre: 'Aceite Ecológico MANUAL',
          categoria: 'Aceite',
          categoriadecata: 'Ecológico',
          empresa_id: empresasInsertadas['aceites@example.com'],
          empresa: 'Aceites Premium SL',
          pais: 'España',
          manual: true,
          origen: 'Jaén',
          azucar: 0,
          grado: 0,
          anio: 2024,
        },
        {
          codigo: 200,
          codigotexto: '000200',
          nombre: 'Ron Añejo MANUAL',
          categoria: 'Destilado',
          categoriadecata: 'Ron',
          empresa_id: empresasInsertadas['destilerias@example.com'],
          empresa: 'Destilerías Test',
          pais: 'España',
          manual: true,
          origen: 'Canarias',
          azucar: 0,
          grado: 38.0,
          anio: 2018,
        },
        {
          codigo: 50,
          codigotexto: '000050',
          nombre: 'Vino Espumoso MANUAL',
          categoria: 'Vino',
          categoriadecata: 'Espumoso',
          empresa_id: empresasInsertadas['vinos@example.com'],
          empresa: 'Vinos del Norte SA',
          pais: 'España',
          manual: true,
          origen: 'D.O. Cava',
          azucar: 1.5,
          grado: 11.5,
          anio: 2023,
        },
        {
          codigo: 300,
          codigotexto: '000300',
          nombre: 'Aceite Arbequina MANUAL',
          categoria: 'Aceite',
          categoriadecata: 'Arbequina',
          empresa_id: empresasInsertadas['aceites@example.com'],
          empresa: 'Aceites Premium SL',
          pais: 'España',
          manual: true,
          origen: 'Cataluña',
          azucar: 0,
          grado: 0,
          anio: 2024,
        },
      ];

      const { error: errorManual } = await supabase
        .from('muestras')
        .insert(muestrasManuales);

      if (errorManual) {
        console.error('Error insertando muestras manuales:', errorManual);
        setMessage(`❌ Error insertando muestras manuales: ${errorManual.message}`);
        setLoading(false);
        return;
      }

      console.log('✅ Muestras manuales insertadas');
      setMessage('✅ ¡Datos de prueba insertados correctamente! 4 empresas, 5 muestras automáticas y 5 muestras manuales.');
      setLoading(false);

    } catch (error) {
      console.error('Error general:', error);
      setMessage(`❌ Error: ${error}`);
      setLoading(false);
    }
  };

  const deleteTestData = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar todos los datos de prueba?')) {
      return;
    }

    setLoading(true);
    setMessage('Eliminando datos de prueba...');

    try {
      // Eliminar muestras de empresas de prueba
      const testEmails = [
        'bodega1@example.com',
        'aceites@example.com',
        'vinos@example.com',
        'destilerias@example.com',
      ];

      const { data: empresas } = await supabase
        .from('empresas')
        .select('id')
        .in('email', testEmails);

      if (empresas && empresas.length > 0) {
        const ids = empresas.map((e) => e.id);

        // Eliminar muestras
        await supabase.from('muestras').delete().in('empresa_id', ids);

        // Eliminar empresas
        await supabase.from('empresas').delete().in('id', ids);
      }

      setMessage('✅ Datos de prueba eliminados correctamente');
      setLoading(false);
    } catch (error) {
      console.error('Error eliminando:', error);
      setMessage(`❌ Error: ${error}`);
      setLoading(false);
    }
  };

  const checkData = async () => {
    setLoading(true);
    try {
      const { data: muestras, error } = await supabase
        .from('muestras')
        .select(`
          codigo,
          codigotexto,
          nombre,
          manual,
          empresas:empresa_id (name)
        `)
        .order('manual', { ascending: false })
        .order('codigo', { ascending: true });

      if (error) throw error;

      console.log('📊 Muestras en la base de datos:', muestras);
      
      const manuales = muestras?.filter((m) => m.manual) || [];
      const automaticas = muestras?.filter((m) => !m.manual) || [];

      setMessage(
        `📊 Total: ${muestras?.length || 0} muestras | ` +
        `🔴 Manuales: ${manuales.length} (códigos 1-999) | ` +
        `🔵 Automáticas: ${automaticas.length} (códigos 1000-9999)`
      );
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setMessage(`❌ Error: ${error}`);
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto my-8">
      <div className="flex items-center gap-3 mb-4">
        <TestTube className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-bold">Datos de Prueba</h2>
      </div>

      <p className="text-gray-600 mb-6">
        Inserta datos de prueba para verificar el funcionamiento de los códigos de muestras
        (manuales 1-999 y automáticos 1000-9999).
      </p>

      <div className="space-y-3 mb-6">
        <button
          onClick={insertTestData}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          <Database className="w-5 h-5" />
          {loading ? 'Procesando...' : 'Insertar Datos de Prueba'}
        </button>

        <button
          onClick={checkData}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
          {loading ? 'Procesando...' : 'Verificar Datos'}
        </button>

        <button
          onClick={deleteTestData}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          <Trash2 className="w-5 h-5" />
          {loading ? 'Procesando...' : 'Eliminar Datos de Prueba'}
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('❌') ? 'bg-red-50 text-red-800' :
          message.includes('✅') ? 'bg-green-50 text-green-800' :
          'bg-blue-50 text-blue-800'
        }`}>
          <p className="text-sm whitespace-pre-wrap">{message}</p>
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2 text-sm">ℹ️ Información:</h3>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Se insertarán 4 empresas de ejemplo</li>
          <li>• Se insertarán 5 muestras automáticas (códigos entre 1000-9999)</li>
          <li>• Se insertarán 5 muestras manuales (códigos entre 1-999)</li>
          <li>• Las muestras manuales aparecerán con fondo rojo claro en el listado</li>
          <li>• Puedes verificar los códigos generados automáticamente</li>
        </ul>
      </div>
    </div>
  );
}
