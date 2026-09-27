import { RADII_KM } from '../config';

/** @param {{ value: number, onChange: (km: number) => void }} props */
export default function RadiusPicker({ value, onChange }) {
  return (
    <fieldset className="chip-group">
      <legend className="chip-group__legend">Distancia máxima</legend>
      <div className="chip-group__options">
        {RADII_KM.map((km) => (
          <label key={km} className="chip chip--sm">
            <input type="radio" name="radius" value={km} checked={value === km} onChange={() => onChange(km)} />
            <span>{km} km</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
