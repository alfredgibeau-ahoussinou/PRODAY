import { sendEmailViaEmailJs } from './emailJsClient';
import {
  buildProdayEmailShell,
  emailCta,
  emailCtaRow,
  emailKicker,
  emailParagraph,
  emailTitle,
} from './betaEmailLayout';

export type BetaRoleId =
  | 'player'
  | 'supporter'
  | 'coach'
  | 'club'
  | 'sponsor';

export const BETA_MEMBER_ROLE = 'Beta-testeur';

export const BETA_ROLE_LABELS: Record<BetaRoleId, string> = {
  player: 'Joueur',
  supporter: 'Supporter',
  coach: 'Coach',
  club: 'Club',
  sponsor: 'Sponsor',
};

const LEGACY_BETA_ROLE_LABELS: Record<string, string> = {
  agent: 'Agent',
  recruiter: 'Recruteur',
  organizer: 'Organisateur',
  physio: 'Santé',
  partenaire: 'Sponsor',
};

export function isBetaRoleId(value: string): value is BetaRoleId {
  return value in BETA_ROLE_LABELS;
}

export function betaRoleLabel(role: string): string {
  if (isBetaRoleId(role)) return BETA_ROLE_LABELS[role];
  return LEGACY_BETA_ROLE_LABELS[role] ?? role;
}

export type BetaWelcomeEmailParams = {
  email: string;
  roleLabel: string;
  siteUrl?: string;
  accessToken?: string;
};

export type BetaConfirmationEmailParams = {
  email: string;
  siteUrl?: string;
};

export type BetaRejectEmailParams = {
  email: string;
  roleLabel: string;
  siteUrl?: string;
};

function buildBetaAccessUrl(site: string, accessToken?: string): string {
  if (accessToken?.trim()) {
    return `${site}/beta/programme?token=${encodeURIComponent(accessToken.trim())}`;
  }
  return `${site}/beta/programme`;
}

function buildBetaInstallerUrl(site: string, accessToken?: string): string {
  if (accessToken?.trim()) {
    return `${site}/beta/installer?token=${encodeURIComponent(accessToken.trim())}`;
  }
  return `${site}/beta/installer`;
}

export function buildBetaConfirmationEmail(params: BetaConfirmationEmailParams): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = 'Beta Request Received';

  const text = [
    'Thank you for your interest in ProDay.',
    '',
    'We have successfully received your beta access request.',
    'Our team will review your application as soon as possible.',
    '',
    'You will receive another email once a decision has been made.',
    '',
    'Thank you for your patience.',
    'The ProDay Team.',
  ].join('\n');

  const html = buildProdayEmailShell({
    subject,
    lang: 'en',
    preheader: 'We received your ProDay beta access request.',
    footerNote: `Message sent to ${params.email}.`,
    bodyHtml: `
      ${emailKicker('Beta waitlist')}
      ${emailTitle('Beta request received')}
      ${emailParagraph('Thank you for your interest in ProDay.')}
      ${emailParagraph(
        'We have successfully received your beta access request. Our team will review your application as soon as possible.',
      )}
      ${emailParagraph(
        'You will receive another email once a decision has been made. Thank you for your patience.',
      )}
    `,
  });

  return { subject, html, text };
}

export function buildBetaWelcomeEmail(params: BetaWelcomeEmailParams): {
  subject: string;
  html: string;
  text: string;
} {
  const site = (params.siteUrl ?? 'https://proday75.fr').replace(/\/$/, '');
  const accessUrl = buildBetaAccessUrl(site, params.accessToken);
  const subject = 'Welcome to the ProDay Beta';

  const text = [
    'Congratulations!',
    '',
    'Your beta access request has been approved.',
    '',
    'You can now access ProDay and discover all of its features.',
    '',
    'Our team will contact you again soon with additional information.',
    '',
    'Welcome to ProDay!',
    '',
    `Access your beta space: ${accessUrl}`,
    `Installer (Android APK): ${buildBetaInstallerUrl(site, params.accessToken)}`,
  ].join('\n');

  const html = buildProdayEmailShell({
    subject,
    lang: 'en',
    preheader: 'Your ProDay beta access has been approved.',
    footerNote: `Message sent to ${params.email}.`,
    bodyHtml: `
      ${emailKicker('Approved')}
      ${emailTitle('Welcome to the ProDay Beta')}
      ${emailParagraph('Congratulations! Your beta access request has been approved.')}
      ${emailParagraph(
        'You can now access ProDay and discover all of its features. Our team will contact you again soon with additional information.',
      )}
      ${emailParagraph(`Profile: <strong style="color:#ffffff;">${params.roleLabel}</strong>`)}
      ${emailCtaRow(
        emailCta(accessUrl, 'Open beta space'),
        emailCta(buildBetaInstallerUrl(site, params.accessToken), 'Installer', false),
      )}
    `,
  });

  return { subject, html, text };
}

export function buildBetaRejectEmail(params: BetaRejectEmailParams): {
  subject: string;
  html: string;
  text: string;
} {
  const site = (params.siteUrl ?? 'https://proday75.fr').replace(/\/$/, '');
  const subject = 'Update Regarding Your Beta Request';

  const text = [
    'Thank you for your interest in ProDay.',
    '',
    'After reviewing your request, we are unfortunately unable to grant beta access at this time.',
    '',
    'We appreciate your interest and will contact you again if new places become available.',
    '',
    'Thank you for your understanding.',
    '',
    'The ProDay Team.',
    '',
    `Site: ${site}`,
  ].join('\n');

  const html = buildProdayEmailShell({
    subject,
    lang: 'en',
    preheader: 'An update regarding your ProDay beta request.',
    footerNote: `Message sent to ${params.email}.`,
    bodyHtml: `
      ${emailKicker('Beta waitlist')}
      ${emailTitle('Update on your beta request')}
      ${emailParagraph('Thank you for your interest in ProDay.')}
      ${emailParagraph(
        'After reviewing your request, we are unfortunately unable to grant beta access at this time.',
      )}
      ${emailParagraph(
        'We appreciate your interest and will contact you again if new places become available.',
      )}
      ${emailCtaRow(emailCta(site, 'Discover ProDay', false))}
    `,
  });

  return { subject, html, text };
}

export type EmailJsBetaConfig = {
  serviceId: string;
  templateId: string;
  publicKey: string;
  privateKey: string;
};

export function buildBetaEmailJsTemplateParams(
  params: BetaWelcomeEmailParams,
): Record<string, string> {
  const site = (params.siteUrl ?? 'https://proday75.fr').replace(/\/$/, '');

  return {
    email: params.email,
    to_email: params.email,
    user_email: params.email,
    member_role: BETA_MEMBER_ROLE,
    profile_label: params.roleLabel,
    role_label: BETA_MEMBER_ROLE,
    site_url: site,
    beta_url: buildBetaAccessUrl(site, params.accessToken),
    installer_url: buildBetaInstallerUrl(site, params.accessToken),
    subject: 'Welcome to the ProDay Beta',
  };
}

export async function sendBetaWelcomeEmailViaEmailJs(
  config: EmailJsBetaConfig,
  params: BetaWelcomeEmailParams,
): Promise<void> {
  await sendEmailViaEmailJs(config, buildBetaEmailJsTemplateParams(params));
}
