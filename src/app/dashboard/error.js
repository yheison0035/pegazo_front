'use client';

// Pantalla de error TEMPORAL del panel: muestra el mensaje real para poder
// diagnosticar el crash en producción. (Se quita luego de arreglar.)
export default function DashboardError({ error, reset }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        padding: 20,
        fontFamily: 'monospace',
        background: '#fff7ed',
        color: '#7c2d12',
      }}
    >
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>
        Error detectado (temporal para diagnóstico)
      </h2>
      <p style={{ fontWeight: 700 }}>Mensaje:</p>
      <pre
        style={{
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          background: '#fff',
          border: '1px solid #fed7aa',
          borderRadius: 8,
          padding: 10,
          fontSize: 13,
        }}
      >
        {String(error?.message || 'sin mensaje')}
      </pre>
      {error?.digest && (
        <p style={{ fontSize: 12, marginTop: 6 }}>digest: {error.digest}</p>
      )}
      {error?.stack && (
        <>
          <p style={{ fontWeight: 700, marginTop: 12 }}>Stack:</p>
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              background: '#fff',
              border: '1px solid #fed7aa',
              borderRadius: 8,
              padding: 10,
              fontSize: 11,
              maxHeight: 300,
              overflow: 'auto',
            }}
          >
            {String(error.stack)}
          </pre>
        </>
      )}
      <button
        onClick={() => reset()}
        style={{
          marginTop: 14,
          background: '#ea580c',
          color: '#fff',
          border: 0,
          borderRadius: 8,
          padding: '10px 18px',
          fontWeight: 700,
        }}
      >
        Reintentar
      </button>
    </div>
  );
}
