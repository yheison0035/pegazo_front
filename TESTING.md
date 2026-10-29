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
