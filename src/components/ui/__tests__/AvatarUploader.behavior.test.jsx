import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useState } from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import AvatarUploader from '../AvatarUploader';

// Envoltorio controlado: refleja el uso real (el padre guarda la URL en onChange).
function Controlled({ initial = '', upload, onChange }) {
  const [value, setValue] = useState(initial);
  return (
    <AvatarUploader
      value={value}
      upload={upload}
      onChange={(url) => { setValue(url); onChange?.(url); }}
    />
  );
}

// El formateador se ejerce por separado en src/lib/imaging/formatImage.test.js;
// aquí comprobamos el comportamiento del subidor: preview, subida y quitar.
vi.mock('@/lib/imaging/formatImage', () => ({
  formatImageFile: vi.fn(async (file) => file),
}));

function pickFile(name = 'foto.png', type = 'image/png') {
  const input = document.querySelector('input[type="file"]');
  const file = new File([new Uint8Array([1, 2, 3])], name, { type });
  act(() => {
    fireEvent.change(input, { target: { files: [file] } });
  });
  return file;
}

describe('AvatarUploader', () => {
  beforeEach(() => {
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:preview');
    globalThis.URL.revokeObjectURL = vi.fn();
  });
  afterEach(() => vi.restoreAllMocks());

  it('muestra el estado vacío con el botón de subir foto', () => {
    render(<AvatarUploader value="" onChange={() => {}} upload={vi.fn()} />);
    expect(screen.getByLabelText('Subir foto')).toBeInTheDocument();
  });

  it('al elegir una imagen la previsualiza, la sube y publica la URL', async () => {
    const upload = vi.fn(async () => ({ data: { url: 'https://cdn/foto-123.webp' } }));
    const onChange = vi.fn();
    const { formatImageFile } = await import('@/lib/imaging/formatImage');
    render(<Controlled upload={upload} onChange={onChange} />);
    pickFile();
    // Vista previa inmediata (objectURL) para saber cuál cargó.
    expect(globalThis.URL.createObjectURL).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(upload).toHaveBeenCalledTimes(1));
    expect(formatImageFile).toHaveBeenCalledWith(expect.any(File), 'avatar');
    await waitFor(() => expect(onChange).toHaveBeenCalledWith('https://cdn/foto-123.webp'));
    const img = await screen.findByAltText('Foto');
    expect(img).toHaveAttribute('src', 'https://cdn/foto-123.webp');
  });

  it('rechaza archivos que no son imagen sin subir', async () => {
    const upload = vi.fn();
    render(<AvatarUploader value="" onChange={() => {}} upload={upload} />);
    const input = document.querySelector('input[type="file"]');
    act(() => {
      fireEvent.change(input, { target: { files: [new File(['x'], 'a.pdf', { type: 'application/pdf' })] } });
    });
    expect(await screen.findByText('El archivo debe ser una imagen.')).toBeInTheDocument();
    expect(upload).not.toHaveBeenCalled();
  });

  it('si la subida falla, avisa y no publica URL', async () => {
    const upload = vi.fn(async () => { throw new Error('Servidor caído'); });
    const onChange = vi.fn();
    render(<AvatarUploader value="" onChange={onChange} upload={upload} />);
    pickFile();
    expect(await screen.findByText('Servidor caído')).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('shape="card" muestra el recuadro vertical de la página de citas', () => {
    render(<AvatarUploader value="https://cdn/previa.webp" onChange={() => {}} upload={vi.fn()} shape="card" />);
    const img = screen.getByAltText('Foto');
    // Mismo encuadre que la tarjeta de profesional en citas: vertical 4:5 y
    // alineado arriba (muestra la cara), esquinas redondeadas.
    expect(img.className).toContain('object-top');
    const frame = img.closest('div');
    expect(frame.className).toContain('aspect-[4/5]');
  });

  it('con foto cargada, "Quitar" la borra', async () => {
    const onChange = vi.fn();
    render(<AvatarUploader value="https://cdn/previa.webp" onChange={onChange} upload={vi.fn()} />);
    expect(screen.getByAltText('Foto')).toHaveAttribute('src', 'https://cdn/previa.webp');
    await act(async () => {
      fireEvent.click(screen.getByLabelText('Quitar foto'));
    });
    expect(onChange).toHaveBeenCalledWith('');
  });
});
