import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

export default defineConfig({
  output: 'server',
  adapter: vercel({ maxDuration: 10 }),
  site: process.env.PUBLIC_SITE_URL || 'https://can-i-vibecode-it-live.vercel.app',
  vite: {
    ssr: {
      external: ['better-sqlite3']
    }
  }
});
