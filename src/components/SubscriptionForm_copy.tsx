import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function SubscriptionForm() {
  const [formData, setFormData] = useState({
    nombre_empresa: '',
    email: '',
    telefono: '',
    direccion: '',
    pais: '',
    categoria: '',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.from('empresas').insert([formData]);
      if (error) throw error;

      setSuccess(true);
      setFormData({
        nombre_empresa: '',
        email: '',
        telefono: '',
        direccion: '',
        pais: '',
        categoria: '',
      });
    } catch (err: any) {
      setError(err.message || 'Error al enviar el formulario.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-50 flex flex-col items-center justify-center py-10 px-6 relative">
      {/* Logo arriba a la izquierda */}
      <div className="absolute top-6 left-6 flex items-center gap-3">
        <img src="/logo-bandera-1.png" alt="Logo Virtus" className="h-12 w-auto" />
      </div>

      {/* Contenedor del formulario */}
      <div className="w-full max-w-2xl bg-white shadow-lg rounded-2xl p-8 border border-primary-100">
        <h1 className="text-3xl font-bold text-[#4B3A2A] mb-2 text-center">
          Formulario de Inscripción
        </h1>
        <p className="text-center text-primary-700 mb-8">
          Complete los datos de su empresa para participar en el certamen.
        </p>

        {success ? (
          <div className="text-center text-green-700 font-medium bg-green-100 p-4 rounded-lg">
            ✅ ¡Formulario enviado con éxito! Nos pondremos en contacto pronto.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-primary-800 font-medium mb-1">Nombre de la empresa</label>
              <input
                type="text"
                name="nombre_empresa"
                value={formData.nombre_empresa}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-lg border border-primary-200 focus:ring-2 focus:ring-primary-500 focus:outline-none shadow-sm"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-primary-800 font-medium mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-primary-200 focus:ring-2 focus:ring-primary-500 focus:outline-none shadow-sm"
                />
              </div>

              <div>
                <label className="block text-primary-800 font-medium mb-1">Teléfono</label>
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-primary-200 focus:ring-2 focus:ring-primary-500 focus:outline-none shadow-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-primary-800 font-medium mb-1">Dirección</label>
              <input
                type="text"
                name="direccion"
                value={formData.direccion}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-primary-200 focus:ring-2 focus:ring-primary-500 focus:outline-none shadow-sm"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-primary-800 font-medium mb-1">País</label>
                <input
                  type="text"
                  name="pais"
                  value={formData.pais}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-primary-200 focus:ring-2 focus:ring-primary-500 focus:outline-none shadow-sm"
                />
              </div>

              <div>
                <label className="block text-primary-800 font-medium mb-1">Categoría</label>
                <select
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-primary-200 bg-white focus:ring-2 focus:ring-primary-500 focus:outline-none shadow-sm"
                >
                  <option value="">Seleccione una categoría</option>
                  <option value="vinos_blancos">Vinos Blancos</option>
                  <option value="vinos_tintos">Vinos Tintos</option>
                  <option value="espumosos">Espumosos</option>
                  <option value="licores">Licores</option>
                  <option value="otros">Otros</option>
                </select>
              </div>
            </div>

            {error && <div className="text-red-600 text-sm text-center">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#8A754C] text-white py-3 rounded-lg font-semibold hover:bg-[#7A6945] transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Enviando...' : 'Enviar inscripción'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
