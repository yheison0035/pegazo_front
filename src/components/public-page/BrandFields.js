'use client';

// Campos de MARCA de la página pública (título, subtítulo, color de acento y
// WhatsApp). Son los mismos para la página de citas y para el catálogo web, así
// que viven en UN solo componente (fuente única, etiquetas idénticas). Cada
// editor conserva aparte lo propio de su vertical (portada/estilo vs tema).
export default function BrandFields({
  form,
  setForm,
  showSubtitle = false,
  accentFallback = '#ea580c',
  taglinePlaceholder = 'Ej: Los mejores precios de la ciudad',
  subtitlePlaceholder = 'Más que un corte, es actitud',
  whatsappPlaceholder = '573001234567 (con indicativo del país)',
}) {
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const inputCls =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400';
  const labelCls = 'mb-1 block text-xs font-semibold text-gray-600';

  return (
    <div className="space-y-4">
      <div className={showSubtitle ? 'grid gap-4 sm:grid-cols-2' : ''}>
        <div>
          <label className={labelCls}>Título / eslogan</label>
          <input
            value={form.tagline || ''}
            onChange={set('tagline')}
            placeholder={taglinePlaceholder}
            className={inputCls}
          />
        </div>
        {showSubtitle && (
          <div>
            <label className={labelCls}>Subtítulo</label>
            <input
              value={form.subtitle || ''}
              onChange={set('subtitle')}
              placeholder={subtitlePlaceholder}
              className={inputCls}
            />
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Color de acento</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={form.accent || accentFallback}
              onChange={set('accent')}
              className="h-10 w-12 flex-none cursor-pointer rounded-lg border border-gray-300"
            />
            <input
              type="text"
              value={form.accent || ''}
              onChange={set('accent')}
              placeholder={accentFallback}
              className={inputCls}
            />
            {form.accent && (
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, accent: '' }))}
                className="flex-none text-xs text-gray-400 hover:text-gray-600"
              >
                Reset
              </button>
            )}
          </div>
        </div>
        <div>
          <label className={labelCls}>WhatsApp de contacto</label>
          <input
            value={form.whatsapp || ''}
            onChange={set('whatsapp')}
            placeholder={whatsappPlaceholder}
            inputMode="numeric"
            className={inputCls}
          />
        </div>
      </div>
    </div>
  );
}
