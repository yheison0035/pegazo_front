'use client';

export default function LoadingOverlay({ show, text = 'Procesando...' }) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl p-6 flex flex-col items-center gap-4 animate-fade-in">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-gray-700">{text}</p>
      </div>
    </div>
  );
}
