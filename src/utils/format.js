const priceFormat = new Intl.NumberFormat('es-ES', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
const euroFormat = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });
const kmFormat = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 });

/** 1.459 -> "1,459" */
export const formatPrice = (price) => priceFormat.format(price);

/** 4.35 -> "4,35 €" */
export const formatEuros = (amount) => euroFormat.format(amount);

/** 0.45 -> "450 m", 3.24 -> "3,2 km" */
export function formatDistance(km) {
  if (km < 1) return `${Math.max(10, Math.round(km * 100) * 10)} m`;
  return `${kmFormat.format(km)} km`;
}

/** "27/09/2026 23:56:34" -> "27/09/2026 a las 23:56"; "28/09/2026 0:12:34" -> "28/09/2026 a las 00:12" */
export function formatUpdatedAt(apiDate) {
  if (!apiDate) return '';
  const [date, time = ''] = apiDate.split(' ');
  const [hours, minutes] = time.split(':');
  return minutes ? `${date} a las ${hours.padStart(2, '0')}:${minutes}` : date;
}

export const directionsUrl = (lat, lon) =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;

export const isOpen24h = (schedule = '') => /24\s*H/i.test(schedule);
