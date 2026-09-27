import StationCard from './StationCard';
import './StationList.css';

/**
 * @param {{
 *   stations: object[], sortBy: 'price' | 'distance', onSortChange: (s: string) => void,
 *   visibleCount: number, onShowMore: () => void, fuelId: string,
 *   selectedId: string | null, cheapestId: string, nearestId: string,
 *   onSelect: (id: string) => void, onShowOnMap: (id: string) => void
 * }} props
 */
export default function StationList({
  stations,
  sortBy,
  onSortChange,
  visibleCount,
  onShowMore,
  fuelId,
  selectedId,
  cheapestId,
  nearestId,
  onSelect,
  onShowOnMap,
}) {
  const shown = stations.slice(0, visibleCount);
  const remaining = stations.length - shown.length;

  return (
    <section className="station-list" aria-labelledby="station-list-title">
      <div className="station-list__head">
        <h2 id="station-list-title" className="station-list__title">
          Todas las gasolineras <span>({stations.length})</span>
        </h2>
        <div className="segmented" role="group" aria-label="Ordenar gasolineras">
          <button type="button" aria-pressed={sortBy === 'price'} onClick={() => onSortChange('price')}>
            Más baratas
          </button>
          <button type="button" aria-pressed={sortBy === 'distance'} onClick={() => onSortChange('distance')}>
            Más cercanas
          </button>
        </div>
      </div>

      <ol className="station-list__items">
        {shown.map((station, index) => (
          <li key={station.id}>
            <StationCard
              station={station}
              rank={index + 1}
              fuelId={fuelId}
              selected={station.id === selectedId}
              isCheapest={station.id === cheapestId}
              isNearest={station.id === nearestId}
              onSelect={onSelect}
              onShowOnMap={onShowOnMap}
            />
          </li>
        ))}
      </ol>

      {remaining > 0 && (
        <button type="button" className="btn btn--outline station-list__more" onClick={onShowMore}>
          Mostrar más gasolineras ({remaining})
        </button>
      )}
    </section>
  );
}
