'use client';

import Link from 'next/link';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

/**
 * Sistema de botones de Pegazo.
 *
 * Uso: <Button variant="add" icon={PlusIcon}>Agregar</Button>
 *
 * Variantes (por intención):
 *   primary      → acción principal / Guardar (naranja de marca)
 *   add / success→ crear / confirmar (verde)
 *   secondary    → Volver / Cancelar (neutro con borde)
 *   outline      → acción secundaria de marca (borde naranja)
 *   clear        → Limpiar / Reiniciar (ámbar suave)
 *   info         → Exportar / Filtrar / Ver (celeste suave)
 *   danger       → Eliminar (rojo)
 *   danger-soft  → destructivo secundario (rojo suave)
 *   soft / ghost → terciarios neutros
 *   link         → enlace de texto
 */

const BASE =
  'relative inline-flex items-center justify-center font-medium whitespace-nowrap select-none transition-all duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.97]';

const VARIANTS = {
  primary:
    'bg-gradient-to-r from-orange-600 to-amber-500 text-[#fff] shadow-sm hover:shadow-md hover:brightness-[1.05] focus-visible:ring-orange-400/60',
  add: 'bg-emerald-600 text-[#fff] shadow-sm hover:bg-emerald-700 focus-visible:ring-emerald-400/60',
  success:
    'bg-emerald-600 text-[#fff] shadow-sm hover:bg-emerald-700 focus-visible:ring-emerald-400/60',
  danger:
    'bg-red-600 text-[#fff] shadow-sm hover:bg-red-700 focus-visible:ring-red-400/60',
  secondary:
    'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 focus-visible:ring-gray-300',
  outline:
    'bg-transparent text-orange-600 border border-orange-500 hover:bg-orange-50 focus-visible:ring-orange-300',
  clear:
    'bg-amber-50 text-amber-700 hover:bg-amber-100 focus-visible:ring-amber-300',
  info: 'bg-sky-50 text-sky-700 hover:bg-sky-100 focus-visible:ring-sky-300',
  'danger-soft':
    'bg-red-50 text-red-700 hover:bg-red-100 focus-visible:ring-red-300',
  soft: 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus-visible:ring-gray-300',
  ghost:
    'bg-transparent text-gray-600 hover:bg-gray-100 focus-visible:ring-gray-300',
  link: 'bg-transparent text-orange-600 hover:text-orange-700 hover:underline focus-visible:ring-orange-300 !px-0 !py-0 !shadow-none',
};

const SIZES = {
  sm: 'text-xs px-3 py-1.5 gap-1.5 rounded-lg',
  md: 'text-sm px-4 py-2 gap-2 rounded-lg',
  lg: 'text-sm px-5 py-2.5 gap-2 rounded-xl',
};

const ICON = { sm: 'h-4 w-4', md: 'h-4 w-4', lg: 'h-5 w-5' };

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconRight: IconRight,
  loading = false,
  disabled = false,
  fullWidth = false,
  href,
  className = '',
  ...props
}) {
  const iconClass = ICON[size] || ICON.md;

  const classes = [
    BASE,
    VARIANTS[variant] || VARIANTS.primary,
    SIZES[size] || SIZES.md,
    fullWidth ? 'w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      {loading ? (
        <ArrowPathIcon className={`${iconClass} animate-spin`} />
      ) : (
        Icon && <Icon className={iconClass} />
      )}
      {children}
      {!loading && IconRight && <IconRight className={iconClass} />}
    </>
  );

  // Como enlace (Next Link) cuando se pasa href y no está deshabilitado.
  if (href && !disabled && !loading) {
    return (
      <Link href={href} className={classes} {...props}>
        {content}
      </Link>
    );
  }

  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {content}
    </button>
  );
}
