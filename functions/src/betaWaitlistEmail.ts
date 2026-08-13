import { sendEmailViaEmailJs } from './emailJsClient';
import {
  IOS_BETA_LAUNCH_LABEL,
  IOS_BETA_LAUNCH_LABEL_SHORT,
} from './betaIosCampaignConstants';
import {
  buildProdayEmailShell,
  emailCta,
  emailCtaRow,
  emailKicker,
  emailList,
  emailPanel,
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
  const site = (params.siteUrl ?? 'https://proday75.fr').replace(/\/$/, '');
  const subject = 'ProDay — demande bêta bien reçue';

  const text = [
    'Bonjour,',
    '',
    'Merci pour votre intérêt pour ProDay.',
    '',
    'Nous avons bien reçu votre demande d’accès à la bêta.',
    'Notre équipe l’examine dès que possible.',
    '',
    `Ouverture iOS (TestFlight) prévue le ${IOS_BETA_LAUNCH_LABEL}.`,
    'Android : APK disponible dès validation, depuis votre espace bêta.',
    '',
    'Vous recevrez un nouvel email dès qu’une décision aura été prise.',
    '',
    `Page bêta : ${site}/beta/inscription`,
    '',
    'Merci pour votre patience,',
    'L’équipe ProDay',
  ].join('\n');

  const html = buildProdayEmailShell({
    subject,
    lang: 'fr',
    preheader: `Demande reçue. Ouverture iOS le ${IOS_BETA_LAUNCH_LABEL_SHORT}.`,
    footerNote: `Message envoyé à ${params.email}.`,
    bodyHtml: `
      ${emailKicker('Liste d’attente')}
      ${emailTitle('Demande bêta bien reçue')}
      ${emailParagraph('Merci pour votre intérêt pour ProDay.')}
      ${emailParagraph(
        'Nous avons bien reçu votre demande d’accès à la bêta. Notre équipe l’examine dès que possible.',
      )}
      ${emailPanel({
        kicker: 'Calendrier',
        title: IOS_BETA_LAUNCH_LABEL,
        body: 'Ouverture iOS via <strong style="color:#ffffff;">TestFlight</strong>. Android : APK dès validation.',
      })}
      ${emailParagraph('Vous recevrez un nouvel email dès qu’une décision aura été prise.')}
      ${emailCtaRow(emailCta(`${site}/beta/inscription`, 'Page bêta', false))}
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
  const installerUrl = buildBetaInstallerUrl(site, params.accessToken);
  const subject = 'Bienvenue dans la bêta ProDay';

  const text = [
    'Bonjour,',
    '',
    `Félicitations — votre accès bêta est approuvé (profil : ${params.roleLabel}).`,
    '',
    'Vous faites partie des premiers à façonner ProDay sur le terrain.',
    '',
    'Prochaines étapes :',
    '• Ouvrez votre espace bêta (programme, guides, retours)',
    '• Android : téléchargez l’APK depuis l’onglet Installer',
    `• iOS : ouverture TestFlight le ${IOS_BETA_LAUNCH_LABEL} — lien envoyé par email`,
    '',
    `Espace bêta : ${accessUrl}`,
    `Installer : ${installerUrl}`,
    '',
    'Bienvenue dans ProDay,',
    'L’équipe ProDay',
  ].join('\n');

  const html = buildProdayEmailShell({
    subject,
    lang: 'fr',
    preheader: `Accès approuvé. iOS TestFlight le ${IOS_BETA_LAUNCH_LABEL_SHORT}.`,
    footerNote: `Message envoyé à ${params.email}.`,
    bodyHtml: `
      ${emailKicker('Accès approuvé')}
      ${emailTitle('Bienvenue dans la bêta ProDay')}
      ${emailParagraph(
        `Félicitations — votre demande a été approuvée. Profil : <strong style="color:#ffffff;">${params.roleLabel}</strong>.`,
      )}
      ${emailParagraph(
        'Vous êtes officiellement beta-testeur — parmi les premiers à façonner ProDay sur le terrain.',
      )}
      ${emailPanel({
        kicker: 'iOS · TestFlight',
        title: IOS_BETA_LAUNCH_LABEL,
        body: 'Le lien TestFlight vous sera envoyé par email à l’ouverture. Android : APK déjà disponible dans Installer.',
      })}
      ${emailList([
        'Ouvrez votre espace bêta (programme et guides)',
        'Installez l’APK Android depuis l’onglet Installer',
        `Attendez le mail TestFlight le ${IOS_BETA_LAUNCH_LABEL_SHORT}`,
      ])}
      ${emailCtaRow(
        emailCta(accessUrl, 'Espace bêta'),
        emailCta(installerUrl, 'Installer', false),
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
  const subject = 'ProDay — mise à jour sur votre demande bêta';

  const text = [
    'Bonjour,',
    '',
    'Merci pour votre intérêt pour ProDay.',
    '',
    'Après examen, nous ne pouvons malheureusement pas vous octroyer un accès bêta pour le moment.',
    '',
    'Votre intérêt compte : nous vous recontacterons si de nouvelles places s’ouvrent.',
    '',
    `Découvrir ProDay : ${site}`,
    '',
    'Merci pour votre compréhension,',
    'L’équipe ProDay',
  ].join('\n');

  const html = buildProdayEmailShell({
    subject,
    lang: 'fr',
    preheader: 'Mise à jour concernant votre demande d’accès bêta ProDay.',
    footerNote: `Message envoyé à ${params.email}.`,
    bodyHtml: `
      ${emailKicker('Liste d’attente')}
      ${emailTitle('Mise à jour sur votre demande')}
      ${emailParagraph('Merci pour votre intérêt pour ProDay.')}
      ${emailParagraph(
        'Après examen, nous ne pouvons malheureusement pas vous octroyer un accès bêta pour le moment.',
      )}
      ${emailParagraph(
        'Nous vous recontacterons si de nouvelles places s’ouvrent. Merci pour votre compréhension.',
      )}
      ${emailCtaRow(emailCta(site, 'Découvrir ProDay', false))}
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
    subject: 'Bienvenue dans la bêta ProDay',
    ios_launch_label: IOS_BETA_LAUNCH_LABEL,
    ios_launch_label_short: IOS_BETA_LAUNCH_LABEL_SHORT,
  };
}

export async function sendBetaWelcomeEmailViaEmailJs(
  config: EmailJsBetaConfig,
  params: BetaWelcomeEmailParams,
): Promise<void> {
  await sendEmailViaEmailJs(config, buildBetaEmailJsTemplateParams(params));
}
