'use client';

// Estado compartido de "refresco en segundo plano". Cuando useLiveRefresh vuelve
// a traer datos (sondeo, foco, pestaña), marca este flag mientras dura el fetch,
// para que los loaders (LoadingOverlay, esqueleto de la tabla) NO parpadeen: el
// loader solo debe verse en la carga inicial, no en cada actualización en vivo.
let count = 0;
const subs = new Set();

function notify() {
  subs.forEach((fn) => {
    try {
      fn(count > 0);
    } catch {
      /* noop */
    }
  });
}

export function beginBackgroundRefresh() {
  count += 1;
  notify();
}

export function endBackgroundRefresh() {
  count = Math.max(0, count - 1);
  notify();
}

export function isBackgroundRefreshing() {
  return count > 0;
}

// Suscribe un callback (recibe el booleano). Devuelve la función para desuscribir.
export function subscribeBackgroundRefresh(fn) {
  subs.add(fn);
  return () => subs.delete(fn);
}
