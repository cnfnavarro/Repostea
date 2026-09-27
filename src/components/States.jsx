import { IconAlert, IconRefresh, IconSearch } from './Icons';
import './States.css';

export function HighlightsSkeleton() {
  return (
    <div className="highlights skeleton-group" aria-hidden="true">
      <div className="skeleton skeleton--hl" />
      <div className="skeleton skeleton--hl" />
      <div className="skeleton skeleton--hl" />
    </div>
  );
}

export function ListSkeleton() {
  return (
    <div className="skeleton-group" role="status">
      <span className="sr-only">Cargando precios…</span>
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="skeleton skeleton--card" aria-hidden="true" />
      ))}
    </div>
  );
}

/** @param {{ message: string, onRetry: () => void }} props */
export function ErrorState({ message, onRetry }) {
  return (
    <div className="state state--error" role="alert">
      <span className="state__icon">
        <IconAlert />
      </span>
      <h3 className="state__title">Algo ha fallado</h3>
      <p className="state__text">{message}</p>
      <button type="button" className="btn btn--primary" onClick={onRetry}>
        <IconRefresh /> Reintentar
      </button>
    </div>
  );
}

/** @param {{ fuelLabel: string, radiusKm: number, nextRadiusKm: number | undefined, onExpand: (km: number) => void }} props */
export function EmptyState({ fuelLabel, radiusKm, nextRadiusKm, onExpand }) {
  return (
    <div className="state">
      <span className="state__icon">
        <IconSearch />
      </span>
      <h3 className="state__title">Ninguna gasolinera a la vista</h3>
      <p className="state__text">
        No hay gasolineras con {fuelLabel} a menos de {radiusKm} km.
        {nextRadiusKm ? ' Prueba a buscar un poco más lejos.' : ' Prueba con otro combustible o ubicación.'}
      </p>
      {nextRadiusKm && (
        <button type="button" className="btn btn--primary" onClick={() => onExpand(nextRadiusKm)}>
          Buscar a {nextRadiusKm} km
        </button>
      )}
    </div>
  );
}
