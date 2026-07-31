'use client';

export default function LoadingOverlay({ show = false, text = 'Cargando...' }) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm">
      <div className="h-10 w-10 border-4 border-gray-300 border-t-orange-600 rounded-full animate-spin" />
      <p className="mt-3 text-sm text-gray-600">{text}</p>
    </div>
  );
}
