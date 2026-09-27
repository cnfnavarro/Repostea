import './Footer.css';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <p>
          Precios oficiales del{' '}
          <a
            href="https://geoportalgasolineras.es/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Geoportal de Gasolineras
          </a>{' '}
          del Ministerio para la Transición Ecológica y el Reto Demográfico, actualizados cada 30 minutos. El precio
          final en el surtidor puede variar ligeramente.
        </p>
        <p className="site-footer__brand">
          Repostea<span>.</span> Hecho para ahorrar en cada depósito.
        </p>
      </div>
    </footer>
  );
}
