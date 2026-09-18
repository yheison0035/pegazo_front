'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import RoleGuard from '@/auth/roleGuard';
import Button from '@/components/ui/Button';
import { useToast } from '@/context/toastContext';
import {
  getBookingPageConfig,
  updateBookingPageConfig,
} from '@/lib/api/routes/company';
import { uploadCompanyLogo } from '@/lib/api/routes/companies';
import {
  PaintBrushIcon,
  ArrowTopRightOnSquareIcon,
  PhotoIcon,
  XMarkIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

const SKINS = [
  {
    value: 'dark',
    label: 'Premium oscuro (guerrero)',
    desc: 'Negro + dorado, portada con imagen, animado. Ideal barbería/gym.',
  },
  {
    value: 'light',
    label: 'Claro suave',
    desc: 'Fondo claro y aireado. Ideal spa, estética, salud.',
  },
  { value: 'classic', label: 'Clásico neutro', desc: 'Neutro para cualquier negocio.' },
];

function DesignInner() {
  const toast = useToast();
  const fileRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingRaven, setUploadingRaven] = useState(false);
  const ravenRef = useRef(null);
  const [slug, setSlug] = useState(null);
  const [defaultAccent, setDefaultAccent] = useState('#d4af37');
  const [form, setForm] = useState({
    skin: 'dark',
    accent: '',
    tagline: '',
    subtitle: '',
    whatsapp: '',
    introCta: '',
    introPills: '',
    heroImage: '',
    ravenImage: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getBookingPageConfig();
      setSlug(data?.slug || null);
      setDefaultAccent(data?.defaultAccent || '#d4af37');
      setForm({
        skin: data?.skin || 'dark',
        accent: data?.accent || '',
        tagline: data?.tagline || '',
        subtitle: data?.subtitle || '',
        whatsapp: data?.whatsapp || data?.phone || '',
        introCta: data?.introCta || '',
        introPills: data?.introPills || '',
        heroImage: data?.heroImage || '',
        ravenImage: data?.ravenImage || '',
      });
    } catch (e) {
      toast.show({ type: 'error', message: e.message || 'Error al cargar' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const makeUpload = (field, setFlag, ref) => async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFlag(true);
    try {
      const { data } = await uploadCompanyLogo(file);
      if (data?.url) setForm((f) => ({ ...f, [field]: data.url }));
    } catch (err) {
      toast.show({ type: 'error', message: err.message || 'No se pudo subir' });
    } finally {
      setFlag(false);
      if (ref.current) ref.current.value = '';
    }
  };
  const onUpload = makeUpload('heroImage', setUploading, fileRef);
  const onUploadRaven = makeUpload('ravenImage', setUploadingRaven, ravenRef);

  const save = async () => {
    setSaving(true);
    try {
      await updateBookingPageConfig(form);
      toast.show({ type: 'success', message: 'Diseño de la página guardado.' });
    } catch (e) {
      toast.show({ type: 'error', message: e.message || 'No se pudo guardar' });
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400';
  const labelCls = 'mb-1 block text-xs font-semibold text-gray-600';
  const dark = form.skin === 'dark';
  const publicUrl = slug ? `https://pegazo.co/booking/${slug}` : null;

  return (
    <div className="mx-auto mt-6 max-w-2xl px-4 pb-16">
      <div className="mb-1 flex items-center gap-2">
        <PaintBrushIcon className="h-7 w-7 text-orange-500" />
        <h1 className="text-2xl font-bold text-gray-800">Diseño de la página de citas</h1>
      </div>
      <p className="mb-5 text-sm text-gray-500">
        Personaliza cómo se ve tu página pública de reservas. Los servicios,
        precios y horarios salen automáticamente de tu CRM.
      </p>

      {publicUrl && (
        <Link
          href={publicUrl}
          target="_blank"
          className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-orange-600 hover:underline"
        >
          <ArrowTopRightOnSquareIcon className="h-4 w-4" /> Ver mi página ({publicUrl})
        </Link>
      )}

      {loading ? (
        <div className="py-16 text-center text-gray-400">Cargando…</div>
      ) : !slug ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          Tu negocio aún no tiene un enlace (slug) para la página de citas.
          Contáctanos para activarlo.
        </div>
      ) : (
        <div className="space-y-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          {/* Estilo */}
          <div>
            <label className={labelCls}>Estilo (skin)</label>
            <div className="grid gap-2 sm:grid-cols-3">
              {SKINS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, skin: s.value }))}
                  className={`rounded-xl border p-3 text-left transition ${
                    form.skin === s.value
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="text-sm font-semibold text-gray-800">{s.label}</p>
                  <p className="mt-0.5 text-[11px] text-gray-500">{s.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Color de acento */}
          <div>
            <label className={labelCls}>Color de acento</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.accent || defaultAccent}
                onChange={set('accent')}
                className="h-10 w-14 cursor-pointer rounded-lg border border-gray-300"
              />
              <input
                type="text"
                value={form.accent}
                onChange={set('accent')}
                placeholder={`${defaultAccent} (color de tu marca)`}
                className={inputCls}
              />
              {form.accent && (
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, accent: '' }))}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Título (tagline)</label>
              <input
                value={form.tagline}
                onChange={set('tagline')}
                placeholder="Agenda tu cita"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Subtítulo</label>
              <input
                value={form.subtitle}
                onChange={set('subtitle')}
                placeholder="Más que un corte, es actitud"
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>WhatsApp para reservas</label>
            <input
              value={form.whatsapp}
              onChange={set('whatsapp')}
              placeholder="573001234567 (con indicativo del país)"
              className={inputCls}
            />
          </div>

          {/* Solo skin oscuro: portada */}
          {dark && (
            <div className="space-y-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Portada (solo estilo oscuro)
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Botón de entrada</label>
                  <input
                    value={form.introCta}
                    onChange={set('introCta')}
                    placeholder="Comienza tu leyenda"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Etiquetas (separadas por ·)</label>
                  <input
                    value={form.introPills}
                    onChange={set('introPills')}
                    placeholder="Disciplina · Estilo · Actitud"
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Imagen de fondo de la portada</label>
                {form.heroImage ? (
                  <div className="relative inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={form.heroImage}
                      alt="Portada"
                      className="h-28 w-48 rounded-lg border border-gray-200 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, heroImage: '' }))}
                      className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white shadow"
                      title="Quitar imagen"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="flex h-28 w-48 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-gray-300 text-gray-400 hover:border-orange-400 hover:text-orange-500 disabled:opacity-50"
                  >
                    <PhotoIcon className="h-7 w-7" />
                    <span className="text-xs">
                      {uploading ? 'Subiendo…' : 'Subir imagen'}
                    </span>
                  </button>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onUpload}
                />
                <p className="mt-1 text-[11px] text-gray-400">
                  Recomendado: foto vertical/temática (ej. el arte de tu marca).
                  Se oscurece automáticamente para que se lea el logo y el texto.
                </p>
              </div>

              <div>
                <label className={labelCls}>Cuervo decorativo (PNG con fondo transparente)</label>
                {form.ravenImage ? (
                  <div className="relative inline-block rounded-lg bg-gray-800 p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={form.ravenImage}
                      alt="Cuervo"
                      className="h-24 w-40 object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, ravenImage: '' }))}
                      className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white shadow"
                      title="Quitar cuervo"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => ravenRef.current?.click()}
                    disabled={uploadingRaven}
                    className="flex h-24 w-40 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-gray-300 text-gray-400 hover:border-orange-400 hover:text-orange-500 disabled:opacity-50"
                  >
                    <PhotoIcon className="h-6 w-6" />
                    <span className="text-xs">
                      {uploadingRaven ? 'Subiendo…' : 'Subir cuervo'}
                    </span>
                  </button>
                )}
                <input
                  ref={ravenRef}
                  type="file"
                  accept="image/png,image/webp"
                  className="hidden"
                  onChange={onUploadRaven}
                />
                <p className="mt-1 text-[11px] text-gray-400">
                  Se muestra flanqueando la portada (arriba a los lados). Usa un
                  PNG recortado con fondo transparente.
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
            <Button variant="primary" icon={CheckCircleIcon} onClick={save} loading={saving}>
              Guardar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BookingDesignPage() {
  return (
    <RoleGuard allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
      <DesignInner />
    </RoleGuard>
  );
}
