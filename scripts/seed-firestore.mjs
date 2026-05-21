/**
 * Peuple Firestore avec des profils initiaux (proday-155b0).
 * Nécessite : Firestore en mode test OU clé service account.
 *
 * Mode simple (mode test Firestore) :
 *   npm run seed
 *
 * Avec règles production : placer firebase/service-account.json
 *   GOOGLE_APPLICATION_CREDENTIALS=firebase/service-account.json npm run seed
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

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

const env = loadEnv();
const projectId = env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'proday-155b0';

function findServiceAccount() {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return process.env.GOOGLE_APPLICATION_CREDENTIALS;
  }
  const fixed = resolve(root, 'firebase/service-account.json');
  if (existsSync(fixed)) return fixed;
  const firebaseDir = resolve(root, 'firebase');
  if (existsSync(firebaseDir)) {
    const found = readdirSync(firebaseDir).find(
      (f) => f.includes('adminsdk') && f.endsWith('.json')
    );
    if (found) return resolve(firebaseDir, found);
  }
  return fixed;
}

const serviceAccountPath = findServiceAccount();

if (getApps().length === 0) {
  if (existsSync(serviceAccountPath)) {
    const sa = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
    initializeApp({ credential: cert(sa), projectId });
    console.log('✓ Admin SDK (service account)');
  } else {
    initializeApp({ projectId });
    console.log('✓ Admin SDK (ADC — compte firebase login)');
  }
}

const db = getFirestore();
const now = Timestamp.now();

const users = [
  {
    id: 'seed_player_1',
    display_name: 'Lucas Martin',
    email: 'lucas.demo@proday.app',
    role: 'player',
    is_verified: true,
    verification_status: 'NOT_REQUIRED',
    is_active: true,
    city: 'Marseille',
    department: '13',
    profile: {
      position: 'Attaquant',
      category: 'U19',
      level: 'R1',
      strong_foot: 'right',
      height_cm: 176,
      weight_kg: 70,
      age: 18,
      availability: 'available',
      season_stats: { matches: 28, goals: 8, assists: 6 },
    },
  },
  {
    id: 'seed_coach_1',
    display_name: 'Marc Lefebvre',
    email: 'marc.demo@proday.app',
    role: 'coach',
    is_verified: true,
    verification_status: 'VERIFIED',
    is_active: true,
    city: 'Lyon',
    profile: {
      job_title: 'Préparateur physique',
      years_experience: 8,
      rating: 4.8,
      bio: 'Préparation physique U17 à Seniors.',
      specialties: ['Préparation physique', 'Renforcement'],
    },
  },
  {
    id: 'seed_agent_1',
    display_name: 'Karim Benali',
    email: 'karim.demo@proday.app',
    role: 'agent',
    is_verified: true,
    verification_status: 'VERIFIED',
    is_active: true,
    city: 'Paris',
    profile: {
      job_title: 'Agent sportif',
      license_number: 'FFF-AG-2847',
      years_experience: 12,
      rating: 4.9,
    },
  },
];

const clubs = [
  { id: 'seed_club_1', name: 'US Marseille', city: 'Marseille', verified: true },
  { id: 'seed_club_2', name: 'FC Lyon Sud', city: 'Lyon', verified: true },
];

const posts = [
  {
    id: 'seed_post_1',
    club_id: 'seed_club_1',
    club_name: 'US Marseille',
    title: 'Recherche Attaquant U19',
    position: 'Attaquant',
    category: 'U19',
    level: 'R1',
    city: 'Marseille',
    description: 'Cherche attaquant pour la saison prochaine.',
    status: 'OPEN',
  },
];

const future = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return Timestamp.fromDate(d);
};

const tournaments = [
  {
    id: 'seed_tournament_1',
    name: 'Coupe ProDay U17',
    organizer_id: 'seed_club_1',
    city: 'Marseille',
    location: { latitude: 43.2965, longitude: 5.3698 },
    date_start: future(14),
    date_end: future(16),
    categories: ['U17'],
    status: 'OPEN',
    subscriber_uids: ['seed_club_2'],
  },
  {
    id: 'seed_tournament_2',
    name: 'Tournoi Été Seniors',
    organizer_id: 'seed_club_2',
    city: 'Lyon',
    location: { latitude: 45.764, longitude: 4.8357 },
    date_start: future(-30),
    date_end: future(-28),
    categories: ['Seniors'],
    status: 'FINISHED',
    awards: {
      best_player: 'seed_player_1',
      top_scorer: 'seed_player_1',
      best_goalkeeper: 'seed_player_1',
    },
    awards_names: {
      best_player: 'Lucas Martin',
      top_scorer: 'Lucas Martin',
      best_goalkeeper: '—',
    },
  },
];

const friendlyMatches = [
  {
    id: 'seed_match_1',
    requester_club_id: 'seed_club_1',
    requester_club_name: 'US Marseille',
    opponent_club_name: 'AS Cannes',
    city: 'Cannes',
    date: future(10),
    time_label: '14:00',
    category: 'Seniors',
    level: 'R2',
    level_type: 'competition',
    has_pitch: true,
    status: 'OPEN',
  },
  {
    id: 'seed_match_2',
    requester_club_id: 'seed_club_2',
    requester_club_name: 'FC Lyon Sud',
    opponent_club_name: 'US Villeurbanne',
    city: 'Lyon',
    date: future(12),
    time_label: '10:00',
    category: 'U19',
    level: 'R1',
    level_type: 'loisir',
    has_pitch: true,
    status: 'ACCEPTED',
  },
];

const sponsorOffers = [
  {
    id: 'seed_offer_1',
    company_name: 'SportEquip 13',
    logo_url: '',
    offer_type: 'equipment',
    description: '10 ballons contre logo sur l’app et maillots partenaires.',
    value: 'Pack équipement',
    target_categories: ['U15', 'U17', 'Seniors'],
    city: 'Marseille',
    active: true,
  },
];

const fundingGoals = [
  {
    id: 'seed_goal_1',
    club_id: 'seed_club_1',
    title: 'Survêtements saison 2026',
    target_amount_eur: 500,
    raised_amount_eur: 300,
    description: 'Financement des survêtements pour les U19.',
  },
];

const messageThreads = [
  {
    id: 'seed_thread_1',
    participant_name: 'Marc Lefebvre',
    last_message: 'Bonjour, intéressé par votre profil U19.',
    updated_at: now,
    unread: true,
    participant_ids: ['seed_coach_1', 'seed_player_1'],
  },
];

async function seed() {
  console.log(`Projet: ${projectId}\n`);

  for (const u of users) {
    const { id, ...data } = u;
    await db.collection('users').doc(id).set({
      ...data,
      created_at: now,
      updated_at: now,
    });
    console.log(`  users/${id}`);
  }

  for (const c of clubs) {
    const { id, ...data } = c;
    await db.collection('clubs').doc(id).set({
      ...data,
      is_active: true,
      created_at: now,
    });
    console.log(`  clubs/${id}`);
  }

  for (const p of posts) {
    const { id, ...data } = p;
    await db.collection('recruitment_posts').doc(id).set({
      ...data,
      created_at: now,
    });
    console.log(`  recruitment_posts/${id}`);
  }

  for (const t of tournaments) {
    const { id, ...data } = t;
    await db.collection('tournaments').doc(id).set({
      ...data,
      created_at: now,
    });
    console.log(`  tournaments/${id}`);
  }

  for (const m of friendlyMatches) {
    const { id, ...data } = m;
    await db.collection('friendly_matches').doc(id).set({
      ...data,
      created_at: now,
    });
    console.log(`  friendly_matches/${id}`);
  }

  for (const o of sponsorOffers) {
    const { id, ...data } = o;
    await db.collection('sponsor_offers').doc(id).set({
      ...data,
      created_at: now,
    });
    console.log(`  sponsor_offers/${id}`);
  }

  for (const g of fundingGoals) {
    const { id, ...data } = g;
    await db.collection('club_funding_goals').doc(id).set(data);
    console.log(`  club_funding_goals/${id}`);
  }

  for (const th of messageThreads) {
    const { id, ...data } = th;
    await db.collection('message_threads').doc(id).set(data);
    console.log(`  message_threads/${id}`);
  }

  console.log(
    '\n✔ Seed terminé — Accueil, Recrutement, Matchs, Arena, Sponsors et Messages.'
  );
}

seed().catch((err) => {
  console.error('\n✖ Seed échoué:', err.message);
  console.error(
    '\nSi règles production : télécharge service-account.json (Firebase → Paramètres → Comptes de service)\n' +
      '→ enregistre dans firebase/service-account.json puis relance.\n'
  );
  process.exit(1);
});
