import { formatCOP, formatDateTime } from '@/lib/api/utils/utils';

export function printSaleInvoice(sale, usuario) {
  if (!sale) return;

  // Dominio público fijo (pegazo.co), sin variable de entorno ni origen actual.
  const verifyUrl = `https://pegazo.co/verifyCodeSale?code=${sale.code}`;

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
    verifyUrl
  )}`;

  const itemsHTML = sale.items
    .map(
      (item, index) => `
      <tr>
        <td style="width:5%;">${index + 1}</td>
        <td style="width:55%;">
          ${item?.variant?.inventory?.name || item?.service?.name}
          <br />
          <span style="font-size:10px; color:#555;">${item?.variant?.color || '-'}</span>
        </td>
        <td style="width:10%; text-align:center;">${item?.quantity}</td>
        <td style="width:15%; text-align:right;">${formatCOP(item?.price)}</td>
        <td style="width:15%; text-align:right;">${formatCOP(
          item?.discount
        )}</td>
        <td style="width:15%; text-align:right;">${formatCOP(
          item?.subtotal
        )}</td>
      </tr>
    `
    )
    .join('');

  const html = `
  <html>
    <head>
      <title>Factura ${sale?.code}</title>
      <style>
        * {
          font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
          font-size: 11.5px;
          line-height: 1.4;
        }

        body {
          margin: 0;
          padding: 10px;
          width: 80mm;
          color: #000;
        }

        .center { text-align: center; }
        .right { text-align: right; }
        .bold { font-weight: 700; }

        .logo {
          display: flex;
          justify-content: center;
          margin-bottom: 6px;
        }

        .logo img {
          max-width: 120px;
          height: auto;
        }

        .qr {
          display: flex;
          justify-content: center;
          margin-top: 6px;
        }

        .qr img {
          width: 100px;
          height: 100px;
        }

        hr {
          border: none;
          border-top: 1px solid #000;
          margin: 6px 0;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        td {
          padding: 2px 0;
          vertical-align: top;
        }

        .section-title {
          text-align: center;
          font-weight: 700;
          margin: 4px 0;
        }

        .footer {
          font-size: 10px;
          text-align: center;
          margin-top: 8px;
          color: #333;
        }

        @media print {
          body {
            width: 80mm;
          }
        }
      </style>
    </head>
    <body>

      <!-- LOGO -->
      <div class="logo">
        <img 
          src=${usuario?.company?.logo || '/images/no-image.png'}
          alt=${usuario?.company?.name || 'sin nombre'}
          referrerpolicy="no-referrer"
        />
      </div>

      <!-- ENCABEZADO -->
      <div class="center bold">${usuario?.company?.name || ''}</div>
      ${usuario?.company?.nit ? `<div class="center">NIT ${usuario.company.nit}</div>` : ''}
      <div class="center">${sale?.local?.address || ''}</div>
      ${usuario?.company?.phone ? `<div class="center">+57 ${usuario.company.phone}</div>` : ''}
      <div class="center">${usuario?.company?.email || ''}</div>
      <div class="center">Régimen: No responsable de IVA</div>

      <hr />

      <!-- CLIENTE -->
      <div class="bold">Cliente: ${
        sale?.customer?.name || 'NOMBRE DEL CLIENTE'
      }</div>
      <div><span class="bold">Documento:</span> ${
        sale?.customer?.document || '-------'
      }</div>
      <div><span class="bold">Dirección:</span> ${
        sale?.customer?.address || '-------'
      }</div>
      <div><span class="bold">Ciudad:</span> ${
        sale?.customer?.city || '-------'
      }</div>

      <hr />

      <!-- FACTURA -->
      <div class="section-title">Factura de venta</div>
      <div class="center bold">N° ${sale?.code || '000000'}</div>

      <hr />

      <div><span class="bold">Fecha:</span> ${formatDateTime(
        sale?.saleDate || sale?.createdAt
      )}</div>
      <div><span class="bold">Forma de pago:</span> ${
        sale?.paymentStatus === 'FIADO' ? 'Crédito' : 'Contado'
      }</div>
      <div><span class="bold">Método de pago:</span> ${
        sale?.paymentMethod || '---'
      }</div>
      <div><span class="bold">Vendedor:</span> ${sale?.user?.name || '---'}</div>

      <hr />

      <!-- PRODUCTOS -->
      <table>
        <thead>
          <tr class="bold">
            <td>#</td>
            <td>Producto</td>
            <td style="text-align:center;">Cant</td>
            <td style="text-align:right;">Precio</td>
            <td style="text-align:right;">Desc.</td>
            <td style="text-align:right;">Total</td>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>

      <hr />

      <div class="right bold">Subtotal: ${formatCOP(sale?.totalAmount)}</div>
      <div class="right bold">Total: ${formatCOP(sale?.totalAmount)}</div>

      <hr />

      ${
        sale?.notes
          ? `
      <!-- OBSERVACIONES -->
      <div style="
        border: 1px solid #f2f4f8;
        padding: 6px;
        font-size: 11px;
        text-align: left;
      ">
        <div style="font-weight:700; margin-bottom:4px;">
          Observaciones:
        </div>
        <div>
          ${sale?.notes}
        </div>
      </div>
    `
          : ''
      }

      <!-- QR -->
      <div class="center bold">Verifique su factura</div>
      <div class="qr">
        <img 
          src="${qrUrl}" 
          alt="QR de verificación" 
          referrerpolicy="no-referrer"
        />
      </div>
      <div class="center" style="font-size:10px;">
        Escanee para validar su compra
      </div>

      <hr />

      <div class="footer">
        Este documento se asimila en todos sus efectos a una letra de cambio
        de conformidad con el Art. 774 del código de comercio.
        En caso de incumplimiento, podrá reportarse a centrales de riesgo.
      </div>

      <script>
        const images = document.images;
        let loaded = 0;

        function doPrint() {
            window.print();
            setTimeout(() => window.close(), 500); // opcional: cerrar después
        }

        if (images.length === 0) {
            doPrint();
        } else {
            for (let img of images) {
            if (img.complete) {
                loaded++;
            } else {
                img.onload = img.onerror = () => {
                loaded++;
                if (loaded === images.length) {
                    doPrint();
                }
                };
            }
            }

            if (loaded === images.length) {
            doPrint();
            }
        }
        </script>
    </body>
  </html>
  `;

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
