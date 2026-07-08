/** En-têtes de sécurité appliqués aux réponses Next.js (complète netlify.toml). */
export const SECURITY_RESPONSE_HEADERS: Readonly<Record<string, string>> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "X-DNS-Prefetch-Control": "off",
};

/** Évite la fuite du jeton bêta via Referer pendant la redirection. */
export const NO_REFERRER_HEADER = "no-referrer";

export function applySecurityHeaders(response: Response): void {
  for (const [key, value] of Object.entries(SECURITY_RESPONSE_HEADERS)) {
    response.headers.set(key, value);
  }
}
