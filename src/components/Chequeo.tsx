import { useEffect, useState, useRef } from 'react';
import { supabase, type Sample } from '../lib/supabase';
import { Search } from 'lucide-react';
function Barcode({ value, height = 80, width = 2, displayValue = true }: { value: string; height?: number; width?: number; displayValue?: boolean }) {
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
        create(ref.current as any, v, { format: 'EAN13', displayValue, height, width });
      } catch (err) {
        // if jsbarcode is not installed, skip barcode generation
        console.warn('jsbarcode not available; barcode will not render', err);
      }
    })();

    return () => { cancelled = true; };
  }, [value, height, width, displayValue]);

  return <svg ref={ref} />;
}

export default function Chequeo() {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [filtered, setFiltered] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);
  const [term, setTerm] = useState('');
  const [scanning, setScanning] = useState(false);
  const scanningRef = useRef(false);
  const [message, setMessage] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const currentReaderRef = useRef<any>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showOnlyRecibidos, setShowOnlyRecibidos] = useState(false);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [sortBy, setSortBy] = useState<'codigo'|'nombre'|'fecha'|'recibida'|null>(null);
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc');
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;

  const formatDate = (d?: string | null) => {
    if (!d) return '-';
    try {
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return '-';
      return dt.toLocaleString('es-ES', { timeZone: userTimeZone, hour12: false });
    } catch (e) { return '-'; }
  };

  const localIsoWithOffset = (d = new Date()) => {
    // returns YYYY-MM-DDTHH:MM:SS±HH:MM (local time with offset)
    const pad = (n: number) => String(Math.floor(Math.abs(n))).padStart(2, '0');
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    const seconds = pad(d.getSeconds());
    const offsetMin = -d.getTimezoneOffset(); // minutes offset from UTC (e.g., +60)
    const offSign = offsetMin >= 0 ? '+' : '-';
    const offHours = pad(Math.floor(Math.abs(offsetMin) / 60));
    const offMins = pad(Math.abs(offsetMin) % 60);
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offSign}${offHours}:${offMins}`;
  };

  useEffect(() => {
    fetchSamples();
  }, []);

  useEffect(() => {
    scanningRef.current = scanning;
  }, [scanning]);

  useEffect(() => {
    const q = term.toLowerCase();
    const newFiltered = samples.filter(s => {
      const codigoText = (s.codigotexto || s.codigo?.toString() || '').toLowerCase();
      const nombre = (s.nombre || '').toLowerCase();
      const empresa = (s.empresa_nombre || s.empresa || '').toLowerCase();
      const matchesTerm = codigoText.includes(q) || nombre.includes(q) || empresa.includes(q);
      const matchesRecibidos = showOnlyRecibidos ? Boolean((s as any).recibida) : true;
      // date filtering: use recibida_at if present, otherwise created_at
      const dateStr = (s as any).recibida_at || (s as any).created_at || null;
      let matchesDate = true;
      try {
        if (dateStr && (dateFrom || dateTo)) {
          const d = new Date(dateStr);
          if (dateFrom) {
            const from = new Date(dateFrom);
            if (d < from) matchesDate = false;
          }
          if (dateTo) {
            const to = new Date(dateTo);
            if (d > to) matchesDate = false;
          }
        }
      } catch (e) { matchesDate = true; }
      return matchesTerm && matchesRecibidos && matchesDate;
    });
    // apply sorting
    const sorted = [...newFiltered];
    if (sortBy) {
      sorted.sort((a: any, b: any) => {
        let va: any; let vb: any;
        switch (sortBy) {
          case 'codigo': va = (a.codigotexto || a.codigo || '').toString(); vb = (b.codigotexto || b.codigo || '').toString(); break;
          case 'nombre': va = (a.nombre || '').toLowerCase(); vb = (b.nombre || '').toLowerCase(); break;
          case 'fecha': va = (a.recibida_at || a.created_at || '') ; vb = (b.recibida_at || b.created_at || ''); va = new Date(va); vb = new Date(vb); break;
          case 'recibida': va = Boolean(a.recibida) ? 1 : 0; vb = Boolean(b.recibida) ? 1 : 0; break;
          default: va = 0; vb = 0;
        }
        if (va == null) va = '';
        if (vb == null) vb = '';
        if (va < vb) return sortDir === 'asc' ? -1 : 1;
        if (va > vb) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }
    setFiltered(sorted);
    // Keep selectedIds only for currently visible rows
    const visibleIds = newFiltered.map(s => String(s.id));
    setSelectedIds(prev => prev.filter(id => visibleIds.includes(id)));
  }, [term, samples, showOnlyRecibidos, dateFrom, dateTo]);

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
      // turn off torch when stopping
      try {
        const stream = videoRef.current?.srcObject as MediaStream | undefined;
        const track = stream?.getVideoTracks()?.[0];
        if (track && (track.getConstraints as any)) {
          const caps: any = track.getCapabilities ? track.getCapabilities() : {};
          if (caps.torch) {
            try { await track.applyConstraints({ advanced: [{ torch: false }] }); } catch (e) { /* ignore */ }
            setTorchOn(false);
          }
        }
      } catch (e) { /* ignore */ }
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
        .update({ recibida: true, recibida_at: localIsoWithOffset() })
        .eq('id', sample.id);
      if (updError) throw updError;
      setMessage(`Marcada recibida: ${sample.nombre}`);
      setSuccessMessage('Marcada recibida');
      setTimeout(() => setSuccessMessage(null), 1400);
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
          // Ensure we use correct format names (MDN uses hyphen, e.g., 'ean-13')
          const desired = ['ean-13', 'ean-8', 'upc-a', 'upc-e', 'code-128'];
          let formats = desired;
          try {
            if (typeof Detector.getSupportedFormats === 'function') {
              const supported: string[] = await Detector.getSupportedFormats();
              // keep only supported ones
              formats = desired.filter(f => supported.includes(f));
              if (!formats.length) formats = supported; // fallback to all supported
            }
          } catch (e) {
            // ignore capabilities check errors
          }
          const detector = new Detector({ formats });
          const loop = async () => {
            if (!scanningRef.current) return;
            try {
              if (!videoRef.current) return;
              const video = videoRef.current;
              const vw = video.videoWidth || video.clientWidth;
              const vh = video.videoHeight || video.clientHeight;
              if (!vw || !vh) { requestAnimationFrame(loop); return; }
              // crop center area (adjust ratios as needed)
              const cropW = Math.max(64, Math.floor(vw * 0.7));
              const cropH = Math.max(64, Math.floor(vh * 0.25));
              const sx = Math.floor((vw - cropW) / 2);
              const sy = Math.floor((vh - cropH) / 2);
              let bitmap: ImageBitmap | null = null;
              try {
                bitmap = await createImageBitmap(video as any, sx, sy, cropW, cropH);
              } catch (e) {
                // fallback: try detect on whole video
              }
              const target = bitmap || videoRef.current;
              const detections = await detector.detect(target as any);
              if (detections && detections.length) {
                const val = detections[0].rawValue || detections[0].raw?.value || '';
                await handleDetected(val);
                setSuccessMessage('Detectado');
                setTimeout(() => setSuccessMessage(null), 1400);
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
        // Prefer EAN/UPC and Code128
        const formats = [
          (ZXing as any).BarcodeFormat?.EAN_13,
          (ZXing as any).BarcodeFormat?.EAN_8,
          (ZXing as any).BarcodeFormat?.UPC_A,
          (ZXing as any).BarcodeFormat?.UPC_E,
          (ZXing as any).BarcodeFormat?.CODE_128,
        ].filter(Boolean);
        let codeReader: any;
        try {
          const hints = new Map();
          if ((ZXing as any).DecodeHintType && formats.length) {
            hints.set((ZXing as any).DecodeHintType.POSSIBLE_FORMATS, formats);
          }
          codeReader = new (ZXing as any).BrowserMultiFormatReader(hints);
        } catch {
          codeReader = new (ZXing as any).BrowserMultiFormatReader();
        }
        currentReaderRef.current = codeReader;
        // Try periodic decode from cropped canvas to improve detection on mobile
        const tryLoop = async () => {
          if (!scanningRef.current) return;
          try {
            const video = videoRef.current;
            if (!video) { setTimeout(tryLoop, 200); return; }
            const vw = video.videoWidth || video.clientWidth;
            const vh = video.videoHeight || video.clientHeight;
            if (!vw || !vh) { setTimeout(tryLoop, 200); return; }
            const cropW = Math.max(64, Math.floor(vw * 0.7));
            const cropH = Math.max(64, Math.floor(vh * 0.25));
            const sx = Math.floor((vw - cropW) / 2);
            const sy = Math.floor((vh - cropH) / 2);
            // draw to canvas
            const canvas = document.createElement('canvas');
            canvas.width = cropW; canvas.height = cropH;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(video as any, sx, sy, cropW, cropH, 0, 0, cropW, cropH);
              // try decode from image element
              try {
                const img = new Image();
                img.src = canvas.toDataURL('image/png');
                img.onload = async () => {
                  try {
                    if (typeof codeReader.decodeFromImageElement === 'function') {
                      const result = await (codeReader as any).decodeFromImageElement(img);
                      if (result) {
                        await handleDetected(result.getText());
                        setSuccessMessage('Detectado');
                        setTimeout(() => setSuccessMessage(null), 1400);
                        await stopScanner();
                        return;
                      }
                    }
                  } catch (e) {
                    // decoding failed, ignore
                  }
                };
              } catch (e) {
                // ignore image decode errors
              }
            }
          } catch (e) {
            console.debug('ZXing periodic decode error', e);
          }
          setTimeout(tryLoop, 220);
        };
        tryLoop();
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

  const toggleTorch = async () => {
    try {
      const stream = videoRef.current?.srcObject as MediaStream | undefined;
      if (!stream) { setMessage('Cámara no activa'); setTimeout(() => setMessage(null), 1500); return; }
      const track = stream.getVideoTracks()[0];
      if (!track) { setMessage('No hay track de vídeo'); setTimeout(() => setMessage(null), 1500); return; }
      const capabilities: any = track.getCapabilities ? track.getCapabilities() : {};
      if (!capabilities.torch) {
        setMessage('Linterna no soportada en este dispositivo');
        setTimeout(() => setMessage(null), 1500);
        return;
      }
      await track.applyConstraints({ advanced: [{ torch: !torchOn }] });
      setTorchOn(prev => !prev);
    } catch (err) {
      console.warn('toggleTorch error', err);
      setMessage('Error al alternar linterna');
      setTimeout(() => setMessage(null), 1500);
    }
  };

  const printSelected = async () => {
    if (!selectedIds || selectedIds.length === 0) {
      alert('No hay muestras seleccionadas para imprimir');
      return;
    }
    const sel = samples.filter(s => selectedIds.includes(String(s.id)));
    if (!sel.length) { alert('No se encontraron muestras seleccionadas'); return; }
    // generate SVGs locally using jsbarcode and layout 5 per line (barcode + text below)
    try {
      const mod = await import('jsbarcode');
      const JsBarcode = (mod as any).default || mod;
      const pieces: string[] = [];
      for (const s of sel) {
        const raw = (s.codigobarras || s.codigo?.toString() || '').toString().replace(/\D/g, '');
        const v = raw ? raw.padStart(13, '0').slice(-13) : '';
        const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        try { JsBarcode(svgEl as any, v, { format: 'EAN13', displayValue: false, height: 90, width: 2 }); } catch (e) { console.warn('JsBarcode render failed', e); }
        // wrap svg + text in container
        pieces.push(`<div class="barcode-item">${svgEl.outerHTML}<div class="code-text">${v}</div></div>`);
      }

      const html = `<!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Imprimir EAN13</title>
          <style>
            @page { size: auto; margin: 10mm; }
            body { margin:0; padding:8mm; font-family: Arial, Helvetica, sans-serif; }
            .grid { display:flex; flex-wrap:wrap; gap:8px; }
            .barcode-item { box-sizing:border-box; width:calc(20% - 8px); display:flex; flex-direction:column; align-items:center; justify-content:center; padding:4px; }
            .barcode-item svg { width:100%; height:auto; max-height:120px; }
            .code-text { font-family: monospace; font-size: 16px; font-weight: bold; margin-top: 6px; text-align: center; }
            @media print {
              body { padding:0; }
              .barcode-item { padding:2mm; }
            }
          </style>
        </head>
        <body>
          <div class="grid">
            ${pieces.join('\n')}
          </div>
        </body>
      </html>`;

      const w = window.open('', '_blank');
      if (!w) { alert('No se pudo abrir ventana de impresión (popups bloqueados?)'); return; }
      w.document.open();
      w.document.write(html);
      w.document.close();
      setSuccessMessage('Preparando impresión');
      setTimeout(() => setSuccessMessage(null), 1500);
      setTimeout(() => { try { w.print(); } catch(e) { /* ignore */ } }, 400);
    } catch (e) {
      console.error('Error generando SVGs localmente', e);
      alert('Error generando códigos para impresión');
    }
  };

  return (
    <div>
      <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 mb-4">
        <div className="flex flex-col gap-3">
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
            <span className="text-sm font-medium text-gray-700">Filtrar fechas:</span>
            <label className="text-xs text-gray-500">Desde</label>
            <input type="datetime-local" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="border px-2 py-1 rounded text-sm" />
            <label className="text-xs text-gray-500">Hasta</label>
            <input type="datetime-local" value={dateTo} onChange={e => setDateTo(e.target.value)} className="border px-2 py-1 rounded text-sm" />
            <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="text-sm text-gray-500 px-2">Limpiar</button>
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
              onClick={() => { printSelected(); }}
            >
              Imprimir EAN13
            </button>
            <button
              className="px-3 py-2 rounded-lg text-sm bg-red-600 text-white"
              title="Exportar a PDF"
              onClick={() => { printSelected(); }}
            >
              PDF
            </button>
            <button
              onClick={() => setShowOnlyRecibidos(prev => !prev)}
              className={`px-3 py-2 rounded-lg text-sm ${showOnlyRecibidos ? 'bg-green-600 text-white' : 'bg-white border border-gray-200'}`}
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
                <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider w-[5ch]">
                  <button onClick={() => { if (sortBy === 'codigo') setSortDir(prev => prev === 'asc' ? 'desc' : 'asc'); else { setSortBy('codigo'); setSortDir('asc'); } }} className="flex items-center gap-1">
                    Cód {sortBy === 'codigo' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                  </button>
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider">
                  <button onClick={() => { if (sortBy === 'nombre') setSortDir(prev => prev === 'asc' ? 'desc' : 'asc'); else { setSortBy('nombre'); setSortDir('asc'); } }} className="flex items-center gap-1">Nombre {sortBy === 'nombre' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</button>
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider">Código Barras (EAN13)</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider">
                  <button onClick={() => { if (sortBy === 'fecha') setSortDir(prev => prev === 'asc' ? 'desc' : 'asc'); else { setSortBy('fecha'); setSortDir('desc'); } }} className="flex items-center gap-1">Fecha recepción {sortBy === 'fecha' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</button>
                </th>
                <th className="px-3 py-2 text-center text-xs font-medium text-white uppercase tracking-wider">
                  <button onClick={() => { if (sortBy === 'recibida') setSortDir(prev => prev === 'asc' ? 'desc' : 'asc'); else { setSortBy('recibida'); setSortDir('desc'); } }} className="flex items-center gap-1">Recibida {sortBy === 'recibida' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</button>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {loading ? (
                <tr><td colSpan={6} className="p-6 text-center text-gray-500">Cargando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="p-6 text-center text-gray-500">No se encontraron muestras</td></tr>
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
                    <td className="px-3 py-2 font-mono text-base font-bold w-[7ch] truncate">{s.codigotexto || s.codigo?.toString() || '-'}</td>
                    <td className="px-3 py-2 text-sm">
                      <div className="font-medium text-base">{s.nombre}</div>
                      <div className="text-xs text-gray-500 mt-1">{s.empresa_nombre || '-'}</div>
                    </td>
                    <td className="px-3 py-2 text-sm">
                      {(() => {
                        const raw = (s.codigobarras || s.codigo?.toString() || '').toString().replace(/\D/g, '');
                        if (!raw) return <span className="text-gray-400">-</span>;
                        return (
                          <div className="flex items-center gap-3">
                            <div className="w-56">
                              <Barcode value={raw} height={80} width={2} />
                            </div>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      {(s as any).recibida ? formatDate((s as any).recibida_at) : '-'}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={Boolean((s as any).recibida)}
                        onChange={async (e) => {
                          const newVal = e.target.checked;
                          try {
                            await supabase.from('muestras').update({ recibida: newVal, recibida_at: newVal ? localIsoWithOffset() : null }).eq('id', s.id);
                            // optimistic update in local state
                            setSamples(prev => prev.map(p => p.id === s.id ? ({ ...p, recibida: newVal }) as Sample : p));
                            setFiltered(prev => prev.map(p => p.id === s.id ? ({ ...p, recibida: newVal }) as Sample : p));
                            setSuccessMessage(newVal ? 'Marcada recibida' : 'Marcada no recibida');
                            setTimeout(() => setSuccessMessage(null), 1200);
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

            {/* Guide box in center to help user position the EAN */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="w-11/12 sm:w-3/4 md:w-2/3 lg:w-1/2 h-40 sm:h-56 border-2 border-white border-dashed rounded-md" />
            </div>

            <div className="absolute top-3 left-3 bg-white/20 backdrop-blur rounded px-3 py-1 text-sm text-white">
              {message ?? 'Escaneando...'}
            </div>

            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              <button
                onClick={() => toggleTorch()}
                className="bg-white bg-opacity-90 text-gray-900 rounded px-3 py-1 text-sm shadow"
                aria-label="Alternar linterna"
              >
                {torchOn ? 'Linterna ON' : 'Linterna OFF'}
              </button>
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
      {/* Success / feedback badge */}
      {successMessage && (
        <div className="fixed top-6 right-6 z-60">
          <div className="bg-green-500 text-white px-3 py-2 rounded shadow">{successMessage}</div>
        </div>
      )}
    </div>
  );
}
