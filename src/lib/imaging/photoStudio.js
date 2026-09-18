// Motor de composición para el "Estudio de foto" del inventario.
//
// TODO corre en el navegador: no toca el backend ni la base de datos. La foto
// final se exporta como Blob y se sube con el mismo flujo de subida de imágenes
// que ya existe (uploadProductImages -> PUT /inventory/:id/images).
//
// La idea es dar un aspecto "tipo tienda online": imagen SIEMPRE cuadrada, el
// producto centrado sobre un fondo limpio (color de marca de la tienda) con un
// margen uniforme, ajustes de brillo/contraste/saturación y logo opcional.

/** Carga un File/Blob/dataURL/URL a un HTMLImageElement ya decodificado. */
export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const url = typeof src === 'string' ? src : URL.createObjectURL(src);
    const img = new Image();
    img.onload = () => {
      if (typeof src !== 'string') URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      if (typeof src !== 'string') URL.revokeObjectURL(url);
      reject(new Error('No se pudo cargar la imagen'));
    };
    img.src = url;
  });
}

/** Cadena para ctx.filter a partir de los ajustes (0 = neutro en cada uno). */
export function filterString({ brightness = 0, contrast = 0, saturation = 0 } = {}) {
  const b = 1 + brightness / 100; // -100..100  ->  0..2
  const c = 1 + contrast / 100;
  const s = 1 + saturation / 100;
  return `brightness(${b}) contrast(${c}) saturate(${s})`;
}

export const DEFAULT_ADJUST = { brightness: 0, contrast: 0, saturation: 0 };
// "Mejorar" automático: un realce suave y honesto, no exagerado.
export const AUTO_ADJUST = { brightness: 6, contrast: 12, saturation: 10 };

/**
 * Dibuja la escena completa en `canvas` (cuadrado de `size`x`size`):
 *   fondo -> imagen (fit-contain con padding + zoom/offset/rotación + ajustes)
 *   -> marca de agua (logo) opcional.
 * `offsetX/offsetY` van en fracción del lienzo (-1..1) para ser resolución-agnósticos.
 */
export function renderScene(
  canvas,
  {
    image,
    size = 1200,
    bg = '#ffffff',
    padding = 0.08, // margen alrededor del producto (fracción del lado)
    zoom = 1,
    offsetX = 0,
    offsetY = 0,
    rotation = 0, // grados
    adjust = DEFAULT_ADJUST,
    logo = null, // HTMLImageElement | null
    logoScale = 0.18, // fracción del lado
    logoOpacity = 0.9,
    transparent = false, // si true, no pinta fondo (para previsualizar recorte)
  },
) {
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, size, size);

  // Fondo limpio.
  if (!transparent) {
    ctx.fillStyle = bg || '#ffffff';
    ctx.fillRect(0, 0, size, size);
  }

  if (image) {
    // Escala base: el producto cabe dentro del área con padding.
    const area = size * (1 - padding * 2);
    const base = Math.min(area / image.width, area / image.height);
    const scale = base * zoom;
    const drawW = image.width * scale;
    const drawH = image.height * scale;

    ctx.save();
    ctx.filter = filterString(adjust);
    // Centro + desplazamiento del usuario.
    ctx.translate(size / 2 + offsetX * size, size / 2 + offsetY * size);
    if (rotation) ctx.rotate((rotation * Math.PI) / 180);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(image, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
  }

  // Marca de agua: logo abajo-derecha con margen.
  if (logo) {
    const lw = size * logoScale;
    const ratio = logo.height / logo.width || 1;
    const lh = lw * ratio;
    const margin = size * 0.035;
    ctx.save();
    ctx.globalAlpha = logoOpacity;
    ctx.drawImage(logo, size - lw - margin, size - lh - margin, lw, lh);
    ctx.restore();
  }
}

/** Exporta el canvas a Blob. WebP si el navegador lo soporta; si no, JPEG. */
export function canvasToBlob(canvas, quality = 0.9) {
  return new Promise((resolve) => {
    const done = (blob, type) => {
      // Safari viejo puede devolver null en webp -> caemos a jpeg.
      if (blob) return resolve({ blob, type });
      canvas.toBlob(
        (b2) => resolve({ blob: b2, type: 'image/jpeg' }),
        'image/jpeg',
        quality,
      );
    };
    canvas.toBlob((b) => done(b, 'image/webp'), 'image/webp', quality);
  });
}
