import { useEffect, useState, useRef } from 'react';
import { supabase, type Sample } from '../lib/supabase';
import { Search } from 'lucide-react';
function Barcode({ value }: { value: string }) {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const digits = (value || '').toString().replace(/\D/g, '');
    if (!digits || !ref.current) return;
    let v = digits;
    if (v.length < 13) v = v.padStart(13, '0');
    if (v.length > 13) v = v.slice(-13);
    let cancelled = false;

    (async () => {
      try {
        const mod = await import('jsbarcode');
        const create = (mod as any).default || mod;
        if (cancelled) return;
        create(ref.current as any, v, { format: 'EAN13', displayValue: true, height: 40, width: 1 });
      } catch (err) {
        // if jsbarcode is not installed, skip barcode generation
        console.warn('jsbarcode not available; barcode will not render', err);
      }
    })();

    return () => { cancelled = true; };
  }, [value]);

  return <svg ref={ref} />;
}

export default function Chequeo() {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [filtered, setFiltered] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);
  const [term, setTerm] = useState('');
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const currentReaderRef = useRef<any>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showOnlyRecibidos, setShowOnlyRecibidos] = useState(false);

  useEffect(() => {
    fetchSamples();
  }, []);

  useEffect(() => {
    const q = term.toLowerCase();
    const newFiltered = samples.filter(s => {
      const codigoText = (s.codigotexto || s.codigo?.toString() || '').toLowerCase();
      const nombre = (s.nombre || '').toLowerCase();
      const empresa = (s.empresa_nombre || s.empresa || '').toLowerCase();
      const matchesTerm = codigoText.includes(q) || nombre.includes(q) || empresa.includes(q);
      const matchesRecibidos = showOnlyRecibidos ? Boolean((s as any).recibida) : true;
      return matchesTerm && matchesRecibidos;
    });
    setFiltered(newFiltered);
    // Keep selectedIds only for currently visible rows
    const visibleIds = newFiltered.map(s => String(s.id));
    setSelectedIds(prev => prev.filter(id => visibleIds.includes(id)));
  }, [term, samples, showOnlyRecibidos]);

  const fetchSamples = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('muestras')
        .select(`*, empresas:empresa_id ( name )`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      const rows = (data || []).map((r: any) => ({ ...r, empresa_nombre: r.empresas?.name || r.empresa || 'Sin empresa' }));
      setSamples(rows);
      setFiltered(rows);
    } catch (err) {
      console.error('Error cargando muestras:', err);
    } finally {
      setLoading(false);
    }
  };

  const stopScanner = async () => {
    setScanning(false);
    setMessage(null);
    try {
      if (currentReaderRef.current && typeof currentReaderRef.current.reset === 'function') {
        try { currentReaderRef.current.reset(); } catch (e) { /* ignore */ }
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(t => t.stop());
        videoRef.current.srcObject = null;
      }
    } catch (err) {
      console.warn('Error stopping scanner', err);
    } finally {
      currentReaderRef.current = null;
    }
  };

  const handleDetected = async (rawValue: string) => {
    // normalize numeric value to digits
    const digits = (rawValue || '').toString().replace(/\D/g, '');
    const ean = digits.padStart(13, '0').slice(-13);
    setMessage(`Detectado: ${ean}. Buscando muestra...`);

    try {
      // search by codigobarras or codigotexto
      const { data, error } = await supabase
        .from('muestras')
        .select('*')
        .or(`codigobarras.eq.${ean},codigotexto.eq.${ean}`)
        .limit(1);
      if (error) throw error;
      if (!data || data.length === 0) {
        setMessage(`No encontrada: ${ean}`);
        navigator.vibrate?.(200);
        setTimeout(() => setMessage(null), 2000);
        return;
      }
      const sample = data[0];
      // If already recibida, inform
      if ((sample as any).recibida) {
        setMessage(`Muestra ya marcada recibida: ${sample.nombre}`);
        navigator.vibrate?.(100);
        setTimeout(() => setMessage(null), 1500);
        return;
      }

      // Update recibida flag
      const { error: updError } = await supabase
        .from('muestras')
        .update({ recibida: true, recibida_at: new Date().toISOString() })
        .eq('id', sample.id);
      if (updError) throw updError;
      setMessage(`Marcada recibida: ${sample.nombre}`);
      navigator.vibrate?.(200);
      // refresh samples list
      await fetchSamples();
      setTimeout(() => setMessage(null), 1500);
    } catch (err) {
      console.error('Error procesando detección', err);
      setMessage('Error procesando detección');
      setTimeout(() => setMessage(null), 2000);
    }
  };

  const startScanner = async () => {
    setMessage(null);
    setScanning(true);
    try {
      const constraints: MediaStreamConstraints = { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        try { videoRef.current.setAttribute('playsinline', 'true'); } catch (e) {}
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        try { await videoRef.current.play(); } catch (e) { console.debug('video.play failed', e); }
      }

      // Prefer native BarcodeDetector
      if ((window as any).BarcodeDetector) {
        try {
          const Detector = (window as any).BarcodeDetector;
          const detector = new Detector({ formats: ['ean_13'] });
          const loop = async () => {
            if (!scanning) return;
            try {
              if (!videoRef.current) return;
              const detections = await detector.detect(videoRef.current);
              if (detections && detections.length) {
                const val = detections[0].rawValue || detections[0].raw?.value || '';
                await handleDetected(val);
                await stopScanner();
                return;
              }
            } catch (e) {
              console.debug('BarcodeDetector detect error, will fallback to ZXing', e);
            }
            requestAnimationFrame(loop);
          };
          loop();
          return;
        } catch (err) {
          console.warn('BarcodeDetector usage failed, falling back', err);
        }
      }

      // Fallback: ZXing browser
      try {
        const ZXing = await import('@zxing/browser');
        const codeReader = new (ZXing as any).BrowserMultiFormatReader();
        currentReaderRef.current = codeReader;
        codeReader.decodeFromVideoDevice(undefined, videoRef.current as any, async (result: any, err: any) => {
          if (result) {
            try { await handleDetected(result.getText()); } catch (e) { console.error('handleDetected error', e); }
            await stopScanner();
          }
          if (err) {
            console.debug('ZXing decode error (usually harmless):', err);
          }
        });
      } catch (err) {
        console.warn('ZXing import failed or detection failed', err);
        setMessage('No es posible usar la cámara en este dispositivo');
        setTimeout(() => setMessage(null), 2000);
        await stopScanner();
      }
    } catch (err: any) {
      console.error('No se pudo iniciar cámara', err);
      setMessage(err?.message || 'Error iniciando cámara');
      setTimeout(() => setMessage(null), 2000);
      setScanning(false);
    }
  };

  return (
    <div>
      <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              value={term}
              onChange={e => setTerm(e.target.value)}
              placeholder="Buscar por código, nombre o empresa..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { if (!scanning) startScanner(); else stopScanner(); }}
              className={`px-3 py-2 rounded-lg text-sm ${scanning ? 'bg-red-600 text-white' : 'bg-primary-600 text-white'}`}
            >
              {scanning ? 'Detener escaneo' : 'Escanear con cámara'}
            </button>
            <button
              className="px-3 py-2 rounded-lg text-sm bg-gray-200 text-gray-800"
              title="Imprimir EAN13"
              onClick={() => { /* placeholder - no action yet */ }}
            >
              Imprimir EAN13
            </button>
            <button
              onClick={() => setShowOnlyRecibidos(prev => !prev)}
              className={`px-3 py-2 rounded-lg text-sm ${showOnlyRecibidos ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200'}`}
              title="Filtrar recibidos"
            >
              {showOnlyRecibidos ? 'Mostrando: Recibidos' : 'Filtrar: Recibidos'}
            </button>
            <div className="text-sm text-gray-600">Mostrando {filtered.length} / {samples.length}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="bg-gray-800 border-b border-gray-200">
              <tr>
                <th className="px-3 py-2 text-center text-xs font-medium text-white uppercase tracking-wider w-6">
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && filtered.every(s => selectedIds.includes(String(s.id)))}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedIds(filtered.map(s => String(s.id)));
                      else setSelectedIds([]);
                    }}
                    className="w-4 h-4"
                    aria-label="Seleccionar todo visible"
                  />
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider w-[5ch]">Cód</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider">Nombre</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider">Empresa</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider">Código Barras (EAN13)</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider">Fecha recepción</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-white uppercase tracking-wider">Recibida</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {loading ? (
                <tr><td colSpan={5} className="p-6 text-center text-gray-500">Cargando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="p-6 text-center text-gray-500">No se encontraron muestras</td></tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} className="border-b border-gray-100">
                    <td className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(String(s.id))}
                        onChange={(e) => {
                          const idStr = String(s.id);
                          if (e.target.checked) setSelectedIds(prev => Array.from(new Set([...prev, idStr])));
                          else setSelectedIds(prev => prev.filter(x => x !== idStr));
                        }}
                        className="w-4 h-4"
                        aria-label={`Seleccionar para imprimir ${s.nombre}`}
                      />
                    </td>
                    <td className="px-3 py-2 font-mono text-xs w-[5ch] truncate">{s.codigotexto || s.codigo?.toString() || '-'}</td>
                    <td className="px-3 py-2 text-sm">{s.nombre}</td>
                    <td className="px-3 py-2 text-sm">{s.empresa_nombre || '-'}</td>
                    <td className="px-3 py-2 text-sm">
                      {(() => {
                        const raw = (s.codigobarras || s.codigo?.toString() || '').toString().replace(/\D/g, '');
                        if (!raw) return <span className="text-gray-400">-</span>;
                        return (
                          <div className="flex items-center gap-3">
                            <div className="w-48">
                              <Barcode value={raw} />
                            </div>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      {((s as any).recibida_at) ? new Date((s as any).recibida_at).toLocaleString('es-ES') : '-'}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={Boolean((s as any).recibida)}
                        onChange={async (e) => {
                          const newVal = e.target.checked;
                          try {
                            await supabase.from('muestras').update({ recibida: newVal, recibida_at: newVal ? new Date().toISOString() : null }).eq('id', s.id);
                            // optimistic update in local state
                            setSamples(prev => prev.map(p => p.id === s.id ? ({ ...p, recibida: newVal }) as Sample : p));
                            setFiltered(prev => prev.map(p => p.id === s.id ? ({ ...p, recibida: newVal }) as Sample : p));
                          } catch (err) {
                            console.error('Error updating recibida', err);
                            alert('Error actualizando recibida');
                          }
                        }}
                        className="w-4 h-4"
                        aria-label={`Marcar recibida ${s.nombre}`}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scanner modal area: fullscreen overlay on mobile for camera preview */}
      {scanning && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/75 p-4">
          <div className="relative w-full max-w-3xl h-[80vh] bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
              autoPlay
            />

            <div className="absolute top-3 left-3 bg-white/20 backdrop-blur rounded px-3 py-1 text-sm text-white">
              {message ?? 'Escaneando...'}
            </div>

            <button
              onClick={() => stopScanner()}
              className="absolute top-3 right-3 bg-white bg-opacity-80 text-gray-900 rounded-full w-9 h-9 flex items-center justify-center shadow"
              aria-label="Cerrar cámara"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
