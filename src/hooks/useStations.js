import { useEffect, useMemo, useState } from 'react';
import { fetchProvince } from '../services/carburantes';
import { provincesAround, SERVICE_DOWN_MESSAGE } from '../services/location';

// Margen extra para no perder gasolineras justo en el borde del radio.
const BORDER_MARGIN_KM = 2;
const OUTSIDE_SPAIN_MESSAGE = 'Solo tenemos precios de gasolineras en España. Prueba con otra ubicación.';

/**
 * Carga las gasolineras de todas las provincias que tocan el radio de búsqueda.
 * Si al cambiar el radio las provincias son las mismas, no se vuelve a descargar nada.
 * @param {{lat: number, lon: number} | null} origin
 * @param {number} radiusKm
 * @param {number} retryToken Cambiarlo fuerza un nuevo intento tras un error.
 */
export function useStations(origin, radiusKm, retryToken) {
  // Resultado de la última petición terminada y para qué petición era.
  const [result, setResult] = useState({ request: null, loadedFor: null, stations: [], updatedAt: null, error: null });

  const provinceKey = useMemo(
    () => (origin ? provincesAround(origin.lat, origin.lon, radiusKm + BORDER_MARGIN_KM).join(',') : ''),
    [origin, radiusKm],
  );

  useEffect(() => {
    if (!origin || !provinceKey) return undefined;
    let cancelled = false;
    const request = { origin, provinceKey, retryToken };

    Promise.all(provinceKey.split(',').map(fetchProvince))
      .then((responses) => {
        if (cancelled) return;
        setResult({
          request,
          loadedFor: origin,
          stations: responses.flatMap((r) => r.stations),
          updatedAt: responses[0].updatedAt,
          error: null,
        });
      })
      .catch(() => {
        if (cancelled) return;
        setResult((prev) => ({ ...prev, request, error: SERVICE_DOWN_MESSAGE }));
      });

    return () => {
      cancelled = true;
    };
  }, [origin, provinceKey, retryToken]);

  if (origin && !provinceKey) {
    return { stations: [], updatedAt: null, hasData: false, isLoading: false, error: OUTSIDE_SPAIN_MESSAGE };
  }

  const { request } = result;
  const isCurrent =
    request !== null &&
    request.origin === origin &&
    request.provinceKey === provinceKey &&
    request.retryToken === retryToken;
  const hasData = origin !== null && result.loadedFor === origin;
  const error = isCurrent ? result.error : null;

  return {
    // Mientras se amplía el radio seguimos mostrando lo que ya teníamos de este mismo origen.
    stations: hasData ? result.stations : [],
    updatedAt: hasData ? result.updatedAt : null,
    hasData,
    isLoading: origin !== null && !isCurrent,
    error,
  };
}
