import { formatCOP, formatDateTime } from '@/lib/api/utils/utils';

// Impresión térmica (80mm) de una FACTURA ELECTRÓNICA DIAN, con su número
// autorizado, CUFE y el QR al catálogo oficial de la DIAN.
//   sale = venta del CRM (items, cliente, totales)
//   doc  = documento fiscal emitido { number, cufe, status } (de /fiscal/emit)
export function printFiscalInvoice(sale, doc, usuario) {
  if (!sale || !doc) return;

  const cufe = doc.cufe || '';
  // El QR de la DIAN apunta al catálogo de consulta con el CUFE.
  const verifyUrl = `https://catalogo-vpfe.dian.gov.co/document/searchqr?documentkey=${cufe}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
    verifyUrl,
  )}`;
  const esPrueba = doc.status && doc.status !== 'ACEPTADO';

  const itemsHTML = (sale.items || [])
    .map(
      (item, i) => `
      <tr>
        <td style="width:5%;">${i + 1}</td>
        <td style="width:55%;">${
          item?.variant?.inventory?.name || item?.service?.name || 'Ítem'
        }</td>
        <td style="width:10%; text-align:center;">${item?.quantity}</td>
        <td style="width:15%; text-align:right;">${formatCOP(item?.price)}</td>
        <td style="width:15%; text-align:right;">${formatCOP(
          item?.subtotal ?? item?.price * item?.quantity,
        )}</td>
      </tr>`,
    )
    .join('');

  const taxTotal = Number(sale?.taxTotal) || 0;
  const totalAmount = Number(sale?.totalAmount) || 0;
  const baseGravable = Number(sale?.subtotal) || totalAmount;
  const showTax = taxTotal > 0;

  const totalsHTML = showTax
    ? `<div class="right">Base gravable: ${formatCOP(baseGravable)}</div>
       <div class="right">IVA: ${formatCOP(taxTotal)}</div>
       <div class="right bold">Total: ${formatCOP(totalAmount)}</div>`
    : `<div class="right bold">Total: ${formatCOP(totalAmount)}</div>`;

  const html = `
  <html>
    <head>
      <title>Factura electrónica ${doc.number || ''}</title>
      <style>
        * { font-family: "Segoe UI","Helvetica Neue",Arial,sans-serif; font-size: 11.5px; line-height: 1.4; }
        body { margin: 0; padding: 10px; width: 80mm; color: #000; }
        .center { text-align: center; } .right { text-align: right; } .bold { font-weight: 700; }
        .logo { display:flex; justify-content:center; margin-bottom:6px; }
        .logo img { max-width: 120px; height: auto; }
        .tag { display:inline-block; border:1px solid #000; padding:1px 6px; border-radius:4px; font-weight:700; font-size:10px; }
        .qr { display:flex; justify-content:center; margin-top:6px; }
        .qr img { width: 110px; height: 110px; }
        hr { border:none; border-top:1px solid #000; margin:6px 0; }
        table { width:100%; border-collapse:collapse; }
        td { padding:2px 0; vertical-align:top; }
        .section-title { text-align:center; font-weight:700; margin:4px 0; }
        .cufe { font-size:9px; word-break:break-all; text-align:center; color:#333; }
        .footer { font-size:10px; text-align:center; margin-top:8px; color:#333; }
        @media print { body { width: 80mm; } }
      </style>
    </head>
    <body>
      <div class="logo">
        <img src=${usuario?.company?.logo || '/images/no-image.png'} referrerpolicy="no-referrer" />
      </div>
      <div class="center bold">${usuario?.company?.name || ''}</div>
      ${usuario?.company?.nit ? `<div class="center">NIT ${usuario.company.nit}</div>` : ''}
      <div class="center">${sale?.local?.address || ''}</div>
      ${usuario?.company?.email ? `<div class="center">${usuario.company.email}</div>` : ''}

      <hr />
      <div class="section-title">FACTURA ELECTRÓNICA DE VENTA</div>
      <div class="center bold">N° ${doc.number || '---'}</div>
      ${esPrueba ? '<div class="center"><span class="tag">PRUEBAS · HABILITACIÓN</span></div>' : ''}
      <hr />

      <div class="bold">Cliente: ${sale?.customer?.name || 'Consumidor Final'}</div>
      <div><span class="bold">Documento:</span> ${sale?.customer?.document || '-------'}</div>
      ${sale?.customer?.address ? `<div><span class="bold">Dirección:</span> ${sale.customer.address}</div>` : ''}
      <div><span class="bold">Fecha:</span> ${formatDateTime(sale?.saleDate || sale?.createdAt || new Date())}</div>
      <div><span class="bold">Método de pago:</span> ${sale?.paymentMethod || '---'}</div>

      <hr />
      <table>
        <thead>
          <tr class="bold">
            <td>#</td><td>Producto</td>
            <td style="text-align:center;">Cant</td>
            <td style="text-align:right;">Precio</td>
            <td style="text-align:right;">Total</td>
          </tr>
        </thead>
        <tbody>${itemsHTML}</tbody>
      </table>
      <hr />
      ${totalsHTML}
      <hr />

      <div class="center bold">Validación previa DIAN</div>
      <div class="qr">
        <img src="${qrUrl}" alt="QR DIAN" referrerpolicy="no-referrer" />
      </div>
      <div class="center" style="font-size:10px;">CUFE</div>
      <div class="cufe">${cufe}</div>

      <hr />
      <div class="footer">Gracias por su compra.</div>

      <script>
        const images = document.images; let loaded = 0;
        function doPrint(){ window.print(); setTimeout(()=>window.close(), 500); }
        if (images.length === 0) doPrint();
        else { for (let img of images){ if (img.complete) loaded++; else img.onload = img.onerror = () => { loaded++; if (loaded===images.length) doPrint(); }; } if (loaded===images.length) doPrint(); }
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
  const d = iframe.contentWindow.document;
  d.open();
  d.write(html);
  d.close();
}
