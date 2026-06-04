export type BetaRoleId = 'player' | 'coach' | 'club' | 'organizer';

export const BETA_MEMBER_ROLE = 'Beta-testeur';

export const BETA_ROLE_LABELS: Record<BetaRoleId, string> = {
  player: 'Joueur',
  coach: 'Coach',
  club: 'Club',
  organizer: 'Organisateur',
};

export function isBetaRoleId(value: string): value is BetaRoleId {
  return value in BETA_ROLE_LABELS;
}

export type BetaWelcomeEmailParams = {
  email: string;
  roleLabel: string;
  siteUrl?: string;
};

export function buildBetaWelcomeEmail(params: BetaWelcomeEmailParams): {
  subject: string;
  html: string;
  text: string;
} {
  const site = (params.siteUrl ?? 'https://proday.app').replace(/\/$/, '');
  const subject = 'Bienvenue dans la bêta ProDay';

  const text = [
    'Bonjour,',
    '',
    `Merci de votre inscription à la bêta ProDay en tant que ${params.roleLabel}.`,
    '',
    'ProDay est l’écosystème foot amateur et semi-pro qui réunit recrutement (Mercato), matchs, tournois, Pulse (score de visibilité) et CV joueur — le tout dans une seule application mobile.',
    '',
    'Prochaines étapes :',
    '• Vous recevrez des nouvelles sur l’avancement de l’app et les dates de test.',
    '• Vous serez contacté en priorité dès l’ouverture de la bêta iOS et Android.',
    '• En attendant, explorez le site pour découvrir les fonctionnalités et l’univers ProDay Woman.',
    '',
    `Site : ${site}`,
    `Page bêta : ${site}/beta`,
    '',
    'À très bientôt sur le terrain,',
    'L’équipe ProDay',
    '',
    '—',
    'Vous recevez cet email car vous vous êtes inscrit à la bêta sur proday.app.',
    'Contact : support@proday.app',
  ].join('\n');

  const html = `<!DOCTYPE html>
<html lang="fr">
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
              <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#0a0a0a;">Bienvenue dans la bêta</h1>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">
                Merci pour votre inscription en tant que <strong>${params.roleLabel}</strong>.
                Vous faites partie des premiers à suivre le lancement de ProDay.
              </p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">
                <strong>ProDay</strong> réunit recrutement (Mercato), matchs amicaux, tournois,
                le score <strong>Pulse</strong> et un <strong>CV joueur</strong> exportable — une seule app pour
                joueurs, coachs, clubs et organisateurs.
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:24px 0;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#0a0a0a;text-transform:uppercase;letter-spacing:0.06em;">Ce qui vous attend</p>
                    <ul style="margin:0;padding-left:18px;font-size:14px;line-height:1.7;color:#475569;">
                      <li>Des nouvelles régulières sur l’avancement de l’application</li>
                      <li>Un accès prioritaire à la bêta mobile (iOS &amp; Android)</li>
                      <li>La découverte de <strong>ProDay Woman</strong>, l’univers dédié au foot féminin</li>
                    </ul>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#64748b;">
                En attendant le lien de téléchargement, parcourez le site pour voir les démos
                Mercato, Pulse, parcours par rôle et la feuille de route.
              </p>
              <a href="${site}/beta" style="display:inline-block;background:#0a0a0a;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:14px 28px;border-radius:999px;">
                Voir la page bêta
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;line-height:1.6;color:#94a3b8;">
                Inscription enregistrée pour ${params.email}.<br />
                Questions ? <a href="mailto:support@proday.app" style="color:#475569;">support@proday.app</a>
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

export type EmailJsBetaConfig = {
  serviceId: string;
  templateId: string;
  publicKey: string;
  privateKey: string;
};

export function buildBetaEmailJsTemplateParams(
  params: BetaWelcomeEmailParams
): Record<string, string> {
  const site = (params.siteUrl ?? 'https://proday.app').replace(/\/$/, '');

  return {
    to_email: params.email,
    user_email: params.email,
    member_role: BETA_MEMBER_ROLE,
    profile_label: params.roleLabel,
    role_label: BETA_MEMBER_ROLE,
    site_url: site,
    beta_url: `${site}/beta`,
    subject: 'Vous êtes beta-testeur ProDay',
  };
}

export async function sendBetaWelcomeEmailViaEmailJs(
  config: EmailJsBetaConfig,
  params: BetaWelcomeEmailParams
): Promise<void> {
  const templateParams = buildBetaEmailJsTemplateParams(params);

  const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: config.serviceId,
      template_id: config.templateId,
      user_id: config.publicKey,
      accessToken: config.privateKey,
      template_params: templateParams,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`EmailJS ${res.status}: ${detail}`);
  }
}
