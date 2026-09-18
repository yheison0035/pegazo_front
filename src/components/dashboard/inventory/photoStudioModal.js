'use client';

// Estudio de foto dentro del producto.
//
// El dueño entra al producto, toma la foto con el celular (o elige de galería),
// la recuadra sobre un fondo limpio con el color de su marca, la mejora y —si
// quiere— le quita el fondo con IA (todo en el navegador, GRATIS, sin backend).
// El resultado sale cuadrado "tipo tienda online" y se agrega a las imágenes
// del producto como un archivo más (mismo flujo de subida que ya existe).

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  XMarkIcon,
  CameraIcon,
  PhotoIcon,
  ArrowPathIcon,
  ArrowUturnLeftIcon,
  SparklesIcon,
  ArrowsPointingOutIcon,
  ScissorsIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { useToast } from '@/context/toastContext';
import { getWebsiteConfig } from '@/lib/api/routes/website';
import {
  loadImage,
  renderScene,
  canvasToBlob,
  DEFAULT_ADJUST,
  AUTO_ADJUST,
} from '@/lib/imaging/photoStudio';

const EXPORT_SIZE = 1200;
const PREVIEW_SIZE = 900;

// Fondos rápidos. El primero (color de marca) se inyecta al abrir.
const BASE_SWATCHES = ['#ffffff', '#f3f4f6', '#111827'];

export default function PhotoStudioModal({ open, onClose, onResult }) {
  const toast = useToast();
  const canvasRef = useRef(null);
  const dragRef = useRef(null);

  const [step, setStep] = useState('capture'); // 'capture' | 'edit'
  const [srcImg, setSrcImg] = useState(null); // HTMLImageElement en uso
  const [origBlob, setOrigBlob] = useState(null); // original (para restaurar)
  const [origImg, setOrigImg] = useState(null); // original decodificado

  const [bg, setBg] = useState('#ffffff');
  const [brandColor, setBrandColor] = useState('');
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [adjust, setAdjust] = useState(DEFAULT_ADJUST);
  const [showAdjust, setShowAdjust] = useState(false);

  const [logoImg, setLogoImg] = useState(null);
  const [useLogo, setUseLogo] = useState(false);

  const [bgRemoved, setBgRemoved] = useState(false);
  const [removingBg, setRemovingBg] = useState(false);
  const [saving, setSaving] = useState(false);

  // Cargar color de marca + logo de la tienda una sola vez al abrir.
  useEffect(() => {
    if (!open) return;
    let alive = true;
    (async () => {
      try {
        const cfg = await getWebsiteConfig();
        if (!alive) return;
        const color = cfg?.primaryColor || '';
        if (color) {
          setBrandColor(color);
          setBg(color);
        }
        if (cfg?.logo) {
          loadImage(cfg.logo)
            .then((img) => alive && setLogoImg(img))
            .catch(() => {});
        }
      } catch {
        /* sin config de tienda: seguimos con blanco */
      }
    })();
    return () => {
      alive = false;
    };
  }, [open]);

  // Bloquear scroll de fondo con el modal abierto.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Reset al cerrar.
  useEffect(() => {
    if (open) return;
    setStep('capture');
    setSrcImg(null);
    setOrigBlob(null);
    setOrigImg(null);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setRotation(0);
    setAdjust(DEFAULT_ADJUST);
    setShowAdjust(false);
    setUseLogo(false);
    setBgRemoved(false);
    setRemovingBg(false);
    setSaving(false);
  }, [open]);

  // Redibujar la previsualización ante cualquier cambio.
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !srcImg) return;
    renderScene(canvas, {
      image: srcImg,
      size: PREVIEW_SIZE,
      bg,
      zoom,
      offsetX: offset.x,
      offsetY: offset.y,
      rotation,
      adjust,
      logo: useLogo ? logoImg : null,
    });
  }, [srcImg, bg, zoom, offset, rotation, adjust, useLogo, logoImg]);

  useEffect(() => {
    draw();
  }, [draw]);

  const openFile = async (file) => {
    if (!file) return;
    try {
      const img = await loadImage(file);
      setOrigBlob(file);
      setOrigImg(img);
      setSrcImg(img);
      setBgRemoved(false);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      setRotation(0);
      setStep('edit');
    } catch {
      toast.show({ type: 'error', message: 'No se pudo abrir la imagen.' });
    }
  };

  // --- Arrastrar para reposicionar (mouse y táctil) ---
  const onPointerDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      baseX: offset.x,
      baseY: offset.y,
      w: rect.width,
      h: rect.height,
    };
    canvasRef.current.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    setOffset({
      x: d.baseX + (e.clientX - d.startX) / d.w,
      y: d.baseY + (e.clientY - d.startY) / d.h,
    });
  };
  const onPointerUp = (e) => {
    dragRef.current = null;
    canvasRef.current?.releasePointerCapture?.(e.pointerId);
  };

  const resetFrame = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setRotation(0);
  };

  const autoEnhance = () => {
    const isAuto =
      adjust.brightness === AUTO_ADJUST.brightness &&
      adjust.contrast === AUTO_ADJUST.contrast &&
      adjust.saturation === AUTO_ADJUST.saturation;
    setAdjust(isAuto ? DEFAULT_ADJUST : AUTO_ADJUST);
  };

  const removeBg = async () => {
    if (!origBlob) return;
    setRemovingBg(true);
    try {
      const { removeBackground } = await import('@imgly/background-removal');
      const blob = await removeBackground(origBlob, {
        output: { format: 'image/png' },
      });
      const img = await loadImage(blob);
      setSrcImg(img);
      setBgRemoved(true);
      toast.show({ type: 'success', message: 'Fondo eliminado.' });
    } catch (e) {
      toast.show({
        type: 'error',
        message:
          'No se pudo quitar el fondo. ' + String(e?.message || '').slice(0, 120),
      });
    } finally {
      setRemovingBg(false);
    }
  };

  const restoreBg = () => {
    if (origImg) setSrcImg(origImg);
    setBgRemoved(false);
  };

  const save = async () => {
    if (!srcImg) return;
    setSaving(true);
    try {
      // Render final a resolución de exportación en un canvas aparte.
      const out = document.createElement('canvas');
      renderScene(out, {
        image: srcImg,
        size: EXPORT_SIZE,
        bg,
        zoom,
        offsetX: offset.x,
        offsetY: offset.y,
        rotation,
        adjust,
        logo: useLogo ? logoImg : null,
      });
      const { blob, type } = await canvasToBlob(out, 0.9);
      if (!blob) throw new Error('export');
      const ext = type === 'image/webp' ? 'webp' : 'jpg';
      const file = new File([blob], `foto-${Date.now()}.${ext}`, { type });
      onResult?.({ file, url: URL.createObjectURL(blob) });
      onClose?.();
    } catch {
      toast.show({ type: 'error', message: 'No se pudo generar la foto.' });
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const swatches = brandColor
    ? [brandColor, ...BASE_SWATCHES.filter((c) => c !== brandColor.toLowerCase())]
    : BASE_SWATCHES;
  const autoOn =
    adjust.brightness === AUTO_ADJUST.brightness &&
    adjust.contrast === AUTO_ADJUST.contrast &&
    adjust.saturation === AUTO_ADJUST.saturation;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/60 backdrop-blur-sm">
      <div className="flex min-h-full items-center justify-center p-3 sm:p-4">
        <div className="flex max-h-[94vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
          {/* Cabecera */}
          <div className="relative shrink-0 bg-gradient-to-r from-orange-600 to-[#111827] px-5 py-4 text-white">
            <button
              onClick={onClose}
              className="absolute right-3 top-3 rounded-full p-1 text-white/80 transition hover:bg-white/15 hover:text-white"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <CameraIcon className="h-6 w-6" /> Estudio de foto
            </h2>
            <p className="text-xs opacity-80">
              Toma la foto y déjala tipo tienda online: cuadrada, centrada y con
              fondo limpio.
            </p>
          </div>

          {step === 'capture' ? (
            <div className="space-y-3 p-5">
              <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-orange-300 bg-orange-50/60 px-4 py-8 text-center transition hover:border-orange-400 hover:bg-orange-50">
                <CameraIcon className="h-10 w-10 text-orange-500" />
                <span className="text-sm font-semibold text-gray-800">
                  Tomar foto ahora
                </span>
                <span className="text-xs text-gray-500">
                  Abre la cámara de tu celular
                </span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => openFile(e.target.files?.[0])}
                />
              </label>

              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
                <PhotoIcon className="h-5 w-5 text-gray-500" />
                Elegir de la galería
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => openFile(e.target.files?.[0])}
                />
              </label>
            </div>
          ) : (
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
              {/* Lienzo */}
              <div className="relative mx-auto w-full max-w-sm">
                <canvas
                  ref={canvasRef}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerLeave={onPointerUp}
                  className="aspect-square w-full touch-none cursor-move rounded-xl border border-gray-200 shadow-sm"
                  style={{
                    backgroundImage:
                      'linear-gradient(45deg,#eee 25%,transparent 25%),linear-gradient(-45deg,#eee 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#eee 75%),linear-gradient(-45deg,transparent 75%,#eee 75%)',
                    backgroundSize: '20px 20px',
                    backgroundPosition: '0 0,0 10px,10px -10px,-10px 0',
                  }}
                />
                <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white">
                  Arrastra para mover
                </span>
              </div>

              {/* Encuadre */}
              <div className="flex items-center gap-3">
                <ArrowsPointingOutIcon className="h-5 w-5 shrink-0 text-gray-400" />
                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.01"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="h-1.5 w-full accent-orange-500"
                />
                <button
                  type="button"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  title="Rotar"
                  className="shrink-0 rounded-lg border border-gray-300 p-1.5 text-gray-600 hover:bg-gray-50"
                >
                  <ArrowPathIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={resetFrame}
                  title="Centrar"
                  className="shrink-0 rounded-lg border border-gray-300 px-2 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                >
                  Centrar
                </button>
              </div>

              {/* Fondo */}
              <div>
                <p className="mb-1.5 text-xs font-semibold text-gray-600">Fondo</p>
                <div className="flex items-center gap-2">
                  {swatches.map((c, i) => (
                    <button
                      key={c + i}
                      type="button"
                      onClick={() => setBg(c)}
                      className={`h-8 w-8 rounded-full border-2 transition ${
                        bg === c
                          ? 'border-orange-500 ring-2 ring-orange-500/30'
                          : 'border-gray-200'
                      }`}
                      style={{ backgroundColor: c }}
                      title={i === 0 && brandColor ? 'Color de tu tienda' : c}
                    />
                  ))}
                  <label
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-dashed border-gray-300 text-[10px] text-gray-500"
                    title="Otro color"
                  >
                    +
                    <input
                      type="color"
                      value={bg}
                      onChange={(e) => setBg(e.target.value)}
                      className="h-0 w-0 opacity-0"
                    />
                  </label>
                </div>
              </div>

              {/* Acciones IA / ajustes / logo */}
              <div className="flex flex-wrap gap-2">
                {bgRemoved ? (
                  <button
                    type="button"
                    onClick={restoreBg}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    <ArrowUturnLeftIcon className="h-4 w-4" /> Restaurar fondo
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={removeBg}
                    disabled={removingBg}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
                  >
                    <ScissorsIcon className="h-4 w-4" />
                    {removingBg ? 'Quitando fondo…' : 'Quitar fondo (IA)'}
                  </button>
                )}

                <button
                  type="button"
                  onClick={autoEnhance}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                    autoOn
                      ? 'border-orange-400 bg-orange-50 text-orange-600'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <SparklesIcon className="h-4 w-4" /> Mejorar
                </button>

                <button
                  type="button"
                  onClick={() => setShowAdjust((v) => !v)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Ajustes
                </button>

                {logoImg && (
                  <button
                    type="button"
                    onClick={() => setUseLogo((v) => !v)}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                      useLogo
                        ? 'border-orange-400 bg-orange-50 text-orange-600'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Logo
                  </button>
                )}
              </div>

              {removingBg && (
                <p className="rounded-lg bg-indigo-50 px-3 py-2 text-xs text-indigo-700">
                  Procesando en tu dispositivo… la primera vez puede tardar unos
                  segundos mientras se descarga el modelo.
                </p>
              )}

              {/* Sliders de ajuste */}
              {showAdjust && (
                <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
                  {[
                    ['brightness', 'Brillo'],
                    ['contrast', 'Contraste'],
                    ['saturation', 'Saturación'],
                  ].map(([key, label]) => (
                    <div key={key} className="flex items-center gap-3">
                      <span className="w-20 text-xs text-gray-600">{label}</span>
                      <input
                        type="range"
                        min="-50"
                        max="50"
                        step="1"
                        value={adjust[key]}
                        onChange={(e) =>
                          setAdjust((a) => ({
                            ...a,
                            [key]: parseInt(e.target.value, 10),
                          }))
                        }
                        className="h-1.5 w-full accent-orange-500"
                      />
                      <span className="w-8 text-right text-xs tabular-nums text-gray-500">
                        {adjust[key]}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Pie */}
          {step === 'edit' && (
            <div className="flex shrink-0 items-center justify-between gap-3 border-t border-gray-100 bg-white p-4">
              <Button variant="secondary" onClick={() => setStep('capture')}>
                Volver
              </Button>
              <Button
                variant="primary"
                icon={CheckCircleIcon}
                onClick={save}
                loading={saving}
                disabled={saving || removingBg}
              >
                Usar foto
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
