import { CheckCircle } from 'lucide-react';

interface InscripcionExitosaProps {
  onClose: () => void;
}

export function InscripcionExitosa({ onClose }: InscripcionExitosaProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-8 md:p-12 text-center">
        {/* Icono de éxito */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-green-400 rounded-full blur-xl opacity-50 animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-green-500 to-green-600 rounded-full p-6 shadow-lg">
              <CheckCircle className="w-20 h-20 text-white" strokeWidth={2.5} />
            </div>
          </div>
        </div>

        {/* Título principal */}
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          ¡Inscripción Realizada!
        </h1>

        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <img 
            src="/logo-bandera-1.png" 
            alt="International Virtus Awards" 
            className="h-24 md:h-32 object-contain"
          />
        </div>

        {/* Mensaje */}
        <div className="mb-8">
          <p className="text-xl md:text-2xl text-gray-700 leading-relaxed">
            Gracias por su inscripción
          </p>
          <p className="text-lg md:text-xl text-gray-600 mt-4">
            En breve recibirá un email con los datos de la inscripción
          </p>
        </div>

        {/* Detalles adicionales */}
        <div className="bg-gradient-to-br from-primary-50 to-orange-50 rounded-2xl p-6 mb-8">
          <p className="text-gray-700">
            <strong>Importante:</strong> Revise su bandeja de entrada y la carpeta de spam.
          </p>
          <p className="text-gray-600 mt-2 text-sm">
            El email contiene la información de pago y los detalles de su inscripción.
          </p>
        </div>

        {/* Botón para volver */}
        <button
          onClick={onClose}
          className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold px-10 py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
        >
          Volver al Inicio
        </button>
      </div>
    </div>
  );
}
