import { ImageResponse } from 'next/og';

// Imagen que se muestra al compartir el enlace de Pegazo (WhatsApp, redes,
// buscadores). Se genera en el build con next/og; 1200x630 es el tamaño estándar.
export const alt = 'Pegazo — Todo tu negocio, en un solo lugar';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background:
            'linear-gradient(135deg, #171717 0%, #0a0a0a 55%, #000000 100%)',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            marginBottom: '36px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '84px',
              height: '84px',
              borderRadius: '22px',
              background: 'linear-gradient(135deg, #ea580c, #f59e0b)',
              fontSize: '52px',
              fontWeight: 800,
            }}
          >
            P
          </div>
          <div style={{ fontSize: '52px', fontWeight: 800 }}>Pegazo</div>
        </div>

        <div
          style={{
            fontSize: '72px',
            fontWeight: 800,
            lineHeight: 1.05,
            maxWidth: '900px',
          }}
        >
          Todo tu negocio, en un solo lugar
        </div>

        <div
          style={{
            marginTop: '32px',
            fontSize: '34px',
            color: '#d4d4d4',
            maxWidth: '920px',
          }}
        >
          Ventas, inventario, clientes, fiado, citas y tu tienda online.
        </div>

        <div
          style={{
            marginTop: '48px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              background: 'linear-gradient(90deg, #ea580c, #f59e0b)',
              color: '#ffffff',
              fontSize: '30px',
              fontWeight: 700,
              padding: '16px 36px',
              borderRadius: '16px',
            }}
          >
            pegazo.co
          </div>
          <div style={{ fontSize: '28px', color: '#a3a3a3' }}>
            Hecho para negocios en Colombia
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
