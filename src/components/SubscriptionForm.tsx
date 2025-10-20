import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { User, Mail, Phone, Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function SubscriptionForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('guardando');

    try {
      // 1) Guarda la inscripción en Supabase
      const { error: insertError } = await supabase
        .from('inscripciones')
        .insert([{ name, email, phone }]);

      if (insertError) {
        console.error('Error guardando:', insertError);
        setStatus('error_guardar');
        return;
      }

      // 2) Llama a la función serverless en Vercel para enviar los emails
      const resp = await fetch('/api/send-inscription-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone }),
      });

      if (!resp.ok) {
        // La inscripción ya está guardada, pero falló el envío de emails
        const body = await resp.json().catch(() => ({ error: 'unknown' }));
        console.error('Error enviando emails:', body);
        setStatus('error_email');
        // opcional: mostrar al usuario que la inscripción fue correcta aunque el correo no se envió
        return;
      }

      setStatus('enviado');
      setName('');
      setEmail('');
      setPhone('');
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-xl shadow-lg p-6 sm:p-8">
      <div className="text-center mb-6 sm:mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full mb-4 shadow-lg">
          <Send className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
          Formulario de Inscripción
        </h2>
        <p className="text-gray-600 text-sm sm:text-base">
          Completa tus datos para inscribirte
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div>
          <label className="block text-primary-800 font-medium mb-2 text-sm sm:text-base">
            Nombre completo
          </label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Tu nombre completo"
              required
              className="w-full pl-12 pr-4 py-3 rounded-lg border border-primary-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors text-base"
            />
          </div>
        </div>

        <div>
          <label className="block text-primary-800 font-medium mb-2 text-sm sm:text-base">
            Correo electrónico
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com"
              type="email"
              required
              className="w-full pl-12 pr-4 py-3 rounded-lg border border-primary-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors text-base"
            />
          </div>
        </div>

        <div>
          <label className="block text-primary-800 font-medium mb-2 text-sm sm:text-base">
            Teléfono (opcional)
          </label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+34 123 456 789"
              className="w-full pl-12 pr-4 py-3 rounded-lg border border-primary-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors text-base"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={status === 'guardando'}
          className="w-full bg-primary-600 text-white font-semibold py-3 sm:py-4 rounded-lg hover:bg-primary-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] text-base sm:text-lg"
        >
          {status === 'guardando' ? (
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin" />
              Enviando inscripción...
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3">
              <Send className="w-5 h-5" />
              Enviar inscripción
            </div>
          )}
        </button>
      </form>

      {/* Mensajes de estado */}
      {status === 'enviado' && (
        <div className="mt-4 sm:mt-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-medium">¡Inscripción enviada correctamente!</p>
              <p className="text-sm mt-1">Revisa tu correo electrónico para más información.</p>
            </div>
          </div>
        </div>
      )}

      {status === 'error_email' && (
        <div className="mt-4 sm:mt-6 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
            <div>
              <p className="font-medium">Inscripción guardada</p>
              <p className="text-sm mt-1">No pudimos enviar el correo de confirmación. Te contactaremos pronto.</p>
            </div>
          </div>
        </div>
      )}

      {(status === 'error_guardar' || status === 'error') && (
        <div className="mt-4 sm:mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="font-medium">Error en la inscripción</p>
              <p className="text-sm mt-1">
                {status === 'error_guardar' 
                  ? 'No pudimos guardar tu inscripción. Intenta de nuevo.' 
                  : 'Ocurrió un error inesperado. Por favor, intenta de nuevo.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}