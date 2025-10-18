import React, { useState } from 'react';
import { Mail, Send, CheckCircle, XCircle, Loader } from 'lucide-react';

const EmailTest: React.FC = () => {
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [responseData, setResponseData] = useState<any>(null);

  const sendTestEmail = async () => {
    setTestStatus('loading');
    setErrorMessage('');
    setResponseData(null);

    // Datos de prueba específicos para jrsepul2000@gmail.com
    const testData = {
      empresa: {
        nombre_empresa: 'PRUEBA DEL SISTEMA',
        nif: 'TEST123456789',
        persona_contacto: 'Administrador del Sistema',
        email: 'jrsepul2000@gmail.com',
        telefono: '959000000',
        movil: '600000000',
        direccion: 'Sistema de Pruebas',
        poblacion: 'Huelva',
        codigo_postal: '21000',
        ciudad: 'Huelva',
        pais: 'España',
        pagina_web: 'www.virtuslarabida.com',
        medio_conocio: 'Prueba del Sistema',
        observaciones: '🧪 EMAIL DE PRUEBA DEL SISTEMA - ' + new Date().toLocaleString('es-ES'),
        num_muestras: 1
      },
      muestras: [
        {
          codigo: 999,
          nombre_muestra: '🧪 MUESTRA DE PRUEBA DEL SISTEMA',
          categoria: 'PRUEBA',
          origen: 'Sistema',
          pais: 'España'
        }
      ],
      precio: {
        pagadas: 0,
        gratis: 1,
        total: 0
      },
      metodoPago: 'transferencia'
    };

    try {
      console.log('Enviando email de prueba...');
      
      const response = await fetch('/api/send-inscription-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });

      const responseText = await response.text();
      
      try {
        const responseJson = JSON.parse(responseText);
        setResponseData(responseJson);
      } catch {
        setResponseData({ rawResponse: responseText });
      }

      if (response.ok) {
        setTestStatus('success');
        console.log('Email enviado correctamente:', responseText);
      } else {
        setTestStatus('error');
        setErrorMessage(`Error ${response.status}: ${responseText}`);
        console.error('Error enviando email:', response.status, responseText);
      }
    } catch (error) {
      setTestStatus('error');
      setErrorMessage(`Error de red: ${error}`);
      console.error('Error de red:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="flex items-center gap-3 mb-6">
        <Mail className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-800">Prueba de Envío de Emails</h2>
      </div>

      <div className="mb-6">
        <p className="text-gray-600 mb-4">
          <strong>🎯 Envío directo a jrsepul2000@gmail.com</strong><br/>
          Esta herramienta envía un email de prueba directamente al administrador 
          usando el sistema de inscripciones con datos de prueba identificables.
        </p>
        
        <div className="bg-red-50 p-4 rounded-lg mb-4 border border-red-200">
          <h3 className="font-semibold text-red-700 mb-2">📧 Email de Prueba</h3>
          <ul className="text-sm text-red-600 space-y-1">
            <li>• <strong>Destinatario:</strong> jrsepul2000@gmail.com</li>
            <li>• <strong>Asunto:</strong> "Nueva inscripción: PRUEBA DEL SISTEMA"</li>
            <li>• <strong>Contenido:</strong> Email completo con datos de prueba marcados</li>
            <li>• <strong>Propósito:</strong> Verificar funcionamiento del sistema de emails</li>
          </ul>
        </div>

        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
          <p className="text-sm text-yellow-700">
            ⚠️ <strong>Importante:</strong> Este email aparecerá como una inscripción real en tu bandeja de entrada.
            Los datos están claramente marcados como "PRUEBA DEL SISTEMA" para identificarlos fácilmente.
          </p>
        </div>
      </div>

      <button
        onClick={sendTestEmail}
        disabled={testStatus === 'loading'}
        className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
          testStatus === 'loading'
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-red-600 hover:bg-red-700 text-white'
        }`}
      >
        {testStatus === 'loading' ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            Enviando email de prueba...
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            Enviar Email de Prueba a jrsepul2000@gmail.com
          </>
        )}
      </button>

      {/* Resultados */}
      {testStatus === 'success' && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-green-800">¡Email enviado a jrsepul2000@gmail.com!</h3>
          </div>
          <p className="text-green-700 text-sm">
            <strong>✅ Sistema funcionando correctamente</strong><br/>
            Se ha enviado un email de prueba a jrsepul2000@gmail.com. 
            Revisa tu bandeja de entrada (incluyendo spam/promociones) para ver el email de confirmación de inscripción con datos de prueba.
          </p>
          {responseData && (
            <details className="mt-3">
              <summary className="cursor-pointer text-sm text-green-700 hover:text-green-800">
                Ver respuesta del servidor
              </summary>
              <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-x-auto">
                {JSON.stringify(responseData, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}

      {testStatus === 'error' && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-5 h-5 text-red-600" />
            <h3 className="font-semibold text-red-800">Error en el envío</h3>
          </div>
          <p className="text-red-700 text-sm mb-2">
            Ha ocurrido un error al intentar enviar el email:
          </p>
          <div className="bg-red-100 p-3 rounded text-sm text-red-800 font-mono">
            {errorMessage}
          </div>
          
          <div className="mt-3 text-sm text-red-700">
            <h4 className="font-semibold mb-1">Posibles causas:</h4>
            <ul className="space-y-1 text-xs">
              <li>• Variable de entorno BREVO_API_KEY no configurada</li>
              <li>• API Key de Brevo inválida o expirada</li>
              <li>• Servicio de Brevo no disponible</li>
              <li>• Error de configuración del servidor</li>
              <li>• Función serverless no desplegada correctamente</li>
            </ul>
          </div>

          {responseData && (
            <details className="mt-3">
              <summary className="cursor-pointer text-sm text-red-700 hover:text-red-800">
                Ver respuesta completa del servidor
              </summary>
              <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-x-auto">
                {JSON.stringify(responseData, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}

      {/* Información adicional */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">Información Técnica</h3>
        <div className="text-sm text-blue-700 space-y-1">
          <p><strong>📡 Endpoint:</strong> /api/send-inscription-email</p>
          <p><strong>🔧 Proveedor:</strong> Brevo (SendinBlue) API v3</p>
          <p><strong>📬 Destinatario:</strong> jrsepul2000@gmail.com</p>
          <p><strong>🧪 Empresa de prueba:</strong> "PRUEBA DEL SISTEMA"</p>
          <p><strong>⏰ Timestamp:</strong> Se incluye fecha/hora actual</p>
          <p><strong>🏷️ Identificación:</strong> Datos marcados como prueba</p>
        </div>
      </div>
    </div>
  );
};

export default EmailTest;