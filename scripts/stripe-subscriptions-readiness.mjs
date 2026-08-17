/**
 * Vérifications Stripe abonnements (sans afficher les secrets).
 *   npm run stripe:subscriptions:check
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const functionsDir = resolve(root, 'functions');

let failed = 0;
let warned = 0;

function ok(label) {
  console.log(`✅ ${label}`);
}

function warn(label) {
  console.log(`⚠️  ${label}`);
  warned += 1;
}

function fail(label) {
  console.log(`❌ ${label}`);
  failed += 1;
}

function loadEnvFile(path) {
  if (!existsSync(path)) return {};
  const env = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim();
  }
  return env;
}

function hasStripeSecret(env) {
  const key = env.STRIPE_SECRET_KEY?.trim();
  return Boolean(key && (key.startsWith('sk_test_') || key.startsWith('sk_live_')));
}

console.log('\n💳 ProDay — contrôle Stripe abonnements\n');

const indexPath = resolve(functionsDir, 'src/index.ts');
if (existsSync(indexPath)) {
  const indexSrc = readFileSync(indexPath, 'utf8');
  const exports = [
    'createSubscriptionCheckoutSession',
    'createBillingPortalSession',
    'stripeWebhook',
  ];
  for (const fn of exports) {
    if (indexSrc.includes(fn)) ok(`functions/index.ts exporte ${fn}`);
    else fail(`functions/index.ts — export manquant : ${fn}`);
  }
} else {
  fail('functions/src/index.ts introuvable');
}

const envFiles = readdirSync(functionsDir)
  .filter((f) => f.startsWith('.env') && !f.endsWith('.example'))
  .map((f) => resolve(functionsDir, f));

if (envFiles.length === 0) {
  warn('Aucun functions/.env.* (gitignored) — copier functions/.env.example → .env.proday-155b0');
} else {
  let foundSecret = false;
  for (const path of envFiles) {
    const env = loadEnvFile(path);
    if (hasStripeSecret(env)) {
      foundSecret = true;
      ok(`STRIPE_SECRET_KEY présente dans ${path.split('/').pop()} (valeur masquée)`);
      if (env.STRIPE_WEBHOOK_SECRET?.trim()) {
        ok(`STRIPE_WEBHOOK_SECRET présente dans ${path.split('/').pop()}`);
      } else {
        warn(`${path.split('/').pop()} — STRIPE_WEBHOOK_SECRET absent (webhook Stripe requis)`);
      }
    }
  }
  if (!foundSecret) {
    fail('STRIPE_SECRET_KEY absente de tous les functions/.env.*');
  }
}

const appEnvExample = resolve(root, '.env.example');
if (existsSync(appEnvExample)) {
  const raw = readFileSync(appEnvExample, 'utf8');
  if (raw.includes('EXPO_PUBLIC_STRIPE_SUBSCRIPTIONS_ENABLED')) {
    ok('.env.example documente EXPO_PUBLIC_STRIPE_SUBSCRIPTIONS_ENABLED');
  } else {
    fail('.env.example — ajouter EXPO_PUBLIC_STRIPE_SUBSCRIPTIONS_ENABLED');
  }
}

const docPath = resolve(root, 'docs/STRIPE_SUBSCRIPTIONS_SETUP.md');
if (existsSync(docPath)) ok('docs/STRIPE_SUBSCRIPTIONS_SETUP.md');
else warn('docs/STRIPE_SUBSCRIPTIONS_SETUP.md absent');

console.log(`\n${failed === 0 ? '✅' : '❌'} Terminé — ${failed} échec(s), ${warned} avertissement(s)\n`);
process.exit(failed > 0 ? 1 : 0);
