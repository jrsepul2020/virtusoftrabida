import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Building2, LogOut, Edit, Save, X } from 'lucide-react';

type Company = {
  id: string;
  name: string;
  email: string;
  phone: string;
  movil: string;
  address: string;
  contact_person: string;
  nif: string;
  codigo_postal: string;
  poblacion: string;
  ciudad: string;
  pais: string;
  observaciones: string;
  conocimiento: string;
  pagina_web: string;
  totalinscripciones: number;
  created_at: string;
};

type Sample = {
  id: string;
  codigo: number;
  nombre: string;
  categoria: string;
  origen: string;
  igp: string;
  pais: string;
  azucar: number;
  grado: number;
  existencias: number;
  anio: number;
  tipouva: string;
  tipoaceituna: string;
  destilado: string;
  pagada: boolean;
  created_at: string;
};

type Props = {
  onLogout: () => void;
};

export default function UserDashboard({ onLogout }: Props) {
  const [company, setCompany] = useState<Company | null>(null);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editedCompany, setEditedCompany] = useState<Company | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        onLogout();
        return;
      }

      const { data: companyData, error: companyError } = await supabase
        .from('empresas')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (companyError) throw companyError;

      if (companyData) {
        setCompany(companyData);
        setEditedCompany(companyData);

        const { data: samplesData, error: samplesError } = await supabase
          .from('muestras')
          .select('*')
          .eq('empresa_id', companyData.id)
          .order('created_at', { ascending: false });

        if (samplesError) throw samplesError;
        setSamples(samplesData || []);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editedCompany || !company) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('empresas')
        .update({
          name: editedCompany.name,
          phone: editedCompany.phone,
          movil: editedCompany.movil,
          address: editedCompany.address,
          contact_person: editedCompany.contact_person,
          nif: editedCompany.nif,
          codigo_postal: editedCompany.codigo_postal,
          poblacion: editedCompany.poblacion,
          ciudad: editedCompany.ciudad,
          pais: editedCompany.pais,
          observaciones: editedCompany.observaciones,
          conocimiento: editedCompany.conocimiento,
          pagina_web: editedCompany.pagina_web,
        })
        .eq('id', company.id);

      if (error) throw error;

      setCompany(editedCompany);
      setEditing(false);
    } catch (error) {
      console.error('Error updating company:', error);
      alert('Error al actualizar los datos');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedCompany(company);
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Cargando...</div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No se encontró información de empresa</h2>
          <button
            onClick={onLogout}
            className="text-primary-600 hover:text-primary-700 underline"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8 text-primary-600" />
            <h1 className="text-3xl font-bold text-gray-800">Área de Empresa</h1>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Cerrar Sesión
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Datos de la Empresa</h2>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Edit className="w-5 h-5" />
                Editar
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  <Save className="w-5 h-5" />
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                  Cancelar
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">NIF</label>
                {editing ? (
                  <input
                    type="text"
                    value={editedCompany?.nif || ''}
                    onChange={(e) => setEditedCompany({ ...editedCompany!, nif: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900 py-2">{company.nif || '-'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                {editing ? (
                  <input
                    type="text"
                    value={editedCompany?.name || ''}
                    onChange={(e) => setEditedCompany({ ...editedCompany!, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900 py-2">{company.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                {editing ? (
                  <input
                    type="tel"
                    value={editedCompany?.phone || ''}
                    onChange={(e) => setEditedCompany({ ...editedCompany!, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900 py-2">{company.phone || '-'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Móvil</label>
                {editing ? (
                  <input
                    type="tel"
                    value={editedCompany?.movil || ''}
                    onChange={(e) => setEditedCompany({ ...editedCompany!, movil: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900 py-2">{company.movil || '-'}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <p className="text-gray-900 py-2">{company.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Persona de Contacto</label>
                {editing ? (
                  <input
                    type="text"
                    value={editedCompany?.contact_person || ''}
                    onChange={(e) => setEditedCompany({ ...editedCompany!, contact_person: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900 py-2">{company.contact_person || '-'}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                {editing ? (
                  <input
                    type="text"
                    value={editedCompany?.address || ''}
                    onChange={(e) => setEditedCompany({ ...editedCompany!, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900 py-2">{company.address || '-'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Población</label>
                {editing ? (
                  <input
                    type="text"
                    value={editedCompany?.poblacion || ''}
                    onChange={(e) => setEditedCompany({ ...editedCompany!, poblacion: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900 py-2">{company.poblacion || '-'}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código Postal</label>
                {editing ? (
                  <input
                    type="text"
                    value={editedCompany?.codigo_postal || ''}
                    onChange={(e) => setEditedCompany({ ...editedCompany!, codigo_postal: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900 py-2">{company.codigo_postal || '-'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                {editing ? (
                  <input
                    type="text"
                    value={editedCompany?.ciudad || ''}
                    onChange={(e) => setEditedCompany({ ...editedCompany!, ciudad: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900 py-2">{company.ciudad || '-'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">País</label>
                {editing ? (
                  <input
                    type="text"
                    value={editedCompany?.pais || ''}
                    onChange={(e) => setEditedCompany({ ...editedCompany!, pais: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900 py-2">{company.pais || '-'}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Página Web</label>
              {editing ? (
                <input
                  type="url"
                  value={editedCompany?.pagina_web || ''}
                  onChange={(e) => setEditedCompany({ ...editedCompany!, pagina_web: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900 py-2">{company.pagina_web || '-'}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                {editing ? (
                  <textarea
                    value={editedCompany?.observaciones || ''}
                    onChange={(e) => setEditedCompany({ ...editedCompany!, observaciones: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900 py-2">{company.observaciones || '-'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">¿Cómo nos conoció?</label>
                {editing ? (
                  <textarea
                    value={editedCompany?.conocimiento || ''}
                    onChange={(e) => setEditedCompany({ ...editedCompany!, conocimiento: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900 py-2">{company.conocimiento || '-'}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Muestras Inscritas ({samples.length})
          </h2>

          {samples.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Código</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Nombre</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Categoría</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">País</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Año</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Estado Pago</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {samples.map((sample) => (
                    <tr key={sample.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-bold text-gray-900">{sample.codigo}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{sample.nombre}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{sample.categoria || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{sample.pais || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{sample.anio || '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            sample.pagada
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {sample.pagada ? 'Pagada' : 'Pendiente'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No hay muestras inscritas</p>
          )}
        </div>
      </div>
    </div>
  );
}
