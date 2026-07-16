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
      ? `Une demande de réinitialisation a été faite pour le compte <strong style="color:#ffffff;">${appName}</strong>&nbsp;:`
      : `Pour activer votre compte <strong style="color:#ffffff;">${appName}</strong>, validez l'adresse suivante&nbsp;:`;
  const bodyAction =
    kind === 'password-reset'
      ? 'Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.'
      : 'Cliquez sur le bouton ci-dessous pour finaliser votre inscription.';
  const ctaLabel = kind === 'password-reset' ? 'Réinitialiser mon mot de passe' : 'Valider mon e-mail';
  const footerNote =
    kind === 'password-reset'
      ? "Ce lien expire après quelques heures. Si vous n'avez pas demandé cette réinitialisation, ignorez cet e-mail — votre mot de passe actuel reste inchangé."
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
    body_action: bodyAction,
    cta_label: ctaLabel,
    button_text: ctaLabel,
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
