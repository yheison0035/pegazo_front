// Formateador único de imágenes para TODOS los cargues (avatar, logo, productos,
// soporte, banners…). Redimensiona, recorta (opcional) y convierte a WebP (con
// respaldo a JPEG) en el navegador ANTES de subir, para que pesen poco y se
// vean bien. La lógica de medidas/nombre es pura y está cubierta por tests; el
// dibujo en canvas se hace aquí y degrada con gracia si algo falla.

import { loadImage, canvasToBlob } from './photoStudio';

// Presets por tipo de cargue. `square:true` recorta a cuadrado (centrado) para
// fotos de personas/avatares. El resto respeta la proporción original.
export const IMAGE_PRESETS = {
  // Foto de persona: vertical (sirve igual para el círculo del sidebar y para
  // la tarjeta 4:5 de la página de citas). No se recorta a cuadrado para no
  // perder el encuadre del retrato; cada vista la recorta con object-cover.
  avatar: { maxWidth: 900, maxHeight: 1200, quality: 0.85 },
  logo: { maxWidth: 512, maxHeight: 512, quality: 0.9 },
  product: { maxWidth: 1280, maxHeight: 1280, quality: 0.82 },
  banner: { maxWidth: 1920, maxHeight: 1080, quality: 0.82 },
  support: { maxWidth: 1600, maxHeight: 1600, quality: 0.8 },
  default: { maxWidth: 1280, maxHeight: 1280, quality: 0.82 },
};

// Estos formatos NO se rasterizan: el SVG es vectorial (perdería nitidez) y el
// GIF perdería la animación. Se suben tal cual.
const PASSTHROUGH = /^image\/(svg\+xml|gif)$/i;

export function resolvePreset(preset = 'default', overrides = {}) {
  const base = IMAGE_PRESETS[preset] || IMAGE_PRESETS.default;
  return { ...base, ...overrides };
}

// Escala (SIN agrandar) para que quepa en maxWidth×maxHeight conservando la
// proporción. Devuelve medidas enteras ≥ 1.
export function fitDimensions(w, h, { maxWidth = Infinity, maxHeight = Infinity } = {}) {
  const sw = Number(w) || 0;
  const sh = Number(h) || 0;
  if (sw <= 0 || sh <= 0) return { width: 0, height: 0 };
  const scale = Math.min(1, maxWidth / sw, maxHeight / sh);
  return {
    width: Math.max(1, Math.round(sw * scale)),
    height: Math.max(1, Math.round(sh * scale)),
  };
}

// Recorte cuadrado centrado (cover) para avatares. `size` es el lado destino,
// acotado al lado menor de la imagen y al máximo del preset (nunca agranda).
export function squareCrop(w, h, maxSide = Infinity) {
  const sw = Number(w) || 0;
  const sh = Number(h) || 0;
  if (sw <= 0 || sh <= 0) return { sx: 0, sy: 0, side: 0, size: 0 };
  const side = Math.min(sw, sh);
  const size = Math.max(1, Math.round(Math.min(side, maxSide)));
  return { sx: Math.round((sw - side) / 2), sy: Math.round((sh - side) / 2), side, size };
}

export function extForType(type) {
  if (type === 'image/webp') return 'webp';
  if (type === 'image/png') return 'png';
  if (type === 'image/jpeg') return 'jpg';
  return 'img';
}

// Reusa el nombre original cambiando la extensión al formato resultante.
export function targetFileName(name, type) {
  const base = String(name || 'imagen').replace(/\.[^.]+$/, '').trim() || 'imagen';
  return `${base}.${extForType(type)}`;
}

// Convierte un File de imagen al formato optimizado. Devuelve SIEMPRE un File:
// el optimizado si se pudo, o el original intacto si el navegador no puede
// rasterizar (nunca rompe el cargue).
export async function formatImageFile(file, preset = 'default', overrides = {}) {
  if (!file || typeof file !== 'object') throw new Error('Archivo inválido.');
  if (!String(file.type || '').startsWith('image/')) {
    throw new Error('El archivo debe ser una imagen.');
  }
  if (PASSTHROUGH.test(file.type)) return file;

  const opts = resolvePreset(preset, overrides);
  try {
    const img = await loadImage(file);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext && canvas.getContext('2d');
    if (!ctx) return file;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    if (opts.square) {
      const { sx, sy, side, size } = squareCrop(img.width, img.height, opts.maxWidth);
      if (!size) return file;
      canvas.width = size;
      canvas.height = size;
      ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
    } else {
      const { width, height } = fitDimensions(img.width, img.height, opts);
      if (!width || !height) return file;
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
    }

    const { blob, type } = await canvasToBlob(canvas, opts.quality);
    if (!blob) return file;
    const optimized = new File([blob], targetFileName(file.name, type), {
      type,
      lastModified: Date.now(),
    });
    // Si el "optimizado" quedara más pesado que el original del mismo tipo, deja
    // el original (caso raro de imágenes ya muy comprimidas).
    if (optimized.type === file.type && optimized.size >= file.size) return file;
    return optimized;
  } catch {
    return file;
  }
}

// Atajo para varios archivos (p. ej. imágenes de producto).
export async function formatImageFiles(files, preset = 'default', overrides = {}) {
  const list = Array.from(files || []);
  return Promise.all(list.map((f) => formatImageFile(f, preset, overrides)));
}
