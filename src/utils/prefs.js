// Preferencias del usuario (combustible, radio, último CP) guardadas en su navegador.
const PREFIX = 'repostea:';

export function readPref(key) {
  try {
    return window.localStorage.getItem(PREFIX + key);
  } catch {
    return null;
  }
}

export function writePref(key, value) {
  try {
    window.localStorage.setItem(PREFIX + key, value);
  } catch {
    // Navegación privada o almacenamiento bloqueado: la app funciona igual sin recordar.
  }
}
