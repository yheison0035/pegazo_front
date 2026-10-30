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
   editar, eliminar) y membresías (crear, cobrar, deshacer, editar, eliminar).
   Un módulo nuevo o una acción nueva en uno existente **no se da por
   terminada sin su test**.
7. Los listados tipo catálogo (tabla genérica + filtros + ver + eliminar)
   reutilizan `describeCatalogList` de `src/test/catalogBehavior.jsx`; cada
   módulo solo añade sus pruebas de crear/editar y acciones propias.
