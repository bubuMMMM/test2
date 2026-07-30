import { apps } from '../lib/apps.js';
import { canonical } from '../lib/site.js';
export const prerender = false;
export function GET() {
  const urls = ['/', '/rebuild-prompt', ...apps.map((app) => `/${app.slug}`)];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((path) => `\n  <url><loc>${canonical(path)}</loc><changefreq>${path === '/' ? 'daily' : 'monthly'}</changefreq><priority>${path === '/' ? '1.0' : '0.8'}</priority></url>`).join('')}\n</urlset>`;
  return new Response(xml, { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
}
