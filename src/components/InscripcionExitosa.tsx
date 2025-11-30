import { CheckCircle, Building2, Package, CreditCard, Mail, Phone, MapPin, Globe } from 'lucide-react';
import { CompanyData, SampleData } from './types';

interface InscripcionExitosaProps {
  onClose: () => void;
  pedido?: number | null;
  company?: CompanyData;
  samples?: SampleData[];
  precio?: { pagadas: number; gratis: number; total: number };
  metodoPago?: string;
}

export function InscripcionExitosa({ 
  onClose, 
  pedido,
  company,
  samples,
  precio,
  metodoPago = 'transferencia'
}: InscripcionExitosaProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-orange-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header de éxito */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 text-center mb-6">
          {/* Icono de éxito */}
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-green-400 rounded-full blur-xl opacity-50 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-green-500 to-green-600 rounded-full p-5 shadow-lg">
                <CheckCircle className="w-16 h-16 text-white" strokeWidth={2.5} />
              </div>
            </div>
          </div>

          {/* Título principal */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            ¡Inscripción Realizada con Éxito!
          </h1>

          {/* Número de pedido */}
          {pedido && (
            <div className="inline-block bg-primary-100 border-2 border-primary-300 rounded-xl px-6 py-3 mt-4">
              <p className="text-sm text-primary-600 font-medium">Número de Pedido</p>
              <p className="text-3xl font-bold text-primary-800">#{pedido}</p>
            </div>
          )}

          {/* Logo */}
          <div className="mt-6 flex justify-center">
            <img 
              src="/logo-bandera-1.png" 
              alt="International Virtus Awards" 
              className="h-20 md:h-24 object-contain"
            />
          </div>
        </div>

        {/* Datos de la empresa */}
        {company && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-200">
              <div className="bg-primary-100 p-2 rounded-lg">
                <Building2 className="w-6 h-6 text-primary-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Datos de la Empresa</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-500">Empresa</span>
                  <p className="font-semibold text-gray-900">{company.nombre_empresa}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">NIF</span>
                  <p className="font-medium text-gray-800">{company.nif}</p>
                </div>
                {company.persona_contacto && (
                  <div>
                    <span className="text-sm text-gray-500">Persona de contacto</span>
                    <p className="font-medium text-gray-800">{company.persona_contacto}</p>
                  </div>
                )}
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Mail className="w-4 h-4 text-gray-400 mt-1" />
                  <div>
                    <span className="text-sm text-gray-500">Email</span>
                    <p className="font-medium text-gray-800 break-all">{company.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Phone className="w-4 h-4 text-gray-400 mt-1" />
                  <div>
                    <span className="text-sm text-gray-500">Teléfono</span>
                    <p className="font-medium text-gray-800">{company.telefono}</p>
                    {company.movil && <p className="text-sm text-gray-600">Móvil: {company.movil}</p>}
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                  <div>
                    <span className="text-sm text-gray-500">Dirección</span>
                    <p className="font-medium text-gray-800">
                      {company.direccion && `${company.direccion}, `}
                      {company.poblacion}
                      {company.codigo_postal && ` (${company.codigo_postal})`}
                    </p>
                    <p className="text-sm text-gray-600">{company.ciudad && `${company.ciudad}, `}{company.pais}</p>
                  </div>
                </div>
                {company.pagina_web && (
                  <div className="flex items-start gap-2">
                    <Globe className="w-4 h-4 text-gray-400 mt-1" />
                    <div>
                      <span className="text-sm text-gray-500">Web</span>
                      <p className="font-medium text-gray-800">{company.pagina_web}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Muestras registradas */}
        {samples && samples.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-200">
              <div className="bg-amber-100 p-2 rounded-lg">
                <Package className="w-6 h-6 text-amber-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Muestras Registradas ({samples.length})</h2>
            </div>
            
            <div className="space-y-4">
              {samples.map((sample, idx) => (
                <div key={idx} className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-primary-600 text-white rounded-full text-sm font-bold shadow">
                        {idx + 1}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-lg mb-2">{sample.nombre_muestra}</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">Categoría:</span>
                          <span className="ml-1 font-medium text-gray-800">{sample.categoria}</span>
                        </div>
                        {sample.pais && (
                          <div>
                            <span className="text-gray-500">País:</span>
                            <span className="ml-1 font-medium text-gray-800">{sample.pais}</span>
                          </div>
                        )}
                        {sample.anio && (
                          <div>
                            <span className="text-gray-500">Año/Añada:</span>
                            <span className="ml-1 font-medium text-gray-800">{sample.anio}</span>
                          </div>
                        )}
                        {sample.origen && (
                          <div>
                            <span className="text-gray-500">Origen:</span>
                            <span className="ml-1 font-medium text-gray-800">{sample.origen}</span>
                          </div>
                        )}
                        {sample.igp && (
                          <div>
                            <span className="text-gray-500">IGP:</span>
                            <span className="ml-1 font-medium text-gray-800">{sample.igp}</span>
                          </div>
                        )}
                        {sample.grado_alcoholico && (
                          <div>
                            <span className="text-gray-500">Grado:</span>
                            <span className="ml-1 font-medium text-gray-800">{sample.grado_alcoholico}°</span>
                          </div>
                        )}
                        {sample.azucar && (
                          <div>
                            <span className="text-gray-500">Azúcar:</span>
                            <span className="ml-1 font-medium text-gray-800">{sample.azucar} g/l</span>
                          </div>
                        )}
                        {sample.tipo_uva && (
                          <div>
                            <span className="text-gray-500">Tipo Uva:</span>
                            <span className="ml-1 font-medium text-gray-800">{sample.tipo_uva}</span>
                          </div>
                        )}
                        {sample.tipo_aceituna && (
                          <div>
                            <span className="text-gray-500">Tipo Aceituna:</span>
                            <span className="ml-1 font-medium text-gray-800">{sample.tipo_aceituna}</span>
                          </div>
                        )}
                        {sample.destilado && (
                          <div>
                            <span className="text-gray-500">Destilado:</span>
                            <span className="ml-1 font-medium text-gray-800">{sample.destilado}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resumen de pago */}
        {precio && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-200">
              <div className="bg-green-100 p-2 rounded-lg">
                <CreditCard className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Resumen de Pago</h2>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Muestras a pagar:</span>
                <span className="font-medium">{precio.pagadas} x 150€</span>
              </div>
              {precio.gratis > 0 && (
                <div className="flex justify-between items-center text-green-600">
                  <span>🎉 Muestras gratis:</span>
                  <span className="font-medium">{precio.gratis}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Método de pago:</span>
                <span className="font-medium capitalize">
                  {metodoPago === 'transferencia' ? 'Transferencia bancaria' : 'PayPal'}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total:</span>
                  <span className="text-2xl font-bold text-primary-700">{precio.total}€</span>
                </div>
              </div>
            </div>

            {metodoPago === 'transferencia' && (
              <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">📋 Datos para la transferencia:</h4>
                <div className="space-y-1 text-sm text-blue-700">
                  <p><strong>Banco:</strong> CAIXABANK</p>
                  <p><strong>IBAN:</strong> ES12 2100 1234 5678 9012 3456</p>
                  <p><strong>Concepto:</strong> Pedido #{pedido} - {company?.nombre_empresa}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mensaje importante */}
        <div className="bg-gradient-to-br from-primary-50 to-orange-50 rounded-2xl p-6 mb-6 border border-primary-200">
          <div className="flex items-start gap-3">
            <div className="bg-primary-100 p-2 rounded-lg flex-shrink-0">
              <Mail className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-primary-800 mb-1">Revise su correo electrónico</h3>
              <p className="text-primary-700 text-sm">
                Hemos enviado un email a <strong>{company?.email}</strong> con todos los detalles de su inscripción.
                Si no lo encuentra, revise la carpeta de spam.
              </p>
            </div>
          </div>
        </div>

        {/* Botón para volver */}
        <div className="text-center">
          <button
            onClick={onClose}
            className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold px-10 py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    </div>
  );
}
