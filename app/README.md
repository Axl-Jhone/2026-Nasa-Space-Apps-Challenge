# app/ (Axl)

React + Vite + TypeScript, Plotly (`react-plotly.js`) for charts, Leaflet for the map, deployed to GitHub Pages.

Not created yet: scaffolding it is Axl's first Claude Code step (prompt in `BUILD-GUIDE.md`, Module D). The Vite template will replace this file.

Pieces: `src/types.ts`, `src/data.ts`, `src/logic/operations.ts`, pages (map, pair, site, method), components (slope chart, score bars, hillshade pair, breaks block, limits strip, ratings table, FAKE banner), and the Pages deploy action.

Reads only `../data/` (Vite `publicDir`). Prefix fetches with `import.meta.env.BASE_URL` and use a hash router.
