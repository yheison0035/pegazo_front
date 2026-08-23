export default function WhatsappLink({ phone, message, className = '' }) {
  if (!phone) return null;

  const number = String(phone).replace(/\s+/g, '');
  const text = message || 'Hola, te contacto ---';

  return (
    <a
      href={`https://wa.me/${number}?text=${encodeURIComponent(text)}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={`flex items-center gap-1 text-green-600 hover:underline ${className}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-5 h-5"
      >
        <path d="M12 2C6.48 2 2 6.24 2 11.5c0 1.98.64 3.81 1.73 5.34L2 22l5.34-1.7c1.5.9 3.2 1.4 4.99 1.4 5.52 0 10-4.24 10-9.5S17.52 2 12 2zm0 17.5c-1.58 0-3.1-.43-4.42-1.25l-.32-.2-3.17 1.01.97-3.07-.21-.32C4.28 14.18 3.8 12.86 3.8 11.5 3.8 7.64 7.47 4.5 12 4.5s8.2 3.14 8.2 7S16.53 19.5 12 19.5zm4.7-5.57c-.25-.12-1.47-.72-1.7-.8-.23-.08-.4-.12-.57.12-.17.25-.65.8-.8.97-.15.17-.3.19-.55.06-.25-.12-1.04-.38-1.98-1.22-.73-.64-1.22-1.43-1.37-1.68-.15-.25-.02-.39.11-.51.12-.12.25-.3.37-.45.12-.15.17-.25.25-.42.08-.17.04-.32-.02-.45-.06-.12-.57-1.38-.78-1.88-.2-.48-.4-.42-.57-.43h-.48c-.17 0-.45.06-.68.32-.23.25-.9.88-.9 2.15s.92 2.5 1.05 2.67c.12.17 1.8 2.76 4.36 3.87 2.56 1.11 2.56.74 3.02.7.46-.04 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.16-.48-.28z" />
      </svg>

      <span>{phone}</span>
    </a>
  );
}
