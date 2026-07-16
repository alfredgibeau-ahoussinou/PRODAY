import type { AuthEmailJsKind } from './emailJsClient';

export type AuthEmailJsPayload = {
  to: string;
  subject: string;
  text: string;
};

const APP_NAME = 'ProDay';

function legacyUnifiedCopy(kind: AuthEmailJsKind) {
  const headline =
    kind === 'password-reset'
      ? 'Réinitialisez votre mot de passe'
      : 'Confirmez votre e-mail';
  const bodyIntro =
    kind === 'password-reset'
      ? `Une demande de réinitialisation a été faite pour le compte <strong style="color:#ffffff;">${APP_NAME}</strong>&nbsp;:`
      : `Pour activer votre compte <strong style="color:#ffffff;">${APP_NAME}</strong>, validez l'adresse suivante&nbsp;:`;
  const bodyAction =
    kind === 'password-reset'
      ? 'Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.'
      : 'Cliquez sur le bouton ci-dessous pour finaliser votre inscription.';
  const ctaLabel =
    kind === 'password-reset' ? 'Réinitialiser mon mot de passe' : 'Valider mon e-mail';
  const footerNote =
    kind === 'password-reset'
      ? "Ce lien expire après quelques heures. Si vous n'avez pas demandé cette réinitialisation, ignorez cet e-mail — votre mot de passe actuel reste inchangé."
      : "Ce lien expire après quelques heures. Si vous n'avez pas créé de compte, ignorez cet e-mail.";

  return { headline, bodyIntro, bodyAction, ctaLabel, footerNote };
}

export function buildAuthEmailJsTemplateParams(
  payload: AuthEmailJsPayload,
  link: string,
  options?: {
    displayName?: string;
    siteUrl?: string;
    kind?: AuthEmailJsKind;
    legacyUnifiedTemplate?: boolean;
  }
): Record<string, string> {
  const kind = options?.kind ?? 'verification';
  const siteUrl = (options?.siteUrl ?? 'https://proday75.fr').replace(/\/$/, '');
  const displayName = options?.displayName?.trim() || '';

  const params: Record<string, string> = {
    email: payload.to,
    to_email: payload.to,
    user_email: payload.to,
    subject: payload.subject,
    app_name: APP_NAME,
    action_link: link,
    verification_url: link,
    message_text: payload.text,
    display_name: displayName,
    display_name_greeting: displayName ? ` ${displayName}` : '',
  };

  if (options?.legacyUnifiedTemplate) {
    const copy = legacyUnifiedCopy(kind);
    Object.assign(params, {
      headline: copy.headline,
      body_intro: copy.bodyIntro,
      body_action: copy.bodyAction,
      cta_label: copy.ctaLabel,
      button_text: copy.ctaLabel,
      footer_note: copy.footerNote,
      email_kind: kind,
      site_url: siteUrl,
    });
  }

  return params;
}
