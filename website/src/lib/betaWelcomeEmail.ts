/** Template email bêta : garder aligné avec functions/src/betaWaitlistEmail.ts */

export const BETA_MEMBER_ROLE = "Beta-testeur";

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

export function buildBetaWelcomeEmail(params: BetaWelcomeEmailParams): {
  subject: string;
  html: string;
  text: string;
} {
  const site = (params.siteUrl ?? "https://proday75.fr").replace(/\/$/, "");
  const accessUrl = buildBetaAccessUrl(site, params.accessToken);
  const subject = "Welcome to the ProDay Beta";

  const text = [
    "Congratulations!",
    "",
    "Your beta access request has been approved.",
    "",
    "You can now access ProDay and discover all of its features.",
    "",
    "Our team will contact you again soon with additional information.",
    "",
    "Welcome to ProDay!",
    "",
    `Access your beta space: ${accessUrl}`,
    `Installer (Android APK): ${buildBetaInstallerUrl(site, params.accessToken)}`,
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${subject}</title>
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
              <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#0a0a0a;">Welcome to the ProDay Beta</h1>
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
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;line-height:1.6;color:#94a3b8;">
                Message sent to ${params.email}.<br />
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

  return { subject, html, text };
}
