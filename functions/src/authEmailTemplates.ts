import * as fs from 'fs';
import * as path from 'path';

export type AuthEmailTemplateKind = 'verification' | 'password-reset';

const SUBJECTS: Record<AuthEmailTemplateKind, string> = {
  verification: 'Confirmez votre adresse e-mail ProDay',
  'password-reset': 'Réinitialisez votre mot de passe ProDay',
};

let templateCache: Partial<Record<AuthEmailTemplateKind, { html: string; text: string }>> = {};

function templateDir(): string {
  return path.join(__dirname, 'auth-email-templates');
}

function readTemplate(kind: AuthEmailTemplateKind): { html: string; text: string } {
  const cached = templateCache[kind];
  if (cached) return cached;

  const dir = templateDir();
  const html = fs.readFileSync(path.join(dir, `${kind === 'verification' ? 'verification' : 'password-reset'}.html`), 'utf8');
  const text = fs.readFileSync(path.join(dir, `${kind === 'verification' ? 'verification' : 'password-reset'}.txt`), 'utf8');
  templateCache[kind] = { html, text };
  return templateCache[kind]!;
}

export function renderAuthEmailTemplate(
  kind: AuthEmailTemplateKind,
  vars: { link: string; email: string; appName?: string; displayName?: string }
): { subject: string; html: string; text: string } {
  const { html: htmlFragment, text: textTemplate } = readTemplate(kind);
  const replacements: Record<string, string> = {
    LINK: vars.link,
    EMAIL: vars.email,
    APP_NAME: vars.appName ?? 'ProDay',
    DISPLAY_NAME: vars.displayName ?? '',
  };

  const applyVars = (template: string) =>
    template.replace(/%([A-Z_]+)%/g, (_, key: string) => replacements[key] ?? `%${key}%`);

  const htmlBody = applyVars(htmlFragment);
  const text = applyVars(textTemplate);

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${SUBJECTS[kind]}</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;">
${htmlBody}
</body>
</html>`;

  return { subject: SUBJECTS[kind], html, text };
}

/** Tests unitaires / hot reload */
export function clearAuthEmailTemplateCache(): void {
  templateCache = {};
}
