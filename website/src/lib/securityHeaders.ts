/** En-têtes de sécurité appliqués aux réponses Next.js (complète netlify.toml). */

/** CSP stricte côté app (alignée netlify.toml). 'unsafe-inline'/'unsafe-eval' : contrainte Next. */
export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://api.emailjs.com https://*.cloudfunctions.net https://*.cal.com https://cal.com https://*.whereby.com https://whereby.com https://*.daily.co",
  "frame-src 'self' https://cal.com https://*.cal.com https://app.cal.com https://whereby.com https://*.whereby.com https://*.daily.co",
  "media-src 'self' blob: https://*.daily.co https://*.whereby.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

export const SECURITY_RESPONSE_HEADERS: Readonly<Record<string, string>> = {
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "accelerometer=(), autoplay=(self), camera=(self \"https://cal.com\" \"https://*.cal.com\" \"https://app.cal.com\" \"https://whereby.com\" \"https://*.whereby.com\" \"https://*.daily.co\"), cross-origin-isolated=(), display-capture=(self \"https://cal.com\" \"https://*.cal.com\" \"https://whereby.com\" \"https://*.whereby.com\"), encrypted-media=(), fullscreen=(self \"https://cal.com\" \"https://*.cal.com\" \"https://app.cal.com\" \"https://whereby.com\" \"https://*.whereby.com\"), geolocation=(), gyroscope=(), magnetometer=(), microphone=(self \"https://cal.com\" \"https://*.cal.com\" \"https://app.cal.com\" \"https://whereby.com\" \"https://*.whereby.com\" \"https://*.daily.co\"), midi=(), payment=(), picture-in-picture=(self), publickey-credentials-get=(), screen-wake-lock=(), sync-xhr=(), usb=(), web-share=(), xr-spatial-tracking=()",
  "X-DNS-Prefetch-Control": "off",
  "X-Permitted-Cross-Domain-Policies": "none",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Content-Security-Policy": CONTENT_SECURITY_POLICY,
  "X-XSS-Protection": "0",
};

/** Évite la fuite du jeton bêta via Referer pendant la redirection. */
export const NO_REFERRER_HEADER = "no-referrer";

export function applySecurityHeaders(response: Response): void {
  for (const [key, value] of Object.entries(SECURITY_RESPONSE_HEADERS)) {
    response.headers.set(key, value);
  }
}

/** Zones sensibles (admin, API auth) : pas de cache, pas d’indexation. */
export function applySensitiveRouteHeaders(response: Response): void {
  applySecurityHeaders(response);
  response.headers.set("Cache-Control", "no-store, max-age=0");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
}
