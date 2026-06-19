import { SPONSOR_MESSAGE_TEMPLATES } from '../content/sponsorContent';

export function sponsorProspectDraftMessage(prospectName: string): string {
  return SPONSOR_MESSAGE_TEMPLATES[0].text.replace('votre club', prospectName);
}
