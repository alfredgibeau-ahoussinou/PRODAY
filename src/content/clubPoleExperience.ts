/**
 * Contenu Pôle Club — aligné sur le site `/pro-club`.
 * Modules, cockpit terrain, signaux président, invitations.
 */

export type ClubPoleModuleId =
  | 'structure'
  | 'bourse-club'
  | 'pipeline-club'
  | 'convocations-club'
  | 'covoiturage-club'
  | 'tournois-club'
  | 'communication-club'
  | 'vitrine-club';

export type ClubPitchZoneId =
  | 'equipes'
  | 'sport'
  | 'bourse'
  | 'covoit'
  | 'hub'
  | 'comms';

export type ClubHubSectionId =
  | 'overview'
  | 'modules'
  | 'bourse'
  | 'invites'
  | 'pitch'
  | 'offers'
  | 'video'
  | 'events'
  | 'mercato'
  | 'equipment'
  | 'sponsors'
  | 'structure';

export const CLUB_PRESIDENT_SIGNALS = [
  {
    tone: 'ok' as const,
    label: 'Ce qui va bien',
    body: 'Équipes actives, convocations confirmées, calendrier rempli.',
  },
  {
    tone: 'warn' as const,
    label: 'À surveiller',
    body: 'Comptes rendus manquants, besoins recrutement, validations en attente.',
  },
  {
    tone: 'act' as const,
    label: 'Décisions',
    body: 'Adhésions, budget sponsors, validation tournoi ou équipement.',
  },
] as const;

export const CLUB_HUB_BLOCKS = [
  {
    title: 'Club Hub',
    body: 'Matchs, équipes, coachs, tournois, bourse, équipements et sponsors : découverts par sections, pas quinze boutons.',
  },
  {
    title: 'Invitations de match',
    body: 'Proposez un adversaire (nom, ville, distance, catégorie), acceptez ou contre-proposez. Match confirmé → calendriers + convocations.',
  },
  {
    title: 'Bourse de recrutement',
    body: 'Avant de chercher dehors : besoins d’équipe, matching sur le vivier (équipe B, réserve, catégorie voisine), propositions de montée, puis publication entre clubs ProDay.',
  },
  {
    title: 'Mercato club',
    body: 'Suivi Observé → Contacté → Essai → Intégré. Après la bourse interne. Pas un pôle recruteur séparé.',
  },
  {
    title: 'Tournois',
    body: 'Générateur de poules, Live Hub, classements auto, QR public. Organisateur = rôle intégré au Club.',
  },
  {
    title: 'Écosystème local',
    body: 'Marketplace équipements entre membres, micro-sponsoring commerces, cagnottes avec règles du club.',
  },
] as const;

export const CLUB_POLE_MODULES: {
  id: ClubPoleModuleId;
  title: string;
  subtitle: string;
  description: string;
  section: ClubHubSectionId;
}[] = [
  {
    id: 'structure',
    title: 'Arbre des équipes',
    subtitle: 'U13 → Seniors',
    description:
      'Toutes les catégories, coachs affectés et staff club. Lisible pour le bureau et le DS.',
    section: 'structure',
  },
  {
    id: 'bourse-club',
    title: 'Bourse de recrutement',
    subtitle: 'Vivier interne d’abord',
    description:
      'Poste manquant : matching sur équipe B, réserve et catégories voisines, propositions de montée, avant de chercher dehors.',
    section: 'bourse',
  },
  {
    id: 'pipeline-club',
    title: 'Mercato & candidatures',
    subtitle: 'Observé → Intégré',
    description:
      'Après le vivier interne : annonces, shortlist, essai et suivi kanban pour le bureau et la DS.',
    section: 'mercato',
  },
  {
    id: 'convocations-club',
    title: 'Convocations & retards',
    subtitle: 'Présences centralisées',
    description:
      'RSVP, retard annoncé en 1–2 clics (joueur ou parent), feuille de présence visible par le coach — sans WhatsApp.',
    section: 'invites',
  },
  {
    id: 'covoiturage-club',
    title: 'Covoiturage club',
    subtitle: 'Matchs & entraînements',
    description:
      'Proposez ou réservez des places. Places visibles, contact conducteur en messagerie sécurisée, suivi pour les parents.',
    section: 'overview',
  },
  {
    id: 'tournois-club',
    title: 'Tournois',
    subtitle: 'Poules · Live · QR',
    description:
      'Générateur de poules, Live Hub, classements auto et page publique. Organisateur = rôle intégré au Club.',
    section: 'events',
  },
  {
    id: 'communication-club',
    title: 'Communication interne',
    subtitle: 'Adhésions & annonces',
    description:
      'Messages structure, validation des adhésions et annonces internes. Sans multiplier les groupes.',
    section: 'overview',
  },
  {
    id: 'vitrine-club',
    title: 'Vitrine & écosystème',
    subtitle: 'Page club · équipements · caméras',
    description:
      'Logo, palmarès, marketplace, et Centre Vidéo multi-marques (Veo, XbotGo, smartphone, import…).',
    section: 'video',
  },
];

export const CLUB_PITCH_ZONES: {
  id: ClubPitchZoneId;
  label: string;
  title: string;
  body: string;
  x: `${number}%`;
  y: `${number}%`;
  section: ClubHubSectionId;
}[] = [
  {
    id: 'equipes',
    label: '01',
    title: 'Équipes & licenciés',
    body: 'Catégories, coachs, dirigeants, bénévoles et parents : permissions par invitation.',
    x: '16%',
    y: '26%',
    section: 'structure',
  },
  {
    id: 'sport',
    label: '02',
    title: 'Matchs & compétitions',
    body: 'Invitations club ↔ club, amicaux, calendrier, résultats, classements et joueur du match.',
    x: '72%',
    y: '22%',
    section: 'invites',
  },
  {
    id: 'bourse',
    label: '03',
    title: 'Bourse de recrutement',
    body: 'Poste manquant : vivier équipe B, réserve, autre catégorie, puis entre clubs ProDay.',
    x: '48%',
    y: '42%',
    section: 'bourse',
  },
  {
    id: 'covoit',
    label: '04',
    title: 'Covoiturage',
    body: 'Matchs, entraînements, stages et détections. Suivi live pour les parents.',
    x: '22%',
    y: '68%',
    section: 'overview',
  },
  {
    id: 'hub',
    label: '05',
    title: 'Direction du club',
    body: 'Ce qui va bien, à surveiller, décisions : adhésions, sponsors, tournois.',
    x: '58%',
    y: '70%',
    section: 'overview',
  },
  {
    id: 'comms',
    label: '06',
    title: 'Présences & comms',
    body: 'Convocations, retards annoncés, annonces structure — sans tableurs ni WhatsApp.',
    x: '82%',
    y: '58%',
    section: 'invites',
  },
];

export const CLUB_MATCH_INVITE_STEPS = [
  {
    n: '01',
    title: 'Proposer',
    body: 'Club ou coach : adversaire, catégorie, date, créneau, lieu et type de match (amical, préparation, tournoi…).',
  },
  {
    n: '02',
    title: 'Répondre',
    body: 'Le club invité accepte, refuse ou propose une autre date. Contre-proposition en un geste.',
  },
  {
    n: '03',
    title: 'Confirmer',
    body: 'Accord des deux côtés : match créé, calendriers synchronisés, coachs informés, convocations prêtes.',
  },
  {
    n: '04',
    title: 'Filmer',
    body: 'Si une caméra est disponible, programmer automatiquement la captation depuis le Centre Vidéo.',
  },
] as const;

export const CLUB_HUB_SECTION_CHIPS: { id: ClubHubSectionId; label: string }[] = [
  { id: 'overview', label: 'Pilotage' },
  { id: 'modules', label: 'Modules' },
  { id: 'bourse', label: 'Bourse' },
  { id: 'invites', label: 'Invitations' },
  { id: 'pitch', label: 'Terrain' },
  { id: 'offers', label: 'Offres' },
  { id: 'video', label: 'Vidéo' },
  { id: 'events', label: 'Tournois' },
  { id: 'mercato', label: 'Mercato' },
  { id: 'equipment', label: 'Équipements' },
  { id: 'sponsors', label: 'Sponsors' },
  { id: 'structure', label: 'Équipes' },
];
