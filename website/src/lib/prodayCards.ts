/**
 * Cartes ProDay (site) — types miroir + démos + palettes.
 */

export type ProDayCardRole =
  | "player"
  | "coach"
  | "club"
  | "supporter"
  | "sponsor";

export type ProDayCardTier = "bronze" | "silver" | "gold" | "elite" | "legend";

export type ProDayCardActionId =
  | "view_profile"
  | "message"
  | "follow"
  | "invite"
  | "recruit"
  | "view_club";

export type ProDayCardBase = {
  id: string;
  role: ProDayCardRole;
  tier: ProDayCardTier;
  displayName: string;
  photoUrl: string;
  verified: boolean;
  accentHex: string;
  deepHex: string;
  actions: ProDayCardActionId[];
  /** Skin FUT premium (planche 12 designs). */
  skinId?: import("./futSkins").FutSkinId;
};

export type ProDayPlayerCardData = ProDayCardBase & {
  role: "player";
  firstName: string;
  lastName: string;
  age: number;
  gender: "M" | "F";
  nationality: string;
  clubName: string;
  primaryPosition: string;
  secondaryPosition: string;
  strongFoot: "Gauche" | "Droit" | "Les deux";
  heightCm: number;
  weightKg: number;
  levelLabel: string;
  league: string;
  levelBadge: "Amateur" | "Centre" | "Pro";
  overall: number;
  formPct: number;
  potential: number;
  estimatedValueLabel: string;
  matches: number;
  goals: number;
  assists: number;
  minutesPlayed: number;
  lastMatchLabel: string;
  maxSpeedKmh: number;
  progressLabel: string;
  skillBadges: string[];
  aiObjectives: string[];
  recruitmentStatus: string;
  heatmapHint: string;
};

export type ProDayCoachCardData = ProDayCardBase & {
  role: "coach";
  clubName: string;
  category: string;
  diplomas: string[];
  certifications: string[];
  preferredFormation: string;
  philosophy: string;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  winRatePct: number;
  playersDeveloped: number;
  coachLevel: string;
  reputation: number;
};

export type ProDayClubCardData = ProDayCardBase & {
  role: "club";
  city: string;
  country: string;
  licensedCount: number;
  teamsCount: number;
  coachesCount: number;
  stadium: string;
  levelLabel: string;
  league: string;
  standingLabel: string;
  primaryColor: string;
  secondaryColor: string;
  historyLine: string;
};

export type ProDaySupporterCardData = ProDayCardBase & {
  role: "supporter";
  favoriteClub: string;
  loyaltyLevel: string;
  eventsAttended: number;
  referrals: number;
  rewards: string[];
  points: number;
  badges: string[];
};

export type ProDaySponsorCardData = ProDayCardBase & {
  role: "sponsor";
  company: string;
  sector: string;
  location: string;
  partnerClubs: string[];
  sponsoredEvents: number;
};

export type ProDayCardData =
  | ProDayPlayerCardData
  | ProDayCoachCardData
  | ProDayClubCardData
  | ProDaySupporterCardData
  | ProDaySponsorCardData;

export const CARD_ACTION_LABELS: Record<ProDayCardActionId, string> = {
  view_profile: "Voir le profil",
  message: "Message",
  follow: "Suivre",
  invite: "Inviter",
  recruit: "Recruter",
  view_club: "Voir le club",
};

export const CARD_ROLE_META: Record<
  ProDayCardRole,
  { label: string; accent: string; deep: string }
> = {
  player: { label: "Joueur", accent: "#0054F0", deep: "#001854" },
  coach: { label: "Coach", accent: "#3B5BFF", deep: "#001848" },
  club: { label: "Club", accent: "#006CFC", deep: "#002478" },
  supporter: { label: "Supporter", accent: "#3C00F0", deep: "#180078" },
  sponsor: { label: "Sponsor", accent: "#D4AF37", deep: "#070605" },
};

export const TIER_GLOW: Record<ProDayCardTier, string> = {
  bronze: "rgba(180, 120, 60, 0.55)",
  silver: "rgba(200, 210, 230, 0.55)",
  gold: "rgba(255, 210, 50, 0.7)",
  elite: "rgba(255, 200, 60, 0.55)",
  legend: "rgba(120, 80, 255, 0.65)",
};

/**
 * Skins FUT alignés sur la ref Ultimate Team :
 * gold = rare gold · elite = TOTW noir/or · legend = special violet · silver/bronze classiques.
 */
export const TIER_FIFA: Record<
  ProDayCardTier,
  {
    frame: [string, string, string];
    face: [string, string, string];
    ink: string;
    inkMuted: string;
    divider: string;
    label: string;
    pattern: "rays" | "metal" | "totw" | "special" | "bronze";
  }
> = {
  bronze: {
    frame: ["#d4a574", "#8b5a2b", "#5c3a1e"],
    face: ["#c9956c", "#a67c52", "#7a5230"],
    ink: "#2a1810",
    inkMuted: "rgba(42,24,16,0.75)",
    divider: "rgba(42,24,16,0.35)",
    label: "BRONZE",
    pattern: "bronze",
  },
  silver: {
    frame: ["#e8ecf2", "#9aa3b2", "#5c6575"],
    face: ["#cfd6e0", "#a8b2c0", "#7a8494"],
    ink: "#1a1e28",
    inkMuted: "rgba(26,30,40,0.75)",
    divider: "rgba(26,30,40,0.3)",
    label: "SILVER",
    pattern: "metal",
  },
  gold: {
    frame: ["#ffe9a0", "#e8c547", "#9a7010"],
    face: ["#f7e59a", "#e8c84a", "#c9a018"],
    ink: "#1a1205",
    inkMuted: "rgba(26,18,5,0.78)",
    divider: "rgba(26,18,5,0.35)",
    label: "RARE GOLD",
    pattern: "rays",
  },
  elite: {
    frame: ["#f0d060", "#2a2a2a", "#0a0a0a"],
    face: ["#1c1c1c", "#0e0e0e", "#050505"],
    ink: "#f5d76e",
    inkMuted: "rgba(245,215,110,0.8)",
    divider: "rgba(245,215,110,0.35)",
    label: "TOTW",
    pattern: "totw",
  },
  legend: {
    frame: ["#a78bfa", "#4c1d95", "#1e0a3c"],
    face: ["#2e1065", "#1e1b4b", "#0f0a2e"],
    ink: "#f5f3ff",
    inkMuted: "rgba(245,243,255,0.8)",
    divider: "rgba(245,243,255,0.3)",
    label: "SPECIAL",
    pattern: "special",
  },
};


export const DEMO_PLAYER_CARD: ProDayPlayerCardData = {
  id: "player-amine",
  role: "player",
  tier: "gold",
  displayName: "Amine Khelifi",
  firstName: "Amine",
  lastName: "Khelifi",
  photoUrl: "/images/card-player-01.jpg",
  verified: true,
  accentHex: "#0054F0",
  deepHex: "#001854",
  actions: ["view_profile", "message", "recruit", "follow"],
  skinId: "gold",
  age: 22,
  gender: "M",
  nationality: "France",
  clubName: "FC ProDay",
  primaryPosition: "MC",
  secondaryPosition: "MOC",
  strongFoot: "Droit",
  heightCm: 178,
  weightKg: 72,
  levelLabel: "Régional 1",
  league: "Ligue Paris IDF",
  levelBadge: "Amateur",
  overall: 84,
  formPct: 88,
  potential: 91,
  estimatedValueLabel: "12–18 k€",
  matches: 18,
  goals: 6,
  assists: 9,
  minutesPlayed: 1420,
  lastMatchLabel: "Victoire 2-1 · Sam.",
  maxSpeedKmh: 32.4,
  progressLabel: "+4 OVR cette saison",
  skillBadges: ["Vision", "Pressing", "Leadership"],
  aiObjectives: ["Finitions dans la surface", "Duels aériens"],
  recruitmentStatus: "Ouvert aux contacts",
  heatmapHint: "Couloir central · 2e ballon",
};

export const DEMO_COACH_CARD: ProDayCoachCardData = {
  id: "coach-sarah",
  role: "coach",
  tier: "elite",
  displayName: "Sarah Morel",
  photoUrl: "/images/card-coach-01.jpg",
  verified: true,
  accentHex: "#3B5BFF",
  deepHex: "#001848",
  actions: ["view_profile", "message", "invite"],
  skinId: "totw",
  clubName: "FC ProDay",
  category: "U19",
  diplomas: ["BEF", "CFF3"],
  certifications: ["UEFA C", "Futsal"],
  preferredFormation: "4-3-3",
  philosophy: "Transitions rapides · pressing haut",
  matches: 42,
  wins: 24,
  draws: 8,
  losses: 10,
  winRatePct: 57,
  playersDeveloped: 18,
  coachLevel: "Coach Premium",
  reputation: 86,
};

export const DEMO_CLUB_CARD: ProDayClubCardData = {
  id: "club-proday",
  role: "club",
  tier: "gold",
  displayName: "FC ProDay",
  photoUrl: "/images/card-club-01.jpg",
  verified: true,
  accentHex: "#006CFC",
  deepHex: "#002478",
  actions: ["view_club", "follow", "message"],
  skinId: "special-blue",
  city: "Paris",
  country: "France",
  licensedCount: 420,
  teamsCount: 12,
  coachesCount: 9,
  stadium: "Stade des Lumières",
  levelLabel: "Régional",
  league: "R1 IDF",
  standingLabel: "3e · 28 pts",
  primaryColor: "#006CFC",
  secondaryColor: "#FFFFFF",
  historyLine: "Fondé 2012 · 2 titres régionaux",
};

export const DEMO_SUPPORTER_CARD: ProDaySupporterCardData = {
  id: "sup-lea",
  role: "supporter",
  tier: "silver",
  displayName: "Léa Martin",
  photoUrl: "/images/card-supporter-01.jpg",
  verified: false,
  accentHex: "#3C00F0",
  deepHex: "#180078",
  actions: ["view_profile", "follow", "message"],
  skinId: "special-pink",
  favoriteClub: "FC ProDay",
  loyaltyLevel: "Tribune Or",
  eventsAttended: 14,
  referrals: 3,
  rewards: ["Maillot 2025", "Accès live"],
  points: 2450,
  badges: ["Fidèle", "Ambassadeur", "Derby"],
};

export const DEMO_SPONSOR_CARD: ProDaySponsorCardData = {
  id: "sponsor-nord",
  role: "sponsor",
  tier: "legend",
  displayName: "Nord Equip",
  photoUrl: "/images/card-sponsor-01.jpg",
  verified: true,
  accentHex: "#D4AF37",
  deepHex: "#070605",
  actions: ["view_profile", "message"],
  skinId: "marble",
  company: "Nord Equip",
  sector: "Équipement sportif",
  location: "Lille · Hauts-de-France",
  partnerClubs: ["FC ProDay", "US Nord", "Olympique Amiens"],
  sponsoredEvents: 7,
};

export const DEMO_CARDS: ProDayCardData[] = [
  DEMO_PLAYER_CARD,
  DEMO_COACH_CARD,
  DEMO_CLUB_CARD,
  DEMO_SUPPORTER_CARD,
  DEMO_SPONSOR_CARD,
];
