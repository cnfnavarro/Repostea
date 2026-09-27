import { TANK_LITERS } from '../config';
import { directionsUrl, formatDistance, formatEuros, formatPrice } from '../utils/format';
import { IconChart, IconMap, IconPin, IconRoute, IconTag } from './Icons';
import './Highlights.css';

/**
 * Tres tarjetas resumen: la más barata, la más cercana y el precio medio de la zona.
 * @param {{ summary: { cheapest: object, nearest: object, min: number, max: number, avg: number, count: number },
 *           onShowOnMap: (id: string) => void }} props
 */
export default function Highlights({ summary, onShowOnMap }) {
  const { cheapest, nearest, min, max, avg, count } = summary;
  const savingVsAverage = (avg - cheapest.price) * TANK_LITERS;
  const nearestExtra = nearest.price - cheapest.price;
  const avgPosition = max > min ? ((avg - min) / (max - min)) * 100 : 50;

  return (
    <section className="highlights" aria-label="Resumen de la zona">
      <article className="hl hl--best">
        <p className="hl__label">
          <IconTag /> La más barata
        </p>
        <p className="hl__price">
          {formatPrice(cheapest.price)}
          <small>€/L</small>
        </p>
        <h3 className="hl__name">{cheapest.brand}</h3>
        <p className="hl__addr">
          {cheapest.address}, {cheapest.town}
        </p>
        <p className="hl__dist">
          <IconPin /> a {formatDistance(cheapest.distance)}
        </p>
        {savingVsAverage >= 0.01 && (
          <p className="hl__note hl__note--save">
            Ahorras <strong>{formatEuros(savingVsAverage)}</strong> por depósito de {TANK_LITERS} L frente a la
            media de la zona.
          </p>
        )}
        <div className="hl__actions">
          <a
            className="btn btn--accent"
            href={directionsUrl(cheapest.lat, cheapest.lon)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <IconRoute /> Cómo llegar
          </a>
          <button type="button" className="btn btn--on-dark" onClick={() => onShowOnMap(cheapest.id)}>
            <IconMap /> Ver en el mapa
          </button>
        </div>
      </article>

      <article className="hl hl--near">
        <p className="hl__label">
          <IconPin /> La más cercana
        </p>
        <p className="hl__price">
          {formatPrice(nearest.price)}
          <small>€/L</small>
        </p>
        <h3 className="hl__name">{nearest.brand}</h3>
        <p className="hl__addr">
          {nearest.address}, {nearest.town}
        </p>
        <p className="hl__dist">
          <IconPin /> a {formatDistance(nearest.distance)}
        </p>
        <p className="hl__note">
          {nearestExtra < 0.0005 ? (
            <>¡Además tiene el mejor precio de la zona!</>
          ) : (
            <>
              Pagas <strong>{formatPrice(nearestExtra)} €/L</strong> más que en la más barata (
              {formatEuros(nearestExtra * TANK_LITERS)} por depósito).
            </>
          )}
        </p>
        <div className="hl__actions">
          <a
            className="btn btn--soft"
            href={directionsUrl(nearest.lat, nearest.lon)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <IconRoute /> Cómo llegar
          </a>
        </div>
      </article>

      <article className="hl hl--stats">
        <p className="hl__label">
          <IconChart /> Precio medio de la zona
        </p>
        <p className="hl__price">
          {formatPrice(avg)}
          <small>€/L</small>
        </p>
        <div className="range" aria-hidden="true">
          <div className="range__bar">
            <span className="range__marker" style={{ left: `${avgPosition}%` }} />
          </div>
        </div>
        <dl className="range__labels">
          <div>
            <dt>Mínimo</dt>
            <dd>{formatPrice(min)}</dd>
          </div>
          <div>
            <dt>Máximo</dt>
            <dd>{formatPrice(max)}</dd>
          </div>
        </dl>
        <p className="hl__note">
          {count === 1 ? 'Solo hay 1 gasolinera' : `${count} gasolineras comparadas`}
          {max > min && (
            <>
              . Entre la más cara y la más barata hay <strong>{formatEuros((max - min) * TANK_LITERS)}</strong> de
              diferencia por depósito.
            </>
          )}
        </p>
      </article>
    </section>
  );
}
