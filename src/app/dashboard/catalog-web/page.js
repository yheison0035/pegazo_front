'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  GlobeAltIcon,
  ClipboardDocumentIcon,
  ArrowTopRightOnSquareIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import RoleGuard from '@/auth/roleGuard';
import { Roles } from '@/config/roles';
import Button from '@/components/ui/Button';
import AlertModal from '@/components/dashboard/modals/alertModal';
import {
  getBookingPageConfig,
  updateBookingPageConfig,
} from '@/lib/api/routes/company';

const inputCls =
  'w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20';

export default function CatalogWebPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState({});
  const [copied, setCopied] = useState(false);
  const [data, setData] = useState(null);
  const [form, setForm] = useState({
    slug: '',
    tagline: '',
    accent: '',
    whatsapp: '',
  });

  const load = useCallback(async () => {
    try {
      const res = await getBookingPageConfig();
      const d = res?.data || {};
      setData(d);
      setForm({
        slug: d.slug || '',
        tagline: d.tagline || '',
        accent: d.accent || d.defaultAccent || '#ea580c',
        whatsapp: d.whatsapp || d.phone || '',
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

  const save = async () => {
    setSaving(true);
    try {
      const res = await updateBookingPageConfig({
        slug: form.slug,
        tagline: form.tagline,
        accent: form.accent,
        whatsapp: form.whatsapp.replace(/\D/g, ''),
      });
      setData(res?.data || null);
      setAlert({ type: 'success', message: 'Catálogo web actualizado.' });
    } catch (e) {
      setAlert({ type: 'error', message: e?.message || 'No se pudo guardar.' });
    } finally {
      setSaving(false);
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
      <div className="w-full max-w-3xl p-4">
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
          .
        </p>

        {loading ? (
          <p className="py-12 text-center text-sm text-gray-400">Cargando…</p>
        ) : (
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
                            <ClipboardDocumentIcon className="h-4 w-4" /> Copiar
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

            {/* Apariencia */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="mb-3 text-sm font-bold text-gray-800">Apariencia</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-gray-500">
                    Eslogan / frase (opcional)
                  </label>
                  <input
                    value={form.tagline}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, tagline: e.target.value }))
                    }
                    placeholder="Ej: Los mejores precios de la ciudad"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">
                    Color principal
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.accent || '#ea580c'}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, accent: e.target.value }))
                      }
                      className="h-10 w-12 cursor-pointer rounded-lg border border-gray-200"
                    />
                    <input
                      value={form.accent}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, accent: e.target.value }))
                      }
                      placeholder="#ea580c"
                      className={inputCls}
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">
                    WhatsApp de contacto
                  </label>
                  <input
                    value={form.whatsapp}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, whatsapp: e.target.value }))
                    }
                    placeholder="573001112233"
                    inputMode="numeric"
                    className={inputCls}
                  />
                </div>
              </div>
              <p className="mt-3 text-[11px] text-gray-400">
                El logo es el de tu negocio (Configuración). Las fotos, precios y
                categorías de los productos se gestionan en Inventario.
              </p>
            </div>

            <div className="flex justify-end">
              <Button variant="primary" onClick={save} loading={saving}>
                Guardar
              </Button>
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
