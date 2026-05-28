/**
 * Alimente Firestore avec des données ProDay (si collections vides).
 * N'écrase pas les documents existants sauf avec --force.
 *
 *   npm run firebase:seed
 *   npm run firebase:seed -- --force
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const force = process.argv.includes('--force');

function loadEnv() {
  const path = resolve(root, '.env');
  if (!existsSync(path)) return {};
  const env = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim();
  }
  return env;
}

function findServiceAccount() {
  const fixed = resolve(root, 'firebase/service-account.json');
  if (existsSync(fixed)) return fixed;
  const firebaseDir = resolve(root, 'firebase');
  const found = readdirSync(firebaseDir).find(
    (f) => f.includes('adminsdk') && f.endsWith('.json')
  );
  if (found) return resolve(firebaseDir, found);
  return fixed;
}

const env = loadEnv();
const projectId = env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'proday-155b0';

if (getApps().length === 0) {
  const saPath = findServiceAccount();
  if (!existsSync(saPath)) {
    console.error('Service account requis : firebase/*adminsdk*.json');
    process.exit(1);
  }
  initializeApp({
    credential: cert(JSON.parse(readFileSync(saPath, 'utf8'))),
    projectId,
  });
}

const db = getFirestore();

async function collectionEmpty(name) {
  const snap = await db.collection(name).limit(1).get();
  return snap.empty;
}

async function upsert(collection, id, data) {
  const ref = db.collection(collection).doc(id);
  if (!force) {
    const existing = await ref.get();
    if (existing.exists) {
      console.log(`  skip ${collection}/${id} (existe)`);
      return;
    }
  }
  await ref.set(data, { merge: true });
  console.log(`  ✓ ${collection}/${id}`);
}

const now = new Date();
const inDays = (n) => {
  const d = new Date(now);
  d.setDate(d.getDate() + n);
  return d;
};

async function main() {
  console.log(`\n🌱 Seed Firestore — ${projectId}${force ? ' (--force)' : ''}\n`);

  const postsEmpty = await collectionEmpty('recruitment_posts');
  const tournamentsEmpty = await collectionEmpty('tournaments');
  const sponsorsEmpty = await collectionEmpty('sponsor_offers');
  const teamEventsEmpty = await collectionEmpty('team_events');

  if (!postsEmpty && !tournamentsEmpty && !sponsorsEmpty && !teamEventsEmpty && !force) {
    console.log('Collections déjà peuplées. Utilisez --force pour réécrire les docs seed.');
    return;
  }

  // Trouver un coach ou admin comme auteur
  const usersSnap = await db
    .collection('users')
    .where('role', 'in', ['coach', 'organizer', 'agent'])
    .limit(1)
    .get();
  const authorUid = usersSnap.docs[0]?.id ?? 'proday_seed_author';
  const authorName = usersSnap.docs[0]?.data()?.display_name ?? 'ProDay Club';
  const authorRef = usersSnap.docs[0]?.ref;

  if (authorRef) {
    const authorData = usersSnap.docs[0].data();
    if (!authorData.profile?.club_id) {
      await authorRef.set(
        {
          profile: {
            ...(authorData.profile ?? {}),
            club_id: 'proday_club_villeurbanne',
          },
          updated_at: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      console.log(`  ✓ users/${authorUid} — club_id assigné (coach)`);
    }
  }

  await upsert('clubs', 'proday_club_villeurbanne', {
    name: 'FC Villeurbanne ProDay',
    city: 'Villeurbanne',
    department: '69',
    level: 'R2',
    created_at: FieldValue.serverTimestamp(),
  });

  await upsert('clubs', 'proday_club_st_priest', {
    name: 'AS Saint-Priest',
    city: 'Saint-Priest',
    department: '69',
    level: 'Départemental',
    created_at: FieldValue.serverTimestamp(),
  });

  await upsert('recruitment_posts', 'proday_post_milieu_u19', {
    author_uid: authorUid,
    club_id: 'proday_club_villeurbanne',
    club_name: 'FC Villeurbanne ProDay',
    title: 'Recherche milieu U19',
    position: 'Milieu',
    category: 'U19',
    level: 'R2',
    city: 'Villeurbanne',
    location: { latitude: 45.764, longitude: 4.8357 },
    description:
      'Club ambitieux en R2. Recherche milieu relayeur, bonne vision de jeu. Essais sur place.',
    status: 'OPEN',
    created_at: FieldValue.serverTimestamp(),
  });

  await upsert('recruitment_posts', 'proday_post_gardien', {
    author_uid: authorUid,
    club_id: 'proday_club_st_priest',
    club_name: 'AS Saint-Priest',
    title: 'Gardien Seniors',
    position: 'Gardien',
    category: 'Seniors',
    level: 'Départemental',
    city: 'Saint-Priest',
    location: { latitude: 45.696, longitude: 4.944 },
    description: 'Gardien n°1 recherché pour la saison prochaine. Bonnes sorties aériennes.',
    status: 'OPEN',
    created_at: FieldValue.serverTimestamp(),
  });

  await upsert('recruitment_posts', 'proday_post_staff', {
    author_uid: authorUid,
    club_id: 'proday_club_villeurbanne',
    club_name: 'FC Villeurbanne ProDay',
    title: 'Préparateur physique',
    position: 'Staff',
    category: 'Seniors',
    level: 'R2',
    city: 'Lyon',
    description: 'Staff diplômé recherché pour renforcer l’encadrement.',
    status: 'OPEN',
    created_at: FieldValue.serverTimestamp(),
  });

  await upsert('tournaments', 'proday_tournoi_ete', {
    name: 'Coupe ProDay Été 2026',
    organizer_id: authorUid,
    city: 'Lyon',
    location: { latitude: 45.75, longitude: 4.85 },
    date_start: Timestamp.fromDate(inDays(21)),
    date_end: Timestamp.fromDate(inDays(22)),
    categories: ['U17', 'Seniors'],
    status: 'OPEN',
    subscriber_uids: [],
    created_at: FieldValue.serverTimestamp(),
  });

  await upsert('tournaments', 'proday_tournoi_quartiers', {
    name: 'Tournoi des Quartiers',
    organizer_id: authorUid,
    city: 'Villeurbanne',
    location: { latitude: 45.77, longitude: 4.88 },
    date_start: Timestamp.fromDate(inDays(35)),
    date_end: Timestamp.fromDate(inDays(35)),
    categories: ['U15', 'U17'],
    status: 'OPEN',
    subscriber_uids: [],
    created_at: FieldValue.serverTimestamp(),
  });

  await upsert('friendly_matches', 'proday_match_amical_1', {
    requester_uid: authorUid,
    requester_club_id: 'proday_club_villeurbanne',
    requester_club_name: 'FC Villeurbanne ProDay',
    opponent_club_name: 'AS Saint-Priest',
    city: 'Villeurbanne',
    date: Timestamp.fromDate(inDays(7)),
    time_label: '15:00',
    category: 'Seniors',
    level: 'R2',
    level_type: 'competition',
    has_pitch: true,
    message: 'Match amical avant la reprise — terrain réservé.',
    status: 'OPEN',
    created_at: FieldValue.serverTimestamp(),
  });

  await upsert('club_announcements', 'proday_annonce_reunion', {
    club_id: 'proday_club_villeurbanne',
    author_uid: authorUid,
    author_name: authorName,
    title: 'Réunion parents & staff',
    body: 'Mercredi 19h au club-house. Ordre du jour : calendrier été et cotisations.',
    created_at: FieldValue.serverTimestamp(),
  });

  await upsert('club_announcements', 'proday_annonce_tournoi', {
    club_id: 'proday_club_villeurbanne',
    author_uid: authorUid,
    author_name: authorName,
    title: 'Inscription Coupe ProDay',
    body: 'Les U17 et Seniors sont inscrits à la Coupe ProDay Été. Merci de confirmer votre disponibilité.',
    created_at: FieldValue.serverTimestamp(),
  });

  const tournoiMatchRef = db.doc('tournaments/proday_tournoi_ete/matches/proday_match_poule_1');
  if (force || !(await tournoiMatchRef.get()).exists) {
    await tournoiMatchRef.set({
      team_a_name: 'FC Villeurbanne ProDay',
      team_b_name: 'AS Saint-Priest',
      score_a: 2,
      score_b: 1,
      phase: 'poule',
      scheduled_at: Timestamp.fromDate(inDays(21)),
      played: true,
      created_at: FieldValue.serverTimestamp(),
    });
    console.log('  ✓ tournaments/proday_tournoi_ete/matches/proday_match_poule_1');
  } else {
    console.log('  skip tournaments/.../proday_match_poule_1 (existe)');
  }

  await upsert('team_events', 'proday_detection_juin', {
    title: 'Journée détection ProDay',
    event_type: 'detection',
    organizer_uid: authorUid,
    organizer_name: authorName,
    club_id: 'proday_club_villeurbanne',
    club_name: 'FC Villeurbanne ProDay',
    starts_at: Timestamp.fromDate(inDays(14)),
    city: 'Lyon',
    location_label: 'Stade municipal',
    categories: ['U17', 'U19'],
    max_participants: 24,
    invitee_uids: [],
    rsvps: {},
    rsvp_notes: {},
    attendance_marks: {},
    created_at: FieldValue.serverTimestamp(),
    updated_at: FieldValue.serverTimestamp(),
  });

  const playersSnap = await db
    .collection('users')
    .where('role', '==', 'player')
    .limit(4)
    .get();
  const playerDocs = playersSnap.docs;
  const inviteeUids = playerDocs.map((d) => d.id);
  const inviteeNames = playerDocs.map((d) => String(d.data().display_name ?? 'Joueur'));

  if (inviteeUids.length >= 2) {
    const rsvps = {};
    const rsvpNotes = {};
    const attendance = {};
    const playerStats = {};
    inviteeUids.forEach((uid, i) => {
      rsvps[uid] = i === 0 ? 'pending' : i === 1 ? 'yes' : 'yes';
      if (i === 2) rsvpNotes[uid] = 'Cours le matin — arrivera en retard';
      if (i >= 1) attendance[uid] = i === 2 ? 'late' : 'present';
      playerStats[uid] = {
        uid,
        player_name: inviteeNames[i],
        minutes_played: 60 + i * 10,
        rating: 6.5 + i * 0.5,
        goals: i === 0 ? 2 : i === 1 ? 1 : 0,
        assists: i === 1 ? 1 : 0,
        yellow_cards: i === 2 ? 1 : 0,
        red_cards: 0,
      };
    });

    await upsert('team_events', 'proday_match_amical_equipe', {
      title: 'Match amical vs AS Saint-Priest',
      event_type: 'friendly',
      organizer_uid: authorUid,
      organizer_name: authorName,
      club_id: 'proday_club_villeurbanne',
      club_name: 'FC Villeurbanne ProDay',
      friendly_match_id: 'proday_match_amical_1',
      starts_at: Timestamp.fromDate(inDays(5)),
      city: 'Villeurbanne',
      location_label: 'Stade municipal',
      invitee_uids: inviteeUids,
      rsvps,
      rsvp_notes: rsvpNotes,
      attendance_marks: attendance,
      player_match_stats: playerStats,
      live_actions: [
        {
          id: 'live_1',
          type: 'goal',
          player_uid: inviteeUids[0],
          player_name: inviteeNames[0],
          minute: 23,
          created_at: Timestamp.fromDate(inDays(-1)),
        },
        {
          id: 'live_2',
          type: 'assist',
          player_uid: inviteeUids[1],
          player_name: inviteeNames[1],
          minute: 23,
          created_at: Timestamp.fromDate(inDays(-1)),
        },
      ],
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    });

    await upsert('team_events', 'proday_entrainement_equipe', {
      title: 'Entraînement collectif U17',
      event_type: 'training',
      organizer_uid: authorUid,
      organizer_name: authorName,
      club_id: 'proday_club_villeurbanne',
      club_name: 'FC Villeurbanne ProDay',
      starts_at: Timestamp.fromDate(inDays(2)),
      city: 'Villeurbanne',
      location_label: 'Terrain synthétique',
      invitee_uids: inviteeUids.slice(0, 3),
      rsvps: Object.fromEntries(
        inviteeUids.slice(0, 3).map((uid, i) => [uid, i === 0 ? 'yes' : 'pending'])
      ),
      rsvp_notes: {},
      attendance_marks: {},
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    });

    for (const [i, uid] of inviteeUids.slice(0, 3).entries()) {
      const statuses = ['pending', 'paid', 'late'];
      const dueOffset = [7, -3, -1][i];
      await upsert('team_payment_requests', `proday_payment_${uid.slice(0, 8)}`, {
        club_id: 'proday_club_villeurbanne',
        label: i === 0 ? 'Cotisation mensuelle' : 'Licence fédérale',
        amount_eur: i === 0 ? 25 : 45,
        due_at: Timestamp.fromDate(inDays(dueOffset)),
        member_uid: uid,
        member_name: inviteeNames[i],
        status: statuses[i],
        paid_at: statuses[i] === 'paid' ? Timestamp.fromDate(inDays(-2)) : null,
        created_by_uid: authorUid,
        created_at: FieldValue.serverTimestamp(),
        updated_at: FieldValue.serverTimestamp(),
      });
    }

    for (const doc of playerDocs.slice(0, 1)) {
      const data = doc.data();
      if (!data.profile?.club_id) {
        await doc.ref.set(
          {
            profile: {
              ...(data.profile ?? {}),
              club_id: 'proday_club_villeurbanne',
            },
            updated_at: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
        console.log(`  ✓ users/${doc.id} — club_id assigné`);
      }
    }
  }

  await upsert('sponsor_offers', 'proday_sponsor_local', {
    company_name: 'Sport & Co Lyon',
    description: 'Équipement -20 % pour les clubs partenaires ProDay.',
    value: 'Réduction membres',
    city: 'Lyon',
    active: true,
    created_at: FieldValue.serverTimestamp(),
  });

  await upsert('club_funding_goals', 'proday_funding_maillots', {
    title: 'Nouveaux maillots U17',
    target_amount_eur: 2500,
    raised_amount_eur: 780,
    club_id: 'proday_club_villeurbanne',
    created_at: FieldValue.serverTimestamp(),
  });

  console.log('\n✅ Seed terminé. Lancez npm run stats:refresh puis npx expo start --clear\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
