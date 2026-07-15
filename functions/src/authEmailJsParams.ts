export type AuthEmailJsPayload = {
  to: string;
  subject: string;
  text: string;
};

export function buildAuthEmailJsTemplateParams(
  payload: AuthEmailJsPayload,
  link: string,
  options?: { displayName?: string; siteUrl?: string; kind?: 'verification' | 'password-reset' }
): Record<string, string> {
  const siteUrl = (options?.siteUrl ?? 'https://proday75.fr').replace(/\/$/, '');
  const kind = options?.kind ?? 'verification';
  const appName = 'ProDay';
  const headline =
    kind === 'password-reset'
      ? 'Réinitialisez votre mot de passe'
      : 'Confirmez votre e-mail';
  const bodyIntro =
    kind === 'password-reset'
      ? `Pour réinitialiser votre mot de passe ${appName}, cliquez ci-dessous&nbsp;:`
      : `Pour activer votre compte ${appName}, validez l'adresse&nbsp;:`;
  const ctaLabel = kind === 'password-reset' ? 'Réinitialiser mon mot de passe' : 'Valider mon e-mail';
  const footerNote =
    kind === 'password-reset'
      ? "Ce lien expire après une heure. Si vous n'avez pas demandé de réinitialisation, ignorez cet e-mail."
      : "Ce lien expire après quelques heures. Si vous n'avez pas créé de compte, ignorez cet e-mail.";
  const displayName = options?.displayName?.trim() || '';
  return {
    email: payload.to,
    to_email: payload.to,
    user_email: payload.to,
    subject: payload.subject,
    headline,
    app_name: appName,
    body_intro: bodyIntro,
    cta_label: ctaLabel,
    footer_note: footerNote,
    email_kind: kind,
    site_url: siteUrl,
    action_link: link,
    verification_url: link,
    message_text: payload.text,
    display_name: displayName,
    display_name_greeting: displayName ? ` ${displayName}` : '',
  };
}
