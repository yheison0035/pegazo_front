const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005'
).replace(/\/$/, '');

async function apiFetch(path, opts = {}) {
  const full = path.startsWith('/')
    ? `${API_URL}${path}`
    : `${API_URL}/${path}`;

  const headers = { ...(opts.headers || {}) };

  // Por defecto auth es true
  const auth = opts.auth !== false;

  if (auth && typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  // No poner Content-Type cuando el body es FormData
  if (!(opts.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] ?? 'application/json';
  }

  const res = await fetch(full, { ...opts, headers });

  if (opts.responseType === 'blob') {
    if (!res.ok) {
      throw new Error(`Error ${res.status} al descargar archivo`);
    }
    return await res.blob();
  }

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  // Manejo centralizado de errores
  if (!res.ok) {
    let message = '';

    switch (res.status) {
      case 400:
        message = data?.message || 'Solicitud inválida';
        break;
      case 401:
        message = data?.message || 'Credenciales incorrectas o sesión expirada';
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
        }
        break;
      case 403:
        message = data?.message || 'No tienes permisos para esta acción';
        break;
      case 404:
        message = data?.message || 'Recurso no encontrado';
        break;
      case 500:
        message = 'Error en el servidor, intenta más tarde';
        break;
      default:
        message = data?.message || `Error ${res.status}`;
    }

    throw new Error(message);
  }

  return data;
}

export default apiFetch;
