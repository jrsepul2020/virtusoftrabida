import { useState, useEffect, useCallback } from "react";
import { ShieldCheck, ArrowLeft, Lock } from "lucide-react";
import toast from "react-hot-toast";

interface Props {
  onSuccess: () => void;
  onBack: () => void;
}

export default function PinGate({ onSuccess, onBack }: Props) {
  const [pin, setPin] = useState("");
  const REQUIRED_PIN = "111111";

  useEffect(() => {
    // Mostrar toast con logo al entrar
    toast.success("Seguridad de la Organización", {
      icon: (
        <div className="flex-shrink-0">
          <img src="/logo-bandera-1.png" alt="Virtus" className="h-6 w-auto" />
        </div>
      ),
      duration: 3000,
    });
  }, []);

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      if (pin === REQUIRED_PIN) {
        toast.success("Acceso permitido");
        onSuccess();
      } else {
        toast.error("Clave de acceso incorrecta");
        setPin("");
      }
    },
    [pin, onSuccess],
  );

  const handleCharClick = (char: string) => {
    if (pin.length < 6) {
      setPin((prev) => prev + char);
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  useEffect(() => {
    if (pin.length === 6) {
      handleSubmit();
    }
  }, [pin, handleSubmit]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* El fondo difuminado se maneja en el componente padre App.tsx para cubrir HeroLanding */}

      <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 w-full max-w-sm relative overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Decorative elements */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary-100/50 rounded-full blur-3xl" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-primary-100/50 rounded-full blur-3xl" />

        <div className="relative z-10 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-600 rounded-2xl shadow-xl shadow-primary-200 mb-6 text-white rotate-3">
            <Lock className="w-10 h-10" />
          </div>

          <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">
            Acceso Restringido
          </h2>
          <p className="text-slate-500 text-sm font-medium mb-8 leading-tight">
            Este módulo es de uso exclusivo para la organización y
            administradores.
          </p>

          {/* Pin display */}
          <div className="flex justify-center gap-3 mb-8">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={`w-10 h-12 rounded-xl border-2 flex items-center justify-center transition-all duration-200 ${
                  pin.length > i
                    ? "border-primary-600 bg-primary-50 text-primary-900 shadow-sm"
                    : "border-slate-200 bg-slate-50 text-slate-300"
                }`}
              >
                {pin.length > i ? (
                  <div className="w-2.5 h-2.5 bg-current rounded-full animate-in fade-in zoom-in" />
                ) : (
                  <span className="text-lg opacity-20">•</span>
                )}
              </div>
            ))}
          </div>

          {/* Numeric keypad */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <button
                key={n}
                onClick={() => handleCharClick(n.toString())}
                className="h-14 rounded-2xl bg-white border border-slate-200 text-xl font-bold text-slate-800 hover:bg-slate-50 hover:border-primary-300 hover:scale-105 active:scale-95 transition-all shadow-sm"
              >
                {n}
              </button>
            ))}
            <button
              onClick={onBack}
              className="h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-all hover:scale-105 active:scale-95"
              title="Volver"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => handleCharClick("0")}
              className="h-14 rounded-2xl bg-white border border-slate-200 text-xl font-bold text-slate-800 hover:bg-slate-50 active:scale-95 transition-all shadow-sm"
            >
              0
            </button>
            <button
              onClick={handleDelete}
              className="h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-all hover:scale-105 active:scale-95"
              title="Borrar"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z"
                />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={onBack}
              className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-slate-100 text-slate-600 font-bold text-sm uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
            >
              Retroceder
            </button>
            <button
              onClick={() => handleSubmit()}
              disabled={pin.length < 6}
              className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-primary-600 text-white font-bold text-sm uppercase tracking-widest hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-200 transition-all active:scale-98"
            >
              <ShieldCheck className="w-4 h-4" />
              Acceder
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
