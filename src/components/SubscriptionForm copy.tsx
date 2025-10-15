import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Building2, X as XIcon } from 'lucide-react';
import PaymentSelection from './PaymentSelection';

type Sample = {
  nombre: string;
  categoria: string;
  origen: string;
  igp: string;
  pais: string;
  azucar: string;
  grado: string;
  existencias: string;
  año: string;
  tipouva: string;
  tipoaceituna: string;
  destilado: string;
  manual: boolean;
  codigo?: string;
};

type ExistingSample = {
  id: string;
  codigo: number;
  nombre: string;
  categoria: string;
  pais: string;
};

const initialCompanyData = {
  name: '',
  email: '',
  phone: '',
  movil: '',
  address: '',
  contact_person: '',
  nif: '',
  codigo_postal: '',
  poblacion: '',
  ciudad: '',
  pais: '',
  observaciones: '',
  conocimiento: '',
  pagina_web: '',
  totalinscripciones: 1,
};

const initialSample: Sample = {
  nombre: '',
  categoria: '',
  origen: '',
  igp: '',
  pais: '',
  azucar: '',
  grado: '',
  existencias: '',
  año: '',
  tipouva: '',
  tipoaceituna: '',
  destilado: '',
  manual: false,
  codigo: '',
};

const getSamplePrice = (count: number): string => {
  const prices: { [key: number]: number } = {
    1: 150,
    2: 300,
    3: 450,
    4: 600,
    5: 600,
    6: 750,
    7: 900,
    8: 1050,
    9: 1200,
    10: 1200,
  };

  return prices[count] ? `${prices[count]}€` : '';
};

export default function SubscriptionForm() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isManualInscription, setIsManualInscription] = useState(false);

  useEffect(() => {
    checkIfAdmin();
  }, []);

  const checkIfAdmin = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAdmin(!!session);
  };

  const generateUniqueManualCode = async (): Promise<number> => {
    const maxAttempts = 50;
    for (let i = 0; i < maxAttempts; i++) {
      const code = Math.floor(Math.random() * 999) + 1;
      const { data } = await supabase
        .from('muestras')
        .select('codigo')
        .eq('codigo', code)
        .maybeSingle();

      if (!data) {
        return code;
      }
    }
    throw new Error('No se pudo generar un código único. Por favor intente nuevamente.');
  };

  const [companyData, setCompanyData] = useState(initialCompanyData);
  const [samples, setSamples] = useState<Sample[]>([{ ...initialSample }]);

  useEffect(() => {
    const createSamplesArray = async () => {
      const count = companyData.totalinscripciones;
      const newSamples: Sample[] = [];

      for (let i = 0; i < count; i++) {
        const sample = { ...initialSample };
        if (isManualInscription) {
          const code = await generateUniqueManualCode();
          sample.manual = true;
          sample.codigo = code.toString();
        }
        newSamples.push(sample);
      }

      setSamples(newSamples);
    };

    createSamplesArray();
  }, [companyData.totalinscripciones, isManualInscription]);

  const handleManualInscriptionToggle = async (checked: boolean) => {
    setIsManualInscription(checked);
  };

  const [existingSamples, setExistingSamples] = useState<ExistingSample[]>([]);
  const [companyEmail, setCompanyEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [registeredSamplesCount, setRegisteredSamplesCount] = useState(0);
  const [error, setError] = useState('');

  const loadExistingSamples = async (email: string) => {
    if (!email) {
      setExistingSamples([]);
      return;
    }

    try {
      const { data: company } = await supabase
        .from('empresas')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (company) {
        const { data: samplesData } = await supabase
          .from('muestras')
          .select('id, codigo, nombre, categoria, pais')
          .eq('ididempresa', company.id);

        setExistingSamples(samplesData || []);
      } else {
        setExistingSamples([]);
      }
    } catch (err) {
      console.error('Error loading samples:', err);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadExistingSamples(companyEmail);
    }, 500);

    return () => clearTimeout(timer);
  }, [companyEmail]);

  const deleteSample = async (sampleId: string) => {
    try {
      const { error } = await supabase
        .from('muestras')
        .delete()
        .eq('id', sampleId);

      if (error) throw error;

      setExistingSamples(existingSamples.filter(s => s.id !== sampleId));
    } catch (err: any) {
      setError(err.message || 'Error al eliminar la muestra');
    }
  };

  const updateSample = (index: number, field: keyof Sample, value: string) => {
    const newSamples = [...samples];
    newSamples[index][field] = value;
    setSamples(newSamples);
  };

  const clearForm = () => {
    setCompanyData(initialCompanyData);
    setSamples([{ ...initialSample }]);
    setCompanyEmail('');
    setExistingSamples([]);
    setIsManualInscription(false);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      let companyId;
      let userId = null;
      let tempPassword: string | undefined;
      let isNewCompany = false;

      const { data: existingCompany } = await supabase
        .from('empresas')
        .select('id, user_id')
        .eq('email', companyData.email)
        .maybeSingle();

      if (existingCompany) {
        companyId = existingCompany.id;
        userId = existingCompany.user_id;

        const { error: updateError } = await supabase
          .from('empresas')
          .update({
            name: companyData.name,
            phone: companyData.phone,
            movil: companyData.movil,
            address: companyData.address,
            contact_person: companyData.contact_person,
            nif: companyData.nif,
            codigo_postal: companyData.codigo_postal,
            poblacion: companyData.poblacion,
            ciudad: companyData.ciudad,
            pais: companyData.pais,
            observaciones: companyData.observaciones,
            conocimiento: companyData.conocimiento,
            pagina_web: companyData.pagina_web,
            totalinscripciones: companyData.totalinscripciones,
          })
          .eq('id', companyId);

        if (updateError) throw updateError;
      } else {
        isNewCompany = true;
        tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase();

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: companyData.email,
          password: tempPassword,
          options: {
            data: {
              company_name: companyData.name,
            },
          },
        });

        if (authError) throw authError;

        if (authData.user) {
          userId = authData.user.id;

          const { data: newCompany, error: companyError } = await supabase
            .from('empresas')
            .insert([{ ...companyData, user_id: userId }])
            .select()
            .single();

          if (companyError) throw companyError;
          companyId = newCompany.id;

          console.log(`Usuario creado - Email: ${companyData.email}, Contraseña: ${tempPassword}`);
          alert(`Se ha creado su cuenta.\n\nEmail: ${companyData.email}\nContraseña temporal: ${tempPassword}\n\nPor favor, guarde esta información para acceder al área de empresas.`);
        }
      }

      const validSamples = samples.filter(
        (s) => s.nombre.trim() !== ''
      );

      if (validSamples.length > 0) {
        const usedCodes = new Set<number>();
        for (const sample of validSamples) {
          if (sample.manual) {
            const codigo = parseInt(sample.codigo || '');
            if (!sample.codigo || isNaN(codigo) || codigo < 1 || codigo > 999) {
              throw new Error('Las inscripciones manuales deben tener un código entre 1 y 999');
            }
            if (usedCodes.has(codigo)) {
              throw new Error(`El código ${codigo} está duplicado en esta inscripción`);
            }
            usedCodes.add(codigo);
          }
        }

        const samplesData = validSamples.map((sample) => {
          const data: any = {
            nombre: sample.nombre,
            categoria: sample.categoria || null,
            origen: sample.origen || null,
            igp: sample.igp || null,
            pais: sample.pais || null,
            azucar: sample.azucar ? parseFloat(sample.azucar) : null,
            grado: sample.grado ? parseFloat(sample.grado) : null,
            existencias: sample.existencias ? parseInt(sample.existencias) : 0,
            año: sample.año ? parseInt(sample.año) : null,
            tipouva: sample.tipouva || null,
            tipoaceituna: sample.tipoaceituna || null,
            destilado: sample.destilado || null,
            ididempresa: companyId,
            manual: sample.manual,
          };

          if (sample.manual && sample.codigo) {
            data.codigo = parseInt(sample.codigo);
          }

          return data;
        });

        const { data: insertedSamples, error: samplesError } = await supabase
          .from('muestras')
          .insert(samplesData)
          .select();

        if (samplesError) throw samplesError;

        // Enviar email de confirmación
        try {
          const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-registration-email`;
          const headers = {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          };

          const emailData = {
            companyName: companyData.name,
            companyEmail: companyData.email,
            contactPerson: companyData.contact_person,
            phone: companyData.phone,
            samples: insertedSamples?.map((s: any) => ({
              codigo: s.codigo,
              nombre: s.nombre,
              categoria: s.categoria,
              pais: s.pais,
            })) || [],
            totalSamples: validSamples.length,
            isNewCompany,
            tempPassword,
          };

          const emailResponse = await fetch(apiUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(emailData),
          });

          if (!emailResponse.ok) {
            console.error('Error al enviar email de confirmación');
          }
        } catch (emailError) {
          console.error('Error al enviar email:', emailError);
        }
      }

      setRegisteredSamplesCount(validSamples.length);
      setShowPayment(true);
      clearForm();
    } catch (err: any) {
      setError(err.message || 'Error al registrar la suscripción');
    } finally {
      setLoading(false);
    }
  };

  if (showPayment) {
    return (
      <PaymentSelection
        totalSamples={registeredSamplesCount}
        companyName={companyData.name}
        companyEmail={companyData.email}
        onBack={() => {
          setShowPayment(false);
        }}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Building2 className="w-8 h-8 text-primary-600" />
          <h2 className="text-3xl font-bold text-gray-800">Formulario de Suscripción al Concurso</h2>
        </div>
        <button
          type="button"
          onClick={clearForm}
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
        >
          <XIcon className="w-5 h-5" />
          Limpiar Datos
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Datos de la Empresa</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                NIF
              </label>
              <input
                type="text"
                value={companyData.nif}
                onChange={(e) => setCompanyData({ ...companyData, nif: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la Empresa *
              </label>
              <input
                type="text"
                required
                value={companyData.name}
                onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                value={companyData.phone}
                onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Móvil
              </label>
              <input
                type="tel"
                value={companyData.movil}
                onChange={(e) => setCompanyData({ ...companyData, movil: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                required
                value={companyData.email}
                onChange={(e) => {
                  setCompanyData({ ...companyData, email: e.target.value });
                  setCompanyEmail(e.target.value);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Persona de Contacto
              </label>
              <input
                type="text"
                value={companyData.contact_person}
                onChange={(e) =>
                  setCompanyData({ ...companyData, contact_person: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dirección
              </label>
              <input
                type="text"
                value={companyData.address}
                onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Población
              </label>
              <input
                type="text"
                value={companyData.poblacion}
                onChange={(e) => setCompanyData({ ...companyData, poblacion: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código Postal
              </label>
              <input
                type="text"
                value={companyData.codigo_postal}
                onChange={(e) => setCompanyData({ ...companyData, codigo_postal: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ciudad
              </label>
              <input
                type="text"
                value={companyData.ciudad}
                onChange={(e) => setCompanyData({ ...companyData, ciudad: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                País
              </label>
              <input
                type="text"
                value={companyData.pais}
                onChange={(e) => setCompanyData({ ...companyData, pais: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observaciones
              </label>
              <textarea
                value={companyData.observaciones}
                onChange={(e) => setCompanyData({ ...companyData, observaciones: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Notas adicionales sobre la empresa..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ¿A través de qué medio nos conoció?
              </label>
              <textarea
                value={companyData.conocimiento}
                onChange={(e) => setCompanyData({ ...companyData, conocimiento: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Redes sociales, recomendación, búsqueda web..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Página Web
              </label>
              <input
                type="url"
                value={companyData.pagina_web}
                onChange={(e) => setCompanyData({ ...companyData, pagina_web: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="https://ejemplo.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de Muestras a Inscribir *
              </label>
              <div className="flex gap-2 flex-wrap">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <label
                    key={num}
                    className={`flex items-center justify-center px-4 py-2 border-2 rounded-lg cursor-pointer transition-all ${
                      companyData.totalinscripciones === num
                        ? 'border-primary-600 bg-primary-50 text-primary-700 font-semibold'
                        : 'border-gray-300 hover:border-primary-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="totalinscripciones"
                      value={num}
                      checked={companyData.totalinscripciones === num}
                      onChange={() => setCompanyData({ ...companyData, totalinscripciones: num })}
                      className="sr-only"
                    />
                    {num}
                  </label>
                ))}
              </div>
              {companyData.totalinscripciones > 0 && (
                <p className="mt-2 text-sm font-medium text-green-700">
                  Precio: {getSamplePrice(companyData.totalinscripciones)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {existingSamples.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Muestras Ya Inscritas</h3>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Código</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Nombre</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Categoría</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">País</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {existingSamples.map((sample) => (
                  <tr key={sample.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{sample.codigo}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{sample.nombre}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{sample.categoria || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{sample.pais || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => deleteSample(sample.id)}
                        className="text-red-600 hover:text-red-700 transition-colors"
                        title="Eliminar muestra"
                      >
                        <Trash2 className="w-5 h-5 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mb-6">
        <div className="mb-4">
          <h3 className="text-xl font-semibold text-gray-700">
            Datos de las Muestras ({samples.length})
          </h3>
          {isAdmin && (
            <label className="flex items-center gap-2 mt-2 text-sm font-medium text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isManualInscription}
                onChange={(e) => handleManualInscriptionToggle(e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span>Inscripción Manual (todas las muestras)</span>
            </label>
          )}
        </div>

        <div className="space-y-4">
          {samples.map((sample, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="mb-3">
                <h4 className="font-medium text-gray-700">Muestra #{index + 1}</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {sample.manual && isAdmin && (
                  <div className="md:col-span-3">
                    <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-primary-800">
                        Inscripción Manual - Código asignado: <span className="font-bold">{sample.codigo}</span>
                      </p>
                    </div>
                  </div>
                )}

                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de la Muestra *
                  </label>
                  <input
                    type="text"
                    required
                    value={sample.nombre}
                    onChange={(e) => updateSample(index, 'nombre', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría
                  </label>
                  <select
                    value={sample.categoria}
                    onChange={(e) => updateSample(index, 'categoria', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar categoría</option>
                    <option value="VINO BLANCO">VINO BLANCO</option>
                    <option value="VINO TINTO">VINO TINTO</option>
                    <option value="VINO ROSADO">VINO ROSADO</option>
                    <option value="VINO SIN ALCOHOL">VINO SIN ALCOHOL</option>
                    <option value="GENEROSO SECO">GENEROSO SECO</option>
                    <option value="GENEROSO DULCE">GENEROSO DULCE</option>
                    <option value="AROMATIZADO">AROMATIZADO</option>
                    <option value="ESPIRITUOSO ORIGEN VÍNICO">ESPIRITUOSO ORIGEN VÍNICO</option>
                    <option value="ESPIRITUOSO NO VÍNICO">ESPIRITUOSO NO VÍNICO</option>
                    <option value="ACEITE OLIVA VIRGEN EXTRA">ACEITE OLIVA VIRGEN EXTRA</option>
                    <option value="ACEITE OLIVA VIRGEN EXTRA ORGÁNICO">ACEITE OLIVA VIRGEN EXTRA ORGÁNICO</option>
                    <option value="ESPUMOSO">ESPUMOSO</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Origen
                  </label>
                  <input
                    type="text"
                    value={sample.origen}
                    onChange={(e) => updateSample(index, 'origen', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    IGP
                  </label>
                  <input
                    type="text"
                    value={sample.igp}
                    onChange={(e) => updateSample(index, 'igp', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    País
                  </label>
                  <input
                    type="text"
                    value={sample.pais}
                    onChange={(e) => updateSample(index, 'pais', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Azúcar
                  </label>
                  <input
                    type="text"
                    value={sample.azucar}
                    onChange={(e) => updateSample(index, 'azucar', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="ej: 12.5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Grado
                  </label>
                  <input
                    type="text"
                    value={sample.grado}
                    onChange={(e) => updateSample(index, 'grado', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="ej: 13.5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Existencias
                  </label>
                  <input
                    type="number"
                    value={sample.existencias}
                    onChange={(e) => updateSample(index, 'existencias', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Año
                  </label>
                  <input
                    type="number"
                    value={sample.año}
                    onChange={(e) => updateSample(index, 'año', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="2024"
                  />
                </div>

                {!sample.categoria.includes('ACEITE') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Uva
                    </label>
                    <input
                      type="text"
                      value={sample.tipouva}
                      onChange={(e) => updateSample(index, 'tipouva', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                )}

                {sample.categoria.includes('ACEITE') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Aceituna
                    </label>
                    <input
                      type="text"
                      value={sample.tipoaceituna}
                      onChange={(e) => updateSample(index, 'tipoaceituna', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                )}

                {!sample.categoria.includes('ACEITE') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Destilado
                    </label>
                    <input
                      type="text"
                      value={sample.destilado}
                      onChange={(e) => updateSample(index, 'destilado', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="bg-primary-600 text-white px-8 py-3 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg"
        >
          {loading ? 'Registrando...' : 'Enviar Suscripción'}
        </button>
      </div>
    </form>
  );
}
