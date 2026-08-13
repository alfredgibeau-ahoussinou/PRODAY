import { createHash, timingSafeEqual } from "crypto";
import { resolveBetaSiteUrl } from "@/lib/betaEmailConfig";

const LOCAL_DEV_HOSTS = new Set(["localhost:3000", "127.0.0.1:3000"]);

/** Hôtes ProDay toujours autorisés (apex, www, Netlify). */
const TRUSTED_SITE_HOSTS = [
  "proday75.fr",
  "www.proday75.fr",
  "proday75.netlify.app",
] as const;

function isNetlifyPreviewHost(host: string): boolean {
  return host.endsWith("--proday75.netlify.app");
}

function addHostWithWwwVariant(hosts: Set<string>, host: string): void {
  hosts.add(host);
  if (host.startsWith("www.")) {
    hosts.add(host.slice(4));
  } else if (!host.includes(":")) {
    hosts.add(`www.${host}`);
  }
}

/** Hôtes autorisés pour les requêtes mutantes (protection CSRF basique). */
function allowedRequestHosts(): Set<string> {
  const hosts = new Set<string>();
  for (const host of TRUSTED_SITE_HOSTS) {
    hosts.add(host);
  }
  try {
    addHostWithWwwVariant(hosts, new URL(resolveBetaSiteUrl()).host);
  } catch {
    // ignore
  }
  if (process.env.NODE_ENV !== "production") {
    for (const host of LOCAL_DEV_HOSTS) hosts.add(host);
  }
  return hosts;
}

function hostMatchesAllowed(urlString: string, allowed: Set<string>): boolean {
  try {
    const host = new URL(urlString).host;
    return allowed.has(host) || isNetlifyPreviewHost(host);
  } catch {
    return false;
  }
}

function digest(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

/**
 * App mobile ProDay : clé partagée (jamais le header public x-proday-client seul).
 * Headers : x-proday-mobile-key (préféré) ou Authorization: Bearer …
 */
export function isProdayMobileClientRequest(request: Request): boolean {
  const expected = process.env.PRODAY_MOBILE_API_SECRET?.trim();
  if (!expected || expected.length < 16) return false;

  const fromHeader = request.headers.get("x-proday-mobile-key")?.trim() ?? "";
  const auth = request.headers.get("authorization")?.trim() ?? "";
  const bearer = auth.toLowerCase().startsWith("bearer ")
    ? auth.slice(7).trim()
    : "";
  const provided = fromHeader || bearer;
  if (!provided) return false;

  const a = digest(provided);
  const b = digest(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Vérifie Origin ou Referer pour les POST navigateur (formulaire bêta). */
export function isSameOriginBrowserRequest(request: Request): boolean {
  const allowed = allowedRequestHosts();
  const origin = request.headers.get("origin");
  if (origin) return hostMatchesAllowed(origin, allowed);

  const referer = request.headers.get("referer");
  if (referer) return hostMatchesAllowed(referer, allowed);

  return false;
}

export const MAX_BETA_EMAIL_LENGTH = 254;

/** Masque un jeton pour logs ou messages d'erreur. */
export function redactToken(value: string | null | undefined): string {
  if (!value?.trim()) return "[absent]";
  const t = value.trim();
  if (t.length <= 8) return "[redacted]";
  return `${t.slice(0, 4)}…${t.slice(-4)}`;
}
