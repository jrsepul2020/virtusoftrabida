import { useState, useEffect, useCallback } from "react";
import { supabase, type Company, type Sample } from "../lib/supabase";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  Calendar,
  CreditCard,
  FileText,
  ArrowLeft,
  User,
  Hash,
  Info,
  Edit2,
  Check,
  X,
  Smartphone,
  Clock,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";

interface CompanyProfileProps {
  id: string;
  onBack: () => void;
}

export default function CompanyProfile({ id, onBack }: CompanyProfileProps) {
  const [data, setData] = useState<Company | null>(null);
  const [muestras, setMuestras] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<any>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: company, error: companyError } = await supabase
        .from("empresas")
        .select("*")
        .eq("id", id)
        .single();

      if (companyError) throw companyError;
      setData(company as Company);

      const { data: samples, error: samplesError } = await supabase
        .from("muestras")
        .select("*")
        .eq("empresa_id", id)
        .order("created_at", { ascending: true });

      if (samplesError)
        console.error("❌ Error fetching samples:", samplesError);
      else setMuestras(samples || []);
    } catch (error: any) {
      console.error("Error fetching company data:", error);
      toast.error(`Error al cargar los datos: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdateField = async (field: keyof Company, value: any) => {
    try {
      const { error } = await supabase
        .from("empresas")
        .update({ [field]: value })
        .eq("id", id);

      if (error) throw error;

      setData((prev) => (prev ? { ...prev, [field]: value } : null));
      toast.success("Campo actualizado");
    } catch (error: any) {
      toast.error(`Error al actualizar: ${error.message}`);
    } finally {
      setEditingField(null);
    }
  };

  const startEditing = (field: keyof Company, value: any) => {
    setEditingField(field as string);
    setEditValue(value ?? "");
  };

  const cancelEditing = () => {
    setEditingField(null);
    setEditValue(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl shadow-sm border border-slate-200">
        <Info className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-900">
          No se encontraron datos
        </h3>
        <button onClick={onBack} className="mt-4 text-primary-600 font-bold">
          Volver
        </button>
      </div>
    );
  }

  const InlineEditField = ({
    label,
    field,
    value,
    icon,
    type = "text",
    options,
    readonly = false,
    noLabel = false,
  }: {
    label: string;
    field?: keyof Company;
    value: any;
    icon?: React.ReactNode;
    type?: "text" | "date" | "checkbox" | "select" | "timestamp";
    options?: { label: string; value: any }[];
    readonly?: boolean;
    noLabel?: boolean;
  }) => {
    const isEditing = editingField === field && !readonly;

    const handleSave = () => {
      if (field && editValue !== value) {
        handleUpdateField(field, editValue);
      } else {
        setEditingField(null);
      }
    };

    return (
      <div className="group relative">
        {!noLabel && (
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
            {icon}
            {label}
          </p>
        )}

        <div
          onClick={() =>
            !isEditing && !readonly && field && startEditing(field, value)
          }
          className={`min-h-[42px] px-3 py-2 rounded-xl border transition-all flex items-center justify-between ${
            readonly
              ? "bg-slate-50/50 border-slate-100 cursor-default"
              : isEditing
                ? "bg-white border-red-500 ring-4 ring-red-50 shadow-md cursor-pointer"
                : "bg-slate-50 border-slate-300 hover:border-primary-200 hover:bg-white cursor-pointer"
          }`}
        >
          {isEditing && field ? (
            <div className="flex items-center w-full gap-2">
              {type === "text" && (
                <input
                  autoFocus
                  className="flex-1 bg-transparent border-none p-0 text-sm font-bold text-slate-900 focus:ring-0"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                  onBlur={(e) => {
                    if (!e.relatedTarget?.classList.contains("cancel-btn")) {
                      handleSave();
                    }
                  }}
                />
              )}
              {type === "date" && (
                <input
                  autoFocus
                  type="date"
                  className="flex-1 bg-transparent border-none p-0 text-sm font-bold text-slate-900 focus:ring-0"
                  value={
                    editValue
                      ? new Date(editValue).toISOString().split("T")[0]
                      : ""
                  }
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={handleSave}
                />
              )}
              {type === "select" && options && (
                <select
                  autoFocus
                  className="flex-1 bg-transparent border-none p-0 text-sm font-bold text-slate-900 focus:ring-0 cursor-pointer"
                  value={editValue?.toString()}
                  onChange={(e) => {
                    const val = e.target.value;
                    const option = options.find(
                      (o) => o.value?.toString() === val,
                    );
                    setEditValue(option ? option.value : val);
                  }}
                  onBlur={handleSave}
                >
                  {options.map((opt) => (
                    <option
                      key={opt.value?.toString()}
                      value={opt.value?.toString()}
                    >
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}
              <div className="flex items-center gap-1">
                <button
                  onClick={handleSave}
                  className="p-1 text-green-600 hover:bg-green-50 rounded"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    cancelEditing();
                  }}
                  className="p-1 text-red-600 hover:bg-red-50 rounded cancel-btn"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm font-bold text-slate-900">
                {type === "date" && value
                  ? new Date(value).toLocaleDateString("es-ES")
                  : type === "timestamp" && value
                    ? new Date(value).toLocaleString("es-ES")
                    : type === "select"
                      ? options?.find((o) => o.value === value)?.label || value
                      : value?.toString() || (
                          <span className="text-slate-300 font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                            No especificado
                          </span>
                        )}
              </p>
              {!readonly && (
                <Edit2 className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2" />
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500 mt-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-6 px-1">
        <span
          className="hover:text-primary-600 cursor-pointer transition-colors"
          onClick={onBack}
        >
          Administración
        </span>
        <ChevronRight className="w-3 h-3" />
        <span
          className="hover:text-primary-600 cursor-pointer transition-colors"
          onClick={onBack}
        >
          Inscripciones
        </span>
        <ChevronRight className="w-3 h-3 text-slate-300" />
        <span className="text-slate-900 dark:text-white truncate max-w-[200px]">
          {data.name}
        </span>
      </nav>

      <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {/* Header Integrated */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-8 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-6 min-w-0 flex-1">
            <button
              onClick={onBack}
              className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-primary-600 transition-all group shrink-0"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-4 flex-wrap">
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-1">
                  {data.name}
                </h1>
                <span className="text-3xl font-black text-primary-600 dark:text-primary-400 tracking-tight leading-none mb-1">
                  #{data.pedido || "S/N"}
                </span>
              </div>
              <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest flex items-center gap-3 flex-wrap mt-2">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" /> Alta:{" "}
                  {new Date(data.created_at).toLocaleDateString("es-ES")}
                </span>
                <span className="w-1 h-1 bg-slate-300 rounded-full shrink-0" />
                <span className="flex items-center gap-1.5">
                  <Hash className="w-3 h-3" /> Muestras:{" "}
                  {data.totalinscripciones || 0}
                </span>
                <span className="w-1 h-1 bg-slate-300 rounded-full shrink-0" />
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3 h-3" /> {data.pais || "España"}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0 px-4">
            <div className="flex items-center gap-3 text-slate-500 text-[11px] font-black uppercase tracking-widest">
              <span>Pago:</span>
              <select
                className={`px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest border focus:ring-2 focus:ring-offset-2 ring-primary-500 focus:outline-none cursor-pointer shadow-sm transition-all ${
                  data.status === "pagado"
                    ? "bg-green-100 border-green-200 text-green-700"
                    : data.status === "approved"
                      ? "bg-blue-100 border-blue-200 text-blue-700"
                      : data.status === "rejected"
                        ? "bg-red-100 border-red-200 text-red-700"
                        : "bg-amber-100 border-amber-200 text-amber-700"
                }`}
                value={data.status}
                onChange={(e) =>
                  handleUpdateField("status", e.target.value as any)
                }
              >
                <option value="pending">PENDIENTE</option>
                <option value="approved">APROBADO</option>
                <option value="pagado">PAGADO</option>
                <option value="rejected">RECHAZADO</option>
              </select>
            </div>
          </div>
        </div>

        {/* Unified Dashboard Sections */}
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {/* Section 1: Información Base & Admin */}
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Col 1: Corporativo */}
              <div className="space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50 py-1.5 px-3 rounded-lg w-fit border border-slate-100 dark:border-slate-800">
                  <Building2 className="w-3.5 h-3.5 text-primary-500" />{" "}
                  Información Corporativa
                </h3>
                <div className="flex flex-col gap-5">
                  <InlineEditField
                    label="Nombre Legal de la Empresa"
                    field="name"
                    value={data.name}
                    icon={<Building2 className="w-3 h-3" />}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div className="sm:col-span-1">
                      <InlineEditField
                        label="CIF / NIF"
                        field="nif"
                        value={data.nif}
                        icon={<Hash className="w-3 h-3" />}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <InlineEditField
                        label="Web"
                        field="pagina_web"
                        value={data.pagina_web}
                        icon={<Globe className="w-3 h-3" />}
                      />
                    </div>
                  </div>

                  <InlineEditField
                    label="Dirección Postal Completa"
                    field="address"
                    value={data.address}
                    icon={<MapPin className="w-3 h-3" />}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div className="sm:col-span-1">
                      <InlineEditField
                        label="C. Postal (8 Dígitos)"
                        field="codigo_postal"
                        value={data.codigo_postal}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <InlineEditField
                        label="Población / Localidad"
                        field="poblacion"
                        value={data.poblacion}
                        icon={<MapPin className="w-3 h-3" />}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <InlineEditField
                      label="Ciudad"
                      field="ciudad"
                      value={data.ciudad}
                    />
                    <InlineEditField
                      label="País"
                      field="pais"
                      value={data.pais}
                      icon={<Globe className="w-3 h-3" />}
                    />
                  </div>
                </div>
              </div>

              {/* Col 2: Gestión e Inscripción */}
              <div className="space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50 py-1.5 px-3 rounded-lg w-fit border border-slate-100 dark:border-slate-800">
                  <User className="w-3.5 h-3.5 text-primary-500" /> Contacto y
                  Gestión
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2">
                    <InlineEditField
                      label="Representante"
                      field="contact_person"
                      value={data.contact_person}
                      icon={<User className="w-3 h-3" />}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <InlineEditField
                      label="Email Principal"
                      field="email"
                      value={data.email}
                      icon={<Mail className="w-3 h-3" />}
                    />
                  </div>
                  <InlineEditField
                    label="Fijo"
                    field="phone"
                    value={data.phone}
                    icon={<Phone className="w-3 h-3" />}
                  />
                  <InlineEditField
                    label="Móvil"
                    field="movil"
                    value={data.movil}
                    icon={<Smartphone className="w-3 h-3" />}
                  />
                  <div className="sm:col-span-2">
                    <InlineEditField
                      label="¿Como nos conoció?"
                      field="conocimiento"
                      value={data.conocimiento}
                    />
                  </div>
                  <InlineEditField
                    label="Nº de Muestras"
                    field="totalinscripciones"
                    value={data.totalinscripciones}
                    type="text"
                  />
                  <InlineEditField
                    label="Estado del pedido"
                    field="revisada"
                    value={data.revisada}
                    type="select"
                    options={[
                      { label: "✓ APROBADO", value: true },
                      { label: "✗ PENDIENTE", value: false },
                    ]}
                  />
                </div>
              </div>
            </div>

            {/* Observaciones Full Width inside first section */}
            <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50 py-1.5 px-3 rounded-lg border border-slate-100 dark:border-slate-800">
                  <FileText className="w-3.5 h-3.5 text-primary-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Observaciones
                  </span>
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-1">
                <InlineEditField
                  label="Observaciones"
                  noLabel
                  field="observaciones"
                  value={data.observaciones}
                  icon={<FileText className="w-3 h-3" />}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Pago & Auditoría */}
          <div className="p-8 bg-slate-50/30 dark:bg-slate-900/10">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-lg w-fit border border-slate-100 dark:border-slate-800">
              <CreditCard className="w-3.5 h-3.5 text-primary-500" />{" "}
              Información de Pago y Auditoría
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              <InlineEditField
                label="Método de Pago"
                field="metodo_pago"
                value={data.metodo_pago}
                type="select"
                options={[
                  { label: "Transferencia Bancaria", value: "transferencia" },
                  { label: "PayPal", value: "paypal" },
                ]}
              />
              <InlineEditField
                label="Estado del Cobro"
                field="pago_confirmado"
                value={data.pago_confirmado}
                type="select"
                options={[
                  { label: "CONFIRMADO", value: true },
                  { label: "PENDIENTE", value: false },
                ]}
              />
              <InlineEditField
                label="Referencia"
                field="referencia_pago"
                value={data.referencia_pago}
                icon={<Hash className="w-3 h-3" />}
              />
              <InlineEditField
                label="Fecha de Ejecución"
                field="fecha_pago"
                value={data.fecha_pago}
                type="date"
                icon={<Calendar className="w-3 h-3" />}
              />
              <div className="sm:col-span-2">
                <InlineEditField
                  label="Notas Específicas del Pago"
                  field="notas_pago"
                  value={data.notas_pago}
                  icon={<FileText className="w-3 h-3" />}
                />
              </div>
              <InlineEditField
                label="Creado el"
                value={data.created_at}
                type="timestamp"
                readonly
                icon={<Clock className="w-3 h-3" />}
              />
              <InlineEditField
                label="Última Modificación"
                value={data.updated_at}
                type="timestamp"
                readonly
                icon={<Clock className="w-3 h-3" />}
              />
            </div>
          </div>

          {/* Section 3: Muestras Table */}
          <div className="p-0 overflow-x-auto">
            <div className="bg-slate-50 dark:bg-slate-900 px-8 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-primary-500" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-200">
                  Muestras Registradas ({muestras.length})
                </h3>
              </div>
            </div>
            {muestras.length > 0 ? (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-white dark:bg-slate-800">
                    <th className="px-8 py-4 font-bold text-slate-400 uppercase text-[9px] border-b border-slate-100 dark:border-slate-700">
                      Cód
                    </th>
                    <th className="px-8 py-4 font-bold text-slate-400 uppercase text-[9px] border-b border-slate-100 dark:border-slate-700">
                      Nombre de la Muestra
                    </th>
                    <th className="px-8 py-4 font-bold text-slate-400 uppercase text-[9px] border-b border-slate-100 dark:border-slate-700 text-center">
                      Año / Cosecha
                    </th>
                    <th className="px-8 py-4 font-bold text-slate-400 uppercase text-[9px] border-b border-slate-100 dark:border-slate-700">
                      Categoría
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                  {muestras.map((m) => (
                    <tr
                      key={m.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <td className="px-8 py-4 font-mono text-[11px] text-primary-600 font-bold">
                        #{m.codigo}
                      </td>
                      <td className="px-8 py-4 font-bold text-slate-900 dark:text-white text-xs">
                        {m.nombre}
                      </td>
                      <td className="px-8 py-4 text-slate-500 dark:text-slate-400 text-[11px] text-center">
                        {m.anio || "-"}
                      </td>
                      <td className="px-8 py-4 text-slate-500 dark:text-slate-400 text-[11px]">
                        {m.categoria || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-16 text-center text-slate-300 dark:text-slate-600">
                <p className="text-sm font-bold uppercase tracking-widest">
                  Sin muestras vinculadas
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
