'use client';

// Preferencia de modo oscuro por dispositivo (personal, no por empresa).
// Se guarda en localStorage y se avisa a los que escuchan con un evento.
export const DARK_KEY = 'pegazo_dark';
export const DARK_EVENT = 'pegazo-dark-change';

export function isDark() {
  try {
    return localStorage.getItem(DARK_KEY) === '1';
  } catch (_) {
    return false;
  }
}

export function setDark(value) {
  try {
    localStorage.setItem(DARK_KEY, value ? '1' : '0');
  } catch (_) {}
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(DARK_EVENT));
  }
}

export function toggleDark() {
  setDark(!isDark());
}
