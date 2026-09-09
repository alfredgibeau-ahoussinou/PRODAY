import { configStr } from './runtimeConfig';
import { isBrevoConfigured, sendTransactionalEmail } from './emailTransport';

export type SponsorQuotePackageTier = 'starter' | 'territorial' | 'national' | 'custom';

export const SPONSOR_QUOTE_PACKAGE_LABELS: Record<SponsorQuotePackageTier, string> = {
  starter: 'Découverte (0 €)',
  territorial: 'Territorial (49 €/mois)',
  national: 'National Pro (99 €/mois)',
  custom: 'Sur-mesure',
};

export type SponsorQuoteRequestData = {
  company_name: string;
  contact_email: string;
  contact_name: string;
  contact_role?: string;
  phone?: string;
  budget?: string;
  goals?: string[];
  audience?: string[];
  regions?: string[];
  sports?: string[];
  message?: string;
  package_tier: SponsorQuotePackageTier;
  sector?: string;
  source: 'website' | 'app';
};

const ADMIN_ALERT_EMAIL = 'proday.admin@gmail.com';

export function buildDefaultQuoteSubject(companyName: string): string {
  const name = companyName.trim() || 'votre entreprise';
  return `Votre devis ProDay Sponsor — ${name}`;
}

export function buildDefaultQuoteHtml(input: {
  contactName: string;
  companyName: string;
  packageTier: SponsorQuotePackageTier;
  budget?: string;
  goals?: string[];
  regions?: string[];
}): string {
  const greeting = input.contactName.trim() || 'Bonjour';
  const packageLabel = SPONSOR_QUOTE_PACKAGE_LABELS[input.packageTier];
  const goalsLine =
    input.goals && input.goals.length > 0
      ? `<li><strong>Objectifs :</strong> ${escapeHtml(input.goals.join(', '))}</li>`
      : '';
  const regionsLine =
    input.regions && input.regions.length > 0
      ? `<li><strong>Zones visées :</strong> ${escapeHtml(input.regions.join(', '))}</li>`
      : '';
  const budgetLine = input.budget
    ? `<li><strong>Budget indicatif :</strong> ${escapeHtml(input.budget)}</li>`
    : '';

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#0a0f1a;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0f1a;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" style="max-width:600px;background:#111827;border-radius:16px;border:1px solid #1e293b;">
        <tr><td style="padding:32px;border-bottom:1px solid #1e293b;text-align:center;">
          <p style="margin:0;font-size:24px;font-weight:700;letter-spacing:0.12em;color:#fff;">PRO<span style="color:#22d3ee;">DAY</span></p>
          <p style="margin:8px 0 0;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#64748b;">Partenaires &amp; Sponsors</p>
        </td></tr>
        <tr><td style="padding:32px;color:#e2e8f0;font-size:15px;line-height:1.65;">
          <p style="margin:0 0 16px;">${escapeHtml(greeting)},</p>
          <p style="margin:0 0 16px;">Merci pour votre intérêt pour <strong>ProDay Sponsor</strong>. Suite à votre demande, voici notre proposition pour <strong>${escapeHtml(input.companyName)}</strong>.</p>
          <div style="margin:24px 0;padding:20px;background:#0f172a;border-radius:12px;border:1px solid #334155;">
            <p style="margin:0 0 12px;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#fbbf24;">Formule recommandée</p>
            <p style="margin:0;font-size:18px;font-weight:700;color:#fff;">${escapeHtml(packageLabel)}</p>
            <ul style="margin:16px 0 0;padding-left:20px;color:#cbd5e1;font-size:14px;">
              ${budgetLine}${goalsLine}${regionsLine}
            </ul>
          </div>
          <p style="margin:0 0 16px;">Cette offre inclut l'accès à votre tableau de bord sponsor, la publication d'offres ciblées et un accompagnement par notre équipe partenaires.</p>
          <p style="margin:0 0 8px;">Pour valider ou ajuster cette proposition, répondez directement à cet email.</p>
          <p style="margin:24px 0 0;color:#94a3b8;">Cordialement,<br/><strong style="color:#e2e8f0;">L'équipe ProDay Partenaires</strong><br/>proday.admin@gmail.com</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function buildDefaultQuoteText(input: {
  contactName: string;
  companyName: string;
  packageTier: SponsorQuotePackageTier;
  budget?: string;
  goals?: string[];
  regions?: string[];
}): string {
  const greeting = input.contactName.trim() || 'Bonjour';
  const packageLabel = SPONSOR_QUOTE_PACKAGE_LABELS[input.packageTier];
  const lines = [
    `${greeting},`,
    '',
    `Merci pour votre intérêt pour ProDay Sponsor. Suite à votre demande, voici notre proposition pour ${input.companyName}.`,
    '',
    `Formule recommandée : ${packageLabel}`,
  ];
  if (input.budget) lines.push(`Budget indicatif : ${input.budget}`);
  if (input.goals?.length) lines.push(`Objectifs : ${input.goals.join(', ')}`);
  if (input.regions?.length) lines.push(`Zones visées : ${input.regions.join(', ')}`);
  lines.push(
    '',
    'Pour valider ou ajuster cette proposition, répondez directement à cet email.',
    '',
    'Cordialement,',
    "L'équipe ProDay Partenaires",
    'proday.admin@gmail.com',
  );
  return lines.join('\n');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function notifyAdminNewQuoteRequest(
  request: SponsorQuoteRequestData,
  requestId: string,
): Promise<void> {
  if (!isBrevoConfigured()) {
    console.warn('[sponsorQuoteMail] Alerte admin ignorée — Brevo non configuré');
    return;
  }

  const packageLabel = SPONSOR_QUOTE_PACKAGE_LABELS[request.package_tier];
  const summary = [
    `Nouvelle demande de devis sponsor (${request.source})`,
    '',
    `Entreprise : ${request.company_name}`,
    request.sector ? `Secteur : ${request.sector}` : '',
    `Contact : ${request.contact_name} · ${request.contact_email}`,
    request.contact_role ? `Fonction : ${request.contact_role}` : '',
    request.phone ? `Téléphone : ${request.phone}` : '',
    `Formule : ${packageLabel}`,
    request.budget ? `Budget : ${request.budget}` : '',
    request.goals?.length ? `Objectifs : ${request.goals.join(', ')}` : '',
    request.audience?.length ? `Public cible : ${request.audience.join(', ')}` : '',
    request.regions?.length ? `Régions : ${request.regions.join(', ')}` : '',
    request.sports?.length ? `Sports : ${request.sports.join(', ')}` : '',
    request.message ? `Message : ${request.message}` : '',
    '',
    `ID Firestore : sponsor_quote_requests/${requestId}`,
  ]
    .filter(Boolean)
    .join('\n');

  try {
    await sendTransactionalEmail({
      to: getAdminAlertEmail(),
      subject: `[ProDay Admin] Devis sponsor — ${request.company_name}`,
      html: `<pre style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5;">${escapeHtml(summary)}</pre>`,
      text: summary,
    });
  } catch (e) {
    console.error('[sponsorQuoteMail] Alerte admin échouée:', e);
  }
}

export function getAdminAlertEmail(): string {
  const override = configStr('admin', 'alert_email', ['ADMIN_ALERT_EMAIL']);
  return override || ADMIN_ALERT_EMAIL;
}

/** Alerte ops : un document demandé a été déposé — à télécharger dans l’Espace Admin. */
export async function notifyAdminSponsorDocUploaded(input: {
  requestId: string;
  companyName: string;
  contactEmail: string;
  docLabel: string;
  fileName?: string;
}): Promise<void> {
  if (!isBrevoConfigured()) {
    console.warn('[sponsorQuoteMail] Alerte docs reçus ignorée — Brevo non configuré');
    return;
  }
  const summary = [
    'Document partenaire reçu',
    '',
    `Entreprise : ${input.companyName}`,
    `Contact : ${input.contactEmail}`,
    `Document : ${input.docLabel}`,
    input.fileName ? `Fichier : ${input.fileName}` : '',
    '',
    'Ouvrez Espace Admin → Devis sponsors → Documents pour télécharger.',
    `ID : sponsor_quote_requests/${input.requestId}`,
  ]
    .filter(Boolean)
    .join('\n');
  try {
    await sendTransactionalEmail({
      to: getAdminAlertEmail(),
      subject: `[ProDay Admin] Doc reçu — ${input.companyName} · ${input.docLabel}`,
      html: `<pre style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5;">${escapeHtml(summary)}</pre>`,
      text: summary,
    });
  } catch (e) {
    console.error('[sponsorQuoteMail] Alerte docs reçus échouée:', e);
  }
}

export function buildThreadMessageEmailHtml(input: {
  contactName: string;
  companyName: string;
  body: string;
}): string {
  const greeting = input.contactName.trim() || 'Bonjour';
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#0a0f1a;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0f1a;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" style="max-width:600px;background:#111827;border-radius:16px;border:1px solid #1e293b;">
        <tr><td style="padding:32px;border-bottom:1px solid #1e293b;text-align:center;">
          <p style="margin:0;font-size:24px;font-weight:700;letter-spacing:0.12em;color:#fff;">PRO<span style="color:#22d3ee;">DAY</span></p>
          <p style="margin:8px 0 0;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#64748b;">Partenaires &amp; Sponsors</p>
        </td></tr>
        <tr><td style="padding:32px;color:#e2e8f0;font-size:15px;line-height:1.65;">
          <p style="margin:0 0 16px;">${escapeHtml(greeting)},</p>
          <p style="margin:0 0 16px;">Concernant votre demande pour <strong>${escapeHtml(input.companyName || 'votre entreprise')}</strong> :</p>
          <div style="margin:24px 0;padding:20px;background:#0f172a;border-radius:12px;border:1px solid #334155;white-space:pre-wrap;">${escapeHtml(input.body)}</div>
          <p style="margin:24px 0 0;color:#94a3b8;">Cordialement,<br/><strong style="color:#e2e8f0;">L'équipe ProDay Partenaires</strong><br/>proday.admin@gmail.com</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function buildThreadMessageEmailText(input: {
  contactName: string;
  companyName: string;
  body: string;
}): string {
  const greeting = input.contactName.trim() || 'Bonjour';
  return [
    `${greeting},`,
    '',
    `Concernant votre demande pour ${input.companyName || 'votre entreprise'} :`,
    '',
    input.body,
    '',
    'Cordialement,',
    "L'équipe ProDay Partenaires",
    'proday.admin@gmail.com',
  ].join('\n');
}

export function buildDocumentRequestEmailHtml(input: {
  contactName: string;
  companyName: string;
  labels: string[];
  message?: string;
}): string {
  const greeting = input.contactName.trim() || 'Bonjour';
  const list = input.labels.map((l) => `<li>${escapeHtml(l)}</li>`).join('');
  const note = input.message
    ? `<p style="margin:16px 0 0;">${escapeHtml(input.message)}</p>`
    : '';
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#0a0f1a;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0f1a;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" style="max-width:600px;background:#111827;border-radius:16px;border:1px solid #1e293b;">
        <tr><td style="padding:32px;border-bottom:1px solid #1e293b;text-align:center;">
          <p style="margin:0;font-size:24px;font-weight:700;letter-spacing:0.12em;color:#fff;">PRO<span style="color:#22d3ee;">DAY</span></p>
          <p style="margin:8px 0 0;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#64748b;">Documents demandés</p>
        </td></tr>
        <tr><td style="padding:32px;color:#e2e8f0;font-size:15px;line-height:1.65;">
          <p style="margin:0 0 16px;">${escapeHtml(greeting)},</p>
          <p style="margin:0 0 16px;">Pour finaliser le dossier partenaire de <strong>${escapeHtml(input.companyName || 'votre entreprise')}</strong>, merci de nous transmettre :</p>
          <ul style="margin:0;padding-left:20px;color:#cbd5e1;">${list}</ul>
          ${note}
          <p style="margin:24px 0 0;">Vous pouvez déposer les fichiers depuis l’espace Sponsor ProDay (si votre compte est lié), ou répondre à cet e-mail.</p>
          <p style="margin:24px 0 0;color:#94a3b8;">Cordialement,<br/><strong style="color:#e2e8f0;">L'équipe ProDay Partenaires</strong></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function buildDocumentRequestEmailText(input: {
  contactName: string;
  companyName: string;
  labels: string[];
  message?: string;
}): string {
  const greeting = input.contactName.trim() || 'Bonjour';
  const lines = [
    `${greeting},`,
    '',
    `Pour finaliser le dossier partenaire de ${input.companyName || 'votre entreprise'}, merci de nous transmettre :`,
    ...input.labels.map((l) => `- ${l}`),
  ];
  if (input.message) {
    lines.push('', input.message);
  }
  lines.push(
    '',
    'Vous pouvez déposer les fichiers depuis l’espace Sponsor ProDay (si votre compte est lié), ou répondre à cet e-mail.',
    '',
    'Cordialement,',
    "L'équipe ProDay Partenaires",
  );
  return lines.join('\n');
}
