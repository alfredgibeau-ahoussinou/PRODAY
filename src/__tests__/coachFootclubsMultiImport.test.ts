import fs from 'fs';
import path from 'path';
import { parseCalendarCsv, parseCalendarIcs } from '../services/matchCenter/calendarUniversalParser';
import { parseFootclubsDisciplineCsv } from '../features/club/utils/footclubsDisciplineParser';
import { parseFootclubsCsv } from '../features/club/utils/footclubsCsvParser';
import { parseImportedSheetText } from '../utils/squadSheetImport';

const ROOT = path.resolve(__dirname, '..');
function read(relative: string): string {
  return fs.readFileSync(path.join(ROOT, relative), 'utf8');
}

describe('Centre d’importation Footclubs FFF multi-modalités', () => {
  const panelSource = read('components/coach/CoachSquadImportPanel.tsx');

  describe('Structure du composant CoachSquadImportPanel', () => {
    it('expose les 5 modalités d’importation Footclubs officielles', () => {
      expect(panelSource).toContain("'roster'");
      expect(panelSource).toContain("'calendar'");
      expect(panelSource).toContain("'discipline'");
      expect(panelSource).toContain("'fmi'");
      expect(panelSource).toContain("'federation'");
    });

    it('intègre les parsers réels sans wizard inventé', () => {
      expect(panelSource).toContain('parseCalendarCsv');
      expect(panelSource).toContain('parseCalendarIcs');
      expect(panelSource).toContain('parseFootclubsDisciplineCsv');
      expect(panelSource).toContain('clubLicenseService.importLicensedRoster');
      expect(panelSource).toContain('ProdayMatchCenterService.importMatches');
      expect(panelSource).toContain('playerDisciplinaryService.importFootclubsCsv');
      expect(panelSource).toContain('federationService.searchClubs');
      expect(panelSource).not.toMatch(/Étape \d+\/8|wizard/i);
    });

    it('propose les onglets de catégories avec icônes adaptées', () => {
      expect(panelSource).toContain('Licences & Effectif');
      expect(panelSource).toContain('Calendrier & Matchs');
      expect(panelSource).toContain('Discipline & Cartons');
      expect(panelSource).toContain('Feuille FMI');
      expect(panelSource).toContain('Sync FFF Directe');
    });
  });

  describe('Modalité 1 : Licences & Effectif FFF', () => {
    it('parse un CSV Footclubs avec statuts médicaux et catégories', () => {
      const csv = `N° Licence;Nom;Prénom;Catégorie;Position;Statut médical;Date de naissance
2548963210;DIALLO;Moussa;U17;Attaquant;Apte;14/03/2009
2548963211;MARTIN;Lucas;U17;Milieu;Valide;22/07/2009`;
      const res = parseFootclubsCsv(csv);
      expect(res.success).toBe(true);
      expect(res.rows).toHaveLength(2);
      expect(res.rows[0].displayName).toBe('Moussa DIALLO');
      expect(res.rows[0].medicalValid).toBe(true);
    });
  });

  describe('Modalité 2 : Calendrier officiel FFF (CSV / ICS)', () => {
    it('parse un export calendrier Footclubs CSV', () => {
      const csv = `Date;Heure;Domicile;Exterieur;Competition;Terrain
18/10/2026;15:00;Mon Club;Tremplin Foot;Régional 1;Stade Municipal
25/10/2026;15:30;ES Nanterre;Mon Club;Régional 1;Complexe Jean Guimier`;
      const res = parseCalendarCsv(csv, { myTeamName: 'Mon Club' });
      expect(res.success).toBe(true);
      expect(res.matches).toHaveLength(2);
      expect(res.matches[0].homeTeam.name).toBe('Mon Club');
      expect(res.matches[0].awayTeam.name).toBe('Tremplin Foot');
      expect(res.matches[0].competition.name).toBe('Régional 1');
      expect(res.matches[0].schedule.date).toBe('2026-10-18');
    });

    it('parse un fichier iCalendar ICS officiel FFF', () => {
      const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//FFF//Footclubs Calendar//FR
BEGIN:VEVENT
UID:match-001@fff.fr
DTSTART:20261108T143000Z
SUMMARY:FC Versailles vs Mon Club (R1)
LOCATION:Stade Montbauron
DESCRIPTION:Championnat Régional 1 - Poule A
END:VEVENT
END:VCALENDAR`;
      const res = parseCalendarIcs(ics, { myTeamName: 'Mon Club' });
      expect(res.success).toBe(true);
      expect(res.matches).toHaveLength(1);
      expect(res.matches[0].schedule.date).toBe('2026-11-08');
    });
  });

  describe('Modalité 3 : Discipline & Sanctions FFF', () => {
    it('parse un relevé disciplinaire Footclubs FFF avec règle Art. 226', () => {
      const csv = `N° Licence;Nom;Prénom;Commission;N° Dossier;Date PV;Date Prise d'effet;Sanction;Compétition;Motif
2541890123;DUPONT;Lucas;Commission Régionale de Discipline;PV-2026-44;12/10/2026;19/10/2026;2 matchs;Championnat;Comportement antisportif`;
      const res = parseFootclubsDisciplineCsv(csv, 'club-test-123');
      expect(res.success).toBe(true);
      expect(res.validRowsCount).toBe(1);
      expect(res.records[0].license_number).toBe('2541890123');
      expect(res.records[0].player_name).toBe('DUPONT Lucas');
      expect(res.records[0].matches_total).toBe(2);
      expect(res.records[0].effective_date).toBe('2026-10-19');
    });
  });

  describe('Modalité 4 : Feuille de match FMI', () => {
    it('parse une composition FMI avec numéros et statuts', () => {
      const csv = `N° Maillot;N° Licence;Nom;Prénom;Statut;Capitaine
1;2541111111;BERNARD;Alexandre;Titulaire (Gardien);Non
4;2542222222;TRAORE;Moussa;Titulaire (Défenseur);Oui`;
      const res = parseImportedSheetText(csv);
      expect(res.ok).toBe(true);
      expect(res.rows).toHaveLength(2);
      expect(res.rows[0].displayName).toBe('Alexandre BERNARD');
      expect(res.rows[1].displayName).toBe('Moussa TRAORE');
    });
  });
});
