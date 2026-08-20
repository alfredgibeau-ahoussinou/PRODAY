/**
 * Diffusions gratuites — honnête.
 *
 * API-Football (fixtures) n’expose en général **pas** d’URL de stream.
 * On n’affiche un chip « Diffusion » que si la réponse contient un canal / URL
 * officiel, ou si un événement ProDay a un lien public explicite (Daily / champ dédié).
 * Jamais de liens pirates.
 */

const FTA_CHANNEL_HINTS =
  /\b(france\s*[2-5]|tf1|tmc|w9|m6|l['’]?equipe|la cha[iî]ne l['’]?equipe|france\.tv|francetv)\b/i;

const OFFICIAL_HOST_HINTS = /(daily\.co|youtube\.com|youtu\.be|twitch\.tv|france\.tv)/i;

export interface ListedBroadcast {
  listed: boolean;
  /** Libellé canal si l’API / la fiche le fournit. */
  label?: string;
  /** URL https officielle uniquement. */
  officialUrl?: string;
}

export function isHttpsUrl(value: string | undefined): value is string {
  if (!value) return false;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function channelLooksFreeToAir(label: string): boolean {
  return FTA_CHANNEL_HINTS.test(label);
}

export function inferBroadcastFromApiPayload(raw: {
  broadcasts?: Array<{ name?: string | null; channel?: string | null; url?: string | null }>;
  tv?: Array<{ name?: string | null; channel?: string | null; url?: string | null }>;
}): ListedBroadcast {
  const rows = [...(raw.broadcasts ?? []), ...(raw.tv ?? [])];
  const labels = rows
    .map((row) => row.name ?? row.channel ?? '')
    .map((label) => label.trim())
    .filter(Boolean);
  const urls = rows.map((row) => row.url ?? '').filter(isHttpsUrl);
  const officialUrl = urls.find((url) => OFFICIAL_HOST_HINTS.test(url) || url.startsWith('https://'));
  const ftaLabel = labels.find(channelLooksFreeToAir);
  const anyLabel = ftaLabel ?? labels[0];
  const listed = Boolean(ftaLabel || (officialUrl && OFFICIAL_HOST_HINTS.test(officialUrl)));
  if (!listed) {
    return { listed: false };
  }
  return {
    listed: true,
    label: anyLabel,
    officialUrl: officialUrl && OFFICIAL_HOST_HINTS.test(officialUrl) ? officialUrl : undefined,
  };
}

export function extractProdayOfficialWatchUrl(input: {
  public_watch_url?: string;
  stream_url?: string;
  visio_url?: string;
  description?: string;
}): string | undefined {
  const explicit = [input.public_watch_url, input.stream_url, input.visio_url].find(isHttpsUrl);
  if (explicit && OFFICIAL_HOST_HINTS.test(explicit)) return explicit;
  if (explicit && /daily\.co/i.test(explicit)) return explicit;
  if (explicit) return explicit;

  const desc = input.description ?? '';
  const match = desc.match(/https:\/\/[^\s]+/i);
  if (!match) return undefined;
  const url = match[0].replace(/[),.;]+$/, '');
  if (!isHttpsUrl(url)) return undefined;
  if (/daily\.co/i.test(url)) return url;
  return undefined;
}

export function isListedBroadcastItem(item: {
  broadcastListed?: boolean;
  watchUrl?: string;
}): boolean {
  return Boolean(item.broadcastListed || item.watchUrl);
}
