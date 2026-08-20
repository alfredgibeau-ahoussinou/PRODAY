import * as functions from 'firebase-functions';

/**
 * Proxy Sportmonks Soccer API v3 — clé serveur SPORTMONKS_API_TOKEN / FOOTBALL_API_KEY.
 * Callable depuis l’app (supporterFootball client).
 */
const BASE = 'https://api.sportmonks.com/v3/football';

function getToken(): string {
  return (
    process.env.SPORTMONKS_API_TOKEN?.trim() ||
    process.env.FOOTBALL_API_KEY?.trim() ||
    ''
  );
}

export const supporterFootballProxy = functions.https.onCall(async (data, context) => {
  if (!context.auth?.uid) {
    throw new functions.https.HttpsError('unauthenticated', 'Connexion requise.');
  }
  const token = getToken();
  if (!token) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'SPORTMONKS_API_TOKEN manquant côté serveur.',
    );
  }

  const path = typeof data?.path === 'string' ? data.path : '';
  if (!path.startsWith('/') || path.includes('..')) {
    throw new functions.https.HttpsError('invalid-argument', 'Chemin API invalide.');
  }

  const query = (data?.query && typeof data.query === 'object' ? data.query : {}) as Record<
    string,
    string | number
  >;

  const url = new URL(`${BASE}${path}`);
  url.searchParams.set('api_token', token);
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null || String(v) === '') continue;
    url.searchParams.set(k, String(v));
  }

  const res = await fetch(url.toString());
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new functions.https.HttpsError(
      'internal',
      `Sportmonks HTTP ${res.status}: ${text.slice(0, 160)}`,
    );
  }
  const json = await res.json();
  return { data: json };
});
