import './HowItWorks.css';

const STEPS = [
  {
    title: 'Elige tu combustible',
    text: 'Gasolina 95, gasolina 98, diésel, diésel premium o GLP. Lo recordaremos para la próxima vez.',
  },
  {
    title: 'Dinos dónde estás',
    text: 'Escribe tu código postal o comparte tu ubicación con un solo toque.',
  },
  {
    title: 'Reposta más barato',
    text: 'Verás la gasolinera más barata, la más cercana y cuánto te ahorras en cada depósito.',
  },
];

export default function HowItWorks() {
  return (
    <section className="how" aria-labelledby="how-title">
      <div className="container">
        <h2 id="how-title" className="how__title">
          Así de <em>fácil</em>
        </h2>
        <ol className="how__steps">
          {STEPS.map((step, i) => (
            <li key={step.title} className="how__step">
              <span className="how__num" aria-hidden="true">
                {i + 1}
              </span>
              <h3 className="how__step-title">{step.title}</h3>
              <p className="how__step-text">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
