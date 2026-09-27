# Repostea · La gasolinera más barata cerca de ti

Web para consultar el precio de la gasolina y el diésel por **código postal** o **ubicación** y encontrar
la gasolinera **más barata** y la **más cercana**, con datos oficiales del Ministerio actualizados cada 30 minutos.

React 19 + Vite, CSS3 puro (sin frameworks CSS) y Leaflet para el mapa. No necesita backend ni API keys.

## Arrancar

```bash
npm install
npm run dev
```

Abre la URL que muestra Vite (por defecto http://localhost:5173).
La geolocalización solo funciona en `localhost` o bajo HTTPS.

```bash
npm run build     # genera dist/ listo para subir a cualquier hosting estático
npm run lint      # oxlint
```

## Qué hace

- Combustibles: Gasolina 95, Gasolina 98, Diésel, Diésel Premium y GLP.
- Búsqueda por código postal o con "Usar mi ubicación".
- Radio de búsqueda de 2 a 50 km (cruza provincias si hace falta).
- Tarjetas resumen: la más barata, la más cercana y el precio medio con el ahorro por depósito (50 L).
- Lista ordenable por precio o distancia, con horario, otros combustibles y enlace "Cómo llegar" (Google Maps).
- Mapa con etiqueta de precio en las 30 más baratas y puntos de color (barata / normal / cara) para el resto.
- Recuerda combustible, radio y último código postal. Modo oscuro automático. Diseño responsive.

## De dónde salen los datos

| Fuente | Uso |
| --- | --- |
| [API REST de carburantes del Ministerio](https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/) | Precios y ubicación de cada gasolinera, por provincia (`FiltroProvincia/{id}`). Permite CORS. |
| [Nominatim (OpenStreetMap)](https://nominatim.org/) | Solo si un código postal no tiene gasolineras, para situarlo en el mapa. |
| [Teselas de OpenStreetMap](https://www.openstreetmap.org/) | Fondo del mapa. |

**Cómo se resuelve un código postal:** sus 2 primeras cifras son la provincia. Se descarga esa provincia
y se toma la mediana de las gasolineras con ese mismo CP; si no hay, se geocodifica con Nominatim; y si
tampoco, se usan las gasolineras de CP vecinos (mismas 4 o 3 primeras cifras).

**Límites provinciales:** `src/data/provinceBounds.json` guarda el rectángulo que ocupan las gasolineras de
cada provincia. Con él se descargan también las provincias vecinas que caen dentro del radio.

> Si publicas la web con mucho tráfico, las teselas de openstreetmap.org y Nominatim tienen políticas de uso
> justo: conviene cambiar a un proveedor de mapas propio o de pago.

## Estructura

```
src/
├── App.jsx / App.css          Página: hero, resultados y lógica de búsqueda
├── config.js                  Radios, tamaño de depósito, paginación
├── components/                Header, SearchPanel, FuelPicker, RadiusPicker, Highlights,
│                              StationList, StationCard, StationMap, States, HowItWorks, Footer
├── hooks/useStations.js       Carga de gasolineras de las provincias necesarias
├── services/carburantes.js    Cliente de la API del Ministerio (con caché de 30 min)
├── services/location.js       Distancias, geolocalización y resolución de códigos postales
├── data/provinceBounds.json   Rectángulo de cada provincia
├── styles/global.css          Tokens de diseño (colores, tipografía, modo oscuro) y reset
└── utils/                     Formato de precios/distancias y preferencias en localStorage
```

Tipografías: **Fraunces** (títulos y precios) y **DM Sans** (texto), de Google Fonts.
