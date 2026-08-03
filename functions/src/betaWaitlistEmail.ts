import { sendEmailViaEmailJs } from './emailJsClient';

export type BetaRoleId =
  | 'player'
  | 'coach'
  | 'club'
  | 'agent'
  | 'recruiter'
  | 'organizer'
  | 'physio'
  | 'sponsor';

export const BETA_MEMBER_ROLE = 'Beta-testeur';

export const BETA_ROLE_LABELS: Record<BetaRoleId, string> = {
  player: 'Joueur',
  coach: 'Coach',
  club: 'Club',
  agent: 'Agent',
  recruiter: 'Recruteur',
  organizer: 'Organisateur',
  physio: 'Pôle santé',
  sponsor: 'Partenaire',
};

export function isBetaRoleId(value: string): value is BetaRoleId {
  return value in BETA_ROLE_LABELS;
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

function emailShell(opts: {
  subject: string;
  lang: string;
  title: string;
  bodyHtml: string;
  footerEmail: string;
}): string {
  return `<!DOCTYPE html>
<html lang="${opts.lang}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${opts.subject}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0a0a0a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
          <tr>
            <td style="background:#0a0a0a;padding:28px 32px;">
              <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:0.04em;">PRODAY</p>
              <p style="margin:8px 0 0;font-size:12px;color:#94a3b8;letter-spacing:0.12em;text-transform:uppercase;">Connecter • Progresser • Réussir</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#0a0a0a;">${opts.title}</h1>
              ${opts.bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;line-height:1.6;color:#94a3b8;">
                Message sent to ${opts.footerEmail}.<br />
                Questions? <a href="mailto:proday.admin@gmail.com" style="color:#475569;">proday.admin@gmail.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
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

  const bodyHtml = `
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">
                Thank you for your interest in ProDay.
              </p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">
                We have successfully received your beta access request.<br />
                Our team will review your application as soon as possible.
              </p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">
                You will receive another email once a decision has been made.
              </p>
              <p style="margin:0;font-size:15px;line-height:1.6;color:#334155;">
                Thank you for your patience.<br />
                The ProDay Team.
              </p>`;

  const html = emailShell({
    subject,
    lang: 'en',
    title: 'Beta Request Received',
    bodyHtml,
    footerEmail: params.email,
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

  const bodyHtml = `
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">
                Congratulations!
              </p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">
                Your beta access request has been approved.
              </p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">
                You can now access ProDay and discover all of its features.
              </p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">
                Our team will contact you again soon with additional information.
              </p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#334155;">
                Welcome to ProDay!
              </p>
              <a href="${accessUrl}" style="display:inline-block;background:#0a0a0a;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:14px 28px;border-radius:999px;">
                Access your beta space
              </a>`;

  const html = emailShell({
    subject,
    lang: 'en',
    title: 'Welcome to the ProDay Beta',
    bodyHtml,
    footerEmail: params.email,
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

  const bodyHtml = `
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">
                Thank you for your interest in ProDay.
              </p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">
                After reviewing your request, we are unfortunately unable to grant beta access at this time.
              </p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">
                We appreciate your interest and will contact you again if new places become available.
              </p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#334155;">
                Thank you for your understanding.<br />
                The ProDay Team.
              </p>
              <a href="${site}" style="display:inline-block;background:#0a0a0a;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:14px 28px;border-radius:999px;">
                Discover ProDay
              </a>`;

  const html = emailShell({
    subject,
    lang: 'en',
    title: 'Update Regarding Your Beta Request',
    bodyHtml,
    footerEmail: params.email,
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
  params: BetaWelcomeEmailParams
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
  params: BetaWelcomeEmailParams
): Promise<void> {
  await sendEmailViaEmailJs(config, buildBetaEmailJsTemplateParams(params));
}
