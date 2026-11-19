// Contenido del blog de Pegazo. Cada artículo es un objeto con su SEO (title,
// description, keywords, fecha) y un cuerpo por secciones (h2 + párrafos + lista
// opcional), que renderiza la página del artículo. Para agregar un artículo,
// añade un objeto a POSTS con un `slug` único.
//
// Buenas prácticas SEO ya aplicadas por el motor del blog:
//  - metadata por artículo (title/description/canonical/OpenGraph)
//  - JSON-LD BlogPosting + BreadcrumbList (+ FAQPage si el artículo trae `faq`)
//  - enlaces internos a la landing y entre artículos
//  - sitemap que incluye /blog y cada artículo.

export const BLOG_BASE = 'https://pegazo.co/blog';

const DEFAULT_COVER = '/images/logo_pegazo.png';

export const POSTS = [
  {
    slug: 'software-pos-punto-de-venta-colombia',
    title:
      'Software POS en Colombia: cómo elegir el punto de venta para tu negocio',
    description:
      'Guía práctica para elegir un software POS (punto de venta) en Colombia: qué funciones te deben importar, errores comunes y cómo saber si de verdad te hará vender más y controlar tu plata.',
    keywords: [
      'software POS Colombia',
      'punto de venta',
      'sistema POS para negocio',
      'programa de ventas',
      'software de facturación Colombia',
    ],
    date: '2026-11-19',
    updated: '2026-11-19',
    readingMinutes: 7,
    cover: DEFAULT_COVER,
    excerpt:
      'Qué mirar al elegir un software POS en Colombia para no pagar de más ni quedarte corto: funciones clave, errores comunes y señales de que te hará vender mejor.',
    intro:
      'Un buen software POS (punto de venta) no es solo “la caja registradora del celular”. Es el centro desde donde vendes, controlas tu inventario, sabes cuánto te deben y entiendes qué tan bien va tu negocio. Elegir mal te cuesta tiempo, ventas y plata. En esta guía te explicamos, sin tecnicismos, qué mirar antes de decidir.',
    sections: [
      {
        h2: '¿Qué es realmente un software POS?',
        body: [
          'POS significa “punto de venta”. Es el programa con el que registras cada venta, cobras (efectivo, tarjeta, transferencia o fiado) y, al mismo tiempo, descuentas del inventario y guardas quién te compró. Un POS moderno vive en la nube: lo abres desde el computador, la tablet o el celular, sin instalar nada ni depender de un técnico.',
          'La diferencia entre uno bueno y uno malo no se nota el primer día; se nota al cierre de mes, cuando quieres saber cuánto vendiste, qué se está agotando y quién te quedó debiendo.',
        ],
      },
      {
        h2: 'Las 7 funciones que sí importan',
        body: [
          'No te dejes llevar por listas infinitas de “características”. Para la mayoría de negocios en Colombia, estas son las que mueven la aguja:',
        ],
        list: [
          'Ventas rápidas: cobrar en segundos, con efectivo, tarjeta, transferencia o fiado, y calcular el cambio.',
          'Inventario en tiempo real: que al vender se descuente solo, con alertas de productos por agotarse.',
          'Clientes y fiado: saber quién te debe, cuánto y desde cuándo, con recordatorios.',
          'Cierre de caja: cuadrar el efectivo del día sin cuentas a mano.',
          'Reportes claros: ventas del día, de la semana y qué producto deja más.',
          'Multi-sede: si tienes (o tendrás) más de un local, ver cada uno por separado y junto.',
          'Tienda online conectada: vender por internet sin volver a cargar el inventario.',
        ],
      },
      {
        h2: 'Errores comunes al elegir (y cómo evitarlos)',
        body: [
          'El primer error es elegir por precio sin mirar si de verdad lo vas a usar. Un sistema baratísimo que nadie en tu equipo entiende termina abandonado. El segundo es escoger algo pensado para una multinacional cuando tienes una tienda, un restaurante o una barbería: te sobran botones y te falta sencillez.',
          'El tercer error es no pensar en el fiado ni en la caja. En Colombia el fiado es realidad diaria, y si el sistema no lo controla bien, la plata “se pierde” en cuadernos. Y si la caja no cuadra sola, cada noche es un dolor de cabeza.',
        ],
      },
      {
        h2: '¿Sirve para mi tipo de negocio?',
        body: [
          'La respuesta depende de qué tan adaptable sea el software. Una tienda vende por unidad; una fruver o una carnicería venden por peso; una barbería cobra servicios y agenda citas; un restaurante maneja mesas y cocina. Un buen POS se adapta a cada uno con el vocabulario y las funciones correctas, en vez de obligarte a ti a adaptarte a él.',
          'Pegazo, por ejemplo, se configura según tu tipo de negocio: comercio, supermercado, droguería, ropa, calzado, restaurante, barbería, distribuidora y más. Cada uno ve solo lo que necesita.',
        ],
      },
      {
        h2: 'Checklist antes de decidir',
        body: ['Antes de pagar o migrar, confirma que el software:'],
        list: [
          '¿Lo puedes usar desde el celular sin instalar nada?',
          '¿Controla el fiado y te avisa de las cuotas?',
          '¿Cuadra la caja del día solo?',
          '¿Te muestra reportes sin que tengas que exportar a Excel?',
          '¿Crece contigo (más usuarios, más sedes, tienda online)?',
          '¿Tiene soporte real que te responde cuando lo necesitas?',
        ],
      },
    ],
    faq: [
      {
        q: '¿Necesito internet todo el tiempo para un software POS?',
        a: 'Para un POS en la nube como Pegazo necesitas conexión para registrar y sincronizar tus ventas. La ventaja es que tus datos están seguros y accesibles desde cualquier dispositivo, sin depender de un solo computador.',
      },
      {
        q: '¿Un software POS me sirve si vendo por peso (fruver, carnicería)?',
        a: 'Sí, siempre que se adapte a tu negocio. En Pegazo puedes vender por kilo, libra o arroba con decimales, además de por unidad.',
      },
      {
        q: '¿Puedo empezar con un local y luego crecer a varias sedes?',
        a: 'Sí. Lo ideal es elegir un sistema que maneje multi-sede desde el inicio, para que al abrir otro local veas cada uno por separado y todo junto, sin cambiar de herramienta.',
      },
    ],
  },

  {
    slug: 'controlar-fiado-cartera-tienda',
    title: 'Fiado y cartera: cómo controlarlos sin perder plata en tu tienda',
    description:
      'El fiado bien manejado fideliza; mal manejado te quiebra. Aprende a controlar la cartera de tu tienda o negocio en Colombia: registro, límites, recordatorios y cómo cobrar sin pelear.',
    keywords: [
      'control de fiado',
      'cartera',
      'software para fiado',
      'cobrar fiado',
      'cartera de clientes',
    ],
    date: '2026-11-19',
    updated: '2026-11-19',
    readingMinutes: 6,
    cover: DEFAULT_COVER,
    excerpt:
      'El fiado bien llevado fideliza; mal llevado te descapitaliza. Guía para registrar, poner límites, recordar y cobrar la cartera sin perder clientes ni plata.',
    intro:
      'En muchos negocios en Colombia el fiado es parte del día a día: le fías al cliente de confianza y vuelve. El problema no es fiar, es fiar sin control. Cuando la cartera vive en un cuaderno o en la memoria, la plata se diluye: no sabes quién debe, cuánto ni desde cuándo. Esta guía te muestra cómo tener el fiado bajo control sin volverte el malo de la película.',
    sections: [
      {
        h2: 'Por qué el fiado se vuelve un problema',
        body: [
          'El fiado se descontrola por tres razones: no queda registrado bien, no hay un límite y nadie hace seguimiento. El resultado es una cartera que crece, clientes que “se olvidan” y un capital de trabajo atrapado que no puedes usar para comprar mercancía.',
          'La buena noticia: con un proceso simple y la herramienta correcta, el fiado deja de ser un hueco y pasa a ser lo que debe ser: una forma de fidelizar al cliente bueno.',
        ],
      },
      {
        h2: 'Registra cada fiado en el momento',
        body: [
          'La regla de oro: ningún fiado sin registrar. Cada venta a crédito debe quedar asociada a un cliente, con el monto y la fecha. Si lo anotas “después”, no lo anotas. Un sistema de ventas que te deje marcar la venta como fiado en el mismo cobro elimina el cuaderno y los olvidos.',
        ],
      },
      {
        h2: 'Pon límites y plazos claros',
        body: [
          'No todos los clientes deben tener el mismo cupo. Define cuánto le fías a cada quién y en cuánto tiempo debe pagar. Cuando hay un plan de pagos (cuotas), el cliente sabe a qué atenerse y tú sabes cuándo esperar la plata.',
          'Un buen control de cartera te deja ver, en un vistazo, quién está al día, quién va a vencer y quién ya se pasó.',
        ],
      },
      {
        h2: 'Recordar sin pelear',
        body: [
          'La mayoría de la gente no paga tarde por mala fe, sino porque se le pasó. Un recordatorio amable y a tiempo —idealmente automático por WhatsApp o correo— recupera cartera sin dañar la relación. El truco es que el recordatorio salga solo, unos días antes del vencimiento y cuando ya se pasó, sin que tengas que estar pendiente.',
          'En Pegazo, por ejemplo, puedes activar recordatorios de crédito al cliente: el sistema avisa de la cuota próxima a vencer y le insiste si ya quedó vencida, sin que tú muevas un dedo.',
        ],
      },
      {
        h2: 'Mide tu cartera como un número del negocio',
        body: [
          'Tu cartera (lo que te deben) es tan importante como tus ventas. Revísala cada semana: cuánto te deben en total, cuánto está vencido y quiénes son los que más deben. Ese número te dice cuánta plata tienes “afuera” y te ayuda a decidir a quién seguir fiando y a quién no.',
        ],
      },
    ],
    faq: [
      {
        q: '¿Está mal fiar en mi negocio?',
        a: 'No. Fiar bien fideliza y aumenta ventas. El problema es fiar sin registro, sin límites y sin seguimiento. Con control, el fiado es una herramienta, no un hueco.',
      },
      {
        q: '¿Cómo cobro un fiado vencido sin perder al cliente?',
        a: 'Con recordatorios amables y automáticos antes y después del vencimiento. La mayoría paga apenas se le recuerda. Dejar que un sistema envíe el aviso por WhatsApp o correo evita la conversación incómoda.',
      },
      {
        q: '¿Qué pasa si llevo el fiado en un cuaderno?',
        a: 'Funciona hasta que crece: se pierden registros, no hay totales ni alertas y la plata se diluye. Pasar el fiado a un software de ventas con cartera te da control y recordatorios automáticos.',
      },
    ],
  },

  {
    slug: 'software-para-barberias-peluquerias',
    title: 'Software para barberías y peluquerías: agenda, comisiones y caja',
    description:
      'Qué debe tener un software para barberías y peluquerías: agenda de citas, comisiones por barbero, control de caja, fidelización y página de reservas. Guía para elegir bien en Colombia.',
    keywords: [
      'software para barberías',
      'software para peluquerías',
      'agenda de citas barbería',
      'comisiones por barbero',
      'sistema para salones de belleza',
    ],
    date: '2026-11-19',
    updated: '2026-11-19',
    readingMinutes: 6,
    cover: DEFAULT_COVER,
    excerpt:
      'Agenda de citas, comisiones por barbero, caja que cuadra y página de reservas: lo que un software para barberías y peluquerías debe resolver de verdad.',
    intro:
      'Una barbería o peluquería no se maneja como una tienda: aquí lo que vendes es tiempo y servicio. Por eso el software que uses tiene que resolver cosas muy concretas: llenar la agenda, pagarle justo a cada barbero, cuadrar la caja y hacer que el cliente vuelva. Esto es lo que debes buscar.',
    sections: [
      {
        h2: 'Agenda y reservas: tu activo más valioso',
        body: [
          'Una silla vacía es plata que no vuelve. El software debe dejarte ver la agenda del día por profesional, agendar en segundos y, mejor aún, dar a tus clientes una página de reservas propia para que pidan cita solos, sin llamadas ni mensajes.',
          'Cuando el cliente reserva en línea y recibe recordatorio, bajan las inasistencias y se llena la agenda sin que tú estés detrás del teléfono.',
        ],
      },
      {
        h2: 'Comisiones por barbero, sin cuentas a mano',
        body: [
          'El pago por comisión es el estándar en barberías. Calcularlo a mano al final de la quincena es lento y da pie a discusiones. El sistema debe registrar quién atendió cada servicio y calcular la comisión solo, para que pagar sea abrir un reporte, no armar una hoja de cálculo.',
          'Esto también te da claridad: qué barbero produce más, qué servicios dejan mejor margen y cómo va cada uno.',
        ],
      },
      {
        h2: 'Caja que cuadra sola',
        body: [
          'Entre servicios, productos (ceras, shampoos) y propinas, la caja de una barbería se mueve todo el día. Un buen software te deja abrir y cerrar el día, y cuadra el efectivo contra lo vendido automáticamente, para que no te quedes cada noche buscando por qué no da.',
        ],
      },
      {
        h2: 'Fidelización: que el cliente vuelva',
        body: [
          'Conseguir un cliente nuevo cuesta; que vuelva, mucho menos. Programas de sellos o descuentos por visitas, y recordatorios automáticos, hacen que el cliente regrese sin que tengas que perseguirlo. En Pegazo puedes configurar fidelización por visitas con descuentos, incluida, sin apps extra.',
        ],
      },
      {
        h2: 'Que se adapte a la barbería (no al revés)',
        body: [
          'El detalle que marca la diferencia: que el sistema hable tu idioma. Que diga “barbero”, “cita”, “servicio”, que te deje cobrar productos y servicios juntos, y que los roles sean los de una barbería (administrador, recepcionista, barbero). Un software genérico te obliga a adaptarte; uno pensado para tu vertical te hace la vida fácil desde el primer día.',
        ],
      },
    ],
    faq: [
      {
        q: '¿El software me da una página para que los clientes reserven?',
        a: 'Los mejores sí. En Pegazo tu barbería tiene una página de reservas propia donde el cliente agenda su cita en línea y recibe recordatorio, lo que reduce las inasistencias.',
      },
      {
        q: '¿Cómo se calculan las comisiones de los barberos?',
        a: 'El sistema registra quién prestó cada servicio y calcula la comisión automáticamente. Al final del periodo abres un reporte por barbero, sin cuentas a mano.',
      },
      {
        q: '¿Sirve igual para una peluquería o un spa?',
        a: 'Sí. La lógica es la misma: agenda por profesional, servicios, comisiones, caja y fidelización. Solo cambia el vocabulario y los servicios, que se configuran según tu negocio.',
      },
    ],
  },
];

export function getAllPosts() {
  // Más recientes primero.
  return [...POSTS].sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPostBySlug(slug) {
  return POSTS.find((p) => p.slug === slug) || null;
}
