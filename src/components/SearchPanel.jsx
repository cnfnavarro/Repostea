import { useState } from 'react';
import FuelPicker from './FuelPicker';
import { IconAlert, IconLocate, IconPin, IconSearch, Spinner } from './Icons';
import './SearchPanel.css';

/**
 * Tarjeta principal de búsqueda: combustible + código postal o ubicación.
 * @param {{
 *   fuel: string, onFuelChange: (id: string) => void,
 *   onSearchPostalCode: (cp: string) => void, onUseLocation: () => void,
 *   pending: 'cp' | 'gps' | null, error: string | null, defaultPostalCode: string
 * }} props
 */
export default function SearchPanel({
  fuel,
  onFuelChange,
  onSearchPostalCode,
  onUseLocation,
  pending,
  error,
  defaultPostalCode,
}) {
  const [postalCode, setPostalCode] = useState(defaultPostalCode);
  const busy = pending !== null;

  const handleSubmit = (event) => {
    event.preventDefault();
    onSearchPostalCode(postalCode);
  };

  return (
    <div className="search-panel">
      <FuelPicker name="fuel-search" legend="¿Qué combustible usas?" value={fuel} onChange={onFuelChange} />

      <div className="search-panel__where">
        <form className="cp-form" onSubmit={handleSubmit} role="search" aria-label="Buscar por código postal">
          <label htmlFor="postal-code" className="chip-group__legend">
            ¿Dónde estás?
          </label>
          <div className="cp-field">
            <IconPin className="cp-field__icon" />
            <input
              id="postal-code"
              type="text"
              inputMode="numeric"
              autoComplete="postal-code"
              placeholder="Código postal"
              maxLength={5}
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? 'search-error' : undefined}
            />
            <button type="submit" className="btn btn--primary cp-field__submit" disabled={busy}>
              {pending === 'cp' ? <Spinner /> : <IconSearch />}
              <span>Buscar</span>
            </button>
          </div>
        </form>

        <div className="search-panel__or" aria-hidden="true">
          <span>o</span>
        </div>

        <button type="button" className="btn btn--locate" onClick={onUseLocation} disabled={busy}>
          {pending === 'gps' ? <Spinner /> : <IconLocate />}
          <span>{pending === 'gps' ? 'Localizando…' : 'Usar mi ubicación'}</span>
        </button>
      </div>

      {error && (
        <p className="alert" id="search-error" role="alert">
          <IconAlert />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
