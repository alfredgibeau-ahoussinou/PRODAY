/**
 * Compteur de convocations en attente sur l'accueil Coach.
 *
 * La carte « Prochain événement » affiche combien d'invités n'ont pas encore
 * répondu à la convocation. Le compteur est **dérivé** de l'événement réel :
 * même définition que le Match Center et les rappels (`getPendingInviteeUids`),
 * aucun état local, donc aucune divergence possible entre l'accueil et les
 * autres écrans qui comptent les relances.
 */

import fs from 'fs';
import path from 'path';
import { getPendingInviteeUids, type RsvpStatus, type TeamEvent } from '../models/TeamEvent';

const ROOT = path.resolve(__dirname, '..');
function read(relative: string): string {
  return fs.readFileSync(path.join(ROOT, relative), 'utf8');
}

const HOME = 'screens/coach/CoachHomeScreen.tsx';

function stubEvent(rsvps: Record<string, RsvpStatus>): TeamEvent {
  return {
    id: 'e1',
    title: 'Match Seniors A',
    event_type: 'competition',
    organizer_uid: 'coach1',
    club_id: 'club1',
    starts_at: new Date(),
    invitee_uids: Object.keys(rsvps),
    rsvps,
    attendance_marks: {},
  } as unknown as TeamEvent;
}

describe('getPendingInviteeUids — définition du compteur affiché', () => {
  it('compte les invités sans réponse, et rien d’autre', () => {
    const event = stubEvent({
      u1: 'pending',
      u2: 'yes',
      u3: 'no',
      u4: 'maybe',
      u5: 'late_under_10',
    });
    expect(getPendingInviteeUids(event)).toEqual(['u1']);
  });

  it('compte un invité absent du journal des réponses comme en attente', () => {
    const event = stubEvent({ u1: 'yes' });
    event.invitee_uids.push('u2');
    expect(getPendingInviteeUids(event)).toEqual(['u2']);
  });

  it('donne zéro sans convocation', () => {
    expect(getPendingInviteeUids(stubEvent({}))).toHaveLength(0);
  });
});

describe('Accueil Coach — le compteur est branché sur la définition partagée', () => {
  it('dérive le compteur du prochain événement réel, sans état local', () => {
    const source = read(HOME);
    expect(source).toContain('getPendingInviteeUids');
    expect(source).toContain('() => (nextEvent ? getPendingInviteeUids(nextEvent).length : 0),');
    /** Zéro convocation → zéro compteur, jamais un chiffre inventé. */
    expect(source).toContain(': 0),');
  });

  it('n’affiche le badge que quand des réponses manquent, à côté de la date', () => {
    const source = read(HOME);
    expect(source).toContain('pendingRsvpCount > 0');
    expect(source).toContain('en attente');
    expect(source).toContain('heroTopRight');
  });
});

describe('Accueil Coach — le badge embarque la relance groupée', () => {
  const HOOK = 'hooks/useCoachRsvpRemind.ts';

  it('l’accueil est branché sur le hook partagé, pas sur une implémentation locale', () => {
    const source = read(HOME);
    expect(source).toContain("import { useCoachRsvpRemind } from '../../hooks/useCoachRsvpRemind';");
    expect(source).toContain('useCoachRsvpRemind(nextEvent)');
    /** La relance ne duplique ni l'envoi ni le calcul des invités. */
    expect(source).not.toContain('executeBulkRsvpReminders');
    expect(source).not.toContain('executeRsvpReminderForPlayer');
  });

  it('le hook relance via coachRsvpReminders avec l’acteur staff du club', () => {
    const hook = read(HOOK);
    expect(hook).toContain(
      "import { executeBulkRsvpReminders } from '../utils/coachRsvpReminders';",
    );
    expect(hook).toContain('executeBulkRsvpReminders([event]');
    expect(hook).toContain('isAdmin: profile.is_admin');
  });

  it('un seul envoi à la fois, et le compteur reste la cible — pas une liste locale', () => {
    const hook = read(HOOK);
    expect(hook).toContain('if (!event || reminding) return;');
    expect(hook).toContain('setReminding(true)');
    expect(hook).not.toContain('executeRsvpReminderForPlayer');
  });

  it('le retour est honnête : succès, cooldown ou échec, trois cas distingués', () => {
    const hook = read(HOOK);
    expect(hook).toContain("result.remindedCount > 0");
    expect(hook).toContain("result.blockedCount > 0");
    expect(hook).toContain("'cooldown'");
    expect(hook).toContain("RsvpRemindFeedback = 'sent' | 'failed' | 'cooldown'");
  });

  it('le compteur tactile et le bouton d’envoi sont deux zones distinctes du badge', () => {
    const source = read(HOME);
    expect(source).toContain('setPendingSheetOpen(true)');
    expect(source).toContain('void remindPendingRsvps()');
    expect(source).toContain('rsvpRemindBtn');
    expect(source).toContain('Relancer');
  });

  it('sans club rattaché, la relance annonce un échec au lieu de mentir', () => {
    const hook = read(HOOK);
    expect(hook).toContain('if (!profile?.profile.club_id)');
  });
});
