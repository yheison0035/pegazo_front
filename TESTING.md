# Pruebas — reglas del proyecto

Un módulo **no está terminado** hasta que:

1. Su lógica (parseos, cálculos, reglas) vive en `src/lib/**` o `src/config/**` **sin React** y tiene tests (`*.test.js` junto al archivo) — plantilla: `src/lib/inventory/importUtils.test.js`.
2. Los componentes con lógica densa tienen tests con Testing Library. Un test que renderice JSX va en un archivo `*.test.jsx` (los componentes `.js` se cargan como JSX gracias a `esbuild.loader` en `vitest.config.mjs`).
3. Si toca **dinero, stock o datos del cliente**, tiene al menos un flujo probado de punta a punta.
4. Se probó con **al menos 3 tipos de negocio** (retail, por peso, servicios/citas; comida si aplica) — plantilla: `src/config/verticals.test.js`.
5. **CI en verde** (`.github/workflows/ci.yml` corre tests + build en cada push/PR).

## Comandos

- `npm test` — corre todo (Vitest).
- `npm run test:watch` — en desarrollo.

Importa con alias `@/...` (mapeado en `vitest.config.mjs`). Entorno `jsdom` + `jest-dom` ya configurados.

## Pruebas de humo de TODAS las pantallas por tipo de negocio

`src/app/dashboard/__tests__/todas-las-pantallas.test.jsx` descubre con
`import.meta.glob` todas las `page.js` del dashboard y las renderiza con el
arnés `src/test/pageHarness.jsx`: dueño de cada tipo de negocio (COMERCIO,
BARBERIA, RESTAURANTE, PARQUEADERO, PANADERIA, ODONTOLOGIA, TECNOLOGIA,
LAVADO_VEHICULOS) + roles acotados (BARBERO, PROFESIONAL, ADMIN, MESERO, CAJA),
con `fetch` simulado por ruta (`FIXTURES` con la forma real de las respuestas;
lo demás recibe lista o detalle genérico). Lo mismo para `src/app/platform` y
el portal del contador. Una pantalla nueva entra sola (glob). Si el backend
cambia la forma de una respuesta, se actualiza `FIXTURES`. Para correr un solo
tipo: `SMOKE_TYPES=COMERCIO npx vitest run src/app/dashboard/__tests__/todas-las-pantallas.test.jsx`.

## Pruebas de humo de pantallas contables (con mocks específicos)

Cada pantalla del dashboard y del portal del contador tiene una prueba de humo
que la renderiza con el usuario simulado y las rutas de API simuladas con la
forma REAL de respuesta (`src/app/dashboard/__tests__/*.pages.test.jsx`,
`src/app/contador/__tests__/*.test.jsx`). La prueba falla si la página lanza un
error de render (por ejemplo leer un campo de `null` antes de cargar) o si una
pestaña ya no está coordinada con un componente compartido. Regla: **toda
pantalla nueva o modificada se agrega a la lista de su archivo de humo** y, si
cambia la forma de una respuesta del backend, se actualiza el dato simulado.

## Pruebas de COMPORTAMIENTO por módulo (cada acción tiene un test)

Carpeta `src/app/dashboard/<modulo>/__tests__/<modulo>.behavior.test.jsx`,
con el arnés `src/test/behaviorHarness.jsx`. A diferencia del humo, aquí se
usa la pantalla como un usuario (Testing Library): buscar, filtrar, paginar,
abrir el detalle, crear, editar, eliminar, exportar, importar, cambiar de
pestaña… y se verifica la **petición exacta** que sale al backend (método,
ruta, query y cuerpo) y el **aviso** que ve el usuario (toast).

Reglas:

1. **Toda acción visible tiene un test**: cada botón, selector, buscador y
   formulario del módulo. Incluye el camino feliz, el error del backend
   (`fail(400, 'motivo')` → debe salir un aviso, nunca una promesa sin capturar)
   y los permisos por rol (qué acciones NO se ven con ASESOR/ADMIN/CAJA…).
2. El backend se simula con `installApi([on('GET', /^\/ruta$/, list([...])), …])`;
   lo que no se declare recibe la forma genérica de `pageHarness`. Las
   respuestas usan la **forma real** del backend (`list`, `detail`, `ok`).
3. Se afirma sobre lo que viaja al backend (`api.last('POST', /^\/customers$/).body`)
   y sobre lo que se le dice al usuario (`expectToast('success', 'Cliente creado')`).
4. Dinero: en textos de pantalla usa `money(n)`; en valores de inputs y
   mensajes usa `formatCOP(n)` (espacio duro).
5. Los selects nativos de Departamento/Ciudad son obligatorios solo si el
   formulario lo declara (`required` del campo); `pickDepartmentAndCity()` los
   llena. Si un submit "no sale", `invalidFields()` dice qué campo lo bloquea.
6. Módulos cubiertos: **tanda 1** clientes, gastos, inventario (lista, crear,
   editar, importar Excel), compras, caja y ventas (POS); **tanda 2** ventas
   realizadas (detalle, imprimir, WhatsApp, CSV, reportes, reactivar, editar),
   cartera (abonos, detalle, eliminar), citas (calendario, lista, cobrar,
   confirmar, agendar con disponibilidad, editar), servicios, proveedores,
   categorías, marcas, sedes y usuarios; **tanda 3** devoluciones, plan separe
   (abonos, entregar, anular), cuentas por pagar (crear, pagar, deshacer,
   editar, eliminar) y membresías (crear, cobrar, deshacer, editar, eliminar);
   **tanda 4** insumos (crear, editar, ajustar existencia, eliminar),
   parqueadero (entrada, mensualidad, salida/cobro, anular, tarifas y
   configuración), mesas (crear, pedidos a cocina, estados, cobrar mesa,
   eliminar, roles) y cotizaciones (crear, aceptar, rechazar, convertir,
   eliminar); **tanda 5** cocina (tablero por estado, avanzar, menú del día),
   pedidos online (filtros, confirmar, envío, fallido, WhatsApp, cancelar,
   eliminar), cargos a empleados (registrar, saldar efectivo/comisión,
   reabrir, eliminar, vista del empleado) y banco (activar/desactivar,
   configuración, enlace compartido, regenerar, copiar, historial); **tanda 6**
   catálogos simples con `describeSimpleCatalog` (`src/test/simpleCatalogBehavior.jsx`):
   segmentos de cliente, tipos de cargo, tipos de gasto, medios de pago,
   unidades de medida; además días de descanso (semanales, calendario,
   puntuales), fidelización (acumulando/antiguos, buscar, sincronizar) y
   notificaciones (sin leer, abrir, marcar todas, ir al detalle); **tanda 7**
   solicitudes de stock (aprobar, rechazar con motivo, pestañas), mi
   suscripción (estado, historial, cómo pagar), mejora de plan (interruptor
   apagado → redirige; con el interruptor encendido vía mock: planes, pago,
   retorno de la pasarela), estadísticas (indicadores, filtros, atajos,
   exportar Excel/libro, pestañas) y diseño de la página de citas (estilos,
   textos, guardar); **tanda 8** ajustes (empresa, horario, apariencia,
   caja, fiscal, contabilidad, contador, cierre, fidelización), tienda online
   (configuración, banners, pagos, Wompi, envíos), guarda cascos (ingreso,
   lavado, cobro, anular, tarifas), catálogo web, facturación electrónica
   (listado, filtros, representación, notas, anular, eliminar, asistente de
   activación, resolución) y nómina electrónica (emitir, corregir, eliminar);
   **tanda 9** contabilidad: activos fijos (crear, editar, dar de baja),
   plan de cuentas (crear, editar, eliminar; cuentas base no borrables),
   libros (diario, mayor, balance de prueba, auxiliar, fechas, exportar,
   error de carga), impuestos (consultar IVA, saldo a favor, CSV), estados
   financieros (resultados, balance, flujo, fechas, exportar), calendario
   tributario (vencimientos, revisar alertas, CSV, obligaciones + perfil
   fiscal, avisos, borrador de renta por año + Excel) y resumen contable
   (tarjetas, vencimientos, CSV), con sus roles;
   **tanda 10** plataforma (SUPER_PLATFORM_ADMIN): empresas (listar, filtrar,
   paginar, activar/desactivar, impersonar, eliminar; crear con administrador;
   editar + panel de módulos/funciones/descuento; panel 360° con pago,
   suspensión, usuarios), usuarios globales (reset de clave, estado), cuentas
   de pago, configuración, planes y funciones (precios, límites, puertas por
   plan), cupones, comunicados, IA (proveedor, key, prueba), tipos de negocio,
   soporte (bandeja + chat), estadísticas globales, proveedor tecnológico,
   API de facturación DIAN (consumidores + keys) y calendario tributario
   (fechas + UVT); cada pantalla verifica además que solo el rol de plataforma
   entra;
   **tanda 11** portal del contador (`/contador`, sesión `accountant`): portada
   (portafolio, buscador por nombre/NIT, llave + QR, crear empresa externa),
   layout (guard de sesión: sin token o sin `sessionType=accountant` redirige a
   `/login`, "Salir" limpia la sesión) y workspace de empresa
   (`/contador/empresa/[companyId]`) con estados financieros (pestañas
   resultados/balance/flujo, rango de fechas, exportar), libros (diario, mayor,
   auxiliar), plan de cuentas, calendario, impuestos, terceros (crear/editar/
   eliminar) y el panel de asientos manuales.

   **Imágenes (formateador único).** `src/lib/imaging/formatImage.js` redimensiona
   y convierte a WebP toda imagen antes de subir (logo, avatar de perfil,
   productos, soporte) y el módulo usuario permite foto opcional al crear/editar
   con vista previa (`src/components/ui/AvatarUploader.js`). Pruebas: la lógica
   pura del formateador (medidas, recorte, nombre, presets) y el comportamiento
   del subidor (preview, subida, error, quitar). La conversión en canvas corre
   en el navegador; en jsdom el formateador devuelve el archivo original.

   Un módulo nuevo o una acción nueva en uno existente **no se da por
   terminada sin su test**.
8. `vitest.config.mjs` fija `testTimeout: 20000`: con la suite completa en
   paralelo, las pantallas pesadas superan los 5 s por defecto aunque solas
   tarden menos de 2 s.
7. Los listados tipo catálogo (tabla genérica + filtros + ver + eliminar)
   reutilizan `describeCatalogList` de `src/test/catalogBehavior.jsx`; cada
   módulo solo añade sus pruebas de crear/editar y acciones propias.
