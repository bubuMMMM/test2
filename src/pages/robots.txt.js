import { canonical } from '../lib/site.js';
export const prerender = false;
export function GET() {
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${canonical('/sitemap.xml')}\n`, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
}
