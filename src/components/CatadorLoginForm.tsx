import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';

type Props = {
  onLogin: (catador: any) => void;
  onBack: () => void;
};

export default function CatadorLoginForm({ onLogin, onBack }: Props) {
  const [email, setEmail] = useState('');
  const [clave, setClave] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const emailTrimmed = email.toLowerCase().trim();
      const claveTrimmed = clave.trim();
      
      // Buscar catador por email y clave
      const { data: catador, error } = await supabase
        .from('catadores')
        .select('*')
        .eq('email', emailTrimmed)
        .eq('clave', claveTrimmed)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          setError('Email o clave incorrectos. Verifica tus datos.');
        } else {
          setError('Error de conexión. Inténtalo de nuevo.');
        }
        return;
      }

      if (!catador) {
        setError('Email o clave incorrectos');
        return;
      }

      // Registrar catador como activo en localStorage
      const catadorActivo = {
        id: catador.id,
        nombre: catador.nombre,
        email: catador.email,
        rol: catador.rol,
        mesa: catador.mesa,
        puesto: catador.puesto,
        ntablet: catador.ntablet,
        loginTime: new Date().toISOString()
      };

      // Obtener catadores activos actuales
      const sessionData = localStorage.getItem('catadores_activos');
      let catadoresActivos = sessionData ? JSON.parse(sessionData) : [];
      
      // Remover entrada previa del mismo catador si existe
      catadoresActivos = catadoresActivos.filter((c: any) => c.id !== catador.id);
      
      // Agregar nuevo registro
      catadoresActivos.push(catadorActivo);
      
      // Guardar en localStorage
      localStorage.setItem('catadores_activos', JSON.stringify(catadoresActivos));

      onLogin(catador);
    } catch (error) {
      console.error('❌ Error en login de catador:', error);
      setError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <div className="flex items-center mb-6">
          <button
            onClick={onBack}
            className="mr-3 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-bold text-gray-800">Acceso Catador</h2>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

                <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="tu-email@ejemplo.com"
              required
            />
          </div>

          <div>
            <label htmlFor="clave" className="block text-sm font-medium text-gray-700 mb-1">
              Clave
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="clave"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Tu clave asignada"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Contacta al administrador si no tienes tu clave
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Verificando...' : 'Acceder'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
            <p className="font-medium text-blue-800 mb-1">Información de acceso:</p>
            <p>• Usa el email registrado en el sistema</p>
            <p>• Tu clave fue asignada por el administrador</p>
          </div>
        </div>
      </div>
    </div>
  );
}