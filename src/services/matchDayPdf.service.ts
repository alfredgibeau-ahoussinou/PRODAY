import { Linking, Platform, Share } from 'react-native';
import type { TeamEvent } from '../models/TeamEvent';
import { formatCalendarDate } from '../utils/seasonCalendar';

/**
 * Service de génération et d'exportation de la feuille de match officielle (HTML / Web Print / PDF).
 * Permet au coach ou au président de club d'imprimer la composition, le schéma tactique et les convocations.
 */
export const matchDayPdfService = {
  /**
   * Génère le document HTML prêt pour l'impression A4 et l'export PDF.
   */
  generateMatchSheetHtml(event: TeamEvent): string {
    const starters = event.lineup?.slots.filter((s) => s.role === 'starter') ?? [];
    const subs = event.lineup?.slots.filter((s) => s.role === 'sub') ?? [];
    const dateStr = event.starts_at ? formatCalendarDate(event.starts_at) : 'Date à définir';

    return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>Feuille de Match - ${event.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 30px; color: #0F172A; background: #FFF; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #00F59B; padding-bottom: 15px; margin-bottom: 25px; }
    .title { font-size: 24px; font-weight: 800; text-transform: uppercase; margin: 0; color: #0F172A; }
    .meta { font-size: 14px; color: #64748B; margin-top: 5px; }
    .badge { background: #0F172A; color: #00F59B; font-weight: 700; font-size: 12px; padding: 4px 10px; border-radius: 4px; display: inline-block; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
    .card { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 15px; }
    .card-title { font-size: 16px; font-weight: 800; border-bottom: 1px solid #E2E8F0; padding-bottom: 8px; margin-top: 0; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { text-align: left; padding: 8px 4px; border-bottom: 1px solid #E2E8F0; }
    th { color: #64748B; font-weight: 700; }
    .num { font-weight: 800; color: #0F172A; width: 30px; }
    .footer { margin-top: 40px; border-top: 1px dashed #CBD5E1; padding-top: 15px; font-size: 11px; color: #94A3B8; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="title">${event.title}</h1>
      <div class="meta">${dateStr} · Lieu : ${event.city} ${event.location_label ? `(${event.location_label})` : ''}</div>
      <div class="meta">Club : ${event.club_name || 'Équipe ProDay'} · Organisateur : ${event.organizer_name}</div>
    </div>
    <div style="text-align: right;">
      <span class="badge">PRODAY MATCH OFFICIAL</span>
      ${event.lineup?.formation ? `<div style="margin-top: 8px; font-weight: 800; font-size: 16px;">Schéma : ${event.lineup.formation}</div>` : ''}
    </div>
  </div>

  <div class="grid">
    <div class="card">
      <h2 class="card-title">XI Titulaires (${starters.length})</h2>
      <table>
        <thead>
          <tr>
            <th class="num">N°</th>
            <th>Joueur</th>
            <th>Poste</th>
          </tr>
        </thead>
        <tbody>
          ${starters.length > 0 ? starters.map((s, idx) => `
            <tr>
              <td class="num">${idx + 1}</td>
              <td><strong>${s.display_name}</strong></td>
              <td>${s.position_label ?? 'Joueur'}</td>
            </tr>
          `).join('') : '<tr><td colspan="3">Aucun titulaire désigné</td></tr>'}
        </tbody>
      </table>
    </div>

    <div class="card">
      <h2 class="card-title">Remplaçants (${subs.length})</h2>
      <table>
        <thead>
          <tr>
            <th class="num">N°</th>
            <th>Joueur</th>
            <th>Poste</th>
          </tr>
        </thead>
        <tbody>
          ${subs.length > 0 ? subs.map((s, idx) => `
            <tr>
              <td class="num">${12 + idx}</td>
              <td><strong>${s.display_name}</strong></td>
              <td>${s.position_label ?? 'Remplaçant'}</td>
            </tr>
          `).join('') : '<tr><td colspan="3">Aucun remplaçant</td></tr>'}
        </tbody>
      </table>
    </div>
  </div>

  <div class="footer">
    Document généré automatiquement par l'application ProDay Football. Valable pour affichage vestiaire et causerie d'avant-match.
  </div>
</body>
</html>
    `;
  },

  /**
   * Imprime ou partage la feuille de match officielle.
   */
  async printOrShareMatchSheet(event: TeamEvent): Promise<void> {
    const html = this.generateMatchSheetHtml(event);

    if (Platform.OS === 'web') {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 250);
      }
      return;
    }

    const starters = event.lineup?.slots.filter((s) => s.role === 'starter') ?? [];
    const subs = event.lineup?.slots.filter((s) => s.role === 'sub') ?? [];
    const summary = [
      `FEUILLE DE MATCH PRODAY : ${event.title}`,
      `${event.starts_at ? formatCalendarDate(event.starts_at) : 'Date à venir'} • ${event.city}`,
      event.lineup?.formation ? `Formation : ${event.lineup.formation}` : '',
      `\nTITULAIRES (${starters.length}) :`,
      ...starters.map((s, i) => `${i + 1}. ${s.display_name} (${s.position_label ?? 'Joueur'})`),
      `\nREMPLAÇANTS (${subs.length}) :`,
      ...subs.map((s, i) => `${12 + i}. ${s.display_name}`),
    ].filter(Boolean).join('\n');

    await Share.share({
      title: `Feuille de match • ${event.title}`,
      message: summary,
    });
  },
};
