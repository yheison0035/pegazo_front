// Páginas de soluciones (SEO por vertical y por keyword comercial). Cada objeto
// genera una página estática en /soluciones/<slug> con su propio H1, contenido,
// FAQ, JSON-LD (SoftwareApplication + FAQPage + BreadcrumbList) y enlaces
// internos. Son las páginas que posicionan por búsquedas de alta intención como
// "software punto de venta", "software para restaurantes", "software contable",
// etc. Para agregar una, añade un objeto con `slug` único a SOLUTIONS.
//
// Importante (SEO honesto): cada página es ÚNICA. Nada de copiar/pegar texto
// entre verticales; Google penaliza el contenido duplicado o inflado con
// keywords. El vocabulario y los ejemplos son específicos de cada negocio.

export const SOLUTIONS_BASE = 'https://pegazo.co/soluciones';

export const SOLUTIONS = [
  // ---------------------------------------------------------------------------
  // KEYWORDS GENÉRICAS (alta intención comercial)
  // ---------------------------------------------------------------------------
  {
    slug: 'software-punto-de-venta',
    eyebrow: 'Punto de venta (POS)',
    metaTitle: 'Software de punto de venta (POS) en Colombia',
    h1: 'Software de punto de venta para tu negocio',
    metaDescription:
      'Pegazo es el software de punto de venta (POS) en la nube para Colombia: cobra en segundos con efectivo, tarjeta, transferencia o fiado, descuenta el inventario solo y cuadra la caja sin cuentas a mano.',
    keywords: [
      'software punto de venta',
      'sistema POS Colombia',
      'programa punto de venta',
      'software POS en la nube',
      'caja registradora digital',
    ],
    intro:
      'Un punto de venta es el corazón de tu negocio: desde ahí cobras, descuentas inventario y entiendes cómo va tu plata. Pegazo es un POS en la nube que abres desde el computador, la tablet o el celular, sin instalar nada ni depender de un técnico.',
    features: [
      ['Cobro en segundos', 'Efectivo, tarjeta, transferencia o fiado, con cálculo de cambio automático.'],
      ['Inventario que se descuenta solo', 'Cada venta baja el stock en tiempo real, con alertas de productos por agotarse.'],
      ['Cierre de caja sin dolor', 'Cuadra el efectivo del día en un clic, sin cuentas en papel.'],
      ['Varios medios de pago', 'Divide un pago, registra abonos y deja todo cuadrado.'],
      ['Multi-sede', 'Si abres otro local, ves cada uno por separado y todo junto.'],
      ['Tienda online conectada', 'Vende por internet sin volver a cargar el inventario.'],
    ],
    closing:
      'Lo mejor: Pegazo se adapta a tu negocio, no al revés. Configuras tu tipo de negocio y el POS muestra solo lo que necesitas, con tu vocabulario.',
    faq: [
      ['¿Necesito un equipo especial para usar el POS?', 'No. Pegazo funciona desde cualquier computador, tablet o celular con navegador. Si ya tienes impresora de tirilla o lector de código de barras, también los puedes usar.'],
      ['¿Puedo vender fiado desde el punto de venta?', 'Sí. Registras la venta a crédito, queda asociada al cliente y el sistema te recuerda las cuotas para que no se pierda plata.'],
      ['¿Sirve si vendo por peso?', 'Sí. Puedes vender por unidad o por kilo, libra y arroba con decimales, ideal para fruver, carnicería o granero.'],
    ],
    related: ['software-de-facturacion', 'software-de-inventario', 'software-para-tiendas-y-minimercados'],
  },
  {
    slug: 'software-de-facturacion',
    eyebrow: 'Facturación',
    metaTitle: 'Software de facturación para negocios en Colombia',
    h1: 'Software de facturación simple para tu negocio',
    metaDescription:
      'Factura tus ventas en segundos con Pegazo: tiquete o comprobante, notas, envío por correo o WhatsApp y todo descontando del inventario. Factura electrónica DIAN en camino, sin costo por documento.',
    keywords: [
      'software de facturación Colombia',
      'programa de facturación',
      'facturación electrónica DIAN',
      'software para facturar',
      'facturar por WhatsApp',
    ],
    intro:
      'Facturar no debería quitarte tiempo de vender. Con Pegazo emites el comprobante de cada venta al instante, se lo envías al cliente por correo o WhatsApp y el inventario se actualiza solo. Sin plantillas de Excel ni cuentas a mano.',
    features: [
      ['Factura al vender', 'El comprobante sale de la misma venta, sin volver a digitar nada.'],
      ['Envío por WhatsApp o correo', 'Tu cliente recibe su documento en segundos, con el detalle de lo que compró.'],
      ['Notas y devoluciones', 'Corrige, anula o haz una nota de crédito sin descuadrar tu caja.'],
      ['Conectada al inventario', 'Lo facturado se descuenta del stock automáticamente.'],
      ['Historial ordenado', 'Encuentra cualquier factura por cliente, fecha o producto.'],
      ['Factura electrónica en camino', 'Estamos integrando la factura y nómina electrónica directo ante la DIAN, sin costo por documento.'],
    ],
    closing:
      'Mientras llega la factura electrónica, ya facturas y gestionas todo tu negocio con normalidad desde un solo lugar.',
    faq: [
      ['¿Pegazo emite factura electrónica DIAN?', 'Estamos integrando la factura y la nómina electrónica directo ante la DIAN, sin costo por documento y con el certificado incluido. Mientras tanto, facturas y gestionas tu negocio con normalidad.'],
      ['¿Puedo enviar la factura por WhatsApp?', 'Sí. Puedes enviar el comprobante de venta por WhatsApp o correo al cliente en el momento de la compra.'],
      ['¿La facturación descuenta del inventario?', 'Sí. Cada venta facturada descuenta el stock en tiempo real, así tu inventario siempre refleja la realidad.'],
    ],
    related: ['software-punto-de-venta', 'software-contable', 'software-de-inventario'],
  },
  {
    slug: 'software-contable',
    eyebrow: 'Finanzas del negocio',
    metaTitle: 'Software para el control contable de tu negocio',
    h1: 'Controla las finanzas de tu negocio en un solo lugar',
    metaDescription:
      'Lleva ingresos, gastos, utilidad y reportes de tu negocio con Pegazo. Datos ordenados y listos para tu contador, sin cuadernos ni Excel. Factura electrónica DIAN en camino.',
    keywords: [
      'software contable Colombia',
      'control de ingresos y gastos',
      'software para pymes',
      'reportes de ventas y utilidad',
      'software administrativo',
    ],
    intro:
      'No necesitas ser contador para saber cómo va tu negocio. Pegazo registra cada venta y cada gasto, calcula tu utilidad y te muestra reportes claros, para que tomes decisiones con datos y le entregues todo ordenado a tu contador.',
    features: [
      ['Ingresos y gastos en orden', 'Registra lo que entra y lo que sale, por categoría, sin cuadernos.'],
      ['Utilidad real', 'Mira cuánto deja tu negocio de verdad, no solo cuánto vendiste.'],
      ['Reportes claros', 'Ventas del día, semana o mes y qué producto deja más margen.'],
      ['Cierre de caja', 'Cuadra el efectivo cada día y detecta diferencias a tiempo.'],
      ['Listo para tu contador', 'Exporta la información ordenada para la declaración, sin armar nada a mano.'],
      ['Factura electrónica en camino', 'Integración directa con la DIAN, sin costo por documento.'],
    ],
    closing:
      'Pegazo no reemplaza a tu contador: le da datos limpios y te da a ti el control diario de tu plata.',
    faq: [
      ['¿Pegazo es un software contable completo?', 'Pegazo controla ingresos, gastos, utilidad, caja y reportes de tu negocio, y deja la información ordenada para tu contador. La factura y nómina electrónica ante la DIAN están en camino.'],
      ['¿Puedo ver cuánto estoy ganando de verdad?', 'Sí. Al registrar ventas y gastos, Pegazo calcula tu utilidad y te muestra reportes para que sepas qué productos y días dejan más.'],
      ['¿Sirve para entregarle la información a mi contador?', 'Sí. La idea es que tu contador reciba datos limpios y ordenados en vez de cuadernos o archivos sueltos.'],
    ],
    related: ['software-de-facturacion', 'software-punto-de-venta', 'crm-para-negocios'],
  },
  {
    slug: 'software-de-inventario',
    eyebrow: 'Inventario',
    metaTitle: 'Software de control de inventario en Colombia',
    h1: 'Control de inventario en tiempo real',
    metaDescription:
      'Controla el stock de tu negocio con Pegazo: se descuenta solo al vender, te avisa de lo que se agota y maneja varias sedes. Por unidad o por peso, con códigos de barras.',
    keywords: [
      'software de inventario',
      'control de inventario Colombia',
      'gestión de stock',
      'sistema de inventario para negocio',
      'inventario multi sede',
    ],
    intro:
      'El inventario descuadrado es plata que se pierde sin que te des cuenta. Pegazo mantiene tu stock al día: al vender se descuenta solo, te avisa de lo que se está agotando y te dice qué productos mueven tu negocio.',
    features: [
      ['Stock en tiempo real', 'Cada venta descuenta el inventario al instante, en todas tus sedes.'],
      ['Alertas de agotados', 'Te avisa antes de quedarte sin lo que más se vende.'],
      ['Por unidad o por peso', 'Maneja productos por cantidad o por kilo, libra y arroba.'],
      ['Códigos de barras', 'Carga y busca productos por código para vender más rápido.'],
      ['Entradas y ajustes', 'Registra compras, mermas y ajustes con su historial.'],
      ['Multi-sede', 'Controla el inventario de cada local por separado y consolidado.'],
    ],
    closing:
      'Saber qué tienes, qué se agota y qué deja más margen deja de ser un misterio: lo ves en una pantalla.',
    faq: [
      ['¿El inventario se actualiza solo al vender?', 'Sí. Cada venta descuenta el stock en tiempo real, para que tu inventario siempre refleje lo que de verdad tienes.'],
      ['¿Puedo controlar el inventario de varias sedes?', 'Sí. Pegazo maneja multi-sede: ves el stock de cada local por separado y el total consolidado.'],
      ['¿Me avisa cuando algo se está agotando?', 'Sí. Puedes definir mínimos y recibir alertas de los productos por agotarse para reponer a tiempo.'],
    ],
    related: ['software-punto-de-venta', 'software-para-supermercados', 'software-para-distribuidoras'],
  },
  {
    slug: 'crm-para-negocios',
    eyebrow: 'Clientes y fidelización',
    metaTitle: 'CRM para negocios y pymes en Colombia',
    h1: 'CRM para conocer y fidelizar a tus clientes',
    metaDescription:
      'Pegazo es el CRM sencillo para tu negocio: guarda a tus clientes, controla el fiado y la cartera, premia la fidelidad y envía recordatorios por WhatsApp. Sin planillas ni cuadernos.',
    keywords: [
      'CRM para negocios',
      'CRM para pymes Colombia',
      'software de clientes',
      'control de fiado y cartera',
      'fidelización de clientes',
    ],
    intro:
      'Tus clientes son tu activo más valioso, pero si están en un cuaderno no puedes fidelizarlos. Pegazo guarda quién te compra, cuánto te debe y cuándo volver a buscarlo, para que vendas más a los de siempre.',
    features: [
      ['Ficha de cada cliente', 'Datos, compras e historial en un solo lugar, no en papelitos.'],
      ['Fiado y cartera', 'Sabes quién te debe, cuánto y desde cuándo, con recordatorios.'],
      ['Fidelización', 'Sellos, premios y recordatorios automáticos para que regresen.'],
      ['WhatsApp con un clic', 'Cobros, promos y recordatorios directo al chat del cliente.'],
      ['Segmenta y vende', 'Identifica a tus mejores clientes y ofréceles algo especial.'],
      ['Todo conectado', 'Las ventas, el fiado y la fidelización viven en la misma plataforma.'],
    ],
    closing:
      'Un CRM no tiene que ser complicado ni caro: tiene que ayudarte a que tus clientes vuelvan. Eso hace Pegazo.',
    faq: [
      ['¿Qué es un CRM y para qué me sirve en mi negocio?', 'Un CRM es donde guardas y gestionas a tus clientes: quién te compra, cuánto te debe y cómo lograr que vuelva. En Pegazo está integrado con tus ventas y tu fiado.'],
      ['¿Puedo controlar el fiado desde el CRM?', 'Sí. Cada crédito queda asociado al cliente, con su saldo y recordatorios de cuotas para que la cartera no se te desordene.'],
      ['¿Puedo premiar a mis clientes frecuentes?', 'Sí. Pegazo incluye sellos, premios y recordatorios automáticos por WhatsApp, sin apps extra.'],
    ],
    related: ['software-punto-de-venta', 'software-para-barberias-y-peluquerias', 'software-contable'],
  },

  // ---------------------------------------------------------------------------
  // VERTICALES POR TIPO DE NEGOCIO
  // ---------------------------------------------------------------------------
  {
    slug: 'software-para-tiendas-y-minimercados',
    eyebrow: 'Tiendas y minimercados',
    metaTitle: 'Software para tiendas y minimercados',
    h1: 'Software para tu tienda o minimercado',
    metaDescription:
      'Pegazo es el software para tiendas, graneros y minimercados en Colombia: vende rápido, controla el fiado del barrio, maneja productos por unidad o peso y cuadra la caja sin cuadernos.',
    keywords: [
      'software para tiendas',
      'software para minimercados',
      'programa para tienda de barrio',
      'sistema para granero',
      'control de fiado tienda',
    ],
    intro:
      'En una tienda de barrio todo es rápido: clientes seguidos, fiado, productos sueltos y por peso. Pegazo está pensado para ese ritmo: cobras en segundos, controlas lo que te deben y sabes qué se vende y qué no.',
    features: [
      ['Ventas al ritmo del mostrador', 'Cobra rápido con efectivo, transferencia o fiado y calcula el cambio.'],
      ['Fiado del barrio bajo control', 'Registra quién te debe y recibe recordatorios de cada cuota.'],
      ['Por unidad o por peso', 'Vende granos, frutas o verduras por kilo, libra o arroba.'],
      ['Inventario que se descuenta solo', 'Siempre sabes qué tienes y qué se está agotando.'],
      ['Cierre de caja diario', 'Cuadra el efectivo del día sin cuentas a mano.'],
      ['Precio al público', 'Define precios y promociones sin enredos.'],
    ],
    closing:
      'Pegazo se adapta a tu tienda, no al revés: nada de pantallas pensadas para una multinacional que no usarías nunca.',
    faq: [
      ['¿Sirve para vender productos por peso en mi tienda?', 'Sí. Puedes vender por kilo, libra o arroba con decimales, ideal para granos, frutas y verduras.'],
      ['¿Me ayuda a controlar el fiado de mis clientes?', 'Sí. Registras cada crédito a nombre del cliente y Pegazo te recuerda las cuotas para que no se pierda plata.'],
      ['¿Es difícil de usar para mi tienda?', 'No. Pegazo se configura para tiendas y minimercados, mostrando solo lo necesario, con un flujo de venta rápido y simple.'],
    ],
    related: ['software-punto-de-venta', 'software-para-supermercados', 'software-de-inventario'],
  },
  {
    slug: 'software-para-supermercados',
    eyebrow: 'Supermercados y autoservicios',
    metaTitle: 'Software para supermercados y autoservicios',
    h1: 'Software para supermercados y autoservicios',
    metaDescription:
      'Gestiona tu supermercado con Pegazo: cajas rápidas con código de barras, inventario de miles de productos en tiempo real, control por peso, promociones y varias sedes consolidadas.',
    keywords: [
      'software para supermercados',
      'sistema para autoservicio',
      'POS supermercado Colombia',
      'inventario supermercado',
      'software para mercado',
    ],
    intro:
      'Un supermercado maneja muchos productos, varias cajas y rotación constante. Pegazo te da velocidad en caja, inventario confiable de todo tu surtido y reportes para saber qué comprar y qué deja más margen.',
    features: [
      ['Cajas rápidas', 'Venta por código de barras para no hacer filas.'],
      ['Inventario grande bajo control', 'Miles de productos con stock en tiempo real y alertas de agotados.'],
      ['Ventas por peso', 'Fruver, carnicería y granel por kilo, libra o arroba.'],
      ['Promociones y precios', 'Ofertas y combos sin descuadrar tu margen.'],
      ['Varias cajas y sedes', 'Consolida la operación de todas tus cajas y locales.'],
      ['Reportes de rotación', 'Sabes qué se mueve, qué se queda y qué reponer.'],
    ],
    closing:
      'Desde la caja hasta el reporte del dueño, todo tu supermercado en una sola plataforma en la nube.',
    faq: [
      ['¿Pegazo funciona con lector de código de barras?', 'Sí. Puedes cargar y vender productos por código de barras para agilizar las cajas.'],
      ['¿Maneja productos por peso como fruver o carnicería?', 'Sí. Vendes por kilo, libra o arroba con decimales dentro del mismo sistema.'],
      ['¿Puedo consolidar varias sedes?', 'Sí. Pegazo es multi-sede: ves cada local por separado y toda la operación consolidada.'],
    ],
    related: ['software-de-inventario', 'software-para-tiendas-y-minimercados', 'software-punto-de-venta'],
  },
  {
    slug: 'software-para-restaurantes-y-bares',
    eyebrow: 'Restaurantes y bares',
    metaTitle: 'Software para restaurantes, bares y cafeterías',
    h1: 'Software para tu restaurante o bar',
    metaDescription:
      'Pegazo es el software para restaurantes, bares y cafeterías: toma pedidos por mesa, maneja tu carta, descuenta insumos del inventario, divide cuentas y cuadra la caja sin enredos.',
    keywords: [
      'software para restaurantes',
      'software para bares',
      'POS restaurante Colombia',
      'sistema para cafetería',
      'comanda digital',
    ],
    intro:
      'En un restaurante o bar el tiempo es servicio. Pegazo te ayuda a tomar pedidos por mesa, manejar tu carta, controlar los insumos y cerrar la caja sin que la noche se vuelva un caos de papeles.',
    features: [
      ['Pedidos por mesa', 'Abre, suma y cierra cuentas por mesa sin confusiones.'],
      ['Tu carta ordenada', 'Productos, combos y adiciones listos para vender.'],
      ['Control de insumos', 'Lo que vendes descuenta ingredientes del inventario.'],
      ['Divide la cuenta', 'Separa pagos entre comensales sin cuentas a mano.'],
      ['Carta/menú digital', 'Comparte tu menú con un enlace para pedidos y domicilios.'],
      ['Cierre de caja', 'Cuadra la caja y las propinas al final del turno.'],
    ],
    closing:
      'Pegazo se adapta a tu restaurante o bar con el vocabulario correcto: mesas, carta e insumos, no términos de otro negocio.',
    faq: [
      ['¿Puedo manejar pedidos por mesa?', 'Sí. Abres una cuenta por mesa, le sumas productos durante el servicio y la cierras al cobrar.'],
      ['¿Controla los insumos de mis platos?', 'Sí. Al vender un plato se descuentan sus insumos del inventario, para que sepas qué reponer.'],
      ['¿Tengo carta o menú para compartir?', 'Sí. Puedes compartir tu carta/menú con un enlace, ideal para domicilios y para que el cliente vea precios.'],
    ],
    related: ['software-punto-de-venta', 'software-de-inventario', 'crm-para-negocios'],
  },
  {
    slug: 'software-para-barberias-y-peluquerias',
    eyebrow: 'Barberías y peluquerías',
    metaTitle: 'Software para barberías, peluquerías y salones',
    h1: 'Software y agenda para tu barbería o peluquería',
    metaDescription:
      'Pegazo es el software para barberías, peluquerías y salones de belleza: agenda de citas online, recordatorios por WhatsApp, cobro de servicios y productos, comisiones y clientes fieles.',
    keywords: [
      'software para barberías',
      'software para peluquerías',
      'agenda para salón de belleza',
      'sistema de citas barbería',
      'app para barbería Colombia',
    ],
    intro:
      'En una barbería o peluquería vendes tiempo y servicio. Pegazo te ayuda a llenar la agenda, reducir las citas perdidas con recordatorios y cobrar servicios y productos en un solo lugar.',
    features: [
      ['Agenda de citas online', 'Tus clientes reservan solos y te llega la cita al instante.'],
      ['Recordatorios por WhatsApp', 'Menos citas perdidas con avisos automáticos.'],
      ['Servicios y productos', 'Cobra el corte y el producto en la misma venta.'],
      ['Comisiones por barbero', 'Lleva la cuenta de cada profesional sin pelear.'],
      ['Clientes que vuelven', 'Historial, sellos y promos para fidelizar.'],
      ['Reportes del día', 'Sabes cuánto entró y qué servicio deja más.'],
    ],
    closing:
      'Desde la cita hasta el cobro, tu barbería o peluquería funciona sola mientras tú te concentras en atender.',
    faq: [
      ['¿Mis clientes pueden reservar cita solos?', 'Sí. Compartes tu enlace de reservas y tus clientes agendan su cita; a ti te llega la notificación.'],
      ['¿Puedo enviar recordatorios de las citas?', 'Sí. Pegazo envía recordatorios por WhatsApp para reducir las citas perdidas.'],
      ['¿Puedo manejar comisiones por barbero o estilista?', 'Sí. Puedes llevar la cuenta de los servicios de cada profesional para calcular sus comisiones.'],
    ],
    related: ['crm-para-negocios', 'software-para-odontologia-y-consultorios', 'software-punto-de-venta'],
  },
  {
    slug: 'software-para-odontologia-y-consultorios',
    eyebrow: 'Consultorios y clínicas',
    metaTitle: 'Software para consultorios, odontología y clínicas',
    h1: 'Software y agenda para tu consultorio o clínica',
    metaDescription:
      'Pegazo es el software para consultorios, odontología y centros de estética: agenda de citas, recordatorios por WhatsApp, historial del paciente, cobro de servicios y reportes claros.',
    keywords: [
      'software para consultorios',
      'software para odontología',
      'agenda para clínica',
      'sistema de citas consultorio',
      'software centro de estética',
    ],
    intro:
      'En un consultorio, cada cita cuenta. Pegazo te ayuda a organizar la agenda, recordar a tus pacientes, llevar su historial y cobrar los servicios, para que tú te concentres en atender bien.',
    features: [
      ['Agenda de citas', 'Organiza horarios y evita cruces entre profesionales.'],
      ['Recordatorios al paciente', 'Avisos por WhatsApp para reducir inasistencias.'],
      ['Historial del paciente', 'Datos y atenciones anteriores a la mano.'],
      ['Cobro de servicios', 'Cobra tratamientos y productos en el mismo lugar.'],
      ['Varios profesionales y sedes', 'Agenda y reportes por cada doctor o sede.'],
      ['Reportes claros', 'Sabes cuántas citas y cuánto ingreso tuviste.'],
    ],
    closing:
      'Pegazo se adapta a tu práctica con el vocabulario de salud y estética, no con términos de una tienda.',
    faq: [
      ['¿Puedo gestionar citas de varios profesionales?', 'Sí. Cada profesional tiene su agenda y puedes ver la ocupación por doctor y por sede.'],
      ['¿Les llega recordatorio a los pacientes?', 'Sí. Pegazo envía recordatorios por WhatsApp para reducir las inasistencias.'],
      ['¿Guarda el historial de cada paciente?', 'Sí. Puedes consultar los datos y las atenciones previas de cada paciente cuando lo necesites.'],
    ],
    related: ['software-para-barberias-y-peluquerias', 'crm-para-negocios', 'software-de-facturacion'],
  },
  {
    slug: 'software-para-ropa-y-calzado',
    eyebrow: 'Ropa y calzado',
    metaTitle: 'Software para tiendas de ropa y calzado',
    h1: 'Software para tu tienda de ropa o calzado',
    metaDescription:
      'Pegazo es el software para tiendas de ropa y calzado: maneja tallas y colores, controla el inventario por variante, vende en tienda y online, y fideliza a tus clientes.',
    keywords: [
      'software para tienda de ropa',
      'software para calzado',
      'inventario por talla y color',
      'POS tienda de ropa',
      'sistema para boutique',
    ],
    intro:
      'En ropa y calzado el inventario se complica: la misma referencia viene en varias tallas y colores. Pegazo controla cada variante, para que sepas qué talla te queda y vendas sin perder ventas por falta de stock.',
    features: [
      ['Tallas y colores', 'Controla cada variante de una misma referencia.'],
      ['Inventario por variante', 'Sabes exactamente qué talla y color tienes.'],
      ['Venta en tienda y online', 'Tu tienda online conectada al mismo inventario.'],
      ['Promos y temporadas', 'Descuentos y combos sin descuadrar tu margen.'],
      ['Clientes que vuelven', 'Fideliza con historial, sellos y promos.'],
      ['Reportes de lo que más sale', 'Compra mejor según lo que de verdad se vende.'],
    ],
    closing:
      'Desde la vitrina hasta la tienda online, tu negocio de ropa o calzado con un solo inventario y un solo control.',
    faq: [
      ['¿Maneja tallas y colores de la misma prenda?', 'Sí. Puedes controlar cada variante (talla y color) de una misma referencia por separado.'],
      ['¿Puedo vender también por internet?', 'Sí. Pegazo incluye tienda online conectada al mismo inventario, sin cargar los productos dos veces.'],
      ['¿Me dice qué referencias se venden más?', 'Sí. Los reportes te muestran qué se vende y qué se queda, para comprar mejor cada temporada.'],
    ],
    related: ['software-de-inventario', 'software-punto-de-venta', 'crm-para-negocios'],
  },
  {
    slug: 'software-para-distribuidoras',
    eyebrow: 'Distribuidoras y mayoristas',
    metaTitle: 'Software para distribuidoras y mayoristas',
    h1: 'Software para tu distribuidora o negocio mayorista',
    metaDescription:
      'Pegazo es el software para distribuidoras y mayoristas en Colombia: listas de precios por cliente, crédito y cartera, inventario por bodega, pedidos y reportes de rotación.',
    keywords: [
      'software para distribuidoras',
      'sistema para mayoristas',
      'software de distribución',
      'crédito y cartera distribuidora',
      'inventario por bodega',
    ],
    intro:
      'En una distribuidora manejas volumen, crédito y precios distintos por cliente. Pegazo te da control de la cartera, inventario por bodega y precios por tipo de cliente, para que vendas más sin perder el control de la plata.',
    features: [
      ['Precios por cliente', 'Maneja listas de precios para mayorista y minorista.'],
      ['Crédito y cartera', 'Controla cuánto te deben, plazos y recordatorios de cobro.'],
      ['Inventario por bodega', 'Sabes qué tienes en cada bodega o punto.'],
      ['Pedidos ágiles', 'Arma pedidos grandes rápido, con sus precios correctos.'],
      ['Multi-sede', 'Consolida la operación de todos tus puntos.'],
      ['Reportes de rotación', 'Identifica qué productos y clientes mueven tu negocio.'],
    ],
    closing:
      'Volumen, crédito y varias bodegas dejan de ser un caos: Pegazo lo mantiene bajo control en una sola plataforma.',
    faq: [
      ['¿Puedo tener precios distintos por cliente?', 'Sí. Puedes manejar listas de precios para distintos tipos de cliente, como mayorista y minorista.'],
      ['¿Cómo controlo la cartera de mis clientes?', 'Pegazo registra cada crédito con su saldo y plazos, y te ayuda con los recordatorios de cobro.'],
      ['¿Maneja inventario en varias bodegas?', 'Sí. Controlas el stock por bodega o punto y consolidas toda tu operación.'],
    ],
    related: ['software-de-inventario', 'crm-para-negocios', 'software-de-facturacion'],
  },
  {
    slug: 'software-para-droguerias',
    eyebrow: 'Droguerías y farmacias',
    metaTitle: 'Software para droguerías y farmacias',
    h1: 'Software para tu droguería o farmacia',
    metaDescription:
      'Pegazo es el software para droguerías y farmacias: inventario con control de vencimientos y lotes, venta rápida por código, precios y promociones, y cuadre de caja diario.',
    keywords: [
      'software para droguerías',
      'software para farmacias',
      'POS droguería Colombia',
      'inventario con vencimientos',
      'sistema para farmacia',
    ],
    intro:
      'En una droguería el inventario es delicado: muchos productos, códigos y fechas de vencimiento. Pegazo te ayuda a vender rápido, controlar el stock y no perder plata por productos vencidos o agotados.',
    features: [
      ['Venta rápida por código', 'Cobra en segundos usando el código de barras.'],
      ['Control de inventario', 'Stock en tiempo real con alertas de agotados.'],
      ['Precios y promociones', 'Maneja precios y ofertas sin descuadrar tu margen.'],
      ['Clientes y fiado', 'Controla a quién le fías y cuánto te debe.'],
      ['Cierre de caja', 'Cuadra el efectivo del día sin cuentas a mano.'],
      ['Reportes claros', 'Sabes qué se vende más y qué reponer.'],
    ],
    closing:
      'Un inventario grande y delicado se vuelve manejable: Pegazo te da control y velocidad en el mostrador.',
    faq: [
      ['¿Puedo vender por código de barras?', 'Sí. Cargas y vendes productos por código de barras para agilizar el mostrador.'],
      ['¿Controla el inventario de muchos productos?', 'Sí. Pegazo maneja inventario en tiempo real con alertas de agotados, ideal para el surtido de una droguería.'],
      ['¿Puedo llevar el fiado de mis clientes?', 'Sí. Registras los créditos por cliente y recibes recordatorios de las cuotas.'],
    ],
    related: ['software-de-inventario', 'software-punto-de-venta', 'software-para-tiendas-y-minimercados'],
  },
  {
    slug: 'software-para-parqueaderos',
    eyebrow: 'Parqueaderos',
    metaTitle: 'Software para parqueaderos',
    h1: 'Software para tu parqueadero',
    metaDescription:
      'Pegazo es el software para parqueaderos: controla entradas y salidas, cobra por tiempo, maneja mensualidades y guarda de cascos, y cuadra la caja del turno sin enredos.',
    keywords: [
      'software para parqueaderos',
      'sistema para parqueadero Colombia',
      'control de parqueadero',
      'cobro por tiempo parqueadero',
      'software guarda cascos',
    ],
    intro:
      'En un parqueadero el cobro depende del tiempo y el control debe ser rápido. Pegazo te ayuda a registrar entradas y salidas, cobrar por tiempo, manejar mensualidades y cuadrar la caja de cada turno.',
    features: [
      ['Entradas y salidas', 'Registra cada vehículo y calcula el cobro por tiempo.'],
      ['Mensualidades', 'Maneja clientes con plan mensual sin cuentas a mano.'],
      ['Guarda de cascos', 'Controla el servicio de guarda de cascos y otros adicionales.'],
      ['Cobro rápido', 'Efectivo, transferencia o tarjeta en segundos.'],
      ['Cierre de caja por turno', 'Cuadra lo recaudado al final de cada turno.'],
      ['Reportes de ocupación', 'Sabes cómo va tu recaudo día a día.'],
    ],
    closing:
      'Pegazo se adapta a tu parqueadero con las funciones que de verdad usas, no con las de una tienda.',
    faq: [
      ['¿Puedo cobrar por tiempo de parqueo?', 'Sí. Registras la entrada y la salida, y Pegazo te ayuda con el cobro según el tiempo.'],
      ['¿Maneja mensualidades?', 'Sí. Puedes manejar clientes con plan mensual además del cobro por tiempo.'],
      ['¿Sirve para el servicio de guarda de cascos?', 'Sí. Puedes controlar la guarda de cascos y otros servicios adicionales del parqueadero.'],
    ],
    related: ['software-punto-de-venta', 'crm-para-negocios', 'software-contable'],
  },

  // ---------------------------------------------------------------------------
  // SERVICIOS Y CITAS
  // ---------------------------------------------------------------------------
  {
    slug: 'software-para-veterinarias',
    eyebrow: 'Veterinarias',
    metaTitle: 'Software para veterinarias y clínicas veterinarias',
    h1: 'Software para tu veterinaria',
    metaDescription:
      'Pegazo es el software para veterinarias y clínicas veterinarias: agenda de citas por especialista, ficha de cada mascota, recordatorios de vacunas por WhatsApp y venta de productos y servicios.',
    keywords: [
      'software para veterinarias',
      'sistema para clínica veterinaria',
      'agenda veterinaria',
      'historia clínica de mascota',
      'programa para veterinaria',
    ],
    intro:
      'En una veterinaria cada paciente tiene cuatro patas y una historia. Pegazo te ayuda a organizar las citas, llevar la ficha de cada mascota, recordar vacunas y cobrar servicios y productos en un solo lugar.',
    features: [
      ['Agenda por especialista', 'Organiza las citas de cada veterinario sin cruces.'],
      ['Ficha de cada mascota', 'Datos del paciente y su dueño, con historial de atenciones.'],
      ['Recordatorios de vacunas', 'Avisos por WhatsApp para que no se pasen las fechas.'],
      ['Servicios y productos', 'Cobra la consulta, el baño y el concentrado en la misma venta.'],
      ['Inventario', 'Controla medicamentos y alimentos con alertas de agotados.'],
      ['Reportes claros', 'Sabes cuántas citas y cuánto ingreso tuviste.'],
    ],
    closing:
      'Pegazo se adapta a tu veterinaria con el vocabulario de mascotas y salud, no con el de una tienda cualquiera.',
    faq: [
      ['¿Puedo llevar la historia de cada mascota?', 'Sí. Cada mascota tiene su ficha con datos, dueño e historial de atenciones para consultarlo cuando lo necesites.'],
      ['¿Me recuerda las vacunas de los pacientes?', 'Sí. Puedes programar recordatorios por WhatsApp para avisar a los dueños de las próximas vacunas o controles.'],
      ['¿Puedo vender productos además de los servicios?', 'Sí. Cobras consultas, baños y productos (alimentos, medicamentos) en la misma venta, con su inventario.'],
    ],
    related: ['software-para-tiendas-de-mascotas', 'crm-para-negocios', 'software-de-inventario'],
  },
  {
    slug: 'software-para-gimnasios',
    eyebrow: 'Gimnasios y centros fitness',
    metaTitle: 'Software para gimnasios y centros fitness',
    h1: 'Software para tu gimnasio',
    metaDescription:
      'Pegazo es el software para gimnasios y centros fitness: maneja membresías, control de acceso, reservas de clases, cobros recurrentes y recordatorios de vencimiento por WhatsApp.',
    keywords: [
      'software para gimnasios',
      'control de acceso gimnasio',
      'membresías gimnasio',
      'software fitness Colombia',
      'sistema para gimnasio',
    ],
    intro:
      'Un gimnasio vive de sus membresías. Pegazo te ayuda a controlar quién está al día, quién está por vencerse y quién entra, además de reservar clases y cobrar sin perder plata por mensualidades vencidas.',
    features: [
      ['Membresías y planes', 'Mensualidades, pases por día y planes personalizados.'],
      ['Control de acceso', 'Sabes quién está al día y quién debe renovar.'],
      ['Reservas de clases', 'Gestiona los cupos de cada clase o entrenamiento.'],
      ['Recordatorios de vencimiento', 'Avisos por WhatsApp para que renueven a tiempo.'],
      ['Cobros y productos', 'Cobra mensualidades, clases y productos (suplementos).'],
      ['Reportes de asistencia', 'Entiende cómo va tu recaudo y tu ocupación.'],
    ],
    closing:
      'Menos mensualidades vencidas y más control: tu gimnasio funciona sin que persigas a nadie.',
    faq: [
      ['¿Puedo manejar membresías mensuales?', 'Sí. Manejas mensualidades, pases por día y planes personalizados, y sabes quién está al día.'],
      ['¿Les aviso a los clientes cuando se les vence el plan?', 'Sí. Pegazo puede enviar recordatorios por WhatsApp para que renueven antes de vencerse.'],
      ['¿Puedo gestionar reservas de clases?', 'Sí. Puedes manejar los cupos y reservas de cada clase o entrenamiento.'],
    ],
    related: ['crm-para-negocios', 'software-para-canchas-sinteticas', 'software-punto-de-venta'],
  },
  {
    slug: 'software-para-lavaderos-de-autos',
    eyebrow: 'Lavaderos de autos',
    metaTitle: 'Software para lavaderos de autos y autolavados',
    h1: 'Software para tu lavadero de autos',
    metaDescription:
      'Pegazo es el software para lavaderos de autos y autolavados: turnos por lavador, servicios y combos, comisiones, fidelización y cobro rápido con cierre de caja diario.',
    keywords: [
      'software para lavadero de autos',
      'sistema para autolavado',
      'turnos lavado de carros',
      'comisiones lavador',
      'POS lavadero',
    ],
    intro:
      'En un lavadero el día se mueve por turnos y comisiones. Pegazo te ayuda a repartir los trabajos entre lavadores, calcular sus comisiones y cobrar rápido, sin cuentas a mano al final del día.',
    features: [
      ['Turnos por lavador', 'Asigna cada trabajo y lleva la cuenta de cada uno.'],
      ['Servicios y combos', 'Lavado básico, encerado, polichado y paquetes.'],
      ['Comisiones', 'Calcula lo que le toca a cada lavador automáticamente.'],
      ['Fidelización', 'Premia al cliente frecuente para que vuelva.'],
      ['Cobro rápido', 'Efectivo, transferencia o tarjeta en segundos.'],
      ['Cierre de caja', 'Cuadra lo recaudado al final del turno.'],
    ],
    closing:
      'Turnos, comisiones y caja bajo control: tu lavadero funciona ordenado todos los días.',
    faq: [
      ['¿Puedo manejar comisiones por lavador?', 'Sí. Registras quién hizo cada trabajo y Pegazo calcula sus comisiones automáticamente.'],
      ['¿Sirve para combos de lavado?', 'Sí. Puedes armar servicios y combos (lavado, encerado, polichado) con sus precios.'],
      ['¿Cómo cuadro la caja del día?', 'Pegazo cuadra el efectivo contra lo vendido al cerrar el turno, sin cuentas a mano.'],
    ],
    related: ['software-para-talleres-mecanicos', 'crm-para-negocios', 'software-punto-de-venta'],
  },
  {
    slug: 'software-para-lavanderias',
    eyebrow: 'Lavanderías',
    metaTitle: 'Software para lavanderías',
    h1: 'Software para tu lavandería',
    metaDescription:
      'Pegazo es el software para lavanderías: órdenes por cliente, estados (recibido, listo, entregado), avisos por WhatsApp, lavado por kilo o por prenda y control de insumos.',
    keywords: [
      'software para lavanderías',
      'sistema para lavandería',
      'órdenes de lavandería',
      'lavado por kilo',
      'programa para lavandería',
    ],
    intro:
      'En una lavandería el cliente deja su ropa y confía en que esté lista a tiempo. Pegazo te ayuda a manejar cada orden, avisar cuando está lista y cobrar por kilo o por prenda, sin confusiones.',
    features: [
      ['Órdenes por cliente', 'Cada prenda o paquete queda a nombre del cliente.'],
      ['Estados de la orden', 'Recibido, en proceso, listo y entregado, siempre claro.'],
      ['Avisos por WhatsApp', 'Le avisas al cliente cuando su ropa está lista.'],
      ['Por kilo o por prenda', 'Cobra lavado por peso, en seco o planchado por unidad.'],
      ['Control de insumos', 'Lleva el inventario de detergentes y suministros.'],
      ['Reportes del día', 'Sabes cuántas órdenes y cuánto ingreso tuviste.'],
    ],
    closing:
      'Cada orden ordenada y el cliente avisado a tiempo: menos reclamos y más clientes contentos.',
    faq: [
      ['¿Puedo cobrar lavado por kilo?', 'Sí. Cobras por kilo, en seco o planchado por prenda, según tu servicio.'],
      ['¿El cliente sabe cuándo está lista su ropa?', 'Sí. Puedes manejar estados de la orden y avisar por WhatsApp cuando esté lista.'],
      ['¿Lleva el control de los insumos?', 'Sí. Puedes manejar el inventario de detergentes y suministros con alertas de agotados.'],
    ],
    related: ['crm-para-negocios', 'software-punto-de-venta', 'software-de-inventario'],
  },
  {
    slug: 'software-para-talleres-mecanicos',
    eyebrow: 'Talleres mecánicos',
    metaTitle: 'Software para talleres mecánicos y automotrices',
    h1: 'Software para tu taller mecánico',
    metaDescription:
      'Pegazo es el software para talleres mecánicos: órdenes de trabajo por vehículo, repuestos y mano de obra, historial por cliente, cotizaciones, inventario de repuestos y cartera.',
    keywords: [
      'software para talleres mecánicos',
      'orden de trabajo taller',
      'sistema para taller automotriz',
      'control de repuestos',
      'programa para taller',
    ],
    intro:
      'En un taller cada vehículo es un trabajo distinto: diagnóstico, repuestos y mano de obra. Pegazo te ayuda a manejar las órdenes de trabajo, cobrar lo justo y controlar los repuestos, sin perder plata ni tiempo.',
    features: [
      ['Órdenes de trabajo', 'Una orden por vehículo con diagnóstico y servicios.'],
      ['Repuestos y mano de obra', 'Suma partes y trabajo en una sola cuenta.'],
      ['Historial por vehículo', 'Consulta qué se le ha hecho a cada carro o moto.'],
      ['Cotizaciones', 'Pasa una cotización y conviértela en orden al aprobar.'],
      ['Inventario de repuestos', 'Controla el stock de partes con alertas.'],
      ['Cartera y fiado', 'Lleva lo que te deben los clientes y flotas.'],
    ],
    closing:
      'Del diagnóstico al cobro, tu taller con todo ordenado: órdenes, repuestos y cartera en un solo lugar.',
    faq: [
      ['¿Puedo manejar órdenes de trabajo por vehículo?', 'Sí. Creas una orden por vehículo con su diagnóstico, repuestos y mano de obra.'],
      ['¿Controla el inventario de repuestos?', 'Sí. Llevas el stock de partes en tiempo real con alertas de agotados.'],
      ['¿Puedo pasar cotizaciones a mis clientes?', 'Sí. Generas una cotización y, al aprobarla, la conviertes en orden de trabajo.'],
    ],
    related: ['software-para-lavaderos-de-autos', 'software-de-inventario', 'crm-para-negocios'],
  },
  {
    slug: 'software-para-canchas-sinteticas',
    eyebrow: 'Canchas sintéticas',
    metaTitle: 'Software para canchas sintéticas y escenarios deportivos',
    h1: 'Software para tus canchas sintéticas',
    metaDescription:
      'Pegazo es el software para canchas sintéticas: reservas por hora y por cancha, calendario de ocupación, cobros y abonos, venta de bebidas y recordatorios por WhatsApp.',
    keywords: [
      'software para canchas sintéticas',
      'reservas de canchas',
      'alquiler de cancha por hora',
      'sistema para canchas de fútbol',
      'programa para cancha sintética',
    ],
    intro:
      'En unas canchas sintéticas el negocio es el tiempo: cada hora reservada es plata. Pegazo te ayuda a manejar las reservas por cancha, cobrar y no dejar horas sin vender por falta de organización.',
    features: [
      ['Reservas por hora', 'Agenda cada cancha por franja horaria sin cruces.'],
      ['Calendario de ocupación', 'Ves de un vistazo qué horas están libres.'],
      ['Cobros y abonos', 'Recibe el pago total o un abono para separar.'],
      ['Venta de adicionales', 'Bebidas, alquiler de petos y más.'],
      ['Recordatorios', 'Avisa a los clientes de su reserva por WhatsApp.'],
      ['Reportes de ocupación', 'Sabes qué horas y canchas rinden más.'],
    ],
    closing:
      'Menos horas vacías y reservas ordenadas: tus canchas trabajan al máximo.',
    faq: [
      ['¿Puedo reservar por hora y por cancha?', 'Sí. Agendas cada cancha por franja horaria y ves la ocupación en un calendario.'],
      ['¿Puedo recibir abonos para separar?', 'Sí. Recibes el pago total o un abono para apartar la reserva.'],
      ['¿Vendo bebidas o alquiler de petos también?', 'Sí. Puedes vender adicionales como bebidas o alquiler de petos junto con la reserva.'],
    ],
    related: ['software-para-gimnasios', 'crm-para-negocios', 'software-punto-de-venta'],
  },

  // ---------------------------------------------------------------------------
  // COMIDA
  // ---------------------------------------------------------------------------
  {
    slug: 'software-para-panaderias',
    eyebrow: 'Panaderías',
    metaTitle: 'Software para panaderías',
    h1: 'Software para tu panadería',
    metaDescription:
      'Pegazo es el software para panaderías: venta por unidad o por peso, control de insumos y producción, inventario, ventas rápidas en el mostrador y cierre de caja diario.',
    keywords: [
      'software para panaderías',
      'sistema para panadería',
      'venta por peso panadería',
      'control de insumos panadería',
      'POS panadería',
    ],
    intro:
      'Una panadería vende rápido y de todo: pan por unidad, torta por porción, productos por peso. Pegazo te ayuda a cobrar ágil en el mostrador, controlar los insumos y saber qué se vende más.',
    features: [
      ['Por unidad o por peso', 'Vende pan por unidad y productos por kilo o libra.'],
      ['Control de insumos', 'Sabes qué gastas en harina, huevos y demás.'],
      ['Ventas rápidas', 'Cobra en segundos en el mostrador.'],
      ['Inventario', 'Controla productos y materia prima.'],
      ['Cierre de caja', 'Cuadra el efectivo del día sin cuentas a mano.'],
      ['Reportes', 'Sabes qué se vende más y a qué hora.'],
    ],
    closing:
      'Del mostrador a la producción, tu panadería con todo controlado en una sola plataforma.',
    faq: [
      ['¿Puedo vender por peso y por unidad?', 'Sí. Vendes pan por unidad y productos por kilo o libra con decimales.'],
      ['¿Controla los insumos de producción?', 'Sí. Puedes llevar el inventario de materias primas como harina y huevos.'],
      ['¿Cuadra la caja del día?', 'Sí. Al cerrar, Pegazo cuadra el efectivo contra lo vendido.'],
    ],
    related: ['software-para-cafeterias', 'software-de-inventario', 'software-punto-de-venta'],
  },
  {
    slug: 'software-para-cafeterias',
    eyebrow: 'Cafeterías',
    metaTitle: 'Software para cafeterías',
    h1: 'Software para tu cafetería',
    metaDescription:
      'Pegazo es el software para cafeterías: carta por categorías, manejo de mesas, venta rápida, combos, control de insumos y cierre de caja. Comparte tu menú con un enlace.',
    keywords: [
      'software para cafeterías',
      'POS cafetería',
      'carta digital cafetería',
      'sistema para café',
      'programa para cafetería',
    ],
    intro:
      'En una cafetería el servicio tiene que ser ágil y la carta clara. Pegazo te ayuda a vender rápido, manejar mesas, controlar los insumos y compartir tu menú con un enlace.',
    features: [
      ['Carta por categorías', 'Bebidas, pastelería y más, ordenado para vender rápido.'],
      ['Mesas', 'Abre, suma y cierra cuentas por mesa.'],
      ['Venta rápida', 'Cobra en segundos para llevar o en sitio.'],
      ['Combos y adiciones', 'Arma paquetes y extras sin enredos.'],
      ['Control de insumos', 'Sabes qué gastas y qué reponer.'],
      ['Carta digital', 'Comparte tu menú con un enlace para tus clientes.'],
    ],
    closing:
      'Rápido en la caja y claro en la carta: tu cafetería atiende mejor y cuadra sola.',
    faq: [
      ['¿Puedo manejar mesas en mi cafetería?', 'Sí. Abres una cuenta por mesa, le sumas productos y la cierras al cobrar.'],
      ['¿Tengo una carta digital para compartir?', 'Sí. Puedes compartir tu menú con un enlace, ideal para que el cliente vea precios.'],
      ['¿Controla los insumos?', 'Sí. Al vender, puedes descontar insumos del inventario para saber qué reponer.'],
    ],
    related: ['software-para-restaurantes-y-bares', 'software-para-panaderias', 'software-punto-de-venta'],
  },
  {
    slug: 'software-para-pizzerias',
    eyebrow: 'Pizzerías',
    metaTitle: 'Software para pizzerías',
    h1: 'Software para tu pizzería',
    metaDescription:
      'Pegazo es el software para pizzerías: menú con adiciones, domicilios, comanda de cocina, pedidos por mesa, control de insumos y cierre de caja. Carta digital con un enlace.',
    keywords: [
      'software para pizzerías',
      'POS pizzería',
      'domicilios pizzería',
      'comanda pizzería',
      'sistema para pizzería',
    ],
    intro:
      'Una pizzería maneja domicilios, mesas y muchas adiciones. Pegazo te ayuda a tomar los pedidos sin errores, mandar la comanda a cocina y controlar los insumos, para que la noche no se vuelva un caos.',
    features: [
      ['Menú con adiciones', 'Tamaños, ingredientes extra y combos.'],
      ['Domicilios', 'Gestiona pedidos a domicilio con sus datos.'],
      ['Comanda de cocina', 'Lo pedido llega claro a la cocina.'],
      ['Pedidos por mesa', 'Abre y cierra cuentas por mesa.'],
      ['Control de insumos', 'Descuenta ingredientes al vender.'],
      ['Carta digital', 'Comparte tu menú con un enlace.'],
    ],
    closing:
      'Pedidos sin errores, cocina al día y caja cuadrada: tu pizzería rinde en la hora pico.',
    faq: [
      ['¿Maneja domicilios?', 'Sí. Gestionas los pedidos a domicilio con sus datos y su cobro.'],
      ['¿La cocina recibe el pedido claro?', 'Sí. Puedes enviar la comanda a cocina para que prepare sin confusiones.'],
      ['¿Puedo manejar adiciones e ingredientes extra?', 'Sí. Tu menú admite tamaños, adiciones e ingredientes extra con sus precios.'],
    ],
    related: ['software-para-restaurantes-y-bares', 'software-para-comidas-rapidas', 'software-punto-de-venta'],
  },
  {
    slug: 'software-para-comidas-rapidas',
    eyebrow: 'Comidas rápidas',
    metaTitle: 'Software para negocios de comidas rápidas',
    h1: 'Software para tu negocio de comidas rápidas',
    metaDescription:
      'Pegazo es el software para comidas rápidas: pedidos ágiles, domicilios, comanda de cocina, combos y cobro rápido. Ideal para hamburguesas, perros, asaderos y más.',
    keywords: [
      'software para comidas rápidas',
      'POS comida rápida',
      'domicilios comida rápida',
      'sistema para asadero',
      'programa para comidas rápidas',
    ],
    intro:
      'En comidas rápidas todo es velocidad: pedidos seguidos, domicilios y cocina a mil. Pegazo te ayuda a tomar el pedido rápido, mandarlo a cocina y cobrar sin filas, para no perder ventas en la hora pico.',
    features: [
      ['Pedidos rápidos', 'Toma y cobra pedidos en segundos.'],
      ['Domicilios', 'Gestiona entregas con sus datos y cobro.'],
      ['Comanda de cocina', 'Lo pedido llega claro para preparar.'],
      ['Combos', 'Arma paquetes para vender más en menos tiempo.'],
      ['Cobro ágil', 'Efectivo, transferencia o tarjeta sin demoras.'],
      ['Reportes', 'Sabes cuántos pedidos y a qué horas.'],
    ],
    closing:
      'Menos filas y más pedidos atendidos: tu negocio de comidas rápidas rinde en la hora pico.',
    faq: [
      ['¿Sirve para domicilios?', 'Sí. Gestionas los pedidos a domicilio con sus datos y su cobro.'],
      ['¿Puedo manejar combos?', 'Sí. Armas combos y paquetes para vender más rápido.'],
      ['¿La cocina recibe el pedido?', 'Sí. Puedes enviar la comanda a cocina para preparar sin errores.'],
    ],
    related: ['software-para-pizzerias', 'software-para-restaurantes-y-bares', 'software-punto-de-venta'],
  },

  // ---------------------------------------------------------------------------
  // PRODUCTOS
  // ---------------------------------------------------------------------------
  {
    slug: 'software-para-carnicerias',
    eyebrow: 'Carnicerías',
    metaTitle: 'Software para carnicerías',
    h1: 'Software para tu carnicería',
    metaDescription:
      'Pegazo es el software para carnicerías: venta por peso (kilo o libra), proveedores, control de stock, fiado y reportes. Ideal para carnes, pollo y productos refrigerados.',
    keywords: [
      'software para carnicerías',
      'venta por peso carnicería',
      'POS carnicería',
      'control de stock carne',
      'sistema para carnicería',
    ],
    intro:
      'En una carnicería casi todo se vende por peso y la rotación es clave. Pegazo te ayuda a vender por kilo o libra, controlar el stock y saber cuánto deja cada corte, sin cuentas a mano.',
    features: [
      ['Venta por peso', 'Cobra por kilo o libra con decimales.'],
      ['Proveedores', 'Registra compras y controla tus costos.'],
      ['Control de stock', 'Sabes qué tienes y qué reponer.'],
      ['Cortes y productos', 'Organiza tu surtido con sus precios.'],
      ['Fiado', 'Lleva lo que te deben tus clientes.'],
      ['Reportes', 'Qué corte deja más y qué se mueve.'],
    ],
    closing:
      'Venta por peso, stock y costos bajo control: tu carnicería deja de perder plata en el detalle.',
    faq: [
      ['¿Puedo vender por peso?', 'Sí. Cobras por kilo o libra con decimales, ideal para carnes y pollo.'],
      ['¿Controla las compras a proveedores?', 'Sí. Registras tus compras para controlar costos y stock.'],
      ['¿Puedo fiar a mis clientes?', 'Sí. Registras los créditos por cliente con recordatorios de cuotas.'],
    ],
    related: ['software-para-fruver', 'software-para-supermercados', 'software-de-inventario'],
  },
  {
    slug: 'software-para-pescaderias',
    eyebrow: 'Pescaderías',
    metaTitle: 'Software para pescaderías',
    h1: 'Software para tu pescadería',
    metaDescription:
      'Pegazo es el software para pescaderías: venta por peso, control de inventario y rotación, proveedores, fiado y reportes. Pensado para productos frescos y cadena de frío.',
    keywords: [
      'software para pescaderías',
      'venta por peso pescado',
      'inventario pescadería',
      'POS pescadería',
      'sistema para pescadería',
    ],
    intro:
      'En una pescadería el producto es fresco y se vende por peso. Pegazo te ayuda a cobrar por kilo, controlar la rotación y llevar tus compras, para que no se te pierda plata en producto que no rota.',
    features: [
      ['Venta por peso', 'Cobra por kilo o libra con decimales.'],
      ['Control de rotación', 'Sabes qué sale rápido y qué se queda.'],
      ['Proveedores', 'Registra compras y controla costos.'],
      ['Inventario', 'Lleva tu surtido con alertas de stock.'],
      ['Fiado', 'Controla lo que te deben.'],
      ['Reportes', 'Qué producto deja más margen.'],
    ],
    closing:
      'Producto fresco, bien rotado y con costos claros: tu pescadería vende mejor y pierde menos.',
    faq: [
      ['¿Puedo vender por peso?', 'Sí. Cobras por kilo o libra con decimales.'],
      ['¿Me ayuda con la rotación del producto?', 'Sí. Con los reportes sabes qué sale rápido y qué se queda, para comprar mejor.'],
      ['¿Controla las compras?', 'Sí. Registras tus compras a proveedores para controlar costos y stock.'],
    ],
    related: ['software-para-carnicerias', 'software-para-supermercados', 'software-de-inventario'],
  },
  {
    slug: 'software-para-fruver',
    eyebrow: 'Fruver y verdulerías',
    metaTitle: 'Software para fruver y verdulerías',
    h1: 'Software para tu fruver o verdulería',
    metaDescription:
      'Pegazo es el software para fruver y verdulerías: venta por peso, control de mermas y rotación, inventario, ventas rápidas, fiado y reportes de lo que más sale.',
    keywords: [
      'software para fruver',
      'sistema para verdulería',
      'venta por peso frutas y verduras',
      'control de mermas',
      'POS fruver',
    ],
    intro:
      'En un fruver casi todo se vende por peso y la merma es el enemigo. Pegazo te ayuda a cobrar por kilo, controlar lo que se daña y saber qué rota, para que tu margen no se te vaya en producto perdido.',
    features: [
      ['Venta por peso', 'Cobra por kilo o libra con decimales.'],
      ['Control de mermas', 'Registra lo que se daña y cuida tu margen.'],
      ['Rotación', 'Sabes qué sale rápido y qué comprar.'],
      ['Inventario', 'Lleva tu surtido al día.'],
      ['Fiado', 'Controla lo que te deben del barrio.'],
      ['Reportes', 'Qué producto deja más y cuándo.'],
    ],
    closing:
      'Menos merma y más rotación: tu fruver cuida el margen hasta en el último racimo.',
    faq: [
      ['¿Puedo vender por peso?', 'Sí. Cobras por kilo o libra con decimales, ideal para frutas y verduras.'],
      ['¿Me ayuda con las mermas?', 'Sí. Puedes registrar lo que se daña y controlar su impacto en tu margen.'],
      ['¿Puedo fiar?', 'Sí. Registras los créditos por cliente con recordatorios.'],
    ],
    related: ['software-para-supermercados', 'software-para-tiendas-y-minimercados', 'software-de-inventario'],
  },
  {
    slug: 'software-para-licoreras',
    eyebrow: 'Licoreras',
    metaTitle: 'Software para licoreras y distribuidoras de licores',
    h1: 'Software para tu licorera',
    metaDescription:
      'Pegazo es el software para licoreras: venta rápida, inventario con control de stock, proveedores, precios y promociones, fiado y reportes. Para punto físico y domicilios.',
    keywords: [
      'software para licoreras',
      'POS licorera',
      'inventario licorera',
      'control de stock licores',
      'sistema para licorera',
    ],
    intro:
      'En una licorera la venta es rápida y el inventario vale plata. Pegazo te ayuda a cobrar ágil, controlar el stock de cada referencia y manejar tus promociones, sin que se te desordenen las cuentas.',
    features: [
      ['Venta rápida', 'Cobra en segundos, con código de barras.'],
      ['Inventario', 'Controla el stock de cada referencia.'],
      ['Proveedores', 'Registra compras y controla costos.'],
      ['Precios y promos', 'Maneja ofertas sin descuadrar tu margen.'],
      ['Fiado', 'Controla lo que te deben.'],
      ['Reportes', 'Qué se vende más y qué reponer.'],
    ],
    closing:
      'Venta ágil y stock controlado: tu licorera mueve producto sin perder el control de la plata.',
    faq: [
      ['¿Puedo vender con código de barras?', 'Sí. Cargas y vendes productos por código de barras para agilizar.'],
      ['¿Controla el inventario de cada referencia?', 'Sí. Llevas el stock en tiempo real con alertas de agotados.'],
      ['¿Puedo manejar promociones?', 'Sí. Manejas precios y ofertas sin descuadrar tu margen.'],
    ],
    related: ['software-para-supermercados', 'software-de-inventario', 'software-punto-de-venta'],
  },
  {
    slug: 'software-para-panaleria',
    eyebrow: 'Pañaleras',
    metaTitle: 'Software para pañaleras y tiendas de bebé',
    h1: 'Software para tu pañalera o tienda de bebé',
    metaDescription:
      'Pegazo es el software para pañaleras y tiendas de bebé: variantes por talla y etapa, marcas, fidelización, devoluciones, inventario y reportes de lo que más sale.',
    keywords: [
      'software para pañaleras',
      'sistema para pañalería',
      'POS tienda de bebé',
      'inventario por talla y etapa',
      'programa para pañalera',
    ],
    intro:
      'En una pañalera el surtido se mueve por tallas, etapas y marcas. Pegazo te ayuda a controlar cada variante, fidelizar a las mamás y papás, y saber qué reponer, sin perder ventas por falta de stock.',
    features: [
      ['Tallas y etapas', 'Controla variantes por talla y etapa del bebé.'],
      ['Marcas', 'Organiza tu surtido por marca.'],
      ['Fidelización', 'Premia a tus clientes frecuentes.'],
      ['Devoluciones', 'Maneja cambios y devoluciones sin descuadres.'],
      ['Inventario', 'Sabes qué tienes y qué reponer.'],
      ['Reportes', 'Qué referencias se venden más.'],
    ],
    closing:
      'Cada talla y marca bajo control: tu pañalera vende sin quedarse sin lo que más buscan.',
    faq: [
      ['¿Maneja variantes por talla y etapa?', 'Sí. Controlas cada variante por talla y etapa por separado.'],
      ['¿Puedo fidelizar a mis clientes?', 'Sí. Pegazo incluye fidelización con sellos y promociones.'],
      ['¿Maneja cambios y devoluciones?', 'Sí. Registras cambios y devoluciones sin descuadrar tu inventario ni tu caja.'],
    ],
    related: ['software-para-ropa-y-calzado', 'crm-para-negocios', 'software-de-inventario'],
  },
  {
    slug: 'software-para-ferreterias',
    eyebrow: 'Ferreterías',
    metaTitle: 'Software para ferreterías',
    h1: 'Software para tu ferretería',
    metaDescription:
      'Pegazo es el software para ferreterías: inventario grande, compras y proveedores, cartera y fiado, cotizaciones, venta por unidad o medida y reportes. Control total de tu surtido.',
    keywords: [
      'software para ferreterías',
      'POS ferretería',
      'inventario ferretería',
      'cartera ferretería',
      'sistema para ferretería',
    ],
    intro:
      'Una ferretería maneja miles de referencias, crédito y proveedores. Pegazo te ayuda a controlar ese inventario grande, llevar la cartera y pasar cotizaciones, para que vendas más sin perder el control.',
    features: [
      ['Inventario grande', 'Controla miles de referencias con alertas.'],
      ['Compras y proveedores', 'Registra entradas y controla costos.'],
      ['Cartera y fiado', 'Lleva lo que te deben, con recordatorios.'],
      ['Cotizaciones', 'Pasa cotizaciones y conviértelas en venta.'],
      ['Por unidad o medida', 'Vende por unidad, metro o peso.'],
      ['Reportes', 'Qué se mueve y qué deja más margen.'],
    ],
    closing:
      'Surtido grande, cartera y proveedores en orden: tu ferretería vende más sin perder el control.',
    faq: [
      ['¿Controla un inventario de miles de productos?', 'Sí. Pegazo maneja inventarios grandes en tiempo real con alertas de agotados.'],
      ['¿Puedo llevar la cartera de mis clientes?', 'Sí. Controlas el crédito y el fiado con recordatorios de cobro.'],
      ['¿Puedo pasar cotizaciones?', 'Sí. Generas cotizaciones y las conviertes en venta al aprobarse.'],
    ],
    related: ['software-de-inventario', 'software-para-distribuidoras', 'crm-para-negocios'],
  },
  {
    slug: 'software-para-floristerias',
    eyebrow: 'Floristerías',
    metaTitle: 'Software para floristerías',
    h1: 'Software para tu floristería',
    metaDescription:
      'Pegazo es el software para floristerías: pedidos y domicilios, fechas especiales, arreglos y productos, inventario, cobros y reportes. Ideal para fechas de alta demanda.',
    keywords: [
      'software para floristerías',
      'pedidos floristería',
      'domicilios flores',
      'sistema para floristería',
      'POS floristería',
    ],
    intro:
      'En una floristería los pedidos y los domicilios marcan el ritmo, sobre todo en fechas especiales. Pegazo te ayuda a organizar los pedidos, cobrar y controlar tus productos, para no quedar mal en los días de más demanda.',
    features: [
      ['Pedidos y domicilios', 'Gestiona cada pedido con sus datos y entrega.'],
      ['Fechas especiales', 'Prepárate para los días de alta demanda.'],
      ['Arreglos y productos', 'Organiza tu catálogo con precios.'],
      ['Inventario', 'Controla flores, materas y accesorios.'],
      ['Cobros', 'Recibe pagos y abonos para separar.'],
      ['Reportes', 'Sabes qué se vende más y cuándo.'],
    ],
    closing:
      'Pedidos ordenados y domicilios a tiempo: tu floristería brilla hasta en los días más movidos.',
    faq: [
      ['¿Maneja pedidos y domicilios?', 'Sí. Gestionas cada pedido con sus datos, su entrega y su cobro.'],
      ['¿Puedo recibir abonos para separar un pedido?', 'Sí. Recibes el pago total o un abono para apartar el pedido.'],
      ['¿Controla el inventario?', 'Sí. Llevas el stock de flores, materas y accesorios.'],
    ],
    related: ['crm-para-negocios', 'software-punto-de-venta', 'software-de-inventario'],
  },
  {
    slug: 'software-para-papelerias',
    eyebrow: 'Papelerías',
    metaTitle: 'Software para papelerías',
    h1: 'Software para tu papelería',
    metaDescription:
      'Pegazo es el software para papelerías: venta rápida, inventario, servicios de impresión y fotocopias, precios, fiado y reportes. Controla productos y servicios en un solo lugar.',
    keywords: [
      'software para papelerías',
      'POS papelería',
      'servicios de impresión papelería',
      'inventario papelería',
      'sistema para papelería',
    ],
    intro:
      'Una papelería vende de todo y también presta servicios como impresión y fotocopias. Pegazo te ayuda a cobrar rápido, controlar el inventario y manejar esos servicios, sin cuentas a mano.',
    features: [
      ['Venta rápida', 'Cobra productos en segundos.'],
      ['Inventario', 'Controla tu surtido con alertas.'],
      ['Servicios', 'Cobra impresión, fotocopias y plastificado.'],
      ['Precios', 'Maneja precios y promociones.'],
      ['Fiado', 'Controla lo que te deben (colegios, oficinas).'],
      ['Reportes', 'Qué se vende más y qué reponer.'],
    ],
    closing:
      'Productos y servicios en una sola caja: tu papelería cobra todo sin cuentas a mano.',
    faq: [
      ['¿Puedo cobrar servicios como impresión o fotocopias?', 'Sí. Manejas servicios además de productos, todo en la misma venta.'],
      ['¿Controla el inventario?', 'Sí. Llevas tu surtido en tiempo real con alertas de agotados.'],
      ['¿Puedo fiar a colegios u oficinas?', 'Sí. Registras los créditos por cliente con recordatorios.'],
    ],
    related: ['software-para-tiendas-y-minimercados', 'software-de-inventario', 'software-punto-de-venta'],
  },
  {
    slug: 'software-para-tiendas-de-mascotas',
    eyebrow: 'Tiendas de mascotas',
    metaTitle: 'Software para tiendas de mascotas y pet shops',
    h1: 'Software para tu tienda de mascotas',
    metaDescription:
      'Pegazo es el software para tiendas de mascotas y pet shops: inventario por marca, venta por peso de concentrado, servicios (baño), fidelización, fiado y reportes.',
    keywords: [
      'software para tiendas de mascotas',
      'POS pet shop',
      'inventario pet shop',
      'fidelización mascotas',
      'sistema para pet shop',
    ],
    intro:
      'Un pet shop vende alimento, accesorios y a veces servicios como baño. Pegazo te ayuda a controlar el inventario por marca, vender concentrado por peso y fidelizar a los dueños, en un solo lugar.',
    features: [
      ['Inventario por marca', 'Organiza tu surtido por marca y tipo.'],
      ['Venta por peso', 'Vende concentrado por kilo o a granel.'],
      ['Servicios', 'Cobra baño, guardería y más.'],
      ['Fidelización', 'Premia a los dueños frecuentes.'],
      ['Fiado', 'Controla lo que te deben.'],
      ['Reportes', 'Qué se vende más y qué reponer.'],
    ],
    closing:
      'Alimento, accesorios y servicios bajo un mismo control: tu tienda de mascotas vende y fideliza mejor.',
    faq: [
      ['¿Puedo vender concentrado por peso?', 'Sí. Vendes por kilo o a granel con decimales.'],
      ['¿Puedo cobrar servicios como baño?', 'Sí. Manejas servicios además de productos en la misma venta.'],
      ['¿Puedo fidelizar a mis clientes?', 'Sí. Pegazo incluye fidelización con sellos y promociones.'],
    ],
    related: ['software-para-veterinarias', 'software-de-inventario', 'crm-para-negocios'],
  },
  {
    slug: 'software-para-tiendas-de-tecnologia',
    eyebrow: 'Tecnología y electrónica',
    metaTitle: 'Software para tiendas de tecnología y electrónica',
    h1: 'Software para tu tienda de tecnología',
    metaDescription:
      'Pegazo es el software para tiendas de tecnología y electrónica: inventario por marca y modelo, cotizaciones, garantías y devoluciones, venta en tienda y online, cartera y reportes.',
    keywords: [
      'software para tiendas de tecnología',
      'POS tecnología',
      'inventario por marca y modelo',
      'cotizaciones electrónica',
      'sistema para tienda de tecnología',
    ],
    intro:
      'En tecnología el surtido se maneja por marca y modelo, con cotizaciones y garantías. Pegazo te ayuda a controlar ese inventario, pasar cotizaciones y manejar devoluciones, para vender con orden en tienda y online.',
    features: [
      ['Inventario por marca y modelo', 'Controla cada referencia con su detalle.'],
      ['Cotizaciones', 'Pasa cotizaciones y conviértelas en venta.'],
      ['Garantías y devoluciones', 'Maneja cambios sin descuadres.'],
      ['Venta en tienda y online', 'Tu tienda online con el mismo inventario.'],
      ['Cartera', 'Controla el crédito y el fiado.'],
      ['Reportes', 'Qué referencias y marcas dejan más.'],
    ],
    closing:
      'Del mostrador a la tienda online, tu negocio de tecnología con un solo inventario y todo en orden.',
    faq: [
      ['¿Controla inventario por marca y modelo?', 'Sí. Manejas cada referencia con su marca, modelo y detalle.'],
      ['¿Puedo pasar cotizaciones?', 'Sí. Generas cotizaciones y las conviertes en venta al aprobarse.'],
      ['¿Puedo vender también por internet?', 'Sí. Incluye tienda online conectada al mismo inventario.'],
    ],
    related: ['software-de-inventario', 'software-para-ropa-y-calzado', 'crm-para-negocios'],
  },
  {
    slug: 'software-para-tienda-online',
    eyebrow: 'Tienda online / ecommerce',
    metaTitle: 'Software para crear tu tienda online conectada al inventario',
    h1: 'Crea tu tienda online conectada a tu negocio',
    metaDescription:
      'Con Pegazo creas tu tienda online conectada al inventario: catálogo web, pedidos y despachos, y ventas en tienda y por internet con un solo stock. Sin cargar los productos dos veces.',
    keywords: [
      'crear tienda online',
      'software para ecommerce',
      'tienda online con inventario',
      'vender por internet Colombia',
      'catálogo web para negocio',
    ],
    intro:
      'Vender por internet no debería significar llevar dos inventarios. Con Pegazo tu tienda online está conectada al mismo stock de tu punto físico: lo que vendes por un lado se descuenta del otro, sin cargar los productos dos veces.',
    features: [
      ['Tienda online integrada', 'Un solo inventario para tienda y web.'],
      ['Catálogo web', 'Tus productos con fotos, precios y descripción.'],
      ['Pedidos y despachos', 'Recibe pedidos y organiza las entregas.'],
      ['Stock sincronizado', 'Lo vendido se descuenta en tiempo real.'],
      ['Pagos', 'Cobra en línea según tu configuración.'],
      ['Reportes', 'Ventas de tienda y web en un solo lugar.'],
    ],
    closing:
      'Un negocio, un inventario, dos canales de venta: tu tienda online y tu punto físico siempre cuadrados.',
    faq: [
      ['¿Tengo que cargar los productos dos veces?', 'No. Tu tienda online usa el mismo inventario del punto físico, así que cargas una sola vez.'],
      ['¿El stock se sincroniza?', 'Sí. Lo que vendes en tienda o en la web descuenta del mismo inventario en tiempo real.'],
      ['¿Puedo recibir pedidos y organizarlos?', 'Sí. Gestionas los pedidos de tu tienda online y organizas sus despachos.'],
    ],
    related: ['software-de-inventario', 'software-para-ropa-y-calzado', 'software-punto-de-venta'],
  },
];

export function getAllSolutions() {
  return SOLUTIONS;
}

export function getSolutionBySlug(slug) {
  return SOLUTIONS.find((s) => s.slug === slug) || null;
}
