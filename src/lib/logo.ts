/** Single source for logo path and cache-bust version. Bump LOGO_VERSION when replacing logo.png. */
export const LOGO_VERSION = '4';

export function getLogoUrl(): string {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '');
  return `${base}/logo.png?v=${LOGO_VERSION}`.replace(/\/+/g, '/');
}
