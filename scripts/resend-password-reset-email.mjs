/**
 * Envoie l'e-mail de réinitialisation ProDay (callable ou Admin SDK + Resend).
 *
 *   node scripts/resend-password-reset-email.mjs user@example.com
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';

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
const email = (args.find((a) => !a.startsWith('--')) || '').trim().toLowerCase();

if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('Usage:\n  node scripts/resend-password-reset-email.mjs user@example.com');
  process.exit(1);
}

const env = loadEnv();
const projectId = env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'proday-155b0';
const sa = JSON.parse(readFileSync(findServiceAccount(), 'utf8'));
if (getApps().length === 0) {
  initializeApp({ credential: cert(sa), projectId });
}

const adminAuth = getAdminAuth();
const betaCfg = loadFunctionsConfig('beta');
const authCfg = loadFunctionsConfig('auth');

function buildPasswordResetEmail(link, targetEmail) {
  const subject = 'Réinitialisez votre mot de passe ProDay';
  const text = [
    'Bonjour,',
    '',
    `Pour réinitialiser le mot de passe de votre compte ProDay (${targetEmail}), ouvrez ce lien :`,
    '',
    link,
    '',
    'Si vous n’êtes pas à l’origine de cette demande, ignorez cet e-mail.',
    '',
    '— ProDay · contact@proday.app',
  ].join('\n');
  const html = `<!DOCTYPE html><html lang="fr"><body style="font-family:sans-serif;background:#0a0a0a;color:#fff;padding:24px">
<h1 style="color:#22d3ee">ProDay</h1>
<p>Réinitialisez le mot de passe du compte <strong>${targetEmail}</strong>.</p>
<p><a href="${link}" style="display:inline-block;background:#22d3ee;color:#000;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:700">Réinitialiser mon mot de passe</a></p>
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

async function sendViaEmailJs(targetEmail, payload, link) {
  const templateId =
    authCfg.emailjs_password_reset_template_id?.trim() ||
    authCfg.emailjs_template_id?.trim();
  const serviceId = authCfg.emailjs_service_id?.trim() || betaCfg.emailjs_service_id?.trim();
  const publicKey = authCfg.emailjs_public_key?.trim() || betaCfg.emailjs_public_key?.trim();
  const privateKey = authCfg.emailjs_private_key?.trim() || betaCfg.emailjs_private_key?.trim();
  if (!templateId) {
    throw new Error(
      'auth.emailjs_password_reset_template_id absent — template Auth reset dédié requis'
    );
  }
  if (!serviceId || !publicKey || !privateKey) {
    throw new Error('EmailJS Auth non configuré (service / clés)');
  }
  const legacyUnified = !authCfg.emailjs_password_reset_template_id?.trim();
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
              headline: 'Réinitialisez votre mot de passe',
              body_intro:
                'Une demande de réinitialisation a été faite pour le compte <strong style="color:#ffffff;">ProDay</strong>&nbsp;:',
              body_action:
                'Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.',
              cta_label: 'Réinitialiser mon mot de passe',
              button_text: 'Réinitialiser mon mot de passe',
              footer_note:
                "Ce lien expire après quelques heures. Si vous n'avez pas demandé cette réinitialisation, ignorez cet e-mail — votre mot de passe actuel reste inchangé.",
              email_kind: 'password-reset',
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
  console.log(`From   : ${authCfg.from_email || betaCfg.from_email || 'ProDay <contact@proday75.fr>'}`);

  try {
    await adminAuth.getUserByEmail(email);
  } catch {
    console.error('✗ Aucun compte Firebase Auth avec cet e-mail.');
    process.exit(1);
  }

  let link;
  try {
    link = await adminAuth.generatePasswordResetLink(email, {
      url: authCfg.continue_url || betaCfg.site_url || 'https://proday75.fr',
      handleCodeInApp: true,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('TOO_MANY_ATTEMPTS')) {
      console.error('✗ Rate-limit Firebase. Attendez 15–60 min puis relancez ce script.');
      process.exit(1);
    }
    throw e;
  }

  const payload = buildPasswordResetEmail(link, email);

  try {
    await sendViaResend(email, payload);
    console.log('✓ E-mail « Réinitialisez votre mot de passe ProDay » envoyé via Resend.');
    return;
  } catch (e) {
    console.warn('Resend:', e instanceof Error ? e.message : e);
  }

  try {
    await sendViaEmailJs(email, payload, link);
    console.log('✓ E-mail envoyé via EmailJS (secours Auth).');
    return;
  } catch (e) {
    console.warn('EmailJS Auth:', e instanceof Error ? e.message : e);
  }

  console.error('✗ Aucun transport e-mail disponible. Vérifiez le domaine sur resend.com/domains.');
  process.exit(1);
}

main().catch((e) => {
  console.error('✗', e instanceof Error ? e.message : e);
  process.exit(1);
});
