export const siteName = 'Can I Vibecode It?';
export const organizationName = 'Can I Vibecode It?';
export const defaultDescription = 'An honest directory of paid SaaS products you can—or cannot—replace with one AI coding prompt.';

export function getSiteUrl() {
  const explicit = import.meta.env.PUBLIC_SITE_URL || process.env.PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, '');
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:4321';
}

export function canonical(path = '/') {
  return new URL(path, `${getSiteUrl()}/`).toString();
}
