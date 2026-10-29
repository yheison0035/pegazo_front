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
