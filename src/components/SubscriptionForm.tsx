// src/components/SubscriptionForm.tsx
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function SubscriptionForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('guardando');

    try {
      // Save subscription in Supabase
      const { error: insertError } = await supabase
        .from('inscripciones')
        .insert([{ name, email, phone }]);

      if (insertError) {
        console.error('Error guardando:', insertError);
        setStatus('error_guardar');
        return;
      }

      // Call Vercel serverless function to send emails
      const resp = await fetch('/api/send-inscription-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone }),
      });

      if (!resp.ok) {
        const body = await resp.json().catch(() => ({ error: 'unknown' }));
        console.error('Error enviando emails:', body);
        setStatus('error_email');
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Nombre</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Nombre"
          required
          className="w-full px-3 py-2 border rounded"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Correo</label>
        <input
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Correo"
          type="email"
          required
          className="w-full px-3 py-2 border rounded"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Teléfono</label>
        <input
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="Teléfono (opcional)"
          className="w-full px-3 py-2 border rounded"
        />
      </div>

      <div>
        <button
          type="submit"
          className="bg-[#8A754C] text-white font-semibold px-4 py-2 rounded"
        >
          Enviar inscripción
        </button>
      </div>

      {status === 'guardando' && <div className="text-sm text-gray-600">Guardando...</div>}
      {status === 'enviado' && <div className="text-sm text-green-600">Inscripción enviada. Revisa tu correo.</div>}
      {status === 'error_email' && <div className="text-sm text-yellow-700">Inscripción guardada, pero no pudimos enviar el correo. Avísanos.</div>}
      {status === 'error_guardar' && <div className="text-sm text-red-600">Error guardando la inscripción.</div>}
      {status === 'error' && <div className="text-sm text-red-600">Error inesperado. Intenta de nuevo.</div>}
    </form>
  );
}