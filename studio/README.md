# Bhutanova Travels Studio

The Sanity Studio for the website (project `234ghw8x`, dataset `production`), published at https://bhutanova.sanity.studio.
Schemas are in `schemaTypes/`. See the root `README.md` for how the site is built and deployed.

```bash
npm install
npm run dev      # http://localhost:3333
npm run deploy   # publishes the Studio (schema changes)
```

`scripts/set-deploy-hook.ts` creates the "Rebuild website on publish" webhook (instructions in its header).
`scripts/import-guides.ts` and `scripts/import-destinations.ts` (with `md-to-pt.ts`) import writers' content files.
