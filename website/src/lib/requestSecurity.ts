import { resolveBetaSiteUrl } from "@/lib/betaEmailConfig";

const LOCAL_DEV_HOSTS = new Set(["localhost:3000", "127.0.0.1:3000"]);

/** Hôtes autorisés pour les requêtes mutantes (protection CSRF basique). */
function allowedRequestHosts(): Set<string> {
  const hosts = new Set<string>();
  try {
    hosts.add(new URL(resolveBetaSiteUrl()).host);
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
    return allowed.has(new URL(urlString).host);
  } catch {
    return false;
  }
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
