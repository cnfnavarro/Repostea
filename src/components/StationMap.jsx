import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { directionsUrl, formatDistance, formatPrice } from '../utils/format';
import './StationMap.css';

const TILES_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const SPAIN_CENTER = [40.2, -3.7];

// Solo las más baratas llevan etiqueta con precio; el resto son puntos para no saturar el mapa.
const PRICE_LABEL_LIMIT = 30;

const escapeHtml = (text = '') =>
  text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const ORIGIN_ICON = L.divIcon({ className: 'map-origin', iconSize: [0, 0], html: '<span class="map-origin__dot"></span>' });

function popupHtml(s) {
  return `
    <div class="map-popup">
      <strong class="map-popup__brand">${escapeHtml(s.brand)}</strong>
      <span class="map-popup__addr">${escapeHtml(s.address)}, ${escapeHtml(s.town)}</span>
      <span class="map-popup__price">${formatPrice(s.price)} <small>€/L</small></span>
      <span class="map-popup__meta">a ${formatDistance(s.distance)}</span>
      <a class="map-popup__link" href="${directionsUrl(s.lat, s.lon)}" target="_blank" rel="noopener noreferrer">Cómo llegar →</a>
    </div>`;
}

/**
 * Mapa Leaflet con la zona de búsqueda y un marcador con el precio de cada gasolinera.
 * @param {{
 *   origin: {lat: number, lon: number, label: string} | null, radiusKm: number,
 *   stations: object[], bestId: string | undefined,
 *   selection: {id: string, source: 'list' | 'map'} | null, onSelect: (id: string) => void
 * }} props
 */
export default function StationMap({ origin, radiusKm, stations, bestId, selection, onSelect }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const areaLayerRef = useRef(null);
  const stationsLayerRef = useRef(null);
  const markersRef = useRef(new Map());
  const selectedIdRef = useRef(null);
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  // Crear el mapa una sola vez
  useEffect(() => {
    const map = L.map(containerRef.current, { scrollWheelZoom: false, zoomSnap: 0.5 }).setView(SPAIN_CENTER, 6);
    // En modo oscuro las teselas se invierten por CSS (ver StationMap.css).
    L.tileLayer(TILES_URL, { attribution: ATTRIBUTION, maxZoom: 19 }).addTo(map);

    // La rueda del ratón solo hace zoom tras pulsar el mapa, para no secuestrar el scroll de la página.
    map.on('click', () => map.scrollWheelZoom.enable());
    map.on('mouseout', () => map.scrollWheelZoom.disable());

    areaLayerRef.current = L.layerGroup().addTo(map);
    stationsLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    const resizeObserver = new ResizeObserver(() => map.invalidateSize());
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Zona de búsqueda: punto de origen + círculo del radio
  useEffect(() => {
    const map = mapRef.current;
    const layer = areaLayerRef.current;
    if (!map || !origin) return;
    layer.clearLayers();
    const center = L.latLng(origin.lat, origin.lon);
    L.circle(center, {
      radius: radiusKm * 1000,
      className: 'map-radius',
      color: '#1f5c57',
      weight: 2,
      fillOpacity: 0.06,
      interactive: false,
    }).addTo(layer);
    L.marker(center, { icon: ORIGIN_ICON, keyboard: false, zIndexOffset: -1000 })
      .bindTooltip(origin.kind === 'gps' ? 'Estás aquí' : escapeHtml(origin.label), { direction: 'top', offset: [0, -10] })
      .addTo(layer);
    map.fitBounds(center.toBounds(radiusKm * 2000), { padding: [12, 12] });
  }, [origin, radiusKm]);

  // Marcadores con precio
  useEffect(() => {
    const layer = stationsLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    markersRef.current.clear();
    selectedIdRef.current = null;

    const maxPrice = stations.reduce((max, s) => Math.max(max, s.price), 0);
    const labelled = new Set(
      [...stations]
        .sort((a, b) => a.price - b.price || a.distance - b.distance)
        .slice(0, PRICE_LABEL_LIMIT)
        .map((s) => s.id),
    );

    for (const s of stations) {
      const isBest = s.id === bestId;
      const hasLabel = labelled.has(s.id);
      const icon = L.divIcon({
        className: 'price-pin-anchor',
        iconSize: [0, 0],
        html: hasLabel
          ? `<span class="map-marker price-pin price-pin--${s.level}${isBest ? ' price-pin--best' : ''}">${isBest ? '★ ' : ''}${formatPrice(s.price)}</span>`
          : `<span class="map-marker price-dot price-dot--${s.level}"></span>`,
      });
      const marker = L.marker([s.lat, s.lon], {
        icon,
        title: `${s.brand}: ${formatPrice(s.price)} €/L`,
        riseOnHover: true,
        // Las más baratas quedan por encima cuando los marcadores se solapan
        zIndexOffset: (isBest ? 30000 : hasLabel ? 10000 : 0) + Math.round((maxPrice - s.price) * 10000),
      });
      marker.bindPopup(popupHtml(s), { offset: [0, hasLabel ? -30 : -4], autoPanPadding: [24, 24] });
      marker.on('click', () => onSelectRef.current(s.id));
      marker.addTo(layer);
      markersRef.current.set(s.id, marker);
    }
  }, [stations, bestId]);

  // Gasolinera seleccionada (desde la lista o desde el propio mapa)
  useEffect(() => {
    const map = mapRef.current;
    const previous = markersRef.current.get(selectedIdRef.current);
    previous?.getElement()?.querySelector('.map-marker')?.classList.remove('is-selected');
    selectedIdRef.current = null;

    const marker = selection && markersRef.current.get(selection.id);
    if (!map || !marker) return;
    marker.getElement()?.querySelector('.map-marker')?.classList.add('is-selected');
    selectedIdRef.current = selection.id;

    if (selection.source === 'map') return;
    const target = marker.getLatLng();
    const zoom = Math.max(map.getZoom(), 14);
    if (map.getZoom() === zoom && map.getCenter().distanceTo(target) < 5) {
      marker.openPopup();
    } else {
      map.once('moveend', () => marker.openPopup());
      map.flyTo(target, zoom, { duration: 0.6 });
    }
  }, [selection, stations]);

  return (
    <div className="station-map-wrap">
      <div ref={containerRef} className="station-map" role="region" aria-label="Mapa de gasolineras" />
      <ul className="map-legend" aria-label="Leyenda del mapa">
        <li>
          <span className="price-dot price-dot--low" /> Barata
        </li>
        <li>
          <span className="price-dot price-dot--mid" /> Normal
        </li>
        <li>
          <span className="price-dot price-dot--high" /> Cara
        </li>
      </ul>
    </div>
  );
}
