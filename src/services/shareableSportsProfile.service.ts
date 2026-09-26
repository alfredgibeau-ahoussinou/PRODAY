import type {
  ExportProfileFieldsSelection,
  ShareableSportsProfileData,
} from '../models/ShareableSportsProfile';

export const shareableSportsProfileService = {
  /**
   * Construit les données réelles du profil exportable selon la sélection délibérée de l'utilisateur.
   * Filtre strictement pour exclure notes privées du coach, données de santé et estimations non vérifiées.
   */
  buildExportData(
    profileData: ShareableSportsProfileData,
    selection: ExportProfileFieldsSelection,
  ): Partial<ShareableSportsProfileData> {
    const result: Partial<ShareableSportsProfileData> = {
      display_name: selection.include_full_name ? profileData.display_name : 'Joueur ProDay',
      avatar_url: selection.include_photo ? profileData.avatar_url : undefined,
      generated_at: new Date(),
      is_minor: profileData.is_minor,
    };

    if (selection.include_birth_date) {
      if (profileData.is_minor) {
        // Pour les mineurs : uniquement l'année de naissance pour la protection
        result.birth_year = profileData.birth_year;
      } else {
        result.age = profileData.age;
      }
    }

    if (selection.include_nationality) {
      result.nationality = profileData.nationality;
    }

    if (selection.include_positions) {
      result.primary_position = profileData.primary_position;
      result.secondary_position = profileData.secondary_position;
    }

    if (selection.include_strong_foot) {
      result.strong_foot = profileData.strong_foot;
    }

    if (selection.include_height_weight) {
      result.height_cm = profileData.height_cm;
      result.weight_kg = profileData.weight_kg;
    }

    if (selection.include_current_club) {
      result.club_name = profileData.club_name;
    }

    if (selection.include_sporting_history) {
      result.history = profileData.history;
    } else {
      result.history = [];
    }

    if (selection.include_verified_stats) {
      result.stats = profileData.stats;
    } else {
      result.stats = [];
    }

    if (selection.include_contact_details) {
      if (profileData.is_minor) {
        result.guardian_contact = profileData.guardian_contact;
      } else {
        result.contact_email = profileData.contact_email;
        result.contact_phone = profileData.contact_phone;
      }
    }

    if (selection.custom_bio?.trim()) {
      result.bio = selection.custom_bio.trim();
    }

    return result;
  },

  /**
   * Génère le HTML imprimable (A4 / PDF) avec typographie soignée Apple/Inter.
   */
  generatePrintableHtml(data: Partial<ShareableSportsProfileData>): string {
    const BRAND = '#003399';
    const name = escapeHtml(data.display_name ?? 'Joueur ProDay');
    const position = escapeHtml(data.primary_position ?? 'Footballeur');
    const club = data.club_name ? escapeHtml(data.club_name) : 'Club non renseigné';

    const historyRows = (data.history ?? []).length > 0
      ? data.history!.map(
          (h) => `
          <div class="history-item">
            <span class="history-season">${escapeHtml(h.season)}</span>
            <span class="history-club">${escapeHtml(h.club_name)}</span>
            <span class="history-level">${escapeHtml(h.category_level)}</span>
            ${h.achievements ? `<p class="history-achieve">${escapeHtml(h.achievements)}</p>` : ''}
          </div>
        `,
        ).join('')
      : '<p class="muted">Aucun historique sportif renseigné.</p>';

    const statsRows = (data.stats ?? []).length > 0
      ? `
        <table class="stats-table">
          <thead>
            <tr>
              <th>Saison</th>
              <th>Source officielle</th>
              <th>Matchs</th>
              <th>Buts</th>
              <th>Passes D.</th>
            </tr>
          </thead>
          <tbody>
            ${data.stats!.map(
              (s) => `
              <tr>
                <td><strong>${escapeHtml(s.season_label)}</strong></td>
                <td><span class="badge-source">${escapeHtml(s.source)}</span></td>
                <td>${s.matches_played}</td>
                <td>${s.goals}</td>
                <td>${s.assists}</td>
              </tr>
            `,
            ).join('')}
          </tbody>
        </table>
      `
      : '<p class="muted">Aucune statistique officielle validée pour cette période.</p>';

    const contactsSection = data.guardian_contact
      ? `<div class="card"><label>Contact Tuteur / Parent (Vérifié)</label><p>${escapeHtml(data.guardian_contact)}</p></div>`
      : data.contact_email || data.contact_phone
      ? `
        <div class="card">
          <label>Coordonnées du joueur</label>
          ${data.contact_email ? `<p>Email : ${escapeHtml(data.contact_email)}</p>` : ''}
          ${data.contact_phone ? `<p>Téléphone : ${escapeHtml(data.contact_phone)}</p>` : ''}
        </div>
      `
      : '';

    return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>Profil Sportif — ${name} | ProDay</title>
  <style>
    @page { size: A4; margin: 16mm 14mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      font-size: 10.5pt;
      line-height: 1.45;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page-container {
      max-width: 210mm;
      margin: 0 auto;
      padding: 16px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2.5px solid ${BRAND};
      padding-bottom: 12px;
      margin-bottom: 18px;
    }
    .title-col h1 {
      font-size: 20pt;
      font-weight: 800;
      color: ${BRAND};
      letter-spacing: -0.02em;
    }
    .title-col .subtitle {
      font-size: 11pt;
      color: #475569;
      font-weight: 600;
      margin-top: 3px;
    }
    .club-badge {
      display: inline-block;
      margin-top: 5px;
      background: #eef2ff;
      color: ${BRAND};
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 8.5pt;
      font-weight: 700;
    }
    .brand-mark {
      font-size: 13pt;
      font-weight: 900;
      color: ${BRAND};
      letter-spacing: 0.05em;
    }
    .section-title {
      font-size: 11.5pt;
      font-weight: 800;
      color: #1e293b;
      margin: 16px 0 8px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      border-left: 3px solid ${BRAND};
      padding-left: 8px;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 12px;
    }
    .card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 12px;
    }
    .card label {
      display: block;
      font-size: 7.5pt;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      font-weight: 700;
      margin-bottom: 3px;
    }
    .card p {
      font-size: 9.5pt;
      color: #0f172a;
      font-weight: 600;
    }
    .history-item {
      padding: 8px 10px;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: baseline;
    }
    .history-season {
      font-weight: 800;
      color: ${BRAND};
      width: 75px;
    }
    .history-club {
      font-weight: 700;
      color: #1e293b;
      flex: 1;
    }
    .history-level {
      color: #64748b;
      font-size: 9pt;
    }
    .history-achieve {
      width: 100%;
      font-size: 8.5pt;
      color: #334155;
      padding-left: 83px;
      font-style: italic;
    }
    .stats-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 6px;
    }
    .stats-table th {
      background: #f1f5f9;
      color: #475569;
      font-size: 7.5pt;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 6px 8px;
      text-align: left;
    }
    .stats-table td {
      padding: 6px 8px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 9pt;
    }
    .badge-source {
      background: #ecfdf5;
      color: #059669;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 7.5pt;
      font-weight: 700;
    }
    .muted {
      color: #94a3b8;
      font-size: 9pt;
      font-style: italic;
      padding: 6px 0;
    }
    .footer {
      margin-top: 24px;
      padding-top: 10px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      color: #94a3b8;
      font-size: 7.5pt;
    }
  </style>
</head>
<body>
  <div class="page-container">
    <div class="header">
      <div class="title-col">
        <h1>${name}</h1>
        <div class="subtitle">${position}</div>
        <div class="club-badge">${club}</div>
      </div>
      <div class="brand-mark">PRODAY</div>
    </div>

    ${data.bio ? `
      <div class="card" style="margin-bottom: 12px;">
        <label>Présentation</label>
        <p style="font-weight: 400; line-height: 1.5;">${escapeHtml(data.bio)}</p>
      </div>
    ` : ''}

    <div class="section-title">Profil Joueur</div>
    <div class="grid-2">
      ${data.age ? `<div class="card"><label>Âge</label><p>${data.age} ans</p></div>` : ''}
      ${data.birth_year ? `<div class="card"><label>Année de naissance</label><p>${data.birth_year}</p></div>` : ''}
      ${data.nationality ? `<div class="card"><label>Nationalité</label><p>${escapeHtml(data.nationality)}</p></div>` : ''}
      ${data.strong_foot ? `<div class="card"><label>Pied fort</label><p>${escapeHtml(data.strong_foot)}</p></div>` : ''}
      ${data.height_cm ? `<div class="card"><label>Taille</label><p>${data.height_cm} cm</p></div>` : ''}
      ${data.weight_kg ? `<div class="card"><label>Poids</label><p>${data.weight_kg} kg</p></div>` : ''}
      ${data.secondary_position ? `<div class="card"><label>Poste secondaire</label><p>${escapeHtml(data.secondary_position)}</p></div>` : ''}
    </div>

    <div class="section-title">Parcours & Historique Validé</div>
    <div class="card" style="padding: 2px 6px;">
      ${historyRows}
    </div>

    <div class="section-title">Statistiques Officielles Vérifiées</div>
    <div class="card">
      ${statsRows}
    </div>

    ${contactsSection ? `
      <div class="section-title">Contact & Représentation</div>
      ${contactsSection}
    ` : ''}

    <div class="footer">
      <span>Document généré via ProDay — Données vérifiées par le club et le joueur.</span>
      <span>${new Date().toLocaleDateString('fr-FR')}</span>
    </div>
  </div>
</body>
</html>`;
  },
};

function escapeHtml(text: string): string {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
