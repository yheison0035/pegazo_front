'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  GlobeAltIcon,
  ClipboardDocumentIcon,
  ArrowTopRightOnSquareIcon,
  CheckIcon,
  PhotoIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import RoleGuard from '@/auth/roleGuard';
import { Roles } from '@/config/roles';
import Button from '@/components/ui/Button';
import AlertModal from '@/components/dashboard/modals/alertModal';
import {
  getBookingPageConfig,
  updateBookingPageConfig,
} from '@/lib/api/routes/company';
import { uploadCompanyLogo } from '@/lib/api/routes/companies';
import BrandFields from '@/components/public-page/BrandFields';

// Temas visuales del catálogo/menú público. Deben coincidir con las claves de
// CATALOG_THEMES de PublicCatalog.js (el backend valida este mismo conjunto).
const THEME_OPTIONS = [
  {
    key: 'clean',
    label: 'Claro profesional',
    desc: 'Blanco y aireado. Para cualquier negocio.',
    accent: '#ea580c',
    bg: '#f7f7f8',
    surface: '#ffffff',
    text: '#111827',
  },
  {
    key: 'dark',
    label: 'Elegante oscuro',
    desc: 'Negro premium. Joyería, tecnología, moda.',
    accent: '#d4af37',
    bg: '#0d0d12',
    surface: '#16161d',
    text: '#f5f5f7',
  },
  {
    key: 'warm',
    label: 'Cálido gourmet',
    desc: 'Crema y terracota. Restaurante, cafetería.',
    accent: '#b45309',
    bg: '#fbf7f1',
    surface: '#ffffff',
    text: '#2a1f1a',
  },
  {
    key: 'fresh',
    label: 'Fresco natural',
    desc: 'Verde suave. Supermercado, saludable.',
    accent: '#16a34a',
    bg: '#f3f8f4',
    surface: '#ffffff',
    text: '#14291d',
  },
  {
    key: 'bold',
    label: 'Moderno vibrante',
    desc: 'Azul profundo y contraste. Tecnología, deporte.',
    accent: '#6366f1',
    bg: '#0f172a',
    surface: '#1e293b',
    text: '#f1f5f9',
  },
];

export default function CatalogWebPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [alert, setAlert] = useState({});
  const [copied, setCopied] = useState(false);
  const [data, setData] = useState(null);
  const fileRef = useRef(null);
  const [form, setForm] = useState({
    slug: '',
    tagline: '',
    subtitle: '',
    accent: '',
    whatsapp: '',
    catalogTheme: 'clean',
    heroImage: '',
  });

  const load = useCallback(async () => {
    try {
      const res = await getBookingPageConfig();
      const d = res?.data || {};
      setData(d);
      setForm({
        slug: d.slug || '',
        tagline: d.tagline || '',
        subtitle: d.subtitle || '',
        accent: d.accent || d.defaultAccent || '',
        whatsapp: d.whatsapp || d.phone || '',
        catalogTheme: d.catalogTheme || 'clean',
        heroImage: d.heroImage || '',
      });
    } catch (e) {
      setAlert({ type: 'error', message: e?.message || 'No se pudo cargar.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const basePath = data?.publicPath || 'catalog';
  const publicUrl = data?.slug
    ? `https://pegazo.co/${basePath}/${data.slug}`
    : null;
  const qrUrl = publicUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
        publicUrl,
      )}`
    : null;

  const theme =
    THEME_OPTIONS.find((t) => t.key === form.catalogTheme) || THEME_OPTIONS[0];
  const previewAccent = form.accent || theme.accent;

  const save = async () => {
    setSaving(true);
    try {
      const res = await updateBookingPageConfig({
        slug: form.slug,
        tagline: form.tagline,
        subtitle: form.subtitle,
        accent: form.accent,
        whatsapp: form.whatsapp.replace(/\D/g, ''),
        catalogTheme: form.catalogTheme,
        heroImage: form.heroImage,
      });
      setData(res?.data || null);
      setAlert({ type: 'success', message: 'Catálogo web actualizado.' });
    } catch (e) {
      setAlert({ type: 'error', message: e?.message || 'No se pudo guardar.' });
    } finally {
      setSaving(false);
    }
  };

  const onUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { data: up } = await uploadCompanyLogo(file);
      if (up?.url) setForm((f) => ({ ...f, heroImage: up.url }));
    } catch (err) {
      setAlert({ type: 'error', message: err?.message || 'No se pudo subir.' });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const copy = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* noop */
    }
  };

  return (
    <RoleGuard allowedRoles={[Roles.SUPER_ADMIN, Roles.ADMIN]}>
      <div className="w-full max-w-5xl p-4">
        <h1 className="flex items-center gap-2 text-xl font-semibold text-gray-800 sm:text-2xl">
          <GlobeAltIcon className="h-6 w-6 text-orange-500" />
          Catálogo web
        </h1>
        <p className="mb-5 mt-1 text-sm text-gray-500">
          Una página pública para <b>mostrar o enviar tu catálogo</b> a los
          clientes (solo visualización, sin pedidos). El contenido sale de tu{' '}
          <Link
            href="/dashboard/inventory"
            className="font-semibold text-orange-600 hover:underline"
          >
            Inventario
          </Link>{' '}
          y{' '}
          <Link
            href="/dashboard/categories"
            className="font-semibold text-orange-600 hover:underline"
          >
            Categorías
          </Link>
          . Aquí personalizas cómo se ve.
        </p>

        {loading ? (
          <p className="py-12 text-center text-sm text-gray-400">Cargando…</p>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
            {/* Columna de edición */}
            <div className="space-y-5">
              {data?.enabled === false && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Tu página pública está <b>desactivada por la plataforma</b>.
                  Aunque configures el enlace, no será visible hasta que la
                  reactiven.
                </div>
              )}

              {/* Enlace público */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="mb-1 text-sm font-bold text-gray-800">
                  Tu enlace público
                </p>
                <p className="mb-3 text-xs text-gray-500">
                  Elige el nombre del enlace (solo letras, números y guiones).
                </p>
                <div className="flex items-stretch overflow-hidden rounded-xl border border-gray-200">
                  <span className="flex items-center bg-gray-50 px-3 text-xs text-gray-400">
                    pegazo.co/{basePath}/
                  </span>
                  <input
                    value={form.slug}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        slug: e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-]/g, ''),
                      }))
                    }
                    placeholder="mi-negocio"
                    className="flex-1 px-3 py-2 text-sm focus:outline-none"
                  />
                </div>

                {publicUrl && (
                  <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
                    {qrUrl && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={qrUrl}
                        alt="QR del catálogo"
                        className="h-28 w-28 flex-none rounded-xl border border-gray-100"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate rounded-lg bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700">
                        {publicUrl}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          onClick={copy}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                        >
                          {copied ? (
                            <>
                              <CheckIcon className="h-4 w-4 text-emerald-600" />{' '}
                              Copiado
                            </>
                          ) : (
                            <>
                              <ClipboardDocumentIcon className="h-4 w-4" />{' '}
                              Copiar
                            </>
                          )}
                        </button>
                        <a
                          href={publicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-3 py-2 text-sm font-bold text-white hover:bg-orange-700"
                        >
                          <ArrowTopRightOnSquareIcon className="h-4 w-4" /> Abrir
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Tema visual */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="mb-1 text-sm font-bold text-gray-800">
                  Tema visual
                </p>
                <p className="mb-3 text-xs text-gray-500">
                  Elige el estilo que mejor represente tu marca.
                </p>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {THEME_OPTIONS.map((t) => {
                    const selected = form.catalogTheme === t.key;
                    return (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() =>
                          setForm((f) => ({ ...f, catalogTheme: t.key }))
                        }
                        className={`overflow-hidden rounded-xl border text-left transition ${
                          selected
                            ? 'border-orange-500 ring-2 ring-orange-500/25'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {/* Mini muestra de colores */}
                        <div
                          className="flex h-12 items-center gap-1.5 px-3"
                          style={{ backgroundColor: t.bg }}
                        >
                          <span
                            className="h-5 w-5 rounded-full border border-black/10"
                            style={{ backgroundColor: t.surface }}
                          />
                          <span
                            className="h-5 w-5 rounded-full"
                            style={{ backgroundColor: t.accent }}
                          />
                          <span
                            className="ml-auto text-[10px] font-bold"
                            style={{ color: t.text }}
                          >
                            Aa
                          </span>
                        </div>
                        <div className="p-2.5">
                          <p className="flex items-center gap-1 text-xs font-semibold text-gray-800">
                            {t.label}
                            {selected && (
                              <CheckIcon className="h-3.5 w-3.5 text-orange-600" />
                            )}
                          </p>
                          <p className="mt-0.5 text-[10px] leading-tight text-gray-500">
                            {t.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Portada + marca */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="mb-3 text-sm font-bold text-gray-800">
                  Portada y marca
                </p>

                {/* Imagen de fondo */}
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  Imagen de fondo de la portada (opcional)
                </label>
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
                      onClick={() =>
                        setForm((f) => ({ ...f, heroImage: '' }))
                      }
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
                <p className="mt-1 mb-4 text-[11px] text-gray-400">
                  Se muestra como fondo de la bienvenida (se oscurece para que se
                  lea el logo y el texto). Si la dejas vacía, usamos un degradado
                  con tu color principal.
                </p>

                {/* Marca y datos (mismo componente que la página de citas) */}
                <BrandFields
                  form={form}
                  setForm={setForm}
                  accentFallback={theme.accent}
                  taglinePlaceholder="Ej: Los mejores precios de la ciudad"
                  whatsappPlaceholder="573001112233"
                />
                <p className="mt-3 text-[11px] text-gray-400">
                  El logo es el de tu negocio (Configuración). Las fotos, precios
                  y categorías de los productos se gestionan en Inventario.
                </p>
              </div>

              <div className="flex justify-end">
                <Button variant="primary" onClick={save} loading={saving}>
                  Guardar
                </Button>
              </div>
            </div>

            {/* Vista previa en vivo */}
            <div className="lg:sticky lg:top-4 lg:self-start">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Vista previa
              </p>
              <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
                {/* Portada */}
                <div
                  className="relative flex h-44 flex-col items-center justify-center px-4 text-center"
                  style={
                    form.heroImage
                      ? {
                          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,.55), rgba(5,5,8,.82)), url(${form.heroImage})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }
                      : {
                          background: `radial-gradient(600px 300px at 50% -10%, ${previewAccent}40, ${theme.bg} 60%)`,
                        }
                  }
                >
                  <p
                    className="text-[9px] font-semibold uppercase tracking-[0.25em]"
                    style={{
                      color: form.heroImage
                        ? 'rgba(255,255,255,.6)'
                        : theme.text,
                      opacity: form.heroImage ? 1 : 0.5,
                    }}
                  >
                    Bienvenido a
                  </p>
                  <p
                    className="mt-0.5 text-lg font-extrabold"
                    style={{
                      color: form.heroImage ? '#fff' : theme.text,
                    }}
                  >
                    {data?.name || 'Tu negocio'}
                  </p>
                  {form.tagline && (
                    <p
                      className="mt-1 text-[10px]"
                      style={{
                        color: form.heroImage
                          ? 'rgba(255,255,255,.7)'
                          : theme.text,
                        opacity: form.heroImage ? 1 : 0.6,
                      }}
                    >
                      {form.tagline}
                    </p>
                  )}
                  <span
                    className="mt-3 rounded-full px-4 py-1.5 text-[10px] font-bold text-white"
                    style={{ backgroundColor: previewAccent }}
                  >
                    Ver el catálogo
                  </span>
                </div>
                {/* Cuerpo */}
                <div
                  className="space-y-2 p-3"
                  style={{ backgroundColor: theme.bg }}
                >
                  <div className="flex gap-1.5">
                    {['Todos', 'Destacados', 'Nuevos'].map((c, i) => (
                      <span
                        key={c}
                        className="rounded-full px-2 py-0.5 text-[9px] font-semibold"
                        style={
                          i === 0
                            ? { backgroundColor: previewAccent, color: '#fff' }
                            : {
                                backgroundColor: theme.surface,
                                color: theme.text,
                                opacity: 0.75,
                              }
                        }
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[0, 1].map((i) => (
                      <div
                        key={i}
                        className="overflow-hidden rounded-lg"
                        style={{ backgroundColor: theme.surface }}
                      >
                        <div
                          className="flex h-14 items-center justify-center text-lg"
                          style={{ backgroundColor: theme.bg }}
                        >
                          🛍️
                        </div>
                        <div className="p-1.5">
                          <p
                            className="text-[9px] font-semibold"
                            style={{ color: theme.text }}
                          >
                            Producto {i + 1}
                          </p>
                          <p
                            className="text-[10px] font-extrabold"
                            style={{ color: previewAccent }}
                          >
                            $ 45.000
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <p className="mt-2 text-[11px] text-gray-400">
                Así se verá al abrir tu enlace. Guarda para aplicar los cambios.
              </p>
            </div>
          </div>
        )}

        <AlertModal
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({})}
        />
      </div>
    </RoleGuard>
  );
}
