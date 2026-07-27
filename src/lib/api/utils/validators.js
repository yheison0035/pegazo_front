// Validaciones dinámicas reutilizables para los formularios (DinamicForm).
// Se aplican en TODOS los módulos según el tipo/nombre del campo.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Nombres de campo que se tratan como teléfono / celular.
const PHONE_FIELDS = ['phone', 'celular', 'telefono', 'whatsapp'];

// Devuelve un mensaje de error, o null si el valor es válido.
export function validateField(field, value) {
  const { required, type, name = '' } = field || {};
  const raw = value == null ? '' : String(value).trim();

  // Obligatorio vacío
  if (required && !raw) {
    return 'Este campo es obligatorio';
  }

  // Opcional y vacío → válido
  if (!raw) return null;

  // Correo electrónico
  if (type === 'email' || name === 'email') {
    if (!EMAIL_RE.test(raw)) return 'Ingresa un correo válido';
  }

  // Teléfono / celular (7 a 15 dígitos)
  const isPhone =
    PHONE_FIELDS.includes(name) || /phone|celular|tel|whatsapp/i.test(name);
  if (isPhone) {
    const digits = raw.replace(/\D/g, '');
    if (digits.length < 7 || digits.length > 15) {
      return 'Ingresa un número de teléfono válido';
    }
  }

  // Numérico
  if (type === 'number') {
    if (Number.isNaN(Number(raw))) return 'Ingresa un número válido';
  }

  return null;
}

// Valida todos los campos del formulario. Devuelve { name: mensaje }.
export function validateForm(fields, formData) {
  const errors = {};
  if (!Array.isArray(fields)) return errors;

  for (const field of fields) {
    if (!field?.name) continue;
    // department / city se manejan con un componente aparte
    if (field.name === 'department' || field.name === 'city') continue;

    const error = validateField(field, formData?.[field.name]);
    if (error) errors[field.name] = error;
  }

  return errors;
}
