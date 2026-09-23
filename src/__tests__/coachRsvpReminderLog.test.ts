/**
 * Historique des relances côté Coach.
 *
 * L'écran liste les traces `rsvp_reminder_log` journalisées par
 * `coachRsvpReminders` (qui, quand, pour qui / combien de destinataires),
 * lues via une requête **filtrée côté base** sur le type — pas un filtrage
 * client de l'inbox — et groupées par jour à l'affichage.
 */

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '..');
function read(relative: string): string {
  return fs.readFileSync(path.join(ROOT, relative), 'utf8');
}

const SERVICE = 'services/staffNotifications.service.ts';
const SCREEN = 'screens/coach/CoachRsvpReminderLogScreen.tsx';
const NAV = 'features/coach/navigation/coachNavConfig.ts';
const SHELL = 'features/coach/shell/CoachAppShell.tsx';
const MENU = 'features/coach/shell/CoachMenuPane.tsx';
const HOME = 'screens/coach/CoachHomeScreen.tsx';

describe('Service — requête de l\u2019historique', () => {
  it('expose listReminderLogs, filtré sur rsvp_reminder_log côté base', () => {
    const source = read(SERVICE);
    expect(source).toContain('async listReminderLogs(uid: string, max = 60)');
    expect(source).toContain("where('type', '==', 'rsvp_reminder_log')");
    expect(source).toContain("orderBy('created_at', 'desc')");
    /** La trace est journalisée déjà lue : elle n'encombre pas l'inbox. */
    expect(source).toContain('markAsRead?: boolean');
    expect(source).toContain('input.markAsRead ? serverTimestamp() : null');
  });
});

describe('Écran — lecture réelle, groupée par jour', () => {
  const source = read(SCREEN);

  it('lit le service réel, sans historique fabriqué', () => {
    expect(source).toContain('staffNotificationsService.listReminderLogs');
    expect(source).not.toContain('setTimeout(');
  });

  it('groupe par jour avec des libellés relatifs honnêtes', () => {
    expect(source).toContain('Aujourd’hui');
    expect(source).toContain('Hier');
    expect(source).toContain('formatDayLabel');
  });

  it('affiche le détail de la trace : mode groupé, auteur, destinataires, canaux', () => {
    expect(source).toContain('recipients_count');
    expect(source).toContain('reminded_by_name');
    expect(source).toContain('channels');
  });

  it('les trois états existent : chargement, vide, liste', () => {
    expect(source).toContain('logs === null');
    expect(source).toContain('Aucune relance pour l’instant');
    expect(source).toContain('CoachEmptyState');
  });

  it('reste sur la règle zéro couleur littérale', () => {
    const literals = source.match(/#[0-9A-Fa-f]{6}\b|rgba?\(/g) ?? [];
    expect(literals).toHaveLength(0);
  });
});

describe('Navigation — destination secondaire câblée', () => {
  it('rsvp_log existe dans le catalogue et les destinations secondaires', () => {
    const nav = read(NAV);
    expect(nav).toContain("| 'rsvp_log'");
    expect(nav).toMatch(/'rsvp_log',\s*$/m);
    expect(nav).toContain("id: 'rsvp_log'");
  });

  it('le shell rend l\u2019écran, le Menu le liste', () => {
    const shell = read(SHELL);
    expect(shell).toContain('case \'rsvp_log\':');
    expect(shell).toContain('<CoachRsvpReminderLogScreen />');
    const menu = read(MENU);
    expect(menu).toContain("id: 'rsvp_log'");
    expect(menu).toContain('Historique des relances');
  });

  it('l\u2019accueil ouvre l\u2019historique depuis une entrée dédiée', () => {
    const home = read(HOME);
    expect(home).toContain("onNavigate?.('rsvp_log')");
    expect(home).toContain('Historique des relances');
  });
});
