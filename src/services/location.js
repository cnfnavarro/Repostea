import provinceBounds from '../data/provinceBounds.json';
import { fetchProvince } from './carburantes';

export const SERVICE_DOWN_MESSAGE =
  'No hemos podido conectar con el servicio de precios del Ministerio. Inténtalo de nuevo en unos segundos.';

const toRad = (deg) => (deg * Math.PI) / 180;

/** Distancia en línea recta (fórmula del haversine), en km. */
export function distanceKm(lat1, lon1, lat2, lon2) {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/**
 * Provincias cuya zona con gasolineras queda a menos de `radiusKm` del punto.
 * Así una búsqueda cerca del límite provincial incluye también a las vecinas.
 * provinceBounds.json guarda [latMin, lonMin, latMax, lonMax] de las gasolineras de cada provincia.
 */
export function provincesAround(lat, lon, radiusKm) {
  const dLat = radiusKm / 111;
  const dLon = radiusKm / (111 * Math.cos(toRad(lat)));
  return Object.entries(provinceBounds)
    .filter(
      ([, [south, west, north, east]]) =>
        lat >= south - dLat && lat <= north + dLat && lon >= west - dLon && lon <= east + dLon,
    )
    .map(([id]) => id);
}

export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Tu navegador no permite obtener la ubicación. Busca por código postal.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => {
        const messages = {
          1: 'No tenemos permiso para ver tu ubicación. Actívalo en el navegador o busca por código postal.',
          3: 'Tu ubicación está tardando demasiado. Inténtalo de nuevo o usa tu código postal.',
        };
        reject(new Error(messages[err.code] ?? 'No hemos podido obtener tu ubicación. Prueba con tu código postal.'));
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 5 * 60 * 1000 },
    );
  });
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function mostCommon(values) {
  const counts = new Map();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

function centerOf(stations) {
  return {
    lat: median(stations.map((s) => s.lat)),
    lon: median(stations.map((s) => s.lon)),
    place: mostCommon(stations.map((s) => s.municipality)),
  };
}

async function geocodePostalCode(postalCode) {
  try {
    const url =
      'https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=es&limit=1&addressdetails=1' +
      `&accept-language=es&postalcode=${postalCode}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const [hit] = await res.json();
    if (!hit) return null;
    const a = hit.address ?? {};
    return {
      lat: Number(hit.lat),
      lon: Number(hit.lon),
      place: a.city || a.town || a.village || a.municipality || null,
    };
  } catch {
    return null;
  }
}

/**
 * Convierte un código postal en un punto de búsqueda.
 * 1) Mediana de las gasolineras con ese mismo CP (sin llamadas extra).
 * 2) Geocodificación del CP con OpenStreetMap (Nominatim).
 * 3) Gasolineras de CP vecinos (mismos 4 y luego 3 primeros dígitos).
 */
export async function resolvePostalCode(input) {
  const postalCode = input.trim();
  if (!/^\d{5}$/.test(postalCode)) {
    throw new Error('Escribe un código postal de 5 cifras, por ejemplo 28013.');
  }
  const provinceId = postalCode.slice(0, 2);
  if (!provinceBounds[provinceId]) {
    throw new Error('Ese código postal no corresponde a ninguna provincia española.');
  }

  let stations;
  try {
    ({ stations } = await fetchProvince(provinceId));
  } catch {
    throw new Error(SERVICE_DOWN_MESSAGE);
  }

  const exact = stations.filter((s) => s.postalCode === postalCode);
  if (exact.length) {
    const c = centerOf(exact);
    return { kind: 'cp', postalCode, lat: c.lat, lon: c.lon, label: `${postalCode} · ${c.place}` };
  }

  const geo = await geocodePostalCode(postalCode);
  if (geo) {
    return {
      kind: 'cp',
      postalCode,
      lat: geo.lat,
      lon: geo.lon,
      label: geo.place ? `${postalCode} · ${geo.place}` : postalCode,
    };
  }

  for (const digits of [4, 3]) {
    const prefix = postalCode.slice(0, digits);
    const nearby = stations.filter((s) => s.postalCode?.startsWith(prefix));
    if (nearby.length) {
      const c = centerOf(nearby);
      return { kind: 'cp', postalCode, lat: c.lat, lon: c.lon, label: `${postalCode} · zona de ${c.place}` };
    }
  }

  throw new Error('No hemos encontrado ese código postal. Revisa que esté bien escrito.');
}
