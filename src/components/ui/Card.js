// Tarjeta base del CRM (mismo estilo redondeado + sombra suave que la tabla
// principal). Reemplaza los `bg-white rounded-2xl shadow border` sueltos.
export default function Card({ children, className = '', padding = true }) {
  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)] ${
        padding ? 'p-5' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}
