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

  // --- Mercato : joueur ne peut pas publier ---
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'users/carol'), {
      role: 'player',
      profile: { club_id: 'club1' },
      is_verified: true,
    });
    await setDoc(doc(db, 'users/dave'), {
      role: 'coach',
      profile: { club_id: 'club1' },
      is_verified: false,
    });
    await setDoc(doc(db, 'users/erin'), {
      role: 'coach',
      profile: { club_id: 'club1' },
      is_verified: true,
    });
    await setDoc(doc(db, 'users/minor1'), {
      role: 'player',
      profile: { club_id: 'club1' },
      is_verified: true,
      parental_settings: {
        is_minor: true,
        supervision_enabled: true,
        contacts_filter_enabled: true,
      },
    });
    await setDoc(doc(db, 'recruitment_posts/post1'), {
      author_uid: 'erin',
      club_id: 'club1',
      status: 'OPEN',
      title: 'Annonce',
    });
  });

  const carolDb = testEnv.authenticatedContext('carol').firestore();
  const daveDb = testEnv.authenticatedContext('dave').firestore();
  const erinDb = testEnv.authenticatedContext('erin').firestore();
  const minorDb = testEnv.authenticatedContext('minor1').firestore();

  await assertFails(
    setDoc(doc(carolDb, 'recruitment_posts/post2'), {
      author_uid: 'carol',
      club_id: 'club1',
      status: 'OPEN',
      title: 'Hack',
    })
  );

  await assertFails(
    setDoc(doc(daveDb, 'recruitment_posts/post3'), {
      author_uid: 'dave',
      club_id: 'club1',
      status: 'OPEN',
      title: 'Non vérifié',
    })
  );

  await assertSucceeds(
    setDoc(doc(erinDb, 'recruitment_posts/post4'), {
      author_uid: 'erin',
      club_id: 'club1',
      status: 'OPEN',
      title: 'Recherche ailier',
    })
  );

  await assertFails(
    updateDoc(doc(carolDb, 'recruitment_posts/post1'), { title: 'Piraté' })
  );

  // --- Mineur : protections parentales non désactivables ---
  await assertFails(
    updateDoc(doc(minorDb, 'users/minor1'), {
      parental_settings: {
        is_minor: false,
        supervision_enabled: false,
        contacts_filter_enabled: false,
      },
    })
  );

  await assertSucceeds(
    updateDoc(doc(minorDb, 'users/minor1'), {
      parental_settings: {
        is_minor: true,
        supervision_enabled: true,
        contacts_filter_enabled: true,
        daily_limit_minutes: 60,
      },
    })
  );

  // --- Clubs : joueur refusé, coach autorisé ---
  await assertFails(
    setDoc(doc(carolDb, 'clubs/club-hack'), {
      name: 'Hack FC',
      city: 'Paris',
      owner_uid: 'carol',
      verified: false,
      categories: ['Seniors'],
    })
  );

  await assertSucceeds(
    setDoc(doc(erinDb, 'clubs/club-ok'), {
      name: 'FC Erin',
      city: 'Lyon',
      owner_uid: 'erin',
      verified: false,
      categories: ['Seniors'],
    })
  );

  // --- Messagerie : thread réservé aux participants ---
  await assertSucceeds(
    setDoc(doc(bobDb, 'message_threads/alice__bob'), {
      participant_ids: ['alice', 'bob'],
      participant_names: { alice: 'Alice', bob: 'Bob' },
      last_message: '',
      unread_by: [],
    })
  );

  await assertFails(getDoc(doc(carolDb, 'message_threads/alice__bob')));

  await assertFails(
    setDoc(doc(daveDb, 'message_threads/dave__bob'), {
      participant_ids: ['dave', 'bob'],
      participant_names: { dave: 'Dave', bob: 'Bob' },
      last_message: '',
      unread_by: [],
    })
  );

  // --- Stage : message trop court refusé ---
  await assertFails(
    setDoc(doc(carolDb, 'stage_applications/app1'), {
      stage_id: 'stage1',
      stage_author_uid: 'erin',
      player_uid: 'carol',
      player_name: 'Carol',
      message: 'court',
      status: 'PENDING',
    })
  );

  await assertSucceeds(
    setDoc(doc(carolDb, 'stage_applications/app2'), {
      stage_id: 'stage1',
      stage_author_uid: 'erin',
      player_uid: 'carol',
      player_name: 'Carol',
      message: 'Bonjour, je souhaite m’inscrire à ce stage.',
      status: 'PENDING',
    })
  );

  // --- Tuteur : mise à jour temps d'écran à distance ---
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'users/minor-linked'), {
      role: 'player',
      display_name: 'Enfant',
      email: 'enfant@test.com',
      profile: {},
      is_verified: false,
      parental_settings: {
        is_minor: true,
        guardian_email: 'parent@test.com',
        guardian_name: 'Parent',
        supervision_enabled: true,
        contacts_filter_enabled: true,
        screen_time_enabled: true,
        daily_limit_minutes: 90,
        active_days: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'],
      },
    });
    await setDoc(doc(db, 'users/parent-user'), {
      role: 'player',
      email: 'parent@test.com',
      profile: {},
      is_verified: true,
    });
  });

  const parentDb = testEnv
    .authenticatedContext('parent-user', { email: 'parent@test.com' })
    .firestore();

  await assertSucceeds(
    updateDoc(doc(parentDb, 'users/minor-linked'), {
      parental_settings: {
        is_minor: true,
        guardian_email: 'parent@test.com',
        guardian_name: 'Parent',
        supervision_enabled: true,
        contacts_filter_enabled: true,
        screen_time_enabled: true,
        daily_limit_minutes: 45,
        active_days: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'],
      },
    })
  );

  await assertFails(
    updateDoc(doc(carolDb, 'users/minor-linked'), {
      parental_settings: {
        is_minor: true,
        guardian_email: 'parent@test.com',
        guardian_name: 'Parent',
        supervision_enabled: true,
        contacts_filter_enabled: true,
        screen_time_enabled: false,
        daily_limit_minutes: 45,
        active_days: ['Lun'],
      },
    })
  );

  console.log('✓ Tous les scénarios rules-unit-testing ont réussi.');
  await testEnv.cleanup();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
