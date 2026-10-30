import { describe, it, expect } from 'vitest';
import {
  resolvePreset,
  fitDimensions,
  squareCrop,
  extForType,
  targetFileName,
  formatImageFile,
  IMAGE_PRESETS,
} from './formatImage';

describe('formatImage · medidas (fitDimensions)', () => {
  it('no agranda imágenes pequeñas', () => {
    expect(fitDimensions(300, 200, { maxWidth: 1280, maxHeight: 1280 })).toEqual({ width: 300, height: 200 });
  });
  it('reduce conservando la proporción (apaisada)', () => {
    expect(fitDimensions(4000, 3000, { maxWidth: 1280, maxHeight: 1280 })).toEqual({ width: 1280, height: 960 });
  });
  it('reduce conservando la proporción (vertical)', () => {
    expect(fitDimensions(3000, 4000, { maxWidth: 1280, maxHeight: 1280 })).toEqual({ width: 960, height: 1280 });
  });
  it('respeta maxHeight distinto de maxWidth (banner)', () => {
    expect(fitDimensions(4000, 4000, { maxWidth: 1920, maxHeight: 1080 })).toEqual({ width: 1080, height: 1080 });
  });
  it('medidas inválidas devuelven 0', () => {
    expect(fitDimensions(0, 100, { maxWidth: 500 })).toEqual({ width: 0, height: 0 });
  });
});

describe('formatImage · recorte cuadrado (squareCrop)', () => {
  it('recorta centrado al lado menor (apaisada)', () => {
    expect(squareCrop(1000, 600, 512)).toEqual({ sx: 200, sy: 0, side: 600, size: 512 });
  });
  it('recorta centrado al lado menor (vertical)', () => {
    expect(squareCrop(600, 1000, 512)).toEqual({ sx: 0, sy: 200, side: 600, size: 512 });
  });
  it('no agranda: lado menor por debajo del máximo', () => {
    expect(squareCrop(300, 400, 512)).toEqual({ sx: 0, sy: 50, side: 300, size: 300 });
  });
});

describe('formatImage · nombre y extensión', () => {
  it('cambia la extensión al formato resultante', () => {
    expect(targetFileName('Foto Perfil.PNG', 'image/webp')).toBe('Foto Perfil.webp');
    expect(targetFileName('producto.jpeg', 'image/jpeg')).toBe('producto.jpg');
    expect(targetFileName('', 'image/webp')).toBe('imagen.webp');
  });
  it('mapea el tipo MIME a extensión', () => {
    expect(extForType('image/webp')).toBe('webp');
    expect(extForType('image/jpeg')).toBe('jpg');
    expect(extForType('image/png')).toBe('png');
  });
});

describe('formatImage · presets', () => {
  it('avatar es vertical (sin recorte cuadrado) para verse bien en la tarjeta de citas', () => {
    expect(IMAGE_PRESETS.avatar.square).toBeFalsy();
    expect(IMAGE_PRESETS.avatar.maxHeight).toBeGreaterThan(IMAGE_PRESETS.avatar.maxWidth);
  });
  it('overrides pisan el preset', () => {
    expect(resolvePreset('product', { quality: 0.5 })).toMatchObject({ maxWidth: 1280, quality: 0.5 });
  });
  it('un preset desconocido cae en default', () => {
    expect(resolvePreset('no-existe')).toEqual(IMAGE_PRESETS.default);
  });
});

describe('formatImage · formatImageFile', () => {
  it('rechaza lo que no es imagen', async () => {
    const file = { type: 'application/pdf', name: 'x.pdf' };
    await expect(formatImageFile(file)).rejects.toThrow(/imagen/);
  });
  it('deja pasar SVG y GIF sin tocarlos', async () => {
    const svg = new File(['<svg/>'], 'icono.svg', { type: 'image/svg+xml' });
    const gif = new File(['GIF'], 'anim.gif', { type: 'image/gif' });
    expect(await formatImageFile(svg, 'logo')).toBe(svg);
    expect(await formatImageFile(gif, 'product')).toBe(gif);
  });
  it('sin canvas disponible (jsdom) devuelve el archivo original sin romper', async () => {
    const png = new File([new Uint8Array([1, 2, 3])], 'foto.png', { type: 'image/png' });
    const out = await formatImageFile(png, 'avatar');
    expect(out).toBeInstanceOf(File);
    expect(out.name).toBe('foto.png');
  });
});
