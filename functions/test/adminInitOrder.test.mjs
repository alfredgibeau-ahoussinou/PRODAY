import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Ordre d'initialisation Firebase Admin — **garde-fou sur le module Veo**.
 *
 * Les modules de `functions/src` appellent `admin.firestore()` au chargement, donc
 * l'application par défaut doit déjà exister quand ils sont requis. Dans ce dépôt,
 * `index.ts` importe `./firebaseAdmin` en premier : l'ordre des `import` du point d'entrée
 * porte donc l'invariant pour la majorité des modules (22 d'entre eux importent
 * `firebase-admin` directement et ne fonctionnent que grâce à cet ordre).
 *
 * Le module Veo **ne doit pas** dépendre de cet ordre : il importe `./firebaseAdmin`, qui
 * appelle `initializeApp()` à son chargement. Sans cela, `const db = admin.firestore()`
 * s'exécuterait avant l'initialisation et le conteneur échouerait au démarrage — la
 * fonction renverrait une erreur serveur, lisible à tort comme un refus de Veo.
 */
const read = (relative) => readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8');

test('veoApi.ts initialise Firebase Admin par lui-même (aucun import direct)', () => {
  const source = read('../src/veoApi.ts');

  assert.match(source, /^const db = admin\.firestore\(\);$/m, 'le module ouvre Firestore au chargement');
  assert.match(source, /import \{ admin \} from '\.\/firebaseAdmin'/, 'il doit importer ./firebaseAdmin');
  assert.doesNotMatch(
    source,
    /import \* as admin from 'firebase-admin'/,
    'un import direct de firebase-admin rendrait le démarrage dépendant de l’ordre des imports',
  );
});

test('firebaseAdmin initialise l’application par défaut au chargement', () => {
  const source = read('../src/firebaseAdmin.ts');
  assert.match(source, /admin\.initializeApp\(\)/);
  assert.match(source, /if \(!admin\.apps\.length\)/);
  assert.match(source, /export \{ admin \}/);
});

test('index.ts importe firebaseAdmin (l’ordre protège les 22 modules qui l’omettent)', () => {
  const source = read('../src/index.ts');
  const firstImport = source.split('\n').find((line) => line.startsWith('import '));
  assert.match(
    firstImport ?? '',
    /firebaseAdmin/,
    'le point d’entrée doit initialiser admin avant de requérir les modules de fonctions',
  );
});
