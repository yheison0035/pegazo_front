'use client';

// Conexión ÚNICA de tiempo real (SSE) con el backend. En vez de que el front
// consulte cada X segundos (sondeo), el backend AVISA cuando algo cambia y aquí
// lo repartimos a quien esté suscrito. Una sola conexión para toda la app.

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'
).replace(/\/$/, '');

let es = null;
let currentToken = null;
let reconnectTimer = null;
let backoff = 1000;
const subs = new Set();

function getToken() {
  try {
    return localStorage.getItem('token');
  } catch {
    return null;
  }
}

function notify(evt) {
  subs.forEach((fn) => {
    try {
      fn(evt);
    } catch {
      /* un suscriptor no debe tumbar a los demás */
    }
  });
}

function cleanup() {
  if (es) {
    try {
      es.close();
    } catch {
      /* noop */
    }
    es = null;
  }
}

function scheduleReconnect() {
  if (reconnectTimer || subs.size === 0) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    backoff = Math.min(backoff * 2, 30000);
    connect();
  }, backoff);
}

function connect() {
  if (typeof window === 'undefined') return;
  const token = getToken();
  if (!token) return; // sin sesión no hay nada que escuchar
  // Ya conectados con el mismo token: no dupliques la conexión.
  if (es && currentToken === token && es.readyState !== 2) return;
  cleanup();
  currentToken = token;
  try {
    es = new EventSource(
      `${API_URL}/realtime/stream?token=${encodeURIComponent(token)}`,
    );
  } catch {
    return;
  }
  es.onopen = () => {
    backoff = 1000;
  };
  es.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      if (data?.type === 'ping') return; // latido para mantener viva la conexión
      notify(data);
    } catch {
      /* ignore */
    }
  };
  es.onerror = () => {
    // Token expirado o corte de red: cerramos y reintentamos con backoff.
    cleanup();
    scheduleReconnect();
  };
}

// Suscribe un callback a los eventos en vivo. Devuelve la función para cancelar.
export function subscribeRealtime(fn) {
  subs.add(fn);
  connect();
  return () => {
    subs.delete(fn);
    if (subs.size === 0) {
      cleanup();
      currentToken = null;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    }
  };
}

// Si la sesión cambia en otra pestaña (login/logout), reconecta con el token nuevo.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== 'token') return;
    cleanup();
    currentToken = null;
    if (subs.size > 0) connect();
  });
}
