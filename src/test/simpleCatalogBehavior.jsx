// Pruebas de comportamiento para los catálogos SIMPLES del CRM (lista en
// tabla + modal con un nombre + confirmación de borrado), p. ej. segmentos de
// clientes, tipos de cargo, tipos de gasto, métodos de pago.
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { within } from '@testing-library/react';
import {
  installApi,
  on,
  ok,
  fail,
  baseRoutes,
  resetBehavior,
  renderPage,
  screen,
  click,
  typeInto,
  button,
  waitForCall,
  expectToast,
  router,
} from './behaviorHarness';

/**
 * @param {object} o
 * @param {string} o.title        Nombre del módulo.
 * @param {Function} o.Page       Página de listado.
 * @param {string} o.base         Ruta base del backend, p. ej. '/customer-segments'.
 * @param {Array}  o.rows         Dos o más filas con la forma real ({id, name, isBase?, usageCount?}).
 * @param {string} o.heading      Título visible de la pantalla.
 * @param {string} o.addText      Texto del botón de crear.
 * @param {string} o.placeholder  Placeholder del nombre en el modal.
 * @param {string} o.deleteTitle  Título del modal de confirmación de borrado.
 * @param {object} [o.extraCreate] Campos adicionales esperados en el POST.
 * @param {Function} [o.fillExtra] Rellena campos extra del modal (recibe el modal).
 * @param {string[]} [o.blockedRoles] Roles redirigidos.
 * @param {object} [o.user]       { type, role } del usuario con permisos.
 */
export function describeSimpleCatalog(o) {
  const escaped = o.base.replace(/\//g, '\\/');
  const LIST_RE = new RegExp(`^${escaped}$`);
  const ITEM_RE = new RegExp(`^${escaped}\\/\\d+$`);
  const user = o.user || {};

  const makeApi = () =>
    installApi([
      on('GET', LIST_RE, ok(o.rows)),
      on('POST', LIST_RE, ok({ id: 99 })),
      on('PUT', ITEM_RE, ok({ id: o.rows[0].id })),
      on('DELETE', ITEM_RE, ok()),
      ...(o.extraRoutes || []),
      ...baseRoutes(),
    ]);

  const modalWithPlaceholder = async () => {
    const input = await screen.findByPlaceholderText(o.placeholder);
    return { input, modal: input.closest('.fixed') };
  };

  describe(`${o.title}`, () => {
    let api;
    beforeEach(() => {
      resetBehavior(user);
      api = makeApi();
    });
    afterEach(() => vi.restoreAllMocks());

    it('lista los registros', async () => {
      await renderPage(<o.Page />);
      await waitForCall(api, 'GET', LIST_RE);
      expect(screen.getByText(o.heading)).toBeInTheDocument();
      expect(await screen.findByText(o.rows[0].name)).toBeInTheDocument();
      expect(screen.getByText(o.rows[1].name)).toBeInTheDocument();
    });

    it('crea un registro desde el modal (nombre en mayúsculas)', async () => {
      await renderPage(<o.Page />);
      await screen.findByText(o.rows[0].name);
      await click(button(o.addText));
      const { input, modal } = await modalWithPlaceholder();
      await typeInto(input, 'nuevo registro');
      expect(input.value).toBe('NUEVO REGISTRO');
      if (o.fillExtra) await o.fillExtra(modal);
      await click(within(modal).getByRole('button', { name: 'Guardar' }));
      const call = await waitForCall(api, 'POST', LIST_RE);
      expect(call.body).toEqual({ name: 'NUEVO REGISTRO', ...(o.extraCreate || {}) });
      await waitForCall(api, 'GET', LIST_RE, { count: 2 });
      expect(screen.queryByPlaceholderText(o.placeholder)).toBeNull();
    });

    it('con el nombre vacío no envía nada', async () => {
      await renderPage(<o.Page />);
      await screen.findByText(o.rows[0].name);
      await click(button(o.addText));
      const { modal } = await modalWithPlaceholder();
      await click(within(modal).getByRole('button', { name: 'Guardar' }));
      expect(api.count('POST', LIST_RE)).toBe(0);
      expect(screen.getByPlaceholderText(o.placeholder)).toBeInTheDocument();
    });

    it('edita un registro con PUT', async () => {
      await renderPage(<o.Page />);
      await screen.findByText(o.rows[0].name);
      await click(screen.getAllByLabelText('Editar')[0]);
      const { input, modal } = await modalWithPlaceholder();
      expect(input.value).toBe(o.rows[0].name);
      await typeInto(input, `${o.rows[0].name} 2`);
      await click(within(modal).getByRole('button', { name: 'Guardar' }));
      const call = await waitForCall(api, 'PUT', new RegExp(`^${escaped}\\/${o.rows[0].id}$`));
      expect(call.body.name).toBe(`${o.rows[0].name} 2`);
    });

    it('eliminar pide confirmación, llama DELETE y recarga; cancelar no hace nada', async () => {
      await renderPage(<o.Page />);
      await screen.findByText(o.rows[0].name);
      const deleteButtons = screen.getAllByLabelText('Eliminar');
      await click(deleteButtons[deleteButtons.length - 1]);
      let confirm = (await screen.findByText(o.deleteTitle)).closest('.fixed');
      await click(within(confirm).getByRole('button', { name: 'Cancelar' }));
      expect(api.count('DELETE', ITEM_RE)).toBe(0);

      await click(screen.getAllByLabelText('Eliminar').pop());
      confirm = (await screen.findByText(o.deleteTitle)).closest('.fixed');
      await click(within(confirm).getByRole('button', { name: 'Eliminar' }));
      await waitForCall(api, 'DELETE', ITEM_RE);
      await waitForCall(api, 'GET', LIST_RE, { count: 2 });
    });

    it('si el backend rechaza el borrado, se avisa', async () => {
      api.set('DELETE', ITEM_RE, fail(400, 'Está en uso'));
      await renderPage(<o.Page />);
      await screen.findByText(o.rows[0].name);
      await click(screen.getAllByLabelText('Eliminar').pop());
      const confirm = (await screen.findByText(o.deleteTitle)).closest('.fixed');
      await click(within(confirm).getByRole('button', { name: 'Eliminar' }));
      await expectToast('error', 'Está en uso');
    });

    for (const role of o.blockedRoles || []) {
      it(`${role} es redirigido al dashboard`, async () => {
        resetBehavior({ ...user, role });
        makeApi();
        await renderPage(<o.Page />);
        expect(router.push).toHaveBeenCalledWith('/dashboard');
      });
    }
  });
}
