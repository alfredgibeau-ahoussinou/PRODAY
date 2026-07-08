/** En-têtes de sécurité appliqués aux réponses Next.js (complète netlify.toml). */
export const SECURITY_RESPONSE_HEADERS: Readonly<Record<string, string>> = {
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "accelerometer=(), autoplay=(), camera=(), cross-origin-isolated=(), display-capture=(), encrypted-media=(), fullscreen=(self), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), midi=(), payment=(), picture-in-picture=(), publickey-credentials-get=(), screen-wake-lock=(), sync-xhr=(), usb=(), web-share=(), xr-spatial-tracking=()",
  "X-DNS-Prefetch-Control": "off",
  "X-Permitted-Cross-Domain-Policies": "none",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
};

/** Évite la fuite du jeton bêta via Referer pendant la redirection. */
export const NO_REFERRER_HEADER = "no-referrer";

export function applySecurityHeaders(response: Response): void {
  for (const [key, value] of Object.entries(SECURITY_RESPONSE_HEADERS)) {
    response.headers.set(key, value);
  }
}
