/**
 * Renvoie l'e-mail de vérification ProDay via EmailJS (Admin SDK).
 *
 *   node scripts/send-verification-email.mjs user@example.com
 *   node scripts/send-verification-email.mjs user@example.com --verify-admin
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
    'Usage:\n  node scripts/send-verification-email.mjs user@example.com\n  node scripts/send-verification-email.mjs user@example.com --verify-admin'
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

async function sendViaEmailJs(targetEmail, payload, link) {
  const templateId =
    authCfg.emailjs_verification_template_id?.trim() ||
    authCfg.emailjs_template_id?.trim();
  const serviceId = authCfg.emailjs_service_id?.trim() || betaCfg.emailjs_service_id?.trim();
  const publicKey = authCfg.emailjs_public_key?.trim() || betaCfg.emailjs_public_key?.trim();
  const privateKey = authCfg.emailjs_private_key?.trim() || betaCfg.emailjs_private_key?.trim();
  if (!templateId) {
    throw new Error(
      'auth.emailjs_verification_template_id absent — créez le template dans EmailJS (docs/emailjs/auth-verification.html)'
    );
  }
  if (!serviceId || !publicKey || !privateKey) {
    throw new Error('EmailJS Auth non configuré (service / clés)');
  }
  const legacyUnified = !authCfg.emailjs_verification_template_id?.trim();
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
        app_name: 'ProDay',
        action_link: link,
        verification_url: link,
        message_text: payload.text,
        display_name: '',
        display_name_greeting: '',
        ...(legacyUnified
          ? {
              headline: 'Confirmez votre e-mail',
              body_intro:
                'Pour activer votre compte <strong style="color:#ffffff;">ProDay</strong>, validez l\'adresse suivante&nbsp;:',
              body_action:
                'Cliquez sur le bouton ci-dessous pour finaliser votre inscription.',
              cta_label: 'Valider mon e-mail',
              button_text: 'Valider mon e-mail',
              footer_note:
                "Ce lien expire après quelques heures. Si vous n'avez pas créé de compte, ignorez cet e-mail.",
              email_kind: 'verification',
              site_url: authCfg.continue_url || betaCfg.site_url || 'https://proday75.fr',
            }
          : {}),
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
      console.error(`  2) Contournement admin : node scripts/send-verification-email.mjs ${email} --verify-admin`);
      process.exit(1);
    }
    throw e;
  }

  const payload = buildVerificationEmail(link, email);

  try {
    await sendViaEmailJs(email, payload, link);
    console.log('✓ E-mail envoyé via EmailJS.');
  } catch (e) {
    console.error('✗ EmailJS:', e instanceof Error ? e.message : e);
    console.error('→ Vérifiez auth.emailjs_verification_template_id et docs/EMAILJS.md');
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('✗', e instanceof Error ? e.message : e);
  process.exit(1);
});
