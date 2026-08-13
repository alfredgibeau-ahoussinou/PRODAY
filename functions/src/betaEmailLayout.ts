/**
 * Layout HTML emails ProDay — dark brand (aligné site proday75.fr).
 * Compatible clients mail (tables + styles inline uniquement).
 */

const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

export const EMAIL_COLORS = {
  bg: '#050505',
  card: '#0c0c0e',
  cardAlt: '#111114',
  border: 'rgba(255,255,255,0.12)',
  borderStrong: 'rgba(255,255,255,0.2)',
  accent: '#0054F0',
  accentBright: '#4C8BFF',
  white: '#ffffff',
  text: '#d4d4d8',
  muted: '#71717a',
  soft: '#a1a1aa',
} as const;

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function emailKicker(label: string): string {
  return `<p style="margin:0 0 10px;font-family:${FONT};font-size:10px;line-height:14px;font-weight:600;letter-spacing:0.22em;text-transform:uppercase;color:${EMAIL_COLORS.accentBright};">${label}</p>`;
}

export function emailTitle(text: string): string {
  return `<h1 style="margin:0 0 18px;font-family:${FONT};font-size:26px;line-height:1.2;font-weight:600;letter-spacing:-0.02em;color:${EMAIL_COLORS.white};">${text}</h1>`;
}

export function emailParagraph(text: string): string {
  return `<p style="margin:0 0 16px;font-family:${FONT};font-size:15px;line-height:1.65;color:${EMAIL_COLORS.text};">${text}</p>`;
}

export function emailPanel(opts: {
  kicker: string;
  title?: string;
  body: string;
}): string {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:8px 0 20px;background:${EMAIL_COLORS.cardAlt};border:1px solid ${EMAIL_COLORS.border};">
  <tr>
    <td style="width:3px;background:${EMAIL_COLORS.accent};font-size:0;line-height:0;">&nbsp;</td>
    <td style="padding:18px 20px;">
      <p style="margin:0;font-family:${FONT};font-size:10px;line-height:14px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:${EMAIL_COLORS.accentBright};">${opts.kicker}</p>
      ${
        opts.title
          ? `<p style="margin:8px 0 0;font-family:${FONT};font-size:20px;line-height:1.3;font-weight:600;color:${EMAIL_COLORS.white};">${opts.title}</p>`
          : ''
      }
      <p style="margin:8px 0 0;font-family:${FONT};font-size:14px;line-height:1.65;color:${EMAIL_COLORS.soft};">${opts.body}</p>
    </td>
  </tr>
</table>`;
}

export function emailCta(href: string, label: string, primary = true): string {
  const style = primary
    ? `display:inline-block;background:${EMAIL_COLORS.accent};color:${EMAIL_COLORS.white};text-decoration:none;font-family:${FONT};font-size:12px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;padding:14px 26px;border:1px solid ${EMAIL_COLORS.accent};`
    : `display:inline-block;background:transparent;color:${EMAIL_COLORS.white};text-decoration:none;font-family:${FONT};font-size:12px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;padding:14px 26px;border:1px solid ${EMAIL_COLORS.borderStrong};`;
  return `<a href="${href}" style="${style}">${label}</a>`;
}

export function emailCtaRow(...buttons: string[]): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:8px 0 4px;">
  <tr>
    ${buttons
      .map(
        (btn, i) =>
          `<td style="padding:${i === 0 ? '0 10px 10px 0' : '0 0 10px 0'};">${btn}</td>`,
      )
      .join('')}
  </tr>
</table>`;
}

export function emailList(items: string[]): string {
  const rows = items
    .map(
      (item) =>
        `<tr>
      <td valign="top" style="padding:0 10px 10px 0;font-family:${FONT};font-size:14px;line-height:1.5;color:${EMAIL_COLORS.accentBright};">▸</td>
      <td style="padding:0 0 10px;font-family:${FONT};font-size:14px;line-height:1.55;color:${EMAIL_COLORS.soft};">${item}</td>
    </tr>`,
    )
    .join('');
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:4px 0 18px;">${rows}</table>`;
}

export function emailOrderedList(items: string[]): string {
  const rows = items
    .map(
      (item, i) =>
        `<tr>
      <td valign="top" style="width:28px;padding:0 10px 12px 0;font-family:${FONT};font-size:12px;line-height:1.5;font-weight:700;letter-spacing:0.08em;color:${EMAIL_COLORS.accentBright};">${String(i + 1).padStart(2, '0')}</td>
      <td style="padding:0 0 12px;font-family:${FONT};font-size:14px;line-height:1.55;color:${EMAIL_COLORS.soft};">${item}</td>
    </tr>`,
    )
    .join('');
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:4px 0 18px;">${rows}</table>`;
}

export type ProdayEmailShellOpts = {
  subject: string;
  preheader?: string;
  bodyHtml: string;
  footerNote?: string;
  lang?: string;
};

/** Shell sombre ProDay — header marque + corps + footer. */
export function buildProdayEmailShell(opts: ProdayEmailShellOpts): string {
  const lang = opts.lang ?? 'fr';
  const preheader = opts.preheader?.trim()
    ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${opts.preheader}</div>`
    : '';
  const footerNote =
    opts.footerNote ??
    'Vous recevez cet email car vous êtes inscrit à la bêta ProDay.';

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${opts.subject}</title>
</head>
<body style="margin:0;padding:0;background:${EMAIL_COLORS.bg};font-family:${FONT};color:${EMAIL_COLORS.white};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  ${preheader}
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${EMAIL_COLORS.bg};padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:${EMAIL_COLORS.card};border:1px solid ${EMAIL_COLORS.border};">
          <tr>
            <td style="height:3px;background:${EMAIL_COLORS.accent};font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:28px 32px 22px;border-bottom:1px solid ${EMAIL_COLORS.border};">
              <p style="margin:0;font-family:${FONT};font-size:22px;line-height:1;font-weight:700;letter-spacing:0.14em;color:${EMAIL_COLORS.white};">PRO<span style="color:${EMAIL_COLORS.accentBright};">DAY</span></p>
              <p style="margin:10px 0 0;font-family:${FONT};font-size:10px;line-height:14px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:${EMAIL_COLORS.muted};">Connecter · Progresser · Réussir</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              ${opts.bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:22px 32px 28px;border-top:1px solid ${EMAIL_COLORS.border};background:#09090b;">
              <p style="margin:0;font-family:${FONT};font-size:12px;line-height:1.65;color:${EMAIL_COLORS.muted};">
                ${footerNote}<br />
                Questions ? <a href="mailto:proday.admin@gmail.com" style="color:${EMAIL_COLORS.accentBright};text-decoration:none;">proday.admin@gmail.com</a>
                · <a href="https://proday75.fr" style="color:${EMAIL_COLORS.soft};text-decoration:none;">proday75.fr</a>
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
