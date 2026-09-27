import { FUELS } from '../services/carburantes';
import { directionsUrl, formatDistance, formatPrice, isOpen24h } from '../utils/format';
import { IconClock, IconMap, IconPin, IconRoute } from './Icons';

const LEVEL_LABEL = { low: 'Barata', mid: 'Normal', high: 'Cara' };

/**
 * @param {{
 *   station: object, rank: number, fuelId: string, selected: boolean,
 *   isCheapest: boolean, isNearest: boolean,
 *   onSelect: (id: string) => void, onShowOnMap: (id: string) => void
 * }} props
 */
export default function StationCard({ station: s, rank, fuelId, selected, isCheapest, isNearest, onSelect, onShowOnMap }) {
  const open24h = isOpen24h(s.schedule);
  const otherFuels = FUELS.filter((f) => f.id !== fuelId && s.prices[f.id]);
  const stop = (event) => event.stopPropagation();

  return (
    <article
      id={`station-${s.id}`}
      className={`station station--${s.level}${selected ? ' is-selected' : ''}`}
      onClick={() => onSelect(s.id)}
    >
      <span className="station__rank" aria-label={`Puesto ${rank}`}>
        {rank}
      </span>

      <div className="station__body">
        {(isCheapest || isNearest) && (
          <p className="station__tags">
            {isCheapest && <span className="tag tag--best">La más barata</span>}
            {isNearest && <span className="tag tag--near">La más cercana</span>}
          </p>
        )}
        <h3 className="station__brand">{s.brand}</h3>
        <p className="station__address">
          {s.address} · {s.town}
        </p>
        {otherFuels.length > 0 && (
          <p className="station__others" aria-label="Otros combustibles">
            {otherFuels.map((f) => (
              <span key={f.id}>
                {f.short} <strong>{formatPrice(s.prices[f.id])}</strong>
              </span>
            ))}
          </p>
        )}
      </div>

      <div className="station__side">
        <p className="station__price">
          <strong>{formatPrice(s.price)}</strong>
          <span>€/L</span>
        </p>
        <span className="level">{LEVEL_LABEL[s.level]}</span>
      </div>

      <div className="station__foot">
        <ul className="station__meta">
          <li>
            <IconPin /> {formatDistance(s.distance)}
          </li>
          <li>
            <IconClock /> {open24h ? 'Abierta 24 h' : s.schedule}
          </li>
        </ul>
        <div className="station__actions">
          <button
            type="button"
            className="pill-btn"
            onClick={(e) => {
              stop(e);
              onShowOnMap(s.id);
            }}
          >
            <IconMap /> Mapa
          </button>
          <a
            className="pill-btn pill-btn--primary"
            href={directionsUrl(s.lat, s.lon)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={stop}
          >
            <IconRoute /> Cómo llegar
          </a>
        </div>
      </div>
    </article>
  );
}
