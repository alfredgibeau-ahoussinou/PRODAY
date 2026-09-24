import test from 'node:test';
import assert from 'node:assert/strict';
import {
  VEO_API_BASE,
  VEO_FAILURE_MESSAGE,
  VEO_TOKEN_URL_PROD,
  VEO_TOKEN_URL_UAT,
  buildTokenRequestBody,
  classifyVeoStatus,
  isSessionUsable,
  mapVeoVideoList,
  mapVeoVideoSummary,
  pickPlaybackTarget,
  readVeoCredentials,
  normalizeVeoApiClientInput,
  maskClientId,
  resolveVeoCredentials,
  isVeoStaffRole,
  isVeoAdminRole,
  isSameClub,
} from '../lib/veoApiCore.js';

const NOW = 1_760_000_000_000;

test('buildTokenRequestBody — le seul flux documenté, et l’e-mail est nettoyé', () => {
  const body = buildTokenRequestBody({
    email: '  coach@club.fr  ',
    password: 'secret-veo',
    clientId: 'client-123',
  });
  assert.deepEqual(body, {
    Username: 'coach@club.fr',
    Password: 'secret-veo',
    Grant_type: 'password',
    Client_id: 'client-123',
  });
});

test('readVeoCredentials — rien sans client délivré par un représentant Veo', () => {
  assert.equal(readVeoCredentials({}), null);
  assert.equal(readVeoCredentials({ VEO_CLIENT_ID: 'abc' }), null);
  assert.equal(readVeoCredentials({ VEO_CLIENT_SECRET: 'xyz' }), null);

  const prod = readVeoCredentials({ VEO_CLIENT_ID: 'abc', VEO_CLIENT_SECRET: 'xyz' });
  assert.equal(prod.tokenUrl, VEO_TOKEN_URL_PROD);

  const uat = readVeoCredentials({
    VEO_CLIENT_ID: 'abc',
    VEO_CLIENT_SECRET: 'xyz',
    VEO_USE_UAT: '1',
  });
  assert.equal(uat.tokenUrl, VEO_TOKEN_URL_UAT);
  assert.equal(VEO_API_BASE, 'https://api.veo.co.uk/api');
});

test('isSessionUsable — expire, marge de 60 s, et jamais sans jeton', () => {
  assert.equal(isSessionUsable(null, NOW), false);
  assert.equal(isSessionUsable({ token: '', expires_at: NOW + 10_000_000 }, NOW), false);
  // 30 s de marge restante : trop juste pour un appel qui va durer.
  assert.equal(isSessionUsable({ token: 't', expires_at: NOW + 30_000 }, NOW), false);
  assert.equal(isSessionUsable({ token: 't', expires_at: NOW + 120_000 }, NOW), true);
  assert.equal(isSessionUsable({ token: 't', expires_at: NOW - 1 }, NOW), false);
});

test('classifyVeoStatus — chaque refus Veo garde un sens distinct', () => {
  assert.equal(classifyVeoStatus(401), 'unauthorized');
  assert.equal(classifyVeoStatus(403), 'unauthorized');
  assert.equal(classifyVeoStatus(429), 'rate_limited');
  assert.equal(classifyVeoStatus(500), 'unavailable');
  assert.equal(classifyVeoStatus(503), 'unavailable');
  assert.equal(classifyVeoStatus(400), 'invalid_response');
  assert.equal(classifyVeoStatus(200), 'invalid_response');
});

test('le blocage « client non délivré » est écrit, pas contourné', () => {
  assert.match(VEO_FAILURE_MESSAGE.not_configured, /représentant Veo/);
  assert.match(VEO_FAILURE_MESSAGE.not_configured, /administrative/);
});

test('mapVeoVideoSummary — aucun champ inventé', () => {
  const full = mapVeoVideoSummary({
    Id: 'v-1',
    Title: 'U15 · RC France',
    RecordedStamp: '2026-09-12T18:00:00Z',
    Duration: 5400,
    Status: 'Transcoded',
  });
  assert.deepEqual(full, {
    id: 'v-1',
    title: 'U15 · RC France',
    recordedAt: '2026-09-12T18:00:00Z',
    durationSec: 5400,
    status: 'Transcoded',
  });

  const minimal = mapVeoVideoSummary({ id: 42 });
  assert.equal(minimal.id, '42');
  assert.match(minimal.title, /Captation 42/);
  assert.equal(minimal.recordedAt, null);
  assert.equal(minimal.durationSec, null);
  assert.equal(minimal.status, null);

  assert.equal(mapVeoVideoSummary(null), null);
  assert.equal(mapVeoVideoSummary({ Title: 'sans identifiant' }), null);
  assert.equal(mapVeoVideoSummary('texte'), null);
});

test('mapVeoVideoList — accepte les enveloppes documentées, ignore le reste', () => {
  const rows = [{ Id: 'a', Duration: 600 }, { Id: 'b' }];
  for (const payload of [
    rows,
    { Videos: rows },
    { videos: rows },
    { Items: rows },
    { items: rows },
  ]) {
    const list = mapVeoVideoList(payload);
    assert.equal(list.length, 2);
    assert.equal(list[0].durationSec, 600);
    assert.equal(list[1].durationSec, null);
  }
  assert.deepEqual(mapVeoVideoList(null), []);
  assert.deepEqual(mapVeoVideoList({ videos: 'nope' }), []);
});

test('pickPlaybackTarget — l’URL vient de Veo, jamais reconstruite', () => {
  const fromTokens = pickPlaybackTarget({
    Id: 'v-1',
    Duration: 5400,
    Tokens: [{ Ratio: '16:9', Url: 'https://storage.veo.co/v-1/16x9.mp4' }],
  });
  assert.deepEqual(fromTokens, {
    url: 'https://storage.veo.co/v-1/16x9.mp4',
    durationSec: 5400,
  });

  // Enveloppe minuscule, et durée absente : on ne l'invente pas.
  assert.deepEqual(pickPlaybackTarget({ tokens: [{ url: 'https://storage.veo.co/x.mp4' }] }), {
    url: 'https://storage.veo.co/x.mp4',
    durationSec: null,
  });

  assert.deepEqual(pickPlaybackTarget({ Url: 'https://storage.veo.co/direct.mp4' }), {
    url: 'https://storage.veo.co/direct.mp4',
    durationSec: null,
  });

  // Aucune URL exploitable : l'appelant doit traiter un échec, pas un faux succès.
  assert.equal(pickPlaybackTarget({ Tokens: [{ Ratio: '16:9' }] }), null);
  assert.equal(pickPlaybackTarget(null), null);
  assert.equal(pickPlaybackTarget('https://storage.veo.co/x.mp4'), null);
});

// ---------------------------------------------------------------------------
// Identifiants d'application saisis depuis l'application
// ---------------------------------------------------------------------------

test('normalizeVeoApiClientInput — refuse ce qui ne peut pas fonctionner', () => {
  assert.deepEqual(normalizeVeoApiClientInput({ clientId: 'court', clientSecret: 'secret-veo-tres-long' }), {
    ok: false,
    message: 'Identifiant client Veo manquant ou trop court.',
  });
  assert.equal(
    normalizeVeoApiClientInput({ clientId: 'client-veo-123456', clientSecret: 'trop-court' }).ok,
    false,
  );
  // Valeur recopiée dans les deux champs : erreur de copier-coller, pas un client valide.
  assert.equal(
    normalizeVeoApiClientInput({
      clientId: 'client-veo-123456',
      clientSecret: 'client-veo-123456',
    }).ok,
    false,
  );
  assert.equal(normalizeVeoApiClientInput(null).ok, false);

  const ok = normalizeVeoApiClientInput({
    clientId: '  client-veo-123456  ',
    clientSecret: '  secret-veo-tres-long-1234  ',
    environment: 'uat',
  });
  assert.equal(ok.ok, true);
  assert.deepEqual(ok.value, {
    clientId: 'client-veo-123456',
    clientSecret: 'secret-veo-tres-long-1234',
    environment: 'uat',
  });
  // Environnement inconnu ⇒ production, jamais une URL de recette par accident.
  assert.equal(
    normalizeVeoApiClientInput({
      clientId: 'client-veo-123456',
      clientSecret: 'secret-veo-tres-long-1234',
      environment: 'n-importe-quoi',
    }).value.environment,
    'prod',
  );
});

test('maskClientId — vérifiable, jamais révélateur', () => {
  assert.equal(maskClientId('client-veo-123456'), '••••3456');
  assert.equal(maskClientId('abcd'), '••••');
  assert.equal(maskClientId('   '), '••••');
});

test('resolveVeoCredentials — projet d’abord, puis identifiants du club', () => {
  const none = resolveVeoCredentials({ env: {}, stored: null });
  assert.equal(none.credentials, null);
  assert.equal(none.source, null);

  const club = resolveVeoCredentials({
    env: {},
    stored: { client_id: 'club-client', client_secret: 'club-secret-long', environment: 'prod' },
  });
  assert.equal(club.source, 'club');
  assert.equal(club.credentials.tokenUrl, VEO_TOKEN_URL_PROD);

  const clubUat = resolveVeoCredentials({
    env: {},
    stored: { client_id: 'club-client', client_secret: 'club-secret-long', environment: 'uat' },
  });
  assert.equal(clubUat.credentials.tokenUrl, VEO_TOKEN_URL_UAT);

  // Un client global déployé prime : le club n'a rien à saisir dans ce cas.
  const project = resolveVeoCredentials({
    env: { VEO_CLIENT_ID: 'env-client', VEO_CLIENT_SECRET: 'env-secret' },
    stored: { client_id: 'club-client', client_secret: 'club-secret-long', environment: 'prod' },
  });
  assert.equal(project.source, 'project');
  assert.equal(project.credentials.clientId, 'env-client');

  // Document incomplet : traité comme absent, pas comme un client utilisable.
  const partial = resolveVeoCredentials({
    env: {},
    stored: { client_id: 'club-client', client_secret: '', environment: 'prod' },
  });
  assert.equal(partial.credentials, null);
});

test('autorisation — staff du club oui, joueur / autre club non', () => {
  assert.equal(isVeoStaffRole('coach'), true);
  assert.equal(isVeoStaffRole('club'), true);
  assert.equal(isVeoStaffRole('staff'), true);
  assert.equal(isVeoStaffRole('player'), false);
  assert.equal(isVeoStaffRole('parent'), false);
  assert.equal(isVeoStaffRole(undefined), false);
  // Un administrateur plateforme passe partout.
  assert.equal(isVeoStaffRole('player', true), true);

  // Retirer les identifiants est plus restrictif que les saisir.
  assert.equal(isVeoAdminRole('coach'), false);
  assert.equal(isVeoAdminRole('club'), true);
  assert.equal(isVeoAdminRole('president'), true);

  assert.equal(isSameClub('club-1', 'club-1'), true);
  assert.equal(isSameClub('club-2', 'club-1'), false);
  assert.equal(isSameClub(undefined, 'club-1'), false);
  assert.equal(isSameClub('club-2', 'club-1', true), true);
});
