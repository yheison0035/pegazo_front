import { formatCOP, formatDateTime } from '@/lib/api/utils/utils';

// Imprime / guarda en PDF una COTIZACIÓN (presupuesto) para entregar al cliente.
// Documento tamaño carta/A4 (no es tiquete térmico): se ve profesional impreso
// o como PDF. No es una factura de venta.
export function printQuote(quote, usuario) {
  if (!quote) return;

  const c = usuario?.company || {};
  const accent = c.primaryColor || '#ea580c';
  const items = Array.isArray(quote.items) ? quote.items : [];

  const itemsHTML = items
    .map(
      (it, i) => `
      <tr>
        <td class="num muted">${i + 1}</td>
        <td>${it.name || 'Ítem'}</td>
        <td class="center num">${it.quantity}</td>
        <td class="right num">${formatCOP(it.price)}</td>
        <td class="right num bold">${formatCOP(it.subtotal)}</td>
      </tr>`,
    )
    .join('');

  const cust = quote.customer || {};
  const custHTML = cust.name
    ? `
      <div class="kv"><span class="k">Cliente</span><span class="v">${cust.name}</span></div>
      ${cust.document ? `<div class="kv"><span class="k">Documento</span><span class="v">${cust.document}</span></div>` : ''}
      ${cust.phone ? `<div class="kv"><span class="k">Teléfono</span><span class="v">${cust.phone}</span></div>` : ''}
    `
    : `<div class="kv"><span class="k">Cliente</span><span class="v muted">—</span></div>`;

  const html = `
  <html>
    <head>
      <meta charset="utf-8" />
      <title>Cotización ${quote.code || ''}</title>
      <style>
        * { box-sizing: border-box; }
        body {
          font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
          margin: 0; color: #1b1b1b; background: #fff;
          font-size: 13px; line-height: 1.5;
        }
        .sheet { max-width: 720px; margin: 0 auto; padding: 32px 28px; }
        .muted { color: #8a8a8a; }
        .center { text-align: center; }
        .right { text-align: right; }
        .bold { font-weight: 700; }
        .num { font-variant-numeric: tabular-nums; }

        .top { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
        .brand { display: flex; align-items: center; gap: 12px; }
        .brand img { height: 56px; width: 56px; object-fit: contain; border-radius: 12px; }
        .biz { font-size: 18px; font-weight: 800; }
        .biz-sub { font-size: 11px; color: #777; }
        .doc-badge {
          text-align: right;
        }
        .doc-badge .tag {
          display: inline-block; border: 2px solid ${accent}; color: ${accent};
          border-radius: 8px; padding: 4px 12px; font-weight: 800; letter-spacing: .5px;
        }
        .doc-badge .code { margin-top: 6px; font-weight: 700; }
        .doc-badge .date { font-size: 11px; color: #777; }

        hr { border: none; border-top: 1px solid #ececec; margin: 18px 0; }

        .eyebrow { font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #9a9a9a; margin-bottom: 6px; }
        .kv { display: flex; gap: 10px; margin: 2px 0; }
        .kv .k { color: #888; min-width: 90px; }
        .kv .v { font-weight: 600; }

        table { width: 100%; border-collapse: collapse; margin-top: 4px; }
        thead th { font-size: 10px; text-transform: uppercase; letter-spacing: .4px; color: #9a9a9a; text-align: left; padding: 8px 8px; border-bottom: 2px solid #1b1b1b; }
        thead th.center { text-align: center; } thead th.right { text-align: right; }
        tbody td { padding: 8px 8px; border-bottom: 1px solid #f0f0f0; vertical-align: top; }

        .total-box { display: flex; justify-content: flex-end; margin-top: 16px; }
        .total-box .inner { min-width: 240px; }
        .total-row { display: flex; justify-content: space-between; padding: 8px 10px; }
        .total-row.grand { background: #1b1b1b; color: #fff; border-radius: 8px; font-weight: 800; font-size: 15px; }

        .note { margin-top: 18px; border: 1px dashed #d8d8d8; border-radius: 10px; padding: 10px 12px; font-size: 12px; }
        .foot { margin-top: 24px; font-size: 10.5px; color: #9a9a9a; text-align: center; }

        @media print { .sheet { padding: 0; } @page { margin: 16mm; } }
      </style>
    </head>
    <body>
      <div class="sheet">
        <div class="top">
          <div class="brand">
            ${c.logo ? `<img src="${c.logo}" alt="${c.name || ''}" referrerpolicy="no-referrer" />` : ''}
            <div>
              <div class="biz">${c.name || ''}</div>
              ${c.nit ? `<div class="biz-sub">NIT ${c.nit}</div>` : ''}
              ${c.phone ? `<div class="biz-sub">Tel. ${c.phone}</div>` : ''}
              ${c.email ? `<div class="biz-sub">${c.email}</div>` : ''}
            </div>
          </div>
          <div class="doc-badge">
            <span class="tag">COTIZACIÓN</span>
            <div class="code">N° ${quote.code || '—'}</div>
            <div class="date">${formatDateTime(quote.createdAt || quote.date || new Date())}</div>
          </div>
        </div>

        <hr />

        <div class="eyebrow">Para</div>
        ${custHTML}

        <table>
          <thead>
            <tr>
              <th class="num" style="width:6%;">#</th>
              <th>Descripción</th>
              <th class="center" style="width:12%;">Cant.</th>
              <th class="right" style="width:18%;">Precio</th>
              <th class="right" style="width:20%;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML || '<tr><td colspan="5" class="center muted" style="padding:16px;">Sin ítems</td></tr>'}
          </tbody>
        </table>

        <div class="total-box">
          <div class="inner">
            <div class="total-row grand"><span>TOTAL</span><span class="num">${formatCOP(quote.total)}</span></div>
          </div>
        </div>

        ${quote.validUntil ? `<div class="note"><b>Validez:</b> esta cotización es válida hasta el ${formatDateTime(quote.validUntil)}. Precios sujetos a cambio y a disponibilidad.</div>` : `<div class="note">Precios sujetos a cambio y a disponibilidad.</div>`}

        ${quote.notes ? `<div class="note"><b>Notas:</b> ${quote.notes}</div>` : ''}

        <div class="foot">
          Este documento es una cotización (presupuesto), no constituye factura de venta.
        </div>
      </div>

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
