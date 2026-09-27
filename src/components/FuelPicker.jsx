import { FUELS } from '../services/carburantes';

/**
 * Selector de combustible en forma de píldoras (radio buttons accesibles).
 * @param {{ value: string, onChange: (id: string) => void, name: string, legend: string, compact?: boolean }} props
 */
export default function FuelPicker({ value, onChange, name, legend, compact = false }) {
  return (
    <fieldset className="chip-group">
      <legend className="chip-group__legend">{legend}</legend>
      <div className="chip-group__options">
        {FUELS.map((fuel) => (
          <label key={fuel.id} className={`chip${compact ? ' chip--sm' : ''}`}>
            <input
              type="radio"
              name={name}
              value={fuel.id}
              checked={value === fuel.id}
              onChange={() => onChange(fuel.id)}
            />
            <span className={`fuel-dot fuel-dot--${fuel.id}`} aria-hidden="true" />
            <span>{compact ? fuel.short : fuel.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
