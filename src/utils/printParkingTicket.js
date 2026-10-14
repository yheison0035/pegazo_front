import { formatCOP, formatDateTime } from '@/lib/api/utils/utils';

// Ticket de INGRESO del parqueadero (80mm térmico). Lo conserva el cliente y
// sirve para buscar el vehículo a la salida (por código o placa).
export function printParkingTicket(ticket, usuario, vehicleType) {
  if (!ticket) return;

  const company = usuario?.company || {};
  const logo = company.logo
    ? `<div class="logo"><img src="${company.logo}" alt="logo" /></div>`
    : '';

  const tarifa = vehicleType
    ? `
      ${vehicleType.hourRate ? `<div class="right">Tarifa hora: ${formatCOP(vehicleType.hourRate)}</div>` : ''}
      ${vehicleType.dayMax ? `<div class="right">Tope día: ${formatCOP(vehicleType.dayMax)}</div>` : ''}
    `
    : '';

  const html = `
  <html>
    <head>
      <title>Ticket ${ticket.code || ticket.id}</title>
      <style>
        * { font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif; font-size: 11.5px; line-height: 1.4; }
        body { margin: 0; padding: 10px; width: 80mm; color: #000; }
        .center { text-align: center; }
        .right { text-align: right; }
        .bold { font-weight: 700; }
        .big { font-size: 22px; font-weight: 800; letter-spacing: 1px; }
        .logo { display: flex; justify-content: center; margin-bottom: 6px; }
        .logo img { max-width: 120px; height: auto; }
        hr { border: none; border-top: 1px dashed #000; margin: 6px 0; }
        .row { display: flex; justify-content: space-between; }
        .section-title { text-align: center; font-weight: 700; margin: 4px 0; }
        .footer { text-align: center; margin-top: 8px; font-size: 10.5px; }
      </style>
    </head>
    <body>
      ${logo}
      <div class="center bold">${company.name || 'Parqueadero'}</div>
      ${company.phone ? `<div class="center">Tel: ${company.phone}</div>` : ''}
      <hr />
      <div class="section-title">TICKET DE INGRESO</div>
      <div class="center big">${ticket.plate || ticket.code}</div>
      <div class="center">Código: ${ticket.code}</div>
      <hr />
      ${ticket.vehicleTypeName ? `<div class="row"><span>Tipo:</span><span class="bold">${ticket.vehicleTypeName}</span></div>` : ''}
      <div class="row"><span>Ingreso:</span><span class="bold">${formatDateTime(ticket.checkInAt)}</span></div>
      ${ticket.isMonthly ? `<div class="row"><span>Mensualidad:</span><span class="bold">Sí</span></div>` : ''}
      ${ticket.notes ? `<div class="row"><span>Nota:</span><span>${ticket.notes}</span></div>` : ''}
      ${tarifa ? `<hr />${tarifa}` : ''}
      <hr />
      <div class="footer">Conserve este ticket. El cobro se realiza a la salida según el tiempo.</div>

      <script>
        function doPrint(){ window.print(); setTimeout(() => window.close(), 500); }
        const images = document.images;
        let loaded = 0;
        if (images.length === 0) { doPrint(); }
        else {
          for (let img of images) {
            if (img.complete) { loaded++; }
            else { img.onload = img.onerror = () => { loaded++; if (loaded === images.length) doPrint(); }; }
          }
          if (loaded === images.length) doPrint();
        }
      </script>
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
  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();
}
