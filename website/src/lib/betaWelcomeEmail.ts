/** Template email bêta : garder aligné avec functions/src/betaWaitlistEmail.ts + betaEmailLayout.ts */

import {
  IOS_BETA_LAUNCH_LABEL,
  IOS_BETA_LAUNCH_LABEL_SHORT,
} from "@/lib/betaIosLaunch";

export const BETA_MEMBER_ROLE = "Beta testeur";

/** Rôles waitlist = les 5 pôles vitrine (pas les rôles réseau intégrés). */
export type BetaRoleId =
  | "player"
  | "supporter"
  | "coach"
  | "club"
  | "sponsor";

export const BETA_ROLE_LABELS: Record<BetaRoleId, string> = {
  player: "Joueur",
  supporter: "Supporter",
  coach: "Coach",
  club: "Club",
  sponsor: "Sponsor",
};

/** Anciens rôles encore en base : affichage admin / statut uniquement. */
const LEGACY_BETA_ROLE_LABELS: Record<string, string> = {
  agent: "Agent",
  recruiter: "Recruteur",
  organizer: "Organisateur",
  physio: "Santé",
  partenaire: "Sponsor",
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

/** Shell sombre ProDay (miroir de functions/src/betaEmailLayout.ts). */
function buildProdayEmailShell(opts: {
  subject: string;
  bodyHtml: string;
  footerNote: string;
  preheader?: string;
  markUrl?: string;
}): string {
  const mark = opts.markUrl ?? "https://proday75.fr/branding/logo-proday-mark.png";
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${opts.subject}</title>
</head>
<body style="margin:0;padding:0;background:#050505;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#ffffff;-webkit-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${opts.preheader ?? "Votre accès bêta ProDay a été approuvé."}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#050505;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#0c0c0e;border:1px solid rgba(255,255,255,0.12);">
          <tr>
            <td style="height:3px;background:#1E3AFF;font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:28px 32px 22px;border-bottom:1px solid rgba(255,255,255,0.12);">
              <img src="${mark}" width="48" height="34" alt="ProDay" style="display:block;margin:0 0 14px;border:0;" />
              <p style="margin:0;font-size:22px;line-height:1;font-weight:700;letter-spacing:0.18em;color:#ffffff;">PRODAY</p>
              <p style="margin:10px 0 0;font-size:10px;line-height:14px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#71717a;">Connecter · Progresser · Réussir</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              ${opts.bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:22px 32px 28px;border-top:1px solid rgba(255,255,255,0.12);background:#09090b;">
              <p style="margin:0;font-size:12px;line-height:1.65;color:#71717a;">
                ${opts.footerNote}<br />
                Questions ? <a href="mailto:proday.admin@gmail.com" style="color:#5B75FF;text-decoration:none;">proday.admin@gmail.com</a>
                · <a href="https://proday75.fr" style="color:#a1a1aa;text-decoration:none;">proday75.fr</a>
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

export function buildBetaWelcomeEmail(params: BetaWelcomeEmailParams): {
  subject: string;
  html: string;
  text: string;
} {
  const site = (params.siteUrl ?? "https://proday75.fr").replace(/\/$/, "");
  const accessUrl = buildBetaAccessUrl(site, params.accessToken);
  const installerUrl = buildBetaInstallerUrl(site, params.accessToken);
  const subject = "Bienvenue dans la bêta ProDay";

  const text = [
    "Bonjour,",
    "",
    `Félicitations — votre accès bêta est approuvé (profil : ${params.roleLabel}).`,
    "",
    "Vous faites partie des premiers à façonner ProDay sur le terrain.",
    "",
    "Prochaines étapes :",
    "• Ouvrez votre espace bêta (programme, guides, retours)",
    "• Android : téléchargez l’APK depuis l’onglet Installer",
    `• iOS : ouverture TestFlight le ${IOS_BETA_LAUNCH_LABEL} — lien envoyé par email`,
    "",
    `Espace bêta : ${accessUrl}`,
    `Installer : ${installerUrl}`,
    "",
    "Bienvenue dans ProDay,",
    "L’équipe ProDay",
  ].join("\n");

  const html = buildProdayEmailShell({
    subject,
    preheader: `Accès approuvé. iOS TestFlight le ${IOS_BETA_LAUNCH_LABEL_SHORT}.`,
    footerNote: `Message envoyé à ${params.email}.`,
    markUrl: `${site}/branding/logo-proday-mark.png`,
    bodyHtml: `
      <p style="margin:0 0 10px;font-size:10px;line-height:14px;font-weight:600;letter-spacing:0.22em;text-transform:uppercase;color:#5B75FF;">Accès approuvé</p>
      <h1 style="margin:0 0 18px;font-size:26px;line-height:1.2;font-weight:600;letter-spacing:-0.02em;color:#ffffff;">Bienvenue dans la bêta ProDay</h1>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#d4d4d8;">Félicitations — votre demande a été approuvée. Profil : <strong style="color:#ffffff;">${params.roleLabel}</strong>.</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#d4d4d8;">Vous êtes officiellement beta testeur — parmi les premiers à façonner ProDay sur le terrain.</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:8px 0 20px;background:#111114;border:1px solid rgba(255,255,255,0.12);">
        <tr>
          <td style="width:3px;background:#1E3AFF;font-size:0;line-height:0;">&nbsp;</td>
          <td style="padding:18px 20px;">
            <p style="margin:0;font-size:10px;line-height:14px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:#5B75FF;">iOS · TestFlight</p>
            <p style="margin:8px 0 0;font-size:20px;line-height:1.3;font-weight:600;color:#ffffff;">${IOS_BETA_LAUNCH_LABEL}</p>
            <p style="margin:8px 0 0;font-size:14px;line-height:1.65;color:#a1a1aa;">Lien TestFlight envoyé par email à l’ouverture. Android : APK déjà disponible dans Installer.</p>
          </td>
        </tr>
      </table>
      <table role="presentation" cellspacing="0" cellpadding="0">
        <tr>
          <td style="padding:0 10px 10px 0;">
            <a href="${accessUrl}" style="display:inline-block;background:#1E3AFF;color:#ffffff;text-decoration:none;font-size:12px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;padding:14px 26px;border:1px solid #1E3AFF;">Espace bêta</a>
          </td>
          <td style="padding:0 0 10px 0;">
            <a href="${installerUrl}" style="display:inline-block;background:transparent;color:#ffffff;text-decoration:none;font-size:12px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;padding:14px 26px;border:1px solid rgba(255,255,255,0.2);">Installer</a>
          </td>
        </tr>
      </table>
    `,
  });

  return { subject, html, text };
}
