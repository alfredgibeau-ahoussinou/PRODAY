import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Manifeste de déploiement Veo.
 *
 * Une callable déclarée dans `veoApi.ts` mais absente de `index.ts` **n'est pas déployée du
 * tout** : l'application reçoit alors « Cloud Function introuvable », ce qui se lit comme
 * une panne d'intégration alors que le code est correct. Constaté en conditions réelles :
 * `firebase deploy --only functions:veoSetApiClient` a répondu
 * « No function matches the filter » pour exactement cette raison.
 */
const read = (relative) => readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8');

const DECLARATION = /export const (\w+) = onCall/g;

test('chaque callable Veo est exportée depuis index.ts', () => {
  const declared = [...read('../src/veoApi.ts').matchAll(DECLARATION)].map((m) => m[1]);
  const entrypoint = read('../src/index.ts');
  const missing = declared.filter((name) => !entrypoint.includes(name));

  assert.ok(declared.length >= 7, `callables attendues au moins 7, trouvées ${declared.length}`);
  assert.deepEqual(missing, [], `Absentes de index.ts (donc non déployées) : ${missing.join(', ')}`);
});

test('les identifiants d’application sont bien des callables déployées', () => {
  const declared = [...read('../src/veoApi.ts').matchAll(DECLARATION)].map((m) => m[1]);
  // Ces deux-là portent le parcours « connexion depuis l'app » : sans elles, le club ne
  // peut rien saisir et aucune connexion Veo n'est possible.
  assert.ok(declared.includes('veoSetApiClient'));
  assert.ok(declared.includes('veoClearApiClient'));
});
