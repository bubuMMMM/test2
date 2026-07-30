export const siteName = 'Can I Vibecode It?';
export const organizationName = 'Can I Vibecode It?';
export const defaultDescription = 'An honest directory of paid SaaS products you can—or cannot—replace with one AI coding prompt.';
export const productionSiteUrl = 'https://can-i-vibecode-it-live.vercel.app';

export function getSiteUrl() {
  const explicit = import.meta.env.PUBLIC_SITE_URL || process.env.PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, '');
  return productionSiteUrl;
}

export function canonical(path = '/') {
  return new URL(path, `${getSiteUrl()}/`).toString();
}
