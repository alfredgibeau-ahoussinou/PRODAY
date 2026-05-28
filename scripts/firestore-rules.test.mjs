/**
 * Tests Firestore Security Rules — ProDay
 * Exécution : npm run firebase:rules:test
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
} from 'firebase/firestore';

const PROJECT_ID = 'proday-rules-test';

async function run() {
  const rulesPath = resolve(process.cwd(), 'firebase/firestore.rules');
  const rules = readFileSync(rulesPath, 'utf8');

  const testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules, host: '127.0.0.1', port: 8080 },
  });

  await testEnv.clearFirestore();

  // --- Joueur : RSVP autorisé ---
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'users/alice'), {
      role: 'player',
      profile: { club_id: 'club1' },
      is_verified: true,
    });
    await setDoc(doc(db, 'users/bob'), {
      role: 'coach',
      profile: { club_id: 'club1' },
      is_verified: true,
    });
    await setDoc(doc(db, 'team_events/ev1'), {
      organizer_uid: 'bob',
      invitee_uids: ['alice'],
      rsvps: { alice: 'pending' },
      match_report_finalized_at: null,
    });
    await setDoc(doc(db, 'team_payment_requests/pay1'), {
      club_id: 'club1',
      member_uid: 'alice',
      amount_eur: 50,
      label: 'Cotisation',
    });
    await setDoc(doc(db, 'club_announcements/ann1'), {
      club_id: 'club1',
      author_uid: 'bob',
      author_name: 'Coach Bob',
      title: 'Réunion',
      body: 'Mercredi 19h',
    });
    await setDoc(doc(db, 'tournaments/t1'), {
      organizer_id: 'bob',
      name: 'Arena Test',
    });
    await setDoc(doc(db, 'tournaments/t1/matches/m1'), {
      team_a_name: 'A',
      team_b_name: 'B',
      score_a: 0,
      score_b: 0,
      phase: 'poule',
      played: false,
    });
  });

  const aliceDb = testEnv.authenticatedContext('alice').firestore();
  const bobDb = testEnv.authenticatedContext('bob').firestore();

  await assertSucceeds(
    updateDoc(doc(aliceDb, 'team_events/ev1'), {
      rsvps: { alice: 'yes' },
      updated_at: new Date(),
    })
  );

  await assertFails(
    updateDoc(doc(aliceDb, 'team_events/ev1'), {
      attendance_marks: { alice: 'present' },
    })
  );

  // Rapport verrouillé : joueur refusé
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await updateDoc(doc(db, 'team_events/ev1'), {
      match_report_finalized_at: new Date(),
    });
  });

  await assertFails(
    updateDoc(doc(aliceDb, 'team_events/ev1'), {
      player_match_stats: { alice: { uid: 'alice', player_name: 'Alice' } },
    })
  );

  await assertSucceeds(
    getDoc(doc(aliceDb, 'club_announcements/ann1'))
  );

  await assertFails(
    setDoc(doc(aliceDb, 'club_announcements/ann2'), {
      club_id: 'club1',
      author_uid: 'alice',
      author_name: 'Alice',
      title: 'Hack',
      body: 'x',
    })
  );

  await assertSucceeds(
    setDoc(doc(bobDb, 'club_announcements/ann2'), {
      club_id: 'club1',
      author_uid: 'bob',
      author_name: 'Coach Bob',
      title: 'Info',
      body: 'Entraînement décalé',
    })
  );

  await assertFails(
    setDoc(doc(aliceDb, 'team_payment_requests/pay2'), {
      club_id: 'club1',
      member_uid: 'alice',
      amount_eur: 10,
      label: 'Test',
    })
  );

  await assertSucceeds(
    updateDoc(doc(bobDb, 'tournaments/t1/matches/m1'), {
      score_a: 2,
      score_b: 1,
      played: true,
    })
  );

  await assertFails(
    deleteDoc(doc(aliceDb, 'club_announcements/ann1'))
  );

  await assertSucceeds(
    deleteDoc(doc(bobDb, 'club_announcements/ann1'))
  );

  console.log('✓ Tous les scénarios rules-unit-testing ont réussi.');
  await testEnv.cleanup();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
