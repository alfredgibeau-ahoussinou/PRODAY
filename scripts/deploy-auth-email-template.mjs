#!/usr/bin/env node
/**
 * Déploie les templates e-mail Firebase Auth (Identity Platform API).
 *
 *   npm run firebase:deploy:auth-email
 *   npm run firebase:deploy:auth-email -- password-reset
 *   npm run firebase:deploy:auth-email -- email-verification --dry-run
 *
 * Prérequis : clé Admin SDK locale (firebase/*adminsdk*.json, gitignored).
 * Permission IAM : firebaseauth.configs.update
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { GoogleAuth } from 'google-auth-library';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const templatesDir = resolve(root, 'firebase/auth-email-templates');

const TEMPLATE_REGISTRY = {
  'email-verification': {
    configFile: 'email-verification.config.json',
    consoleLabel: 'Validation de l\'adresse e-mail',
  },
  'password-reset': {
    configFile: 'password-reset.config.json',
    consoleLabel: 'Réinitialisation du mot de passe',
  },
};

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
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return process.env.GOOGLE_APPLICATION_CREDENTIALS;
  }
  const fixed = resolve(root, 'firebase/service-account.json');
  if (existsSync(fixed)) return fixed;
  const firebaseDir = resolve(root, 'firebase');
  if (existsSync(firebaseDir)) {
    const found = readdirSync(firebaseDir).find(
      (f) => f.includes('adminsdk') && f.endsWith('.json')
    );
    if (found) return resolve(firebaseDir, found);
  }
  return null;
}

function parseArgs(argv) {
  const positional = argv.filter((a) => !a.startsWith('--'));
  const flags = new Set(argv.filter((a) => a.startsWith('--')));
  const templateId = positional[0] || 'email-verification';
  if (!TEMPLATE_REGISTRY[templateId]) {
    console.error(
      'Usage: node scripts/deploy-auth-email-template.mjs [email-verification|password-reset] [--dry-run] [--plain-text]'
    );
    process.exit(1);
  }
  return {
    templateId,
    dryRun: flags.has('--dry-run'),
    plainText: flags.has('--plain-text'),
  };
}

function normalizeConfig(raw) {
  const sender = raw.sender || {};
  const templateKey = raw.templateId || raw.templateKey;
  const htmlFile = raw.htmlFile;
  const textFile = raw.textFile || raw.plainTextFile;
  if (!templateKey) throw new Error('templateId / templateKey manquant dans la config');
  if (!htmlFile || !textFile) throw new Error('htmlFile / textFile manquants dans la config');
  return {
    templateKey,
    displayName: sender.displayName || raw.displayName || 'ProDay',
    senderLocalPart: sender.localPart || raw.senderLocalPart || 'noreply',
    replyTo: sender.replyTo || raw.replyTo || 'contact@proday.app',
    subject: raw.subject,
    bodyFormat: raw.bodyFormat || 'HTML',
    htmlFile,
    textFile,
  };
}

function loadTemplateConfig(templateId) {
  const entry = TEMPLATE_REGISTRY[templateId];
  const configPath = resolve(templatesDir, entry.configFile);
  if (!existsSync(configPath)) {
    throw new Error(`Config introuvable : ${configPath}`);
  }
  const raw = JSON.parse(readFileSync(configPath, 'utf8'));
  const config = normalizeConfig(raw);
  const htmlPath = resolve(templatesDir, config.htmlFile);
  const txtPath = resolve(templatesDir, config.textFile);
  if (!existsSync(htmlPath)) throw new Error(`HTML introuvable : ${htmlPath}`);
  if (!existsSync(txtPath)) throw new Error(`Texte introuvable : ${txtPath}`);
  return {
    entry,
    config,
    html: readFileSync(htmlPath, 'utf8'),
    plainText: readFileSync(txtPath, 'utf8'),
  };
}

function buildEmailTemplate(config, html, plainText, plainTextMode) {
  const bodyFormat = plainTextMode ? 'PLAIN_TEXT' : config.bodyFormat;
  const body = bodyFormat === 'HTML' ? html : plainText;
  return {
    senderDisplayName: config.displayName,
    senderLocalPart: config.senderLocalPart,
    replyTo: config.replyTo,
    subject: config.subject,
    body,
    bodyFormat,
  };
}

async function getAccessToken(serviceAccountPath) {
  const auth = new GoogleAuth({
    keyFile: serviceAccountPath,
    scopes: [
      'https://www.googleapis.com/auth/cloud-platform',
      'https://www.googleapis.com/auth/identitytoolkit',
      'https://www.googleapis.com/auth/firebase',
    ],
  });
  const client = await auth.getClient();
  const { token } = await client.getAccessToken();
  if (!token) throw new Error('Impossible d\'obtenir un token OAuth');
  return token;
}

async function fetchConfig(projectId, token) {
  const url = `https://identitytoolkit.googleapis.com/admin/v2/projects/${projectId}/config`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GET config échoué (${res.status}) : ${text}`);
  }
  return res.json();
}

async function updateConfig(projectId, token, templateKey, emailTemplate) {
  const url =
    `https://identitytoolkit.googleapis.com/admin/v2/projects/${projectId}/config` +
    `?updateMask=notification.sendEmail.${templateKey}`;
  const body = {
    name: `projects/${projectId}/config`,
    notification: {
      sendEmail: {
        [templateKey]: emailTemplate,
      },
    },
  };
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PATCH config échoué (${res.status}) : ${text}`);
  }
  return res.json();
}

function printConsoleInstructions(entry, config, html, plainText) {
  console.log('\n--- Instructions Console Firebase ---');
  console.log('1. Ouvrir https://console.firebase.google.com/ → projet proday-155b0');
  console.log('2. Authentication → Templates (Modèles)');
  console.log(`3. Sélectionner « ${entry.consoleLabel} » → crayon (modifier)`);
  console.log(`4. Nom de l'expéditeur : ${config.displayName}`);
  console.log(`5. Adresse de réponse : ${config.replyTo}`);
  console.log(`6. Objet : ${config.subject}`);
  console.log(`7. Message : coller le contenu de firebase/auth-email-templates/${config.htmlFile}`);
  console.log('8. URL d\'action : %LINK% (valeur par défaut — ne pas modifier)');
  console.log('9. Enregistrer');
  console.log('\n--- Version texte (fallback) ---\n');
  console.log(plainText);
}

async function main() {
  const { templateId, dryRun, plainText: plainTextMode } = parseArgs(process.argv.slice(2));
  const env = loadEnv();
  const projectId =
    env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || 'proday-155b0';

  const { entry, config, html, plainText } = loadTemplateConfig(templateId);
  const emailTemplate = buildEmailTemplate(config, html, plainText, plainTextMode);
  const { templateKey } = config;

  console.log(`Projet Firebase : ${projectId}`);
  console.log(`Template        : ${templateId} (${entry.consoleLabel})`);
  console.log(`API field       : notification.sendEmail.${templateKey}`);
  console.log(`Format corps    : ${emailTemplate.bodyFormat}`);
  console.log(`Objet           : ${emailTemplate.subject}`);
  console.log(`Expéditeur      : ${emailTemplate.senderDisplayName} <${emailTemplate.senderLocalPart}@…>`);
  console.log(`Reply-to        : ${emailTemplate.replyTo}`);

  if (dryRun) {
    console.log('\n[--dry-run] Aucune modification envoyée.');
    printConsoleInstructions(entry, config, html, plainText);
    return;
  }

  const serviceAccountPath = findServiceAccount();
  if (!serviceAccountPath) {
    console.warn('\nService account introuvable — déploiement API impossible.');
    printConsoleInstructions(entry, config, html, plainText);
    process.exit(0);
  }

  try {
    const token = await getAccessToken(serviceAccountPath);
    await fetchConfig(projectId, token);
    const updated = await updateConfig(projectId, token, templateKey, emailTemplate);
    const applied = updated?.notification?.sendEmail?.[templateKey];
    console.log('\n✓ Template déployé via Identity Platform API');
    console.log(`  Objet     : ${applied?.subject ?? emailTemplate.subject}`);
    console.log(`  Reply-to  : ${applied?.replyTo ?? emailTemplate.replyTo}`);
    console.log(`  Format    : ${applied?.bodyFormat ?? emailTemplate.bodyFormat}`);
    console.log(`  Customized: ${applied?.customized ?? 'n/a'}`);
  } catch (err) {
    console.error(`\nÉchec déploiement API : ${err.message}`);
    printConsoleInstructions(entry, config, html, plainText);
    process.exit(1);
  }
}

main();
