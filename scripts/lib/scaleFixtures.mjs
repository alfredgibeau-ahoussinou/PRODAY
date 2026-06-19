/** Génération de données synthétiques pour tests de charge. */

const ROLES = ['player', 'coach', 'physio', 'agent', 'club', 'organizer'];
const CITIES = ['Paris', 'Lyon', 'Marseille', 'Bordeaux', 'Lille', 'Nantes', 'Toulouse', 'Nice'];
const POSITIONS = ['Milieu', 'Attaquant', 'Défenseur', 'Gardien', 'Ailier'];
const LEVELS = ['U15', 'U17', 'U19', 'Seniors', 'Régional'];

export function makeFirestoreUserDoc(i, now = Date.now()) {
  const role = ROLES[i % ROLES.length];
  const city = CITIES[i % CITIES.length];
  const clubId = `club-${i % 200}`;
  return {
    role,
    display_name: `Joueur ${i}`,
    email: `user${i}@scale.test`,
    phone: `060000${String(i).padStart(4, '0').slice(-4)}`,
    city,
    is_active: true,
    is_verified: i % 3 === 0,
    verification_status: 'NOT_REQUIRED',
    onboarding_documents_submitted: true,
    created_at: new Date(now - i * 60_000),
    updated_at: new Date(now - i * 30_000),
    profile: {
      club_id: clubId,
      position: POSITIONS[i % POSITIONS.length],
      level: LEVELS[i % LEVELS.length],
      rating: (i % 50) / 10,
    },
    parental_settings:
      i % 17 === 0
        ? { is_minor: true, supervision_enabled: true, contacts_filter_enabled: true }
        : undefined,
    location: { latitude: 48.8 + (i % 100) * 0.01, longitude: 2.3 + (i % 100) * 0.01 },
  };
}

export function makeAppUser(i, now = Date.now()) {
  const doc = makeFirestoreUserDoc(i, now);
  return {
    uid: `u${i}`,
    ...doc,
    documents: [],
    created_at: doc.created_at,
    updated_at: doc.updated_at,
  };
}

export function makeFeedPosts(count = 60, now = Date.now()) {
  return Array.from({ length: count }, (_, i) => ({
    id: `post-${i}`,
    type: i % 4 === 0 ? 'poll' : 'news',
    title: `Actualité ${i} Paris`,
    body: `Contenu fil communauté ${i}`,
    author_name: `Auteur ${i}`,
    author_uid: `author-${i}`,
    audience: 'all',
    created_at: new Date(now - i * 3_600_000),
    poll_votes: i % 4 === 0 ? { a: ['u1', 'u2'], b: ['u3'] } : undefined,
  }));
}

export function matchesSearch(user, q) {
  if (!q) return true;
  const lower = q.toLowerCase();
  const p = user.profile ?? {};
  return (
    user.display_name.toLowerCase().includes(lower) ||
    (p.position?.toLowerCase().includes(lower) ?? false) ||
    (p.job_title?.toLowerCase().includes(lower) ?? false) ||
    (p.medical_specialty?.toLowerCase().includes(lower) ?? false) ||
    (user.city?.toLowerCase().includes(lower) ?? false) ||
    (p.level?.toLowerCase().includes(lower) ?? false)
  );
}

export function simulateListByRole(users, role, search = '', listLimit = 50) {
  return users
    .filter((u) => u.role === role && u.is_active !== false)
    .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
    .slice(0, listLimit)
    .map((u) => {
      const next = { ...u };
      delete next.email;
      delete next.phone;
      delete next.parental_settings;
      return next;
    })
    .filter((u) => matchesSearch(u, search));
}

export function simulateListMembersByClubId(users, clubId, listLimit = 50) {
  const roles = ['player', 'coach', 'agent'];
  const merged = [];
  for (const role of roles) {
    merged.push(...simulateListByRole(users, role, '', listLimit));
  }
  return merged.filter((u) => u.profile?.club_id === clubId);
}

export function formatMs(ms) {
  return `${ms.toFixed(1)} ms`;
}

export function verdict(ms, budgetMs) {
  return ms <= budgetMs ? 'OK' : 'LENT';
}
