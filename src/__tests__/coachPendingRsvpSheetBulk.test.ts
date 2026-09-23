/**
 * « Tout relancer » dans l'en-tête de la feuille des réponses en attente.
 *
 * La relance groupée de la feuille n'est **pas** un nouveau chemin d'envoi :
 * elle applique la même relance individuelle (`executeRsvpReminderForPlayer`)
 * à chaque ligne pas encore « Relancé », et réutilise les mêmes états par
 * ligne — donc ce que le coach voit (spinner, Relancé, Échec) est exactement
 * ce qui a été envoyé.
 */

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '..');
function read(relative: string): string {
  return fs.readFileSync(path.join(ROOT, relative), 'utf8');
}

const SHEET = 'components/coach/CoachPendingRsvpSheet.tsx';

function block(source: string, from: string, to: string): string {
  const start = source.indexOf(from);
  expect(start).toBeGreaterThan(-1);
  const end = source.indexOf(to, start);
  expect(end).toBeGreaterThan(start);
  return source.slice(start, end);
}

const REMIND_ALL_END = 'cooldownAt]);';

describe('Feuille réponses en attente — relance groupée dans l’en-tête', () => {
  const source = read(SHEET);

  it('la relance groupée passe par le même chemin que les boutons à l’unité', () => {
    const remindAll = block(source, 'const remindAll', REMIND_ALL_END);
    expect(remindAll).toContain('executeRsvpReminderForPlayer(event, row.uid, {');
    expect(remindAll).toContain('actor: profile');
    expect(remindAll).toContain('setRowStates');
    /** Aucune deuxième implémentation d'envoi dans la feuille. */
    expect(remindAll).not.toContain('scheduleProdayLocalNotification');
    expect(remindAll).not.toContain('staffNotificationsService');
  });

  it('relance seulement les lignes pas encore prévenues **et** hors garde-fou 24 h', () => {
    const remindAll = block(source, 'const remindAll', REMIND_ALL_END);
    expect(remindAll).toContain("!== 'sent'");
    expect(remindAll).toContain('cooldownAt[row.uid] === undefined');
    expect(remindAll).toContain('if (targets.length === 0) return;');
    expect(remindAll).toContain('|| anySending) return;');
  });

  it('le bouton vit dans l’en-tête, avec ses états dont le cooldown', () => {
    const header = block(source, '<View style={styles.header}>', '</View>\n\n      {rows === null ? (');
    expect(header).toContain('Tout relancer');
    expect(header).toContain('Déjà relancés');
    expect(header).toContain('anySending ? (');
    expect(header).toContain('Relancés');
    expect(header).toContain('bulkTargets.length === 0');
  });

  it('les états par ligne restent la seule source de vérité — groupe et unité partagent rowStates', () => {
    /** Le rendu des lignes lit rowStates, que la relance groupée écrit aussi. */
    expect(source).toContain("const state = rowStates[row.uid] ?? 'idle';");
    const remindAll = block(source, 'const remindAll', REMIND_ALL_END);
    expect(remindAll).toContain("[row.uid]: 'sending'");
    expect(remindAll).toContain("[row.uid]: ok ? 'sent' : 'failed'");
  });

  it('les lignes en cooldown affichent le délai et ne sont pas cliquables', () => {
    expect(source).toContain('Relancé {cooldownLabel(cooldownAt[row.uid])}');
    expect(source).toContain('RSVP_REMINDER_COOLDOWN_MS');
    expect(source).toContain('listReminderLogsForEvent');
  });
});
