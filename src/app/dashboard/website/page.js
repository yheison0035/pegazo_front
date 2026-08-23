'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  PlusIcon,
  TrashIcon,
  ArrowUpTrayIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import RoleGuard from '@/auth/roleGuard';
import AlertModal from '@/components/dashboard/modals/alertModal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Button from '@/components/ui/Button';
import {
  getWebsiteConfig,
  updateWebsiteConfig,
  uploadWebsiteImage,
  createWebsiteBanner,
  updateWebsiteBanner,
  deleteWebsiteBanner,
} from '@/lib/api/routes/website';
import {
  WEBSITE_THEMES,
  WEBSITE_FONTS,
  themeColors,
} from '@/config/websiteThemes';

const EMPTY_BANNER = {
  image: '',
  title: '',
  subtitle: '',
  buttonText: '',
  buttonUrl: '',
  order: 0,
  active: true,
  type: 'HOME',
};

function Section({ title, description, children }) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-gray-800">{title}</h2>
      {description && (
        <p className="mt-1 mb-4 text-sm text-gray-500">{description}</p>
      )}
      <div className={description ? '' : 'mt-4'}>{children}</div>
    </section>
  );
}

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-gray-400">{hint}</span>}
    </label>
  );
}

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-orange-500';

// Paleta compacta y curada para elegir con un clic (sin escribir el hex).
const COLOR_PRESETS = [
  '#EA580C', '#F59E0B', '#EAB308', '#22C55E', '#10B981', '#06B6D4',
  '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#111827',
];

function ColorField({ label, value, fallback, onChange }) {
  const current = value || fallback;
  const norm = (c) => (c || '').toLowerCase();
  const [openPalette, setOpenPalette] = useState(false);

  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={current}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 flex-none cursor-pointer rounded border border-gray-300"
          title="Color personalizado"
        />
        <input
          type="text"
          value={value || ''}
          placeholder={fallback}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
        <button
          type="button"
          onClick={() => setOpenPalette((v) => !v)}
          className="whitespace-nowrap rounded-lg border border-gray-300 px-2.5 py-2 text-xs text-gray-600 hover:border-orange-400 hover:text-orange-600"
        >
          Paleta
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="whitespace-nowrap text-xs text-gray-400 hover:text-gray-600"
          >
            Usar tema
          </button>
        )}
      </div>

      {/* Paleta desplegable (colapsada por defecto para no saturar) */}
      {openPalette && (
        <div className="mt-2 flex flex-wrap gap-1.5 rounded-lg border border-gray-200 bg-gray-50 p-2">
          {COLOR_PRESETS.map((c) => {
            const selected = norm(value) === norm(c);
            return (
              <button
                key={c}
                type="button"
                title={c}
                onClick={() => {
                  onChange(c);
                  setOpenPalette(false);
                }}
                style={{ backgroundColor: c }}
                className={`h-6 w-6 rounded-full border transition hover:scale-110 ${
                  selected ? 'border-orange-600 ring-2 ring-orange-400' : 'border-gray-300'
                }`}
              />
            );
          })}
        </div>
      )}
    </Field>
  );
}

export default function WebsitePage() {
  const [config, setConfig] = useState(null);
  const [form, setForm] = useState({});
  const [banners, setBanners] = useState([]);
  const [newBanner, setNewBanner] = useState(EMPTY_BANNER);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState('');
  const [alert, setAlert] = useState({});
  const [bannerToDelete, setBannerToDelete] = useState(null);
  const [showAllThemes, setShowAllThemes] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getWebsiteConfig();

      setConfig(data);
      setBanners(data.websiteBanners || []);

      const settings = data.websiteSetting || {};

      setForm({
        websiteName: data.websiteName || '',
        favicon: data.favicon || '',
        theme: data.theme || 'clasico',
        fontFamily: data.fontFamily || 'inter',
        primaryColor: data.primaryColor || '',
        secondaryColor: data.secondaryColor || '',
        accentColor: data.accentColor || '',
        ctaColor: data.ctaColor || '',
        heroTitle: data.heroTitle || '',
        heroSubtitle: data.heroSubtitle || '',
        whatsapp: settings.whatsapp || '',
        address: settings.address || '',
        schedule: settings.schedule || '',
        facebook: settings.facebook || '',
        instagram: settings.instagram || '',
        tiktok: settings.tiktok || '',
        youtube: settings.youtube || '',
        metaTitle: settings.metaTitle || '',
        metaDescription: settings.metaDescription || '',
        footerText: settings.footerText || '',
        ecommerceLocalId: settings.ecommerceLocalId || '',
      });
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const set = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));

  /**
   * Al elegir un tema se adoptan sus colores. Si no se hiciera, los colores
   * que la empresa ya había escogido seguirían mandando y parecería que el
   * tema no cambia nada. Después puede volver a ajustar cada color.
   */
  const applyTheme = (themeId) => {
    setForm((prev) => ({ ...prev, theme: themeId, ...themeColors(themeId) }));
  };

  const handleUpload = async (file, onDone, key) => {
    if (!file) return;

    setUploading(key);
    try {
      const res = await uploadWebsiteImage(file);
      onDone(res.url);
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'No se pudo subir' });
    } finally {
      setUploading('');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Se mandan también los vacíos (cadena vacía) para poder borrar un valor;
      // la sede es numérica, así que si no hay ninguna elegida no se envía.
      const payload = { ...form };

      if (payload.ecommerceLocalId === '') {
        delete payload.ecommerceLocalId;
      } else {
        payload.ecommerceLocalId = Number(payload.ecommerceLocalId);
      }

      await updateWebsiteConfig(payload);

      setAlert({ type: 'success', message: 'Tienda actualizada' });
      load();
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'No se pudo guardar' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddBanner = async () => {
    if (!newBanner.image) {
      setAlert({ type: 'warning', message: 'Sube primero la imagen del banner' });
      return;
    }

    try {
      await createWebsiteBanner({
        ...newBanner,
        order: Number(newBanner.order) || 0,
      });
      setNewBanner(EMPTY_BANNER);
      setAlert({ type: 'success', message: 'Banner agregado' });
      load();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  const handleToggleBanner = async (banner) => {
    try {
      await updateWebsiteBanner(banner.id, { active: !banner.active });
      load();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  const confirmDeleteBanner = async () => {
    const banner = bannerToDelete;
    try {
      await deleteWebsiteBanner(banner.id);
      setBannerToDelete(null);
      setAlert({ type: 'success', message: 'Banner eliminado' });
      load();
    } catch (err) {
      setBannerToDelete(null);
      setAlert({ type: 'error', message: err.message });
    }
  };

  const colors = themeColors(form.theme);

  const selectedLocal = (config?.locals || []).find(
    (local) => String(local.id) === String(form.ecommerceLocalId)
  );

  return (
    <RoleGuard allowedRoles={['SUPER_ADMIN', 'SUPER_PLATFORM_ADMIN']}>
      <div className="w-full pb-10">
        <div className="mb-4">
          <h1 className="text-2xl font-semibold text-gray-800">Tienda online</h1>
          <p className="text-sm text-gray-500">
            Diseño y contenido de tu tienda. Los cambios se ven en tu dominio al
            recargar.
          </p>
        </div>

        {loading ? (
          <p className="py-10 text-center text-gray-400">Cargando…</p>
        ) : !config?.websiteEnabled ? (
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-6">
            <div className="flex items-start gap-3">
              <GlobeAltIcon className="mt-0.5 h-6 w-6 shrink-0 text-orange-500" />
              <div>
                <h2 className="font-semibold text-gray-800">
                  Tu tienda online todavía no está habilitada
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Para publicar tu tienda necesitas un dominio y que la
                  plataforma active el ecommerce en tu cuenta. Escríbenos y lo
                  dejamos listo; después podrás configurar aquí el diseño, los
                  banners y los datos de contacto.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-5">
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              Tienda publicada en{' '}
              <a
                href={`https://${config.domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold underline"
              >
                {config.domain}
              </a>
            </div>

            {/* ---------- DISEÑO ---------- */}
            <Section
              title="Tema"
              description="Elige el estilo base de tu tienda. Puedes ajustar los colores debajo."
            >
              <div className="grid gap-3 sm:grid-cols-3">
                {(showAllThemes
                  ? WEBSITE_THEMES
                  : WEBSITE_THEMES.slice(0, 3)
                ).map((theme) => {
                  const selected = form.theme === theme.id;

                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => applyTheme(theme.id)}
                      className={`rounded-lg border p-4 text-left transition ${
                        selected
                          ? 'border-orange-500 ring-2 ring-orange-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="mb-3 flex gap-1.5">
                        {theme.preview.map((color) => (
                          <span
                            key={color}
                            style={{ backgroundColor: color }}
                            className="h-6 w-6 rounded-full border border-black/10"
                          />
                        ))}
                      </div>
                      <p className="text-sm font-semibold text-gray-800">
                        {theme.name}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {theme.description}
                      </p>
                    </button>
                  );
                })}
              </div>

              {WEBSITE_THEMES.length > 3 && (
                <button
                  type="button"
                  onClick={() => setShowAllThemes((v) => !v)}
                  className="mt-3 text-sm font-medium text-orange-600 hover:underline"
                >
                  {showAllThemes
                    ? 'Ver menos temas'
                    : `Ver más temas (${WEBSITE_THEMES.length - 3})`}
                </button>
              )}
            </Section>

            <Section
              title="Colores y tipografía"
              description="Lo que dejes vacío toma el color del tema elegido."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <ColorField
                  label="Color principal (menú y pie de página)"
                  value={form.primaryColor}
                  fallback={colors.primaryColor}
                  onChange={set('primaryColor')}
                />
                <ColorField
                  label="Color secundario"
                  value={form.secondaryColor}
                  fallback={colors.secondaryColor}
                  onChange={set('secondaryColor')}
                />
                <ColorField
                  label="Color de acento"
                  value={form.accentColor}
                  fallback={colors.accentColor}
                  onChange={set('accentColor')}
                />
                <ColorField
                  label="Color de los botones de compra"
                  value={form.ctaColor}
                  fallback={colors.ctaColor}
                  onChange={set('ctaColor')}
                />

                <Field label="Tipografía">
                  <select
                    value={form.fontFamily}
                    onChange={(e) => set('fontFamily')(e.target.value)}
                    className={inputClass}
                  >
                    {WEBSITE_FONTS.map((font) => (
                      <option key={font.id} value={font.id}>
                        {font.name} — {font.sample}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </Section>

            {/* ---------- IDENTIDAD ---------- */}
            <Section
              title="Identidad"
              description="El logo y los datos de contacto son los de tu empresa. Aquí solo ajustas cómo se ven en la tienda."
            >
              <div className="mb-5 flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                {config.logo ? (
                  // Imagen normal: el logo puede estar en cualquier dominio y
                  // next/image reventaría la pantalla si no está permitido.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={config.logo}
                    alt={config.name || 'Logo'}
                    className="h-12 w-12 rounded border border-gray-200 bg-white object-contain"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded border border-dashed border-gray-300 text-xs text-gray-400">
                    Sin logo
                  </div>
                )}
                <div className="text-sm">
                  <p className="font-medium text-gray-800">{config.name}</p>
                  <p className="text-xs text-gray-500">
                    Logo y datos de la empresa. Se cambian en los datos de tu
                    empresa, no aquí.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Nombre visible en la tienda"
                  hint={`Si lo dejas vacío se usa "${config.name}"`}
                >
                  <input
                    type="text"
                    value={form.websiteName}
                    onChange={(e) => set('websiteName')(e.target.value)}
                    className={inputClass}
                  />
                </Field>

                <Field label="Sede que se publica en la tienda" hint="Su inventario es el que se vende online">
                  <select
                    value={form.ecommerceLocalId}
                    onChange={(e) => set('ecommerceLocalId')(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Selecciona una sede</option>
                    {(config.locals || []).map((local) => (
                      <option key={local.id} value={local.id}>
                        {local.name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Favicon" hint="El iconito de la pestaña del navegador">
                  <div className="flex items-center gap-3">
                    {form.favicon && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={form.favicon}
                        alt="Favicon"
                        className="h-8 w-8 rounded border border-gray-200 object-contain"
                      />
                    )}
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
                      <ArrowUpTrayIcon className="h-4 w-4" />
                      {uploading === 'favicon' ? 'Subiendo…' : 'Subir imagen'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handleUpload(
                            e.target.files?.[0],
                            set('favicon'),
                            'favicon'
                          )
                        }
                      />
                    </label>
                  </div>
                </Field>
              </div>
            </Section>

            {/* ---------- PORTADA ---------- */}
            <Section
              title="Portada"
              description="Si no subes banners se muestra este título y subtítulo."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Título de portada">
                  <input
                    type="text"
                    value={form.heroTitle}
                    onChange={(e) => set('heroTitle')(e.target.value)}
                    className={inputClass}
                  />
                </Field>

                <Field label="Subtítulo de portada">
                  <input
                    type="text"
                    value={form.heroSubtitle}
                    onChange={(e) => set('heroSubtitle')(e.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>
            </Section>

            {/* ---------- CONTACTO ---------- */}
            <Section
              title="Contacto y redes"
              description="Si dejas algo vacío, la tienda usa los datos de tu empresa y de la sede."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="WhatsApp"
                  hint={
                    config.phone
                      ? `Si lo dejas vacío se usa ${config.phone}`
                      : 'Sin indicativo. Si lo dejas vacío no se muestra el botón.'
                  }
                >
                  <input
                    type="text"
                    value={form.whatsapp}
                    placeholder={config.phone || ''}
                    onChange={(e) => set('whatsapp')(e.target.value)}
                    className={inputClass}
                  />
                </Field>

                <Field label="Horario de atención">
                  <input
                    type="text"
                    value={form.schedule}
                    placeholder="8:00 AM - 6:00 PM"
                    onChange={(e) => set('schedule')(e.target.value)}
                    className={inputClass}
                  />
                </Field>

                <Field label="Dirección" hint="Si la dejas vacía se usa la de la sede publicada">
                  <input
                    type="text"
                    value={form.address}
                    placeholder={selectedLocal?.address || ''}
                    onChange={(e) => set('address')(e.target.value)}
                    className={inputClass}
                  />
                </Field>

                <Field label="Instagram">
                  <input
                    type="url"
                    value={form.instagram}
                    placeholder="https://instagram.com/tu-tienda"
                    onChange={(e) => set('instagram')(e.target.value)}
                    className={inputClass}
                  />
                </Field>

                <Field label="Facebook">
                  <input
                    type="url"
                    value={form.facebook}
                    placeholder="https://facebook.com/tu-tienda"
                    onChange={(e) => set('facebook')(e.target.value)}
                    className={inputClass}
                  />
                </Field>

                <Field label="TikTok">
                  <input
                    type="url"
                    value={form.tiktok}
                    placeholder="https://tiktok.com/@tu-tienda"
                    onChange={(e) => set('tiktok')(e.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>
            </Section>

            {/* ---------- SEO ---------- */}
            <Section
              title="SEO"
              description="Cómo aparece tu tienda en Google y al compartirla."
            >
              <div className="grid gap-4">
                <Field label="Título para buscadores" hint="Máximo 70 caracteres">
                  <input
                    type="text"
                    maxLength={70}
                    value={form.metaTitle}
                    placeholder={config.websiteName || config.name}
                    onChange={(e) => set('metaTitle')(e.target.value)}
                    className={inputClass}
                  />
                </Field>

                <Field
                  label="Descripción para buscadores"
                  hint="Máximo 160 caracteres recomendados"
                >
                  <textarea
                    rows={3}
                    maxLength={320}
                    value={form.metaDescription}
                    onChange={(e) => set('metaDescription')(e.target.value)}
                    className={inputClass}
                  />
                </Field>

                <Field label="Texto legal del pie de página">
                  <input
                    type="text"
                    value={form.footerText}
                    onChange={(e) => set('footerText')(e.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>
            </Section>

            <div className="sticky bottom-0 flex justify-end gap-3 border-t border-gray-200 bg-white/90 py-3 backdrop-blur">
              <Button variant="primary" type="submit" loading={saving}>
                {saving ? 'Guardando…' : 'Guardar cambios'}
              </Button>
            </div>
          </form>
        )}

        {/* ---------- BANNERS (fuera del form para no anidar formularios) ---------- */}
        {!loading && config?.websiteEnabled && (
          <div className="mt-5">
            <Section
              title="Banners de portada"
              description="Se muestran en un carrusel en la página principal."
            >
              <div className="space-y-3">
                {banners.length === 0 && (
                  <p className="text-sm text-gray-400">
                    Aún no hay banners. Agrega el primero abajo.
                  </p>
                )}

                {banners.map((banner) => (
                  <div
                    key={banner.id}
                    className="flex flex-col gap-3 rounded-lg border border-gray-200 p-3 sm:flex-row sm:items-center"
                  >
                    {/* Imagen de Cloudinary, se muestra tal cual */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={banner.image}
                      alt={banner.title || 'Banner'}
                      className="h-16 w-28 rounded object-cover"
                    />

                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">
                        {banner.title || 'Sin título'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {banner.subtitle || '—'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleBanner(banner)}
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        banner.active
                          ? 'bg-green-50 text-green-600'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {banner.active ? 'Visible' : 'Oculto'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setBannerToDelete(banner)}
                      className="text-gray-400 hover:text-red-500"
                      aria-label="Eliminar banner"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-lg border border-dashed border-gray-300 p-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Imagen del banner" hint="Recomendado 1600×700 px">
                    <div className="flex items-center gap-3">
                      {newBanner.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={newBanner.image}
                          alt="Nuevo banner"
                          className="h-12 w-20 rounded object-cover"
                        />
                      )}
                      <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
                        <ArrowUpTrayIcon className="h-4 w-4" />
                        {uploading === 'banner' ? 'Subiendo…' : 'Subir imagen'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            handleUpload(
                              e.target.files?.[0],
                              (url) =>
                                setNewBanner((prev) => ({ ...prev, image: url })),
                              'banner'
                            )
                          }
                        />
                      </label>
                    </div>
                  </Field>

                  <Field label="Título">
                    <input
                      type="text"
                      value={newBanner.title}
                      onChange={(e) =>
                        setNewBanner((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Subtítulo">
                    <input
                      type="text"
                      value={newBanner.subtitle}
                      onChange={(e) =>
                        setNewBanner((prev) => ({
                          ...prev,
                          subtitle: e.target.value,
                        }))
                      }
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Texto del botón">
                    <input
                      type="text"
                      value={newBanner.buttonText}
                      onChange={(e) =>
                        setNewBanner((prev) => ({
                          ...prev,
                          buttonText: e.target.value,
                        }))
                      }
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Enlace del botón" hint="Por ejemplo /ofertas">
                    <input
                      type="text"
                      value={newBanner.buttonUrl}
                      onChange={(e) =>
                        setNewBanner((prev) => ({
                          ...prev,
                          buttonUrl: e.target.value,
                        }))
                      }
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Orden">
                    <input
                      type="number"
                      value={newBanner.order}
                      onChange={(e) =>
                        setNewBanner((prev) => ({
                          ...prev,
                          order: e.target.value,
                        }))
                      }
                      className={inputClass}
                    />
                  </Field>
                </div>

                <Button
                  variant="add"
                  icon={PlusIcon}
                  type="button"
                  onClick={handleAddBanner}
                  className="mt-4"
                >
                  Agregar banner
                </Button>
              </div>
            </Section>
          </div>
        )}

        <AlertModal
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({})}
        />

        <ConfirmModal
          open={!!bannerToDelete}
          title="¿Eliminar banner?"
          message="Se eliminará este banner de la tienda."
          confirmText="Eliminar"
          tone="danger"
          onConfirm={confirmDeleteBanner}
          onCancel={() => setBannerToDelete(null)}
        />
      </div>
    </RoleGuard>
  );
}
