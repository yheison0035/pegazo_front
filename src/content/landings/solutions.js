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
];

export function getAllSolutions() {
  return SOLUTIONS;
}

export function getSolutionBySlug(slug) {
  return SOLUTIONS.find((s) => s.slug === slug) || null;
}
