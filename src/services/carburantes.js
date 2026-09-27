/**
 * Cliente del servicio REST oficial de precios de carburantes del
 * Ministerio para la Transición Ecológica y el Reto Demográfico.
 * El servicio permite CORS, así que se consulta directamente desde el navegador.
 */
const API_BASE =
  'https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres';

// El Ministerio publica precios nuevos cada media hora.
const CACHE_TTL_MS = 30 * 60 * 1000;

export const FUELS = [
  { id: 'g95', label: 'Gasolina 95', short: 'G95', field: 'Precio Gasolina 95 E5' },
  { id: 'diesel', label: 'Diésel', short: 'Diésel', field: 'Precio Gasoleo A' },
  { id: 'g98', label: 'Gasolina 98', short: 'G98', field: 'Precio Gasolina 98 E5' },
  { id: 'dieselPremium', label: 'Diésel Premium', short: 'Diésel+', field: 'Precio Gasoleo Premium' },
  { id: 'glp', label: 'GLP', short: 'GLP', field: 'Precio Gases licuados del petróleo' },
];

/** provinceId -> { at: timestamp, promise } */
const cache = new Map();

function parseNumber(value) {
  if (!value) return null;
  const n = Number.parseFloat(value.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

const LOWERCASE_WORDS = new Set(['de', 'del', 'la', 'las', 'el', 'los', 'y', 'e', 'en', 'a', 'al', 'con', 'por']);
const UPPERCASE_WORDS = new Set(['bp', 'q8', 'gm', 'glp', 'gnc', 'gnl', 'e.s.', 's.l.', 's.a.', 'sl', 'sa', 'ii', 'iii', 'iv']);

/** "AVENIDA CASTILLA LA MANCHA, 26" -> "Avenida Castilla la Mancha, 26" */
export function prettify(text = '') {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((word, i) => {
      if (UPPERCASE_WORDS.has(word)) return word.toUpperCase();
      if (word === 's/n' || word === 's/n,') return word;
      if (i > 0 && LOWERCASE_WORDS.has(word)) return word;
      return word.replace(/\p{L}/u, (c) => c.toUpperCase());
    })
    .join(' ')
    .replace(/[\s,]+$/, '');
}

/** "Palmas de Gran Canaria (Las)" -> "Las Palmas de Gran Canaria" */
const moveArticle = (name = '') => name.replace(/^(.+?)\s*\((\p{L}+)\)$/u, '$2 $1');

function toStation(raw) {
  const prices = {};
  for (const fuel of FUELS) {
    const price = parseNumber(raw[fuel.field]);
    if (price) prices[fuel.id] = price;
  }
  return {
    id: raw.IDEESS,
    brand: prettify(raw['Rótulo']) || 'Gasolinera',
    address: prettify(raw['Dirección']),
    town: prettify(moveArticle(raw.Localidad)),
    municipality: moveArticle(raw.Municipio),
    postalCode: raw['C.P.'],
    schedule: raw.Horario,
    publicSale: raw['Tipo Venta'] !== 'R',
    lat: parseNumber(raw.Latitud),
    lon: parseNumber(raw['Longitud (WGS84)']),
    prices,
  };
}

// Algunas estaciones vienen con coordenadas vacías o a (0, 0).
const hasValidCoords = (s) =>
  s.lat != null && s.lon != null && s.lat > 27 && s.lat < 44.5 && s.lon > -18.5 && s.lon < 4.5;

/**
 * Descarga (y cachea 30 min) las gasolineras de una provincia.
 * @param {string} provinceId Código INE de 2 cifras, igual al prefijo del código postal.
 * @returns {Promise<{updatedAt: string, stations: object[]}>}
 */
export function fetchProvince(provinceId) {
  const cached = cache.get(provinceId);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.promise;

  const promise = fetch(`${API_BASE}/FiltroProvincia/${provinceId}`)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((data) => {
      if (data.ResultadoConsulta !== 'OK') throw new Error(data.ResultadoConsulta);
      return {
        updatedAt: data.Fecha,
        stations: data.ListaEESSPrecio.map(toStation).filter((s) => s.publicSale && hasValidCoords(s)),
      };
    });

  cache.set(provinceId, { at: Date.now(), promise });
  promise.catch(() => cache.delete(provinceId));
  return promise;
}
