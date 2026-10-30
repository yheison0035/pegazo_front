// Pruebas de comportamiento COMUNES a los listados "tipo catálogo" del CRM
// (tabla genérica + filtros por columna + ver detalle + eliminar con
// confirmación). Cada módulo las invoca con sus datos y añade lo específico
// (crear, editar, acciones propias) en su propio archivo.
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { within } from '@testing-library/react';
import {
  installApi,
  on,
  list,
  detail,
  ok,
  fail,
  baseRoutes,
  resetBehavior,
  renderPage,
  screen,
  click,
  typeInto,
  buttons,
  rowButton,
  queryRowButton,
  waitForCall,
  expectToast,
  router,
} from './behaviorHarness';

/**
 * @param {object} o
 * @param {string} o.title            Nombre del módulo para el describe.
 * @param {Function} o.Page           Componente de la página de listado.
 * @param {string} o.base             Ruta base del backend, p. ej. '/providers'.
 * @param {Array}  o.rows             Filas simuladas (≥ 2) con la forma real.
 * @param {string} o.rowText          Texto visible de la primera fila (para ubicarla).
 * @param {string} o.secondRowText    Texto visible de la segunda fila.
 * @param {string} o.filterPlaceholder Placeholder del filtro de texto a probar.
 * @param {string} o.filterKey        Clave de query que debe viajar con ese filtro.
 * @param {string} o.heading          Título de la pantalla.
 * @param {string} o.viewTitle        Título del modal de detalle.
 * @param {string} o.newHref          href del botón de agregar (null si no aplica).
 * @param {string} o.addText          Texto del botón de agregar.
 * @param {object} o.user             { type, role } del usuario con permisos completos.
 * @param {string[]} o.readOnlyRoles  Roles que NO deben ver "Eliminar".
 * @param {string[]} o.blockedRoles   Roles que son redirigidos al dashboard.
 * @param {Array}  o.extraRoutes      Rutas adicionales del backend simulado.
 */
export function describeCatalogList(o) {
  const escaped = o.base.replace(/\//g, '\\/');
  const LIST_RE = new RegExp(`^${escaped}$`);
  const ITEM_RE = new RegExp(`^${escaped}\\/\\d+$`);
  const user = o.user || {};

  const makeApi = () =>
    installApi([
      ...(o.extraRoutes || []),
      on('GET', LIST_RE, list(o.rows, { total: o.rows.length })),
      on('GET', ITEM_RE, detail(o.rows[0])),
      on('DELETE', ITEM_RE, ok()),
      ...baseRoutes(),
    ]);

  describe(`${o.title} · listado`, () => {
    let api;
    beforeEach(() => {
      resetBehavior(user);
      api = makeApi();
    });
    afterEach(() => vi.restoreAllMocks());

    it('carga la primera página y muestra las filas', async () => {
      await renderPage(<o.Page />);
      const call = await waitForCall(api, 'GET', LIST_RE);
      expect(call.query).toMatchObject({ page: '1', limit: '10' });
      expect(screen.getByText(o.heading)).toBeInTheDocument();
      expect(screen.getByText(o.rowText)).toBeInTheDocument();
      expect(screen.getByText(o.secondRowText)).toBeInTheDocument();
    });

    if (o.filterPlaceholder) {
      it('el filtro por columna viaja al backend y vuelve a la página 1', async () => {
        await renderPage(<o.Page />);
        await waitForCall(api, 'GET', LIST_RE);
        await typeInto(screen.getAllByPlaceholderText(o.filterPlaceholder)[0], 'ZZ');
        const call = await waitForCall(api, 'GET', LIST_RE, { count: 2 });
        expect(call.query[o.filterKey]).toBe('ZZ');
        expect(call.query.page).toBe('1');
      });
    }

    it('paginación: siguiente página', async () => {
      api.set('GET', LIST_RE, list(o.rows, { total: 25, limit: 10 }));
      await renderPage(<o.Page />);
      await waitForCall(api, 'GET', LIST_RE);
      await click(buttons('→')[0]);
      const call = await waitForCall(api, 'GET', LIST_RE, { count: 2 });
      expect(call.query.page).toBe('2');
    });

    if (o.viewTitle) {
      it('ver detalle abre la ficha y se cierra', async () => {
        await renderPage(<o.Page />);
        await waitForCall(api, 'GET', LIST_RE);
        await click(rowButton(o.rowText, 'Ver detalle'));
        const modal = screen.getByText(o.viewTitle).closest('.fixed');
        expect(within(modal).getByText(o.rowText)).toBeInTheDocument();
        await click(within(modal).getAllByRole('button')[0]);
        expect(screen.queryByText(o.viewTitle)).toBeNull();
      });
    }

    it('eliminar pide confirmación, llama DELETE y recarga', async () => {
      await renderPage(<o.Page />);
      await waitForCall(api, 'GET', LIST_RE);
      await click(rowButton(o.secondRowText, 'Eliminar'));
      const modal = screen.getByText('Confirmar eliminación').parentElement;
      expect(within(modal).getByText(o.secondRowText)).toBeInTheDocument();
      await click(within(modal).getByRole('button', { name: 'Eliminar' }));
      await waitForCall(api, 'DELETE', new RegExp(`^${escaped}\\/${o.rows[1].id}$`));
      await waitForCall(api, 'GET', LIST_RE, { count: 2 });
      expect(screen.queryByText('Confirmar eliminación')).toBeNull();
    });

    it('cancelar la eliminación no llama al backend', async () => {
      await renderPage(<o.Page />);
      await waitForCall(api, 'GET', LIST_RE);
      await click(rowButton(o.rowText, 'Eliminar'));
      const modal = screen.getByText('Confirmar eliminación').parentElement;
      await click(within(modal).getByRole('button', { name: 'Cancelar' }));
      expect(api.count('DELETE', ITEM_RE)).toBe(0);
    });

    it('si el backend rechaza el borrado, se avisa el motivo', async () => {
      api.set('DELETE', ITEM_RE, fail(400, 'Tiene registros asociados'));
      await renderPage(<o.Page />);
      await waitForCall(api, 'GET', LIST_RE);
      await click(rowButton(o.rowText, 'Eliminar'));
      const modal = screen.getByText('Confirmar eliminación').parentElement;
      await click(within(modal).getByRole('button', { name: 'Eliminar' }));
      await expectToast('error', 'Tiene registros asociados');
      expect(screen.queryByText('Confirmar eliminación')).toBeNull();
    });

    if (o.newHref) {
      it('los accesos a crear y editar apuntan a sus pantallas', async () => {
        await renderPage(<o.Page />);
        await waitForCall(api, 'GET', LIST_RE);
        expect(screen.getByText(o.addText).closest('a')).toHaveAttribute('href', o.newHref);
        expect(rowButton(o.rowText, 'Editar')).toHaveAttribute('href', `${o.newHref.replace(/\/new$/, '')}/edit/${o.rows[0].id}`);
      });
    }
  });

  if ((o.readOnlyRoles || []).length || (o.blockedRoles || []).length) {
    describe(`${o.title} · permisos`, () => {
      afterEach(() => vi.restoreAllMocks());

      for (const role of o.readOnlyRoles || []) {
        it(`${role} no ve "Eliminar"`, async () => {
          resetBehavior({ ...user, role });
          const api = makeApi();
          await renderPage(<o.Page />);
          await waitForCall(api, 'GET', LIST_RE);
          expect(screen.getByText(o.rowText)).toBeInTheDocument();
          expect(queryRowButton(o.rowText, 'Eliminar')).toBeNull();
        });
      }

      for (const role of o.blockedRoles || []) {
        it(`${role} es redirigido al dashboard`, async () => {
          resetBehavior({ ...user, role });
          makeApi();
          await renderPage(<o.Page />);
          expect(router.push).toHaveBeenCalledWith('/dashboard');
          expect(screen.queryByText(o.heading)).toBeNull();
        });
      }
    });
  }
}
