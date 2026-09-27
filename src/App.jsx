import { useEffect, useMemo, useRef, useState } from 'react';
import Header from './components/Header';
import SearchPanel from './components/SearchPanel';
import FuelPicker from './components/FuelPicker';
import RadiusPicker from './components/RadiusPicker';
import Highlights from './components/Highlights';
import StationList from './components/StationList';
import StationMap from './components/StationMap';
import HowItWorks from './components/HowItWorks';
import Footer from './components/Footer';
import { EmptyState, ErrorState, HighlightsSkeleton, ListSkeleton } from './components/States';
import { FUELS } from './services/carburantes';
import { distanceKm, getCurrentPosition, resolvePostalCode } from './services/location';
import { useStations } from './hooks/useStations';
import { formatUpdatedAt } from './utils/format';
import { readPref, writePref } from './utils/prefs';
import { DEFAULT_FUEL, DEFAULT_RADIUS_KM, PAGE_SIZE, RADII_KM } from './config';
import './App.css';

const DESKTOP_QUERY = '(min-width: 1024px)';
const byPrice = (a, b) => a.price - b.price || a.distance - b.distance;
const byDistance = (a, b) => a.distance - b.distance || a.price - b.price;

function initialFuel() {
  const saved = readPref('fuel');
  return FUELS.some((f) => f.id === saved) ? saved : DEFAULT_FUEL;
}

function initialRadius() {
  const saved = Number(readPref('radius'));
  return RADII_KM.includes(saved) ? saved : DEFAULT_RADIUS_KM;
}

const smoothScroll = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';

export default function App() {
  const [fuel, setFuel] = useState(initialFuel);
  const [radius, setRadius] = useState(initialRadius);
  const [origin, setOrigin] = useState(null);
  const [pending, setPending] = useState(null);
  const [searchError, setSearchError] = useState(null);
  const [selection, setSelection] = useState(null);
  const [sortBy, setSortBy] = useState('price');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [retryToken, setRetryToken] = useState(0);
  const resultsRef = useRef(null);

  const { stations, updatedAt, hasData, isLoading, error } = useStations(origin, radius, retryToken);
  const fuelInfo = FUELS.find((f) => f.id === fuel);

  // Gasolineras dentro del radio que venden el combustible elegido
  const results = useMemo(() => {
    if (!origin) return [];
    const list = [];
    for (const s of stations) {
      const price = s.prices[fuel];
      if (price == null) continue;
      const distance = distanceKm(origin.lat, origin.lon, s.lat, s.lon);
      if (distance <= radius) list.push({ ...s, price, distance });
    }
    return list;
  }, [origin, stations, fuel, radius]);

  const summary = useMemo(() => {
    if (!results.length) return null;
    let sum = 0;
    let cheapest = results[0];
    let nearest = results[0];
    let min = Infinity;
    let max = -Infinity;
    for (const s of results) {
      sum += s.price;
      min = Math.min(min, s.price);
      max = Math.max(max, s.price);
      if (byPrice(s, cheapest) < 0) cheapest = s;
      if (byDistance(s, nearest) < 0) nearest = s;
    }
    return { cheapest, nearest, min, max, avg: sum / results.length, count: results.length };
  }, [results]);

  // Nivel de precio por tercios: barata / normal / cara
  const leveled = useMemo(() => {
    if (!results.length) return [];
    const prices = results.map((s) => s.price).sort((a, b) => a - b);
    const lowCut = prices[Math.floor((prices.length - 1) / 3)];
    const highCut = prices[Math.floor(((prices.length - 1) * 2) / 3)];
    return results.map((s) => ({
      ...s,
      level: s.price <= lowCut ? 'low' : s.price > highCut ? 'high' : 'mid',
    }));
  }, [results]);

  const ranked = useMemo(
    () => [...leveled].sort(sortBy === 'price' ? byPrice : byDistance),
    [leveled, sortBy],
  );

  // Al lanzar una búsqueda nueva, llevamos al usuario a los resultados
  useEffect(() => {
    if (origin) resultsRef.current?.scrollIntoView({ behavior: smoothScroll(), block: 'start' });
  }, [origin]);

  function startSearch(nextOrigin) {
    setOrigin(nextOrigin);
    setSelection(null);
    setVisibleCount(PAGE_SIZE);
  }

  async function handlePostalCode(postalCode) {
    setPending('cp');
    setSearchError(null);
    try {
      const next = await resolvePostalCode(postalCode);
      writePref('cp', next.postalCode);
      startSearch(next);
    } catch (err) {
      setSearchError(err.message);
    } finally {
      setPending(null);
    }
  }

  async function handleLocation() {
    setPending('gps');
    setSearchError(null);
    try {
      const { lat, lon } = await getCurrentPosition();
      startSearch({ kind: 'gps', lat, lon, label: 'Tu ubicación' });
    } catch (err) {
      setSearchError(err.message);
    } finally {
      setPending(null);
    }
  }

  function changeFuel(id) {
    setFuel(id);
    writePref('fuel', id);
    setSelection(null);
    setVisibleCount(PAGE_SIZE);
  }

  function changeRadius(km) {
    setRadius(km);
    writePref('radius', String(km));
    setSelection(null);
    setVisibleCount(PAGE_SIZE);
  }

  function selectFromList(id) {
    setSelection({ id, source: 'list' });
  }

  function showOnMap(id) {
    setSelection({ id, source: 'list' });
    if (!window.matchMedia(DESKTOP_QUERY).matches) {
      document.getElementById('mapa')?.scrollIntoView({ behavior: smoothScroll(), block: 'center' });
    }
  }

  function selectFromMap(id) {
    setSelection({ id, source: 'map' });
    const index = ranked.findIndex((s) => s.id === id);
    if (index >= visibleCount) setVisibleCount(index + 1);
    if (window.matchMedia(DESKTOP_QUERY).matches) {
      setTimeout(() => {
        document.getElementById(`station-${id}`)?.scrollIntoView({ behavior: smoothScroll(), block: 'nearest' });
      }, 60);
    }
  }

  const isInitialLoading = isLoading && !hasData;
  const nextRadius = RADII_KM.find((km) => km > radius);
  const placeLabel = origin?.kind === 'gps' ? 'tu ubicación' : origin?.label;

  let listContent;
  if (error) {
    listContent = <ErrorState message={error} onRetry={() => setRetryToken((n) => n + 1)} />;
  } else if (isInitialLoading) {
    listContent = <ListSkeleton />;
  } else if (!summary) {
    listContent = (
      <EmptyState fuelLabel={fuelInfo.label} radiusKm={radius} nextRadiusKm={nextRadius} onExpand={changeRadius} />
    );
  } else {
    listContent = (
      <StationList
        stations={ranked}
        sortBy={sortBy}
        onSortChange={setSortBy}
        visibleCount={visibleCount}
        onShowMore={() => setVisibleCount((n) => n + PAGE_SIZE)}
        fuelId={fuel}
        selectedId={selection?.id ?? null}
        cheapestId={summary.cheapest.id}
        nearestId={summary.nearest.id}
        onSelect={selectFromList}
        onShowOnMap={showOnMap}
      />
    );
  }

  return (
    <div className="page">
      <Header />

      <main>
        <section className="hero" aria-labelledby="hero-title">
          <div className="container hero__inner">
            <p className="eyebrow">Gasolina y diésel · toda España</p>
            <h1 id="hero-title" className="hero__title">
              Llena el depósito <em>pagando menos</em>
            </h1>
            <p className="hero__lead">
              Compara al momento el precio de la gasolina y el diésel en las gasolineras de tu zona y encuentra la más
              barata cerca de ti.
            </p>
            <SearchPanel
              fuel={fuel}
              onFuelChange={changeFuel}
              onSearchPostalCode={handlePostalCode}
              onUseLocation={handleLocation}
              pending={pending}
              error={searchError}
              defaultPostalCode={readPref('cp') ?? ''}
            />
          </div>
        </section>

        {origin ? (
          <section className="results" id="resultados" ref={resultsRef} aria-labelledby="results-title">
            <div className="container">
              <div className="results__head">
                <p className="eyebrow">Resultados</p>
                <h2 id="results-title" className="results__title">
                  Gasolineras cerca de <em>{placeLabel}</em>
                </h2>
                <p className="results__meta">
                  {summary && (
                    <>
                      <strong>{summary.count}</strong> {summary.count === 1 ? 'gasolinera' : 'gasolineras'} con{' '}
                      {fuelInfo.label} a menos de {radius} km
                      {origin.kind === 'gps' && ` · junto a ${summary.nearest.town}`}
                    </>
                  )}
                  {summary && updatedAt && ' · '}
                  {updatedAt && `Precios del ${formatUpdatedAt(updatedAt)}`}
                </p>
              </div>

              <div className="toolbar">
                <FuelPicker compact name="fuel-results" legend="Combustible" value={fuel} onChange={changeFuel} />
                <RadiusPicker value={radius} onChange={changeRadius} />
              </div>

              {isInitialLoading && !error && <HighlightsSkeleton />}
              {!error && summary && <Highlights summary={summary} onShowOnMap={showOnMap} />}

              <div className="results__layout">
                <div className="results__map" id="mapa">
                  <StationMap
                    origin={origin}
                    radiusKm={radius}
                    stations={error ? [] : leveled}
                    bestId={summary?.cheapest.id}
                    selection={selection}
                    onSelect={selectFromMap}
                  />
                </div>
                <div className={`results__list${isLoading && hasData ? ' is-refreshing' : ''}`}>{listContent}</div>
              </div>
            </div>
          </section>
        ) : (
          <HowItWorks />
        )}
      </main>

      <Footer />
    </div>
  );
}
