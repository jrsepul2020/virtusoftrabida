import React, { useState } from "react";
import { EmpresaScreen } from "./EmpresaScreen";
import { MuestrasScreen } from "./MuestrasScreen";
import { ConfirmacionScreen } from "./ConfirmacionScreen";
import { CompanyData, SampleData, PaymentMethod } from "./types";

// Helpers
function calcularPrecio(muestras: number) {
  const gratis = Math.floor(muestras / 5);
  const pagadas = muestras - gratis;
  return { pagadas, gratis, total: pagadas * 150 };
}

const initialSample: SampleData = {
  nombre_muestra: "",
  categoria: "",
  origen: "",
  igp: "",
  pais: "",
  azucar: "",
  grado_alcoholico: "",
  existencias: "",
  anio: "",
  tipo_uva: "",
  tipo_aceituna: "",
  destilado: "",
};

function SubscriptionForm() {
  const [pantalla, setPantalla] = useState<1 | 2 | 3>(1);
  const [company, setCompany] = useState<CompanyData>({
    nif: "",
    nombre_empresa: "",
    persona_contacto: "",
    telefono: "",
    movil: "",
    email: "",
    direccion: "",
    poblacion: "",
    codigo_postal: "",
    ciudad: "",
    pais: "",
    medio_conocio: "",
    pagina_web: "",
    observaciones: "",
    num_muestras: 1,
  });
  const [samples, setSamples] = useState<SampleData[]>([{ ...initialSample }]);
  const [payment, setPayment] = useState<PaymentMethod>("transferencia");
  const [success, setSuccess] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Handlers empresa
  const handleCompanyChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === "num_muestras") {
      const num = Math.max(1, parseInt(value) || 1);
      setCompany((prev: CompanyData) => ({ ...prev, [name]: num }));
      setSamples((prev: SampleData[]) => {
        const arr = [...prev];
        if (arr.length < num) {
          return arr.concat(
            Array(num - arr.length)
              .fill(0)
              .map(() => ({ ...initialSample }))
          );
        } else if (arr.length > num) {
          return arr.slice(0, num);
        }
        return arr;
      });
    } else {
      setCompany((prev: CompanyData) => ({ ...prev, [name]: value }));
    }
  };

  // Handlers muestra
  const handleSampleChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setSamples((prev: SampleData[]) => {
      const arr = [...prev];
      arr[index] = { ...arr[index], [name]: value };
      return arr;
    });
  };

  // Handler pago
  const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPayment(e.target.value as PaymentMethod);
  };

  // Handler submit - catch sin variable para eliminar warning
  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      setSuccess(true);
    } catch {
      setError("Error al enviar el formulario.");
    } finally {
      setLoading(false);
    }
  };

  const precio = calcularPrecio(company.num_muestras);

  if (pantalla === 1)
    return (
      <EmpresaScreen
        company={company}
        onChange={handleCompanyChange}
        onNext={() => setPantalla(2)}
        precio={precio}
      />
    );
  if (pantalla === 2)
    return (
      <MuestrasScreen
        samples={samples}
        onChange={handleSampleChange}
        onPrev={() => setPantalla(1)}
        onNext={() => setPantalla(3)}
      />
    );
  return (
    <ConfirmacionScreen
      company={company}
      samples={samples}
      payment={payment}
      onPaymentChange={handlePaymentChange}
      precio={precio}
      onPrev={() => setPantalla(2)}
      onSubmit={handleSubmit}
      success={success}
      loading={loading}
      error={error}
    />
  );
}

export default SubscriptionForm;