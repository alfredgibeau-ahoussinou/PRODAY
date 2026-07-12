/**
 * Renvoie l'e-mail de vérification ProDay.
 * 1) Callable Cloud Function (Resend brandé, fallback Firebase natif côté app)
 * 2) Admin generateEmailVerificationLink + Resend
 * 3) Admin generateEmailVerificationLink + EmailJS (secours)
 *
 *   node scripts/resend-verification-email.mjs user@example.com
 *   node scripts/resend-verification-email.mjs user@example.com --verify-admin
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

function loadEnv() {
  const path = resolve(root, '.env');
  if (!existsSync(path)) return {};
  const env = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim();
  }
  return env;
}

function findServiceAccount() {
  const firebaseDir = resolve(root, 'firebase');
  if (existsSync(firebaseDir)) {
    const found = readdirSync(firebaseDir).find(
      (f) => f.includes('adminsdk') && f.endsWith('.json')
    );
    if (found) return resolve(firebaseDir, found);
  }
  return resolve(root, 'firebase/service-account.json');
}

function loadFunctionsConfig(scope) {
  try {
    return JSON.parse(execSync(`firebase functions:config:get ${scope}`, { encoding: 'utf8' }));
  } catch {
    return {};
  }
}

const args = process.argv.slice(2);
const verifyAdmin = args.includes('--verify-admin');
const email = (args.find((a) => !a.startsWith('--')) || '').trim().toLowerCase();

if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error(
    'Usage:\n  node scripts/resend-verification-email.mjs user@example.com\n  node scripts/resend-verification-email.mjs user@example.com --verify-admin'
  );
  process.exit(1);
}

const env = loadEnv();
const projectId = env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'proday-155b0';
const sa = JSON.parse(readFileSync(findServiceAccount(), 'utf8'));
if (getApps().length === 0) {
  initializeApp({ credential: cert(sa), projectId });
}

const adminAuth = getAdminAuth();
const db = getFirestore();
const betaCfg = loadFunctionsConfig('beta');
const authCfg = loadFunctionsConfig('auth');

async function verifyAdminBypass(uid) {
  await adminAuth.updateUser(uid, { emailVerified: true });
  await db.collection('users').doc(uid).set(
    { email_verified: true, updated_at: FieldValue.serverTimestamp() },
    { merge: true }
  );
  console.log('✓ E-mail marqué vérifié (Auth + Firestore) — contournement admin.');
}

function buildVerificationEmail(link, targetEmail) {
  const subject = 'Confirmez votre adresse e-mail ProDay';
  const text = [
    'Bonjour,',
    '',
    `Pour activer votre compte ProDay (${targetEmail}), ouvrez ce lien :`,
    '',
    link,
    '',
    'Ce lien expire après quelques heures.',
    '',
    '— ProDay · contact@proday.app',
  ].join('\n');
  const html = `<!DOCTYPE html><html lang="fr"><body style="font-family:sans-serif;background:#0a0a0a;color:#fff;padding:24px">
<h1 style="color:#22d3ee">ProDay</h1>
<p>Confirmez votre adresse e-mail <strong>${targetEmail}</strong>.</p>
<p><a href="${link}" style="display:inline-block;background:#22d3ee;color:#000;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:700">Confirmer mon e-mail</a></p>
<p style="font-size:12px;color:#888">${link}</p>
</body></html>`;
  return { subject, html, text };
}

async function sendViaResend(targetEmail, payload) {
  const apiKey = authCfg.resend_api_key || betaCfg.resend_api_key;
  const from =
    authCfg.from_email || betaCfg.from_email || 'ProDay <contact@proday75.fr>';
  if (!apiKey) throw new Error('Clé Resend absente (beta.resend_api_key)');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [targetEmail],
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      reply_to: 'contact@proday.app',
    }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}

async function sendViaEmailJs(targetEmail, payload) {
  const { emailjs_service_id: serviceId, emailjs_template_id: templateId, emailjs_public_key: publicKey, emailjs_private_key: privateKey } = betaCfg;
  if (!serviceId || !templateId || !publicKey || !privateKey) {
    throw new Error('EmailJS non configuré');
  }
  const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: serviceId,
      template_id: templateId,
      user_id: publicKey,
      accessToken: privateKey,
      template_params: {
        email: targetEmail,
        to_email: targetEmail,
        user_email: targetEmail,
        subject: payload.subject,
        message: payload.text,
        site_url: betaCfg.site_url || 'https://proday75.fr',
      },
    }),
  });
  if (!res.ok) throw new Error(`EmailJS ${res.status}: ${await res.text()}`);
}

async function main() {
  console.log(`Projet : ${projectId}`);
  console.log(`E-mail : ${email}`);

  const user = await adminAuth.getUserByEmail(email);
  if (user.emailVerified) {
    console.log('✓ E-mail déjà vérifié.');
    return;
  }

  if (verifyAdmin) {
    await verifyAdminBypass(user.uid);
    return;
  }

  let link;
  try {
    link = await adminAuth.generateEmailVerificationLink(email, {
      url: authCfg.continue_url || betaCfg.site_url || 'https://proday75.fr',
      handleCodeInApp: true,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('TOO_MANY_ATTEMPTS')) {
      console.error('✗ Rate-limit Firebase. Options :');
      console.error('  1) Attendre 15–60 min puis relancer ce script');
      console.error(`  2) Contournement admin : node scripts/resend-verification-email.mjs ${email} --verify-admin`);
      process.exit(1);
    }
    throw e;
  }

  const payload = buildVerificationEmail(link, email);

  try {
    await sendViaResend(email, payload);
    console.log('✓ E-mail envoyé via Resend.');
    return;
  } catch (e) {
    console.warn('Resend:', e instanceof Error ? e.message : e);
  }

  try {
    await sendViaEmailJs(email, payload);
    console.log('✓ E-mail envoyé via EmailJS (secours).');
    return;
  } catch (e) {
    console.warn('EmailJS:', e instanceof Error ? e.message : e);
  }

  console.error('✗ Aucun transport e-mail disponible. Vérifiez le domaine sur resend.com/domains.');
  process.exit(1);
}

main().catch((e) => {
  console.error('✗', e instanceof Error ? e.message : e);
  process.exit(1);
});
