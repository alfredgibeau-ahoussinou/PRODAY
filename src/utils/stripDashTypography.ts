/**
 * Interdit tirets typographiques et puces « - » (copilote Club).
 * Conserve les traits d’union dans les mots (ex. peut-être).
 */
export function stripDashTypography(text: string): string {
  return text
    .replace(/\u2014/g, ',') // —
    .replace(/\u2013/g, ',') // –
    .replace(/^\s*[-–—•*]\s+/gm, '')
    .replace(/\s+-\s+/g, ', ')
    .replace(/\s*,\s*,+/g, ',')
    .replace(/\s+([.!?])/g, '$1')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
