import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://bhutanova-travels.pages.dev',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  integrations: [sitemap()],
  build: { inlineStylesheets: 'auto' },
});
