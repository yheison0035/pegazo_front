import { formatCOP, formatDateTime } from '@/lib/api/utils/utils';

// Comprobante de custodia (guarda cascos) — MISMO diseño que la factura de venta
// (logo, encabezado de empresa, régimen, QR y pie), pero con la información del
// ingreso: cliente, quién recibe, cascos, lavado, tarifas y observación.
export function printCustodyTicket(ticket, usuario, settings) {
  if (!ticket) return;

  const modeLabel =
    ticket.billingMode === 'DIA'
      ? 'Por día'
      : ticket.billingMode === 'MENSUALIDAD'
        ? 'Mensualidad'
        : 'Por hora';

  const responsableIVA = usuario?.company?.responsableIVA ?? false;
  const regimenText = responsableIVA
    ? 'Responsable de IVA'
    : 'No responsable de IVA';

  const tarifasHTML = `
    ${settings?.hourRate ? `<div class="right">Tarifa por hora: ${formatCOP(settings.hourRate)}</div>` : ''}
    ${settings?.dayRate ? `<div class="right">Tarifa por día: ${formatCOP(settings.dayRate)}</div>` : ''}
    ${settings?.washPrice ? `<div class="right">Lavado (c/u): ${formatCOP(settings.washPrice)}</div>` : ''}
  `;

  const html = `
  <html>
    <head>
      <title>Comprobante ${ticket.id}</title>
      <style>
        * { font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif; font-size: 11.5px; line-height: 1.4; }
        body { margin: 0; padding: 10px; width: 80mm; color: #000; }
        .center { text-align: center; }
        .right { text-align: right; }
        .bold { font-weight: 700; }
        .logo { display: flex; justify-content: center; margin-bottom: 6px; }
        .logo img { max-width: 120px; height: auto; }
        hr { border: none; border-top: 1px solid #000; margin: 6px 0; }
        .section-title { text-align: center; font-weight: 700; margin: 4px 0; }
        .big { text-align: center; font-weight: 700; font-size: 15px; margin: 4px 0; }
        .footer { font-size: 10px; text-align: center; margin-top: 8px; color: #333; }
        @media print { body { width: 80mm; } }
      </style>
    </head>
    <body>
      <div class="logo">
        <img src=${usuario?.company?.logo || '/images/no-image.png'} alt=${usuario?.company?.name || 'sin nombre'} referrerpolicy="no-referrer" />
      </div>

      <div class="center bold">${usuario?.company?.name || ''}</div>
      ${usuario?.company?.nit ? `<div class="center">NIT ${usuario.company.nit}</div>` : ''}
      ${usuario?.company?.phone ? `<div class="center">+57 ${usuario.company.phone}</div>` : ''}
      <div class="center">${usuario?.company?.email || ''}</div>
      <div class="center">Régimen: ${regimenText}</div>

      <hr />

      <div class="section-title">Comprobante de custodia</div>
      <div class="big">N° ${ticket.id}</div>
      <div class="center">Guarde este comprobante para reclamar su(s) casco(s)</div>

      <hr />

      <div class="bold">${ticket.customerName ? 'Cliente: ' + ticket.customerName : ticket.plate ? 'Placa: ' + ticket.plate : 'Cliente: -------'}</div>
      ${ticket.customerPhone ? `<div><span class="bold">Celular:</span> ${ticket.customerPhone}</div>` : ''}
      ${ticket.customerEmail ? `<div><span class="bold">Correo:</span> ${ticket.customerEmail}</div>` : ''}
      ${ticket.receivedByName ? `<div><span class="bold">Recibió:</span> ${ticket.receivedByName}</div>` : ''}

      <hr />

      <div><span class="bold">Fecha de ingreso:</span> ${formatDateTime(ticket.checkInAt)}</div>
      <div><span class="bold">N° de cascos:</span> ${ticket.helmetCount || 1}</div>
      ${ticket.washRequested ? `<div><span class="bold">Lavado:</span> ${ticket.washCount || ticket.helmetCount} casco(s)</div>` : ''}
      <div><span class="bold">Forma de cobro:</span> ${modeLabel}</div>

      <hr />

      ${tarifasHTML}

      ${
        ticket.notes
          ? `<hr /><div style="border:1px solid #f2f4f8; padding:6px; font-size:11px; text-align:left;">
        <div style="font-weight:700; margin-bottom:4px;">Observaciones:</div>
        <div>${ticket.notes}</div>
      </div>`
          : ''
      }

      <hr />

      <div class="center bold">Comprobante de custodia</div>

      <hr />
      <div class="footer">Presente este comprobante para reclamar su(s) casco(s). El cobro se realiza al momento de la entrega.</div>

      <script>
        const images = document.images;
        let loaded = 0;
        function doPrint(){ window.print(); setTimeout(() => window.close(), 500); }
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

// `opts` permite forzar la identificación cuando la venta no tiene cliente
// registrado (guarda cascos: se recibió por nombre o por placa).
export function printSaleInvoice(sale, usuario, opts = {}) {
  if (!sale) return;

  // Dominio público fijo (pegazo.co), sin variable de entorno ni origen actual.
  const verifyUrl = `https://pegazo.co/verifyCodeSale?code=${sale.code}`;

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
    verifyUrl
  )}`;

  const hidePlaceholder = (c) =>
    c && !['ÚNICO', 'UNICO', 'GENERAL'].includes(String(c).toUpperCase())
      ? c
      : null;
  const itemsHTML = sale.items
    .map((item) => {
      const name =
        item?.variant?.inventory?.name || item?.service?.name || 'Ítem';
      const color = hidePlaceholder(item?.variant?.color);
      const disc = Number(item?.discount) || 0;
      return `
      <tr>
        <td style="width:52%;">
          <div class="it-name">${name}</div>
          ${color ? `<div class="muted sm">${color}</div>` : ''}
          ${disc > 0 ? `<div class="muted sm">Desc. ${formatCOP(disc)}</div>` : ''}
        </td>
        <td style="width:12%; text-align:center;" class="num">${item?.quantity}</td>
        <td style="width:18%; text-align:right;" class="num">${formatCOP(item?.price)}</td>
        <td style="width:18%; text-align:right;" class="num bold">${formatCOP(item?.subtotal)}</td>
      </tr>
    `;
    })
    .join('');

  // Config fiscal de la venta (respeta el IVA que calculó el POS/backend).
  // responsableIVA puede venir en la venta (verify) o en la empresa del usuario;
  // como respaldo, si hay IVA cobrado se asume responsable.
  const taxTotal = Number(sale?.taxTotal) || 0;
  const totalAmount = Number(sale?.totalAmount) || 0;
  const baseGravable = Number(sale?.subtotal) || totalAmount;
  // Efectivo recibido y cambio (solo ventas en efectivo con recibido guardado).
  const cashReceived = Number(sale?.cashReceived) || 0;
  const showCash = sale?.paymentMethod === 'EFECTIVO' && cashReceived > 0;
  const changeDue = showCash ? Math.max(0, cashReceived - totalAmount) : 0;
  const showTax = taxTotal > 0;
  const responsableIVA =
    sale?.responsableIVA ??
    usuario?.company?.responsableIVA ??
    showTax;
  const regimenText = responsableIVA
    ? 'Responsable de IVA'
    : 'No responsable de IVA';
  // El pie legal (letra de cambio / centrales de riesgo) solo aplica a ventas a
  // crédito (fiado), no a las de contado.
  const isCredito = sale?.paymentStatus === 'FIADO';

  // Plan separe (apartado): se marca el comprobante y se muestra abonado/saldo.
  const isLayaway = sale?.paymentStatus === 'PLAN_SEPARE';
  const paid = Number(opts?.paid) || 0;
  const saldo =
    opts?.saldo != null ? Number(opts.saldo) : Math.max(0, totalAmount - paid);
  const layawayTotalsHTML = isLayaway
    ? `
      <div class="totline" style="margin-top:5px;">
        <span class="k">Abonado</span>
        <span class="num" style="color:#1b8a4b; font-weight:700;">${formatCOP(paid)}</span>
      </div>
      <div class="saldo-box">
        <span>Saldo pendiente</span>
        <span class="num">${formatCOP(saldo)}</span>
      </div>
    `
    : '';

  // Detalle de abonos del plan separe (con fecha y método).
  const abonos = isLayaway ? opts?.payments || [] : [];
  const abonosHTML = abonos.length
    ? `
      <div class="eyebrow">Abonos</div>
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Método</th>
            <th style="text-align:right;">Valor</th>
          </tr>
        </thead>
        <tbody>
          ${abonos
            .map(
              (p) => `
          <tr>
            <td style="text-align:left;">${formatDateTime(p?.paidAt)}</td>
            <td style="text-align:left;">${p?.method || '-'}</td>
            <td style="text-align:right;">${formatCOP(p?.amount)}</td>
          </tr>`,
            )
            .join('')}
        </tbody>
      </table>
      <hr />
    `
    : '';

  const totalsHTML =
    (showTax
      ? `
      <div class="totline"><span class="k">Base gravable</span><span class="num">${formatCOP(
        baseGravable
      )}</span></div>
      <div class="totline"><span class="k">IVA</span><span class="num">${formatCOP(
        taxTotal
      )}</span></div>
    `
      : `
      <div class="totline"><span class="k">Subtotal</span><span class="num">${formatCOP(
        totalAmount
      )}</span></div>
    `) +
    `<div class="total-box"><span>TOTAL</span><span class="num">${formatCOP(
      totalAmount
    )}</span></div>` +
    layawayTotalsHTML;

  const html = `
  <html>
    <head>
      <title>Factura ${sale?.code}</title>
      <style>
        * { box-sizing: border-box; }

        body {
          font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
          margin: 0;
          padding: 12px;
          width: 80mm;
          color: #1b1b1b;
          font-size: 11.5px;
          line-height: 1.45;
          -webkit-font-smoothing: antialiased;
        }

        .center { text-align: center; }
        .right { text-align: right; }
        .bold { font-weight: 700; }
        .muted { color: #888; }
        .sm { font-size: 10px; }
        .num { font-variant-numeric: tabular-nums; }

        .logo { display: flex; justify-content: center; margin-bottom: 8px; }
        .logo img { max-width: 110px; height: auto; }

        .biz-name {
          font-size: 14px;
          font-weight: 800;
          letter-spacing: 0.3px;
          margin-bottom: 1px;
        }

        /* Separador punteado, discreto */
        hr {
          border: none;
          border-top: 1px dashed #c4c4c4;
          margin: 9px 0;
        }

        /* Etiqueta de sección (eyebrow) */
        .eyebrow {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 1.3px;
          text-transform: uppercase;
          color: #9a9a9a;
          margin-bottom: 4px;
        }

        /* Sello (Plan separe / Factura) */
        .stamp {
          display: inline-block;
          border: 1.5px solid #1b1b1b;
          border-radius: 7px;
          padding: 4px 12px;
          font-weight: 800;
          letter-spacing: 0.5px;
          font-size: 12px;
        }

        /* Filas clave:valor */
        .kv { display: flex; justify-content: space-between; gap: 10px; margin: 2px 0; }
        .kv .k { color: #888; }
        .kv .v { font-weight: 600; text-align: right; }

        table { width: 100%; border-collapse: collapse; }
        thead th {
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          color: #9a9a9a;
          font-weight: 700;
          padding: 0 0 5px;
          border-bottom: 1px solid #e0e0e0;
        }
        tbody td { padding: 4px 0; vertical-align: top; border-bottom: 1px dotted #ececec; }
        .it-name { font-weight: 600; }

        /* Totales */
        .totals { margin-top: 4px; }
        .totline { display: flex; justify-content: space-between; margin: 2px 0; }
        .totline .k { color: #888; }
        .total-box {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-top: 6px;
          padding-top: 6px;
          border-top: 2px solid #1b1b1b;
          font-weight: 800;
          font-size: 13.5px;
        }
        .saldo-box {
          display: flex;
          justify-content: space-between;
          margin-top: 7px;
          padding: 6px 9px;
          border: 1.5px solid #1b1b1b;
          border-radius: 7px;
          font-weight: 800;
        }

        .qr { display: flex; justify-content: center; margin-top: 4px; }
        .qr img { width: 94px; height: 94px; }

        .note-box {
          border: 1px dashed #d0d0d0;
          border-radius: 6px;
          padding: 7px 9px;
          font-size: 10.5px;
          text-align: left;
        }

        .footer { font-size: 9px; text-align: center; margin-top: 10px; color: #9a9a9a; }

        @media print { body { width: 80mm; } }
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
      <div class="center biz-name">${usuario?.company?.name || ''}</div>
      ${usuario?.company?.nit ? `<div class="center muted sm">NIT ${usuario.company.nit}</div>` : ''}
      ${sale?.local?.address ? `<div class="center muted sm">${sale.local.address}</div>` : ''}
      ${usuario?.company?.phone ? `<div class="center muted sm">+57 ${usuario.company.phone}</div>` : ''}
      ${usuario?.company?.email ? `<div class="center muted sm">${usuario.company.email}</div>` : ''}
      <div class="center muted sm">${regimenText}</div>

      <hr />

      <!-- CLIENTE -->
      <div class="eyebrow">Cliente</div>
      ${(() => {
        const c = sale?.customer;
        const name = c?.name || opts.customerName;
        if (name) {
          return `<div class="kv"><span class="k">Nombre</span><span class="v">${name}</span></div>
      <div class="kv"><span class="k">Documento</span><span class="v">${c?.document || '—'}</span></div>
      ${c?.address ? `<div class="kv"><span class="k">Dirección</span><span class="v">${c.address}</span></div>` : ''}
      ${c?.city ? `<div class="kv"><span class="k">Ciudad</span><span class="v">${c.city}</span></div>` : ''}`;
        }
        if (opts.plate) {
          return `<div class="kv"><span class="k">Placa</span><span class="v">${opts.plate}</span></div>`;
        }
        return `<div class="kv"><span class="k">Nombre</span><span class="v muted">Consumidor final</span></div>`;
      })()}

      <hr />

      <!-- FACTURA -->
      <div class="center" style="margin: 2px 0 5px;">
        <span class="stamp">${isLayaway ? 'PLAN SEPARE' : 'FACTURA DE VENTA'}</span>
      </div>
      <div class="center bold">N° ${sale?.code || '000000'}</div>
      ${
        isLayaway
          ? '<div class="center muted sm">Comprobante de apartado — no es la factura final de entrega</div>'
          : ''
      }

      <hr />

      <div class="kv"><span class="k">Fecha</span><span class="v">${formatDateTime(
        sale?.saleDate || sale?.createdAt
      )}</span></div>
      <div class="kv"><span class="k">Forma de pago</span><span class="v">${
        isLayaway
          ? 'Plan separe'
          : sale?.paymentStatus === 'FIADO'
            ? 'Crédito'
            : 'Contado'
      }</span></div>
      <div class="kv"><span class="k">Método de pago</span><span class="v">${
        sale?.paymentMethod || '—'
      }</span></div>
      ${
        showCash
          ? `<div class="kv"><span class="k">Efectivo recibido</span><span class="v num">${formatCOP(
              cashReceived
            )}</span></div>
      <div class="kv"><span class="k">Cambio</span><span class="v num">${formatCOP(
        changeDue
      )}</span></div>`
          : ''
      }
      <div class="kv"><span class="k">Vendedor</span><span class="v">${sale?.user?.name || '—'}</span></div>

      <hr />

      <!-- PRODUCTOS -->
      <div class="eyebrow">Detalle</div>
      <table>
        <thead>
          <tr>
            <th>Producto</th>
            <th style="text-align:center;">Cant</th>
            <th style="text-align:right;">Precio</th>
            <th style="text-align:right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>

      <hr />

      <div class="totals">${totalsHTML}</div>

      <hr />

      ${abonosHTML}

      ${
        sale?.notes
          ? `
      <!-- OBSERVACIONES -->
      <div class="note-box">
        <div class="eyebrow" style="margin-bottom:3px;">Observaciones</div>
        <div>${sale?.notes}</div>
      </div>

      <hr />
    `
          : ''
      }

      <!-- QR -->
      <div class="center muted sm">${
        isLayaway ? 'Consulte su plan separe' : 'Verifique su factura'
      }</div>
      <div class="qr">
        <img
          src="${qrUrl}"
          alt="QR de verificación"
          referrerpolicy="no-referrer"
        />
      </div>
      <div class="center muted" style="font-size:9px;">
        Escanee el código para validar en línea
      </div>

      <hr />

      ${
        isCredito
          ? `<div class="footer">
        Este documento se asimila en todos sus efectos a una letra de cambio
        de conformidad con el Art. 774 del código de comercio.
        En caso de incumplimiento, podrá reportarse a centrales de riesgo.
      </div>`
          : `<div class="footer">Gracias por su compra.</div>`
      }

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
