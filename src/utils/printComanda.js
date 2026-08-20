// Imprime una comanda para la cocina (ticket 80mm): mesa, mesero, hora e ítems.
export function printComanda(comanda, mesaName) {
  if (!comanda) return;

  const now = new Date().toLocaleString('es-CO', {
    timeZone: 'America/Bogota',
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  });

  const rows = (comanda.items || [])
    .map(
      (it) => `
      <tr>
        <td style="text-align:left;font-weight:bold;">${it.quantity}x</td>
        <td style="text-align:left;">${it.name}${
          it.notes ? `<br/><small>${it.notes}</small>` : ''
        }</td>
      </tr>`
    )
    .join('');

  const html = `
    <html>
      <head>
        <title>Comanda</title>
        <style>
          * { font-family: monospace; }
          body { width: 72mm; margin: 0 auto; padding: 6px; }
          h2 { text-align:center; margin: 4px 0; }
          table { width: 100%; border-collapse: collapse; }
          td { padding: 3px 2px; vertical-align: top; font-size: 13px; }
          .hr { border-top: 1px dashed #000; margin: 6px 0; }
          .meta { font-size: 12px; }
        </style>
      </head>
      <body>
        <h2>COCINA</h2>
        <div class="meta">
          <b>${mesaName || comanda.mesa?.name || 'Para llevar'}</b><br/>
          ${comanda.user?.name ? `Mesero: ${comanda.user.name}<br/>` : ''}
          ${now} · #${comanda.id}
        </div>
        <div class="hr"></div>
        <table>${rows}</table>
        <div class="hr"></div>
        ${comanda.notes ? `<div class="meta"><i>${comanda.notes}</i></div>` : ''}
      </body>
    </html>`;

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  doc.open();
  doc.write(html);
  doc.close();

  iframe.onload = () => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => document.body.removeChild(iframe), 1000);
  };
}
