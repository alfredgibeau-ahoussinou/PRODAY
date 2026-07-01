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
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
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
      onboarding_documents_submitted: true,
    });
    await setDoc(doc(db, 'users/bob'), {
      role: 'coach',
      profile: { club_id: 'club1' },
      is_verified: true,
      onboarding_documents_submitted: true,
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
      organizer_uid: 'bob',
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

  await assertFails(
    updateDoc(doc(aliceDb, 'users/alice'), {
      profile: {
        club_id: 'club1',
        season_stats: { matches: 99, goals: 99, assists: 99 },
      },
      updated_at: new Date(),
    })
  );

  await assertSucceeds(
    updateDoc(doc(bobDb, 'users/alice'), {
      profile: {
        club_id: 'club1',
        season_stats: { matches: 12, goals: 5, assists: 3 },
      },
      updated_at: new Date(),
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
      onboarding_documents_submitted: true,
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
      onboarding_documents_submitted: true,
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

  await assertFails(
    updateDoc(doc(carolDb, 'users/carol'), {
      role: 'admin',
    })
  );

  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'users/minor-guard'), {
      role: 'player',
      email: 'minor-g@test.com',
      parental_settings: {
        is_minor: true,
        guardian_email: 'parent@test.com',
        guardian_name: 'Parent',
        supervision_enabled: true,
        contacts_filter_enabled: true,
      },
    });
  });

  const minorGuardDb = testEnv.authenticatedContext('minor-guard').firestore();

  await assertFails(
    updateDoc(doc(minorGuardDb, 'users/minor-guard'), {
      parental_settings: {
        is_minor: true,
        guardian_email: 'hacker@test.com',
        guardian_name: 'Parent',
        supervision_enabled: true,
        contacts_filter_enabled: true,
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

  // --- Messages : lecture par participant du thread (y compris groupe) ---
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'message_threads/team__ev1'), {
      participant_ids: ['alice', 'bob'],
      participant_names: { alice: 'Alice', bob: 'Bob' },
      last_message: '',
      unread_by: [],
    });
    await setDoc(doc(db, 'messages/msg1'), {
      thread_id: 'alice__bob',
      sender_id: 'alice',
      receiver_id: 'bob',
      body: 'Salut Bob',
      created_at: new Date(),
    });
    await setDoc(doc(db, 'messages/msg2'), {
      thread_id: 'alice__bob',
      sender_id: 'bob',
      receiver_id: 'alice',
      body: 'Salut Alice',
      created_at: new Date(),
    });
    await setDoc(doc(db, 'messages/group1'), {
      thread_id: 'team__ev1',
      sender_id: 'alice',
      receiver_id: 'group',
      body: 'Go team',
      created_at: new Date(),
    });
  });

  await assertSucceeds(
    getDocs(
      query(
        collection(aliceDb, 'messages'),
        where('thread_id', '==', 'alice__bob'),
        orderBy('created_at', 'asc')
      )
    )
  );

  await assertSucceeds(getDoc(doc(bobDb, 'messages/msg1')));

  await assertSucceeds(getDoc(doc(bobDb, 'messages/group1')));

  await assertFails(
    getDocs(
      query(
        collection(carolDb, 'messages'),
        where('thread_id', '==', 'alice__bob'),
        orderBy('created_at', 'asc')
      )
    )
  );

  await assertFails(getDoc(doc(carolDb, 'messages/group1')));

  await assertSucceeds(
    addDoc(collection(aliceDb, 'messages'), {
      thread_id: 'alice__bob',
      sender_id: 'alice',
      receiver_id: 'bob',
      body: 'Nouveau message',
      created_at: new Date(),
    })
  );

  await assertFails(
    addDoc(collection(daveDb, 'messages'), {
      thread_id: 'alice__bob',
      sender_id: 'dave',
      receiver_id: 'bob',
      body: 'Intrusion',
      created_at: new Date(),
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

  // --- Inbox tuteur guardian_notifications ---
  await assertSucceeds(
    addDoc(collection(bobDb, 'guardian_notifications'), {
      guardian_email: 'parent@test.com',
      child_uid: 'minor-linked',
      event_id: 'ev-guardian-1',
      event_title: 'Entraînement mercredi',
      event_city: 'Lyon',
      type: 'minor_invite',
      source: 'team_events',
      read_at: null,
      created_at: new Date(),
    })
  );

  await assertSucceeds(
    getDocs(
      query(
        collection(parentDb, 'guardian_notifications'),
        where('guardian_email', '==', 'parent@test.com')
      )
    )
  );

  await assertFails(
    getDocs(
      query(
        collection(aliceDb, 'guardian_notifications'),
        where('guardian_email', '==', 'parent@test.com')
      )
    )
  );

  const parentGuardSnap = await getDocs(
    query(
      collection(parentDb, 'guardian_notifications'),
      where('guardian_email', '==', 'parent@test.com')
    )
  );
  const parentGuardDoc = parentGuardSnap.docs[0];
  await assertSucceeds(
    updateDoc(doc(parentDb, 'guardian_notifications', parentGuardDoc.id), {
      read_at: new Date(),
    })
  );

  // --- Sponsors : métriques offres & vues profil ---
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'users/sponsor-co'), {
      role: 'sponsor',
      profile: { company_name: 'Sponsor Co' },
      is_verified: true,
    });
    await setDoc(doc(db, 'sponsor_offers/offer1'), {
      sponsor_uid: 'sponsor-co',
      company_name: 'Sponsor Co',
      description: 'Équipement',
      value: '500 €',
      city: 'Lyon',
      active: true,
      views_count: 0,
      clicks_count: 0,
      leads_count: 0,
    });
  });

  const sponsorDb = testEnv.authenticatedContext('sponsor-co').firestore();

  await assertSucceeds(
    updateDoc(doc(aliceDb, 'sponsor_offers/offer1'), { views_count: 1 })
  );

  await assertSucceeds(
    updateDoc(doc(aliceDb, 'sponsor_offers/offer1'), { leads_count: 1 })
  );

  await assertFails(
    updateDoc(doc(aliceDb, 'sponsor_offers/offer1'), { description: 'Hack' })
  );

  await assertSucceeds(
    updateDoc(doc(sponsorDb, 'sponsor_offers/offer1'), { active: false })
  );

  await assertFails(
    deleteDoc(doc(aliceDb, 'sponsor_offers/offer1'))
  );

  const guestDb = testEnv.unauthenticatedContext().firestore();

  await assertFails(
    updateDoc(doc(guestDb, 'sponsor_offers/offer1'), { views_count: 1 })
  );

  await assertFails(
    addDoc(collection(guestDb, 'sponsor_profile_views'), {
      sponsor_uid: 'sponsor-co',
      viewer_anonymous_id: 'anon-guest',
      created_at: new Date(),
    })
  );

  await assertSucceeds(
    addDoc(collection(aliceDb, 'sponsor_profile_views'), {
      sponsor_uid: 'sponsor-co',
      viewer_uid: 'alice',
      created_at: new Date(),
    })
  );

  await assertFails(
    addDoc(collection(aliceDb, 'sponsor_profile_views'), {
      sponsor_uid: 'sponsor-co',
      viewer_uid: 'bob',
      created_at: new Date(),
    })
  );

  await assertSucceeds(
    getDocs(
      query(
        collection(sponsorDb, 'sponsor_profile_views'),
        where('sponsor_uid', '==', 'sponsor-co')
      )
    )
  );

  await assertFails(
    getDocs(
      query(
        collection(aliceDb, 'sponsor_profile_views'),
        where('sponsor_uid', '==', 'sponsor-co')
      )
    )
  );

  // --- Demandes upgrade Territorial ---
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'sponsor_upgrade_requests/req-pending'), {
      sponsor_uid: 'sponsor-co',
      tier: 'territorial',
      company: 'Sponsor Co',
      city: 'Lyon',
      status: 'pending',
      created_at: new Date(),
    });
  });

  const adminDb = testEnv.authenticatedContext('admin-1', { admin: true }).firestore();

  await assertSucceeds(
    updateDoc(doc(adminDb, 'sponsor_upgrade_requests/req-pending'), {
      status: 'contacted',
      contacted_at: new Date(),
      updated_at: new Date(),
    })
  );

  await assertSucceeds(
    updateDoc(doc(adminDb, 'sponsor_upgrade_requests/req-pending'), {
      status: 'approved',
      approved_at: new Date(),
      updated_at: new Date(),
    })
  );

  await assertFails(
    updateDoc(doc(sponsorDb, 'sponsor_upgrade_requests/req-pending'), {
      status: 'approved',
    })
  );

  await assertFails(
    addDoc(collection(sponsorDb, 'sponsor_upgrade_requests'), {
      sponsor_uid: 'sponsor-co',
      tier: 'territorial',
      company: 'Autre',
      city: 'Paris',
      status: 'approved',
      created_at: new Date(),
    })
  );

  // --- Inscription supporter ---
  const fanDb = testEnv.authenticatedContext('fan1').firestore();

  await assertSucceeds(
    setDoc(doc(fanDb, 'users/fan1'), {
      role: 'supporter',
      verification_status: 'NOT_REQUIRED',
      display_name: 'Fan Test',
      email: 'fan@test.com',
      profile: { job_title: 'Supporter' },
      product_line: 'supporter',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    })
  );

  await assertFails(
    setDoc(doc(testEnv.authenticatedContext('fan2').firestore(), 'users/fan2'), {
      role: 'invalid_role',
      verification_status: 'NOT_REQUIRED',
    })
  );

  // --- Journal activité joueur ---
  await assertSucceeds(
    setDoc(doc(carolDb, 'player_activities/act1'), {
      player_uid: 'carol',
      type: 'training',
      date: new Date(),
      duration_min: 60,
      source: 'manual',
      created_at: new Date(),
    })
  );

  await assertSucceeds(
    getDoc(doc(erinDb, 'player_activities/act1'))
  );

  await assertSucceeds(
    updateDoc(doc(carolDb, 'player_activities/act1'), {
      duration_min: 75,
      notes: 'Mise à jour sync',
    })
  );

  await assertFails(
    getDoc(doc(aliceDb, 'player_activities/act1'))
  );

  await assertFails(
    setDoc(doc(erinDb, 'player_activities/act-hack'), {
      player_uid: 'carol',
      type: 'training',
      date: new Date(),
      duration_min: 60,
      source: 'manual',
      created_at: new Date(),
    })
  );

  await assertFails(
    updateDoc(doc(carolDb, 'player_activities/act1'), {
      analysis_status: 'analyzed',
      analysis_summary_fr: 'Hack client',
    })
  );

  await assertFails(
    setDoc(doc(carolDb, 'player_activities/act-fake'), {
      player_uid: 'carol',
      type: 'match',
      date: new Date(),
      duration_min: 60,
      source: 'manual',
      created_at: new Date(),
      analysis_status: 'analyzed',
      analysis_summary_fr: 'Faux score IA',
    })
  );

  await assertSucceeds(
    setDoc(doc(carolDb, 'users/carol/health_program_progress/mental'), {
      completed_days: [1, 2],
      updated_at: new Date(),
    })
  );

  await assertFails(
    getDoc(doc(erinDb, 'users/carol/health_program_progress/mental'))
  );

  // --- Memberships : joueur crée demande pending ---
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'users/player1'), {
      role: 'player',
      profile: {},
      is_verified: true,
    });
    await setDoc(doc(db, 'users/coach1'), {
      role: 'coach',
      profile: { club_id: 'club-mem' },
      is_verified: true,
    });
    await setDoc(doc(db, 'clubs/club-mem'), {
      name: 'Club Mem',
      owner_uid: 'coach1',
      verified: false,
    });
  });

  const playerDb = testEnv.authenticatedContext('player1').firestore();
  const coachDb = testEnv.authenticatedContext('coach1').firestore();

  await assertFails(
    setDoc(doc(testEnv.authenticatedContext('player-stats').firestore(), 'users/player-stats'), {
      role: 'player',
      verification_status: 'PENDING',
      email: 'stats@test.com',
      profile: { season_stats: { matches: 99, goals: 99, assists: 99 } },
      created_at: new Date(),
      updated_at: new Date(),
    })
  );

  await assertSucceeds(
    setDoc(doc(playerDb, 'memberships/mem1'), {
      club_id: 'club-mem',
      team_id: 'unassigned',
      player_uid: 'player1',
      player_name: 'Joueur Test',
      status: 'pending',
      requested_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    })
  );

  await assertSucceeds(getDoc(doc(coachDb, 'memberships/mem1')));

  await assertSucceeds(
    updateDoc(doc(coachDb, 'memberships/mem1'), {
      status: 'active',
      validated_by_uid: 'coach1',
      validated_at: new Date(),
      updated_at: new Date(),
    })
  );

  console.log('✓ Tous les scénarios rules-unit-testing ont réussi.');
  await testEnv.cleanup();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
