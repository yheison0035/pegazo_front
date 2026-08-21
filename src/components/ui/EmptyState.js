import { InboxIcon } from '@heroicons/react/24/outline';

// Estado vacío unificado del CRM (mismo lenguaje visual que la tabla principal).
export default function EmptyState({
  icon: Icon = InboxIcon,
  title = 'No se encontraron resultados',
  subtitle,
  action,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 px-6 py-10 text-center ${className}`}
    >
      <Icon className="h-10 w-10 text-gray-300" />
      <p className="text-sm font-medium text-gray-500">{title}</p>
      {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
