import { IconPump } from './Icons';
import './Header.css';

export default function Header() {
  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <a href={import.meta.env.BASE_URL} className="brand" aria-label="Repostea, ir al inicio">
          <span className="brand__logo">
            <IconPump />
          </span>
          <span className="brand__name">
            Repostea<span className="brand__dot">.</span>
          </span>
        </a>
        <p className="site-header__badge">
          <span className="live-dot" aria-hidden="true" />
          Precios oficiales, actualizados cada 30 min
        </p>
      </div>
    </header>
  );
}
