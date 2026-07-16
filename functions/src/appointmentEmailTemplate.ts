import * as fs from 'fs';
import * as path from 'path';

let templateCache: string | null = null;

function readAppointmentTemplate(): string {
  if (templateCache) return templateCache;
  const templatePath = path.join(__dirname, 'email-templates', 'appointment.html');
  let html = fs.readFileSync(templatePath, 'utf8');
  html = html.replace(/^<!--[\s\S]*?-->\s*/, '');
  templateCache = html;
  return templateCache;
}

export function renderAppointmentEmailHtml(params: Record<string, string>): string {
  let html = readAppointmentTemplate();
  for (const [key, value] of Object.entries(params)) {
    html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }
  return html;
}

export function buildAppointmentPlainText(params: Record<string, string>): string {
  return [
    `Bonjour ${params.recipient_name},`,
    '',
    params.body_intro.replace(/<[^>]+>/g, ''),
    '',
    params.body_detail,
    '',
    `Statut : ${params.status_label}`,
    '',
    params.body_action.replace(/<[^>]+>/g, ''),
    params.meeting_link ? `\nLien visio : ${params.meeting_link}` : '',
    '',
    `— ${params.app_name}`,
    'support@proday.app',
  ].join('\n');
}

/** Tests unitaires / hot reload */
export function clearAppointmentEmailTemplateCache(): void {
  templateCache = null;
}
