/**
 * Modèle partagé de l'espace Vidéo ProDay (Coach + Club/Admin) — **pur et testable**.
 *
 * Il encode le résultat de l'audit produit Veo (`docs/proday-veo-feature-inventory.md`) :
 * ce que chaque produit Veo fait réellement, ce que l'API officielle permet d'intégrer,
 * et ce qui doit rester un **renvoi externe** plutôt qu'un faux contrôle dans ProDay.
 *
 * Règles tenues par ce modèle :
 * 1. Aucun état « Connecté » n'est déduit d'un identifiant présent — seulement d'une
 *    connexion réellement vérifiée auprès du service.
 * 2. Le direct n'est **pas** une promesse d'API : aucun endpoint de live n'est documenté,
 *    donc il est classé `handoff` et jamais rendu comme un lecteur intégré.
 * 3. Un produit ne donne pas les capacités d'un autre : Veo Go n'expose ni Veo Live ni
 *    Veo Analytics, et ne montre que ses propres captations.
 * 4. La connexion au compte passe par un flux **mot de passe** documenté ⇒ traitement
 *    serveur obligatoire, jamais un formulaire client.
 */

export type EvidenceLevel = 'observed' | 'documented' | 'inferred' | 'unverified';

/**
 * `direct`     — appelable depuis ProDay via l'API officielle (sous condition de client Veo).
 * `handoff`    — renvoi explicite vers Veo ; ProDay n'exécute pas la fonction.
 * `partner`    — dépend d'un accès, d'un abonnement ou d'un add-on non délivré.
 * `unsupported`— non supporté par le produit, ou non documenté.
 */
export type IntegrationClass = 'direct' | 'handoff' | 'partner' | 'unsupported';

export const INTEGRATION_LABEL: Record<IntegrationClass, string> = {
  direct: 'Intégré',
  handoff: 'Renvoi vers Veo',
  partner: 'Selon accès Veo',
  unsupported: 'Non disponible',
};

const INTEGRATION_TONE: Record<IntegrationClass, 'success' | 'neutral' | 'warning' | 'muted'> = {
  direct: 'success',
  handoff: 'neutral',
  partner: 'warning',
  unsupported: 'muted',
};

export type VeoProductId = 'veo_go' | 'veo_cam' | 'veo_platform';

export interface VeoProduct {
  id: VeoProductId;
  name: string;
  kind: string;
  /** Filme-t-il lui-même ? */
  captures: boolean;
  /** Le direct est-il disponible sur ce produit ? */
  live: 'yes_addon' | 'no' | 'not_applicable';
  /** Veo Analytics est-il disponible sur ce produit ? */
  analytics: 'yes_addon' | 'no' | 'not_applicable';
  requirement: string;
  evidence: EvidenceLevel;
  source: string;
}

export const VEO_PRODUCTS: readonly VeoProduct[] = [
  {
    id: 'veo_go',
    name: 'Veo Go',
    kind: 'Application iOS + support',
    captures: true,
    live: 'no',
    analytics: 'no',
    requirement: 'Deux iPhones à caméra ultra grand-angle, iOS 18 ou plus récent, abonnement Veo Go actif',
    evidence: 'documented',
    source: 'support.veo.com — FAQ Veo Go',
  },
  {
    id: 'veo_cam',
    name: 'Veo Cam 3',
    kind: 'Caméra matérielle',
    captures: true,
    live: 'yes_addon',
    analytics: 'yes_addon',
    requirement: 'Caméra Veo Cam 3 / 5G et add-ons Veo Live / Veo Analytics selon le besoin',
    evidence: 'documented',
    source: 'veo.com · FAQ Veo Go (§ add-ons)',
  },
  {
    id: 'veo_platform',
    name: 'Plateforme Veo',
    kind: 'Application web (app.veo.co)',
    captures: false,
    live: 'yes_addon',
    analytics: 'not_applicable',
    requirement: 'Compte Veo ; les captations Veo Go et Veo Cam y sont réunies',
    evidence: 'documented',
    source: 'developer.veo.co.uk · support.veo.com',
  },
] as const;

export type VeoCapabilityId =
  | 'list_videos'
  | 'play_video'
  | 'associate_match'
  | 'upload_video'
  | 'processing_state'
  | 'comments_tags'
  | 'account_connection'
  | 'pair_phone_rig'
  | 'pair_camera'
  | 'live'
  | 'analytics'
  | 'capture';

export interface VeoCapability {
  id: VeoCapabilityId;
  label: string;
  detail: string;
  integration: IntegrationClass;
  /** Ce qu'il faut réellement détenir pour l'activer. */
  requires: string;
  /**
   * La capacité exige-t-elle un client Veo (identifiant + secret) ou une connexion
   * vérifiée ? Sans ce drapeau, la pastille « Intégré » se lirait comme « ça marche
   * aujourd'hui », alors que le code attend un accès non délivré.
   */
  requiresVeoAccess: boolean;
  evidence: EvidenceLevel;
}

/**
 * Libellé honnête d'une capacité : « Intégré » est réservé à ce qui fonctionne sans
 * accès supplémentaire. Ce qui est codé mais attend un client Veo ou une connexion
 * vérifiée l'écrit explicitement.
 */
export function capabilityBadgeLabel(
  capability: VeoCapability,
  input: VeoConnectionInput,
): string {
  if (capability.integration !== 'direct') return INTEGRATION_LABEL[capability.integration];
  if (!capability.requiresVeoAccess) return INTEGRATION_LABEL.direct;
  return input.accountVerified ? INTEGRATION_LABEL.direct : 'Prêt · accès Veo requis';
}

/** Ton de la pastille : une capacité qui attend un accès n'est pas « success ». */
export function capabilityBadgeTone(
  capability: VeoCapability,
  input: VeoConnectionInput,
): 'success' | 'neutral' | 'warning' | 'muted' {
  if (capability.integration !== 'direct') return INTEGRATION_TONE[capability.integration];
  if (!capability.requiresVeoAccess) return 'success';
  return input.accountVerified ? 'success' : 'warning';
}

export const VEO_CAPABILITIES: readonly VeoCapability[] = [
  {
    id: 'list_videos',
    label: 'Lister les captations autorisées',
    detail: 'Récupère les vidéos visibles par le compte (paginé).',
    integration: 'direct',
    requires: 'Client Veo (identifiant + secret délivrés par un représentant Veo)',
    requiresVeoAccess: true,
    evidence: 'documented',
  },
  {
    id: 'play_video',
    label: 'Lire une captation dans ProDay',
    detail: 'Le service renvoie une URL de lecture temporaire par format ; le lecteur ProDay la lit.',
    integration: 'direct',
    requires: 'Client Veo + captation transcodée (état « Transcoded »)',
    requiresVeoAccess: true,
    evidence: 'documented',
  },
  {
    id: 'associate_match',
    label: 'Associer une captation à un match du club',
    detail: 'Association club / équipe / événement, indépendante de l’API.',
    integration: 'direct',
    requires: 'Rien de plus : association ProDay',
    requiresVeoAccess: false,
    evidence: 'observed',
  },
  {
    id: 'upload_video',
    label: 'Envoyer une vidéo vers Veo',
    detail: 'Création de l’actif, jeton d’envoi, puis dépôt direct vers le stockage Veo.',
    integration: 'direct',
    requires: 'Client Veo (l’envoi passe par une URL à usage unique)',
    requiresVeoAccess: true,
    evidence: 'documented',
  },
  {
    id: 'processing_state',
    label: 'Suivre l’état de traitement',
    detail: 'Six états officiels : jeton, envoi, attente de transcodage, transcodage, prêt, erreur.',
    integration: 'direct',
    requires: 'Client Veo',
    requiresVeoAccess: true,
    evidence: 'documented',
  },
  {
    id: 'comments_tags',
    label: 'Commentaires, tags et analyses',
    detail: 'Ressources « comments » et « tagsets » de l’API.',
    integration: 'direct',
    requires: 'Client Veo ; l’analyse dépend des droits du compte',
    requiresVeoAccess: true,
    evidence: 'documented',
  },
  {
    id: 'account_connection',
    label: 'Connecter le compte Veo du club',
    detail:
      'Le seul flux documenté demande l’identifiant et le mot de passe Veo. L’échange doit donc se faire côté serveur, jamais dans le client.',
    integration: 'partner',
    requires:
      'Client Veo et accord produit explicite (le mot de passe Veo n’est jamais collecté par ProDay tant que cet accord manque)',
    requiresVeoAccess: true,
    evidence: 'documented',
  },
  {
    id: 'pair_phone_rig',
    label: 'Associer les deux iPhones Veo Go (QR)',
    detail:
      'Le QR existe, mais il est affiché par le premier iPhone dans l’application Veo Go, et scanné par le second iPhone pour rejoindre la prise. ProDay n’est ni l’un ni l’autre, et aucune interface de session locale n’est documentée : le cycle se déroule donc entièrement dans l’application Veo Go.',
    integration: 'handoff',
    requires:
      'Deux iPhones compatibles, appli Veo Go installée, un abonnement Veo Go actif sur un appareil, le rig et le trépied',
    requiresVeoAccess: true,
    evidence: 'documented',
  },
  {
    id: 'pair_camera',
    label: 'Associer une caméra Veo Cam',
    detail:
      'L’association se fait en Bluetooth depuis l’application Veo Cam, après connexion au compte Veo, en sélectionnant la caméra par son numéro d’identification. Aucun QR n’intervient, et il n’existe pas d’interface d’appairage à appeler.',
    integration: 'handoff',
    requires:
      'Caméra Veo Cam 2/3 allumée (voyant fixe), Bluetooth et WiFi actifs sur le mobile, identifiants Veo, application Veo Cam',
    requiresVeoAccess: true,
    evidence: 'documented',
  },
  {
    id: 'live',
    label: 'Direct Veo',
    detail:
      'Add-on Veo Live, non supporté par Veo Go. Aucun endpoint de direct n’est documenté : ProDay ne peut pas l’intégrer aujourd’hui.',
    integration: 'handoff',
    requires: 'Veo Cam + add-on Veo Live ; consultation sur la plateforme Veo',
    requiresVeoAccess: true,
    evidence: 'documented',
  },
  {
    id: 'analytics',
    label: 'Veo Analytics',
    detail: 'Add-on d’analyse ; absent de Veo Go, distinct des fonctionnalités de Veo Cam.',
    integration: 'partner',
    requires: 'Add-on Veo Analytics activé sur le compte',
    requiresVeoAccess: true,
    evidence: 'documented',
  },
  {
    id: 'capture',
    label: 'Filmer le match',
    detail: 'Captation par le matériel Veo Cam ou par le rig Veo Go — hors de ProDay.',
    integration: 'handoff',
    requires: 'Matériel / application Veo',
    requiresVeoAccess: true,
    evidence: 'documented',
  },
] as const;

/** Faits d’API vérifiés sur la documentation officielle (15/09/2026). */
export const VEO_API = {
  base: 'https://api.veo.co.uk/api/',
  tokenEndpoint: 'https://tokenapi.veo.co.uk/oauth2/token',
  tokenEndpointUat: 'https://tokenapiuat.veo.co.uk/oauth2/token',
  grantType: 'password',
  tokenLifetimeSeconds: 1209599,
  provisioning:
    'L’application (identifiant + secret) ne peut être créée que par un représentant Veo. Aucun flux OAuth à délégation n’est documenté publiquement.',
  documentedResources: ['videos', 'users', 'groups', 'comments', 'tagsets'] as const,
} as const;

export type VideoAudienceRole = 'club' | 'coach' | 'player' | 'parent' | 'staff';

export type VideoSectionId = 'overview' | 'library' | 'live' | 'clips' | 'connections';

export interface VideoSection {
  id: VideoSectionId;
  label: string;
  /** Ce que la section porte réellement — sert de sous-titre, jamais de décoration. */
  purpose: string;
  /** Rôles autorisés à voir la section. */
  roles: readonly VideoAudienceRole[];
  /** Peut-on agir dessus depuis ProDay, ou est-ce un renvoi explicite ? */
  mode: 'proday' | 'handoff' | 'setup';
  /** Raison affichée quand la section est visible mais non exploitable. */
  limit?: string;
}

/**
 * Structure retenue pour l'espace Vidéo. Elle ne contient **que** des sections
 * justifiées : pas d'onglet vide, pas de tableau de bord décoratif.
 */
export const VIDEO_SECTIONS: readonly VideoSection[] = [
  {
    id: 'overview',
    label: 'Vue d’ensemble',
    purpose: 'État de la captation du club et prochaine action utile',
    roles: ['club', 'coach', 'staff', 'player', 'parent'],
    mode: 'proday',
  },
  {
    id: 'library',
    label: 'Bibliothèque',
    purpose: 'Captations associées aux matchs et aux équipes',
    roles: ['club', 'coach', 'staff', 'player', 'parent'],
    mode: 'proday',
  },
  {
    id: 'clips',
    label: 'Clips & analyse',
    purpose: 'Séquences dérivées des captations réellement présentes',
    roles: ['club', 'coach', 'staff'],
    mode: 'proday',
  },
  {
    id: 'live',
    label: 'Direct',
    purpose: 'Ouvrir le direct sur la plateforme Veo',
    roles: ['club', 'coach', 'staff', 'player', 'parent'],
    mode: 'handoff',
    limit:
      'Aucun endpoint de direct n’est documenté et Veo Go ne supporte pas Veo Live : le direct s’ouvre donc sur la plateforme Veo, jamais dans un lecteur ProDay.',
  },
  {
    id: 'connections',
    label: 'Appareils & connexions',
    purpose: 'Compte Veo, matériel de captation et état réel de la connexion',
    roles: ['club', 'coach'],
    mode: 'setup',
    limit:
      'La connexion du compte dépend d’un client Veo délivré par un représentant, et le flux documenté demande le mot de passe Veo : rien n’est déclaré connecté sans vérification auprès du service.',
  },
] as const;

export const VIDEO_SECTION_IDS: readonly VideoSectionId[] = VIDEO_SECTIONS.map((s) => s.id);

const ROLE_ALIASES: Record<string, VideoAudienceRole> = {
  club: 'club',
  president: 'club',
  admin: 'club',
  coach: 'coach',
  staff: 'staff',
  player: 'player',
  joueur: 'player',
  parent: 'parent',
};

/** Normalise un rôle applicatif vers l'audience vidéo. Inconnu ⇒ audience la plus basse. */
export function toVideoAudienceRole(role?: string | null): VideoAudienceRole {
  if (!role) return 'player';
  return ROLE_ALIASES[role.trim().toLowerCase()] ?? 'player';
}

/** Sections visibles pour une audience — l'ordre est celui de `VIDEO_SECTIONS`. */
export function resolveVideoSections(role?: string | null): VideoSection[] {
  const audience = toVideoAudienceRole(role);
  return VIDEO_SECTIONS.filter((section) => section.roles.includes(audience));
}

/** Un rôle peut-il agir sur la connexion Veo du club (credentials client API) ? */
export function canManageVideoConnections(role?: string | null): boolean {
  return toVideoAudienceRole(role) === 'club';
}

/** Un rôle peut-il importer, associer un match ou diffuser en direct ? */
export function canUploadAndAssociateVideo(role?: string | null): boolean {
  const audience = toVideoAudienceRole(role);
  return audience === 'club' || audience === 'coach' || audience === 'staff';
}

/** Zone de la bibliothèque : le joueur et le parent ne voient que le partage explicite. */
export function libraryVisibilityNote(role?: string | null): string {
  const audience = toVideoAudienceRole(role);
  if (audience === 'player' || audience === 'parent') {
    return 'Vous voyez uniquement les captations explicitement partagées avec vous.';
  }
  return 'Toutes les captations du club autorisées pour votre rôle, la même source que le pôle Club.';
}

// ---------------------------------------------------------------------------
// État de connexion — formulation honnête
// ---------------------------------------------------------------------------

export interface VeoConnectionInput {
  /** Identifiants API présents dans l'environnement ? */
  clientConfigured: boolean;
  /** Un compte Veo a-t-il été réellement connecté **et vérifié** auprès du service ? */
  accountVerified: boolean;
  /** Une erreur de connexion a-t-elle été constatée lors du dernier essai ? */
  lastAttemptFailed?: boolean;
}

export type VeoConnectionStateId = 'not_configured' | 'client_only' | 'failed' | 'connected';

export interface VeoConnectionDescription {
  state: VeoConnectionStateId;
  label: string;
  title: string;
  body: string;
  tone: 'neutral' | 'warning' | 'danger' | 'success';
  /** L'action proposée est-elle possible, ou s'agit-il d'un prérequis externe ? */
  action: 'none' | 'retry' | 'request_access';
}

/**
 * Décrit l'état de connexion **sans jamais inventer** « Connecté ».
 * Un identifiant présent ne suffit pas : seul `accountVerified` produit l'état connecté.
 */
export function describeVeoConnection(input: VeoConnectionInput): VeoConnectionDescription {
  if (input.accountVerified) {
    return {
      state: 'connected',
      label: 'Connecté',
      title: 'Compte Veo connecté',
      body: 'La connexion a été vérifiée auprès du service Veo. Les captations autorisées peuvent être listées et lues dans ProDay.',
      tone: 'success',
      action: 'none',
    };
  }

  if (input.lastAttemptFailed) {
    return {
      state: 'failed',
      label: 'Échec',
      title: 'La dernière connexion a échoué',
      body: 'Le service Veo a refusé la demande. Vérifiez le compte, les droits du club, puis réessayez.',
      tone: 'danger',
      action: 'retry',
    };
  }

  if (input.clientConfigured) {
    return {
      state: 'client_only',
      label: 'Client prêt',
      title: 'Client Veo présent, aucun compte connecté',
      body: 'Les identifiants d’application sont configurés, mais aucun compte Veo n’a encore été connecté. Vérifiez le club associé avant de lancer la connexion.',
      tone: 'warning',
      action: 'retry',
    };
  }

  return {
    state: 'not_configured',
    label: 'Non configuré',
    title: 'Connexion Veo non configurée',
    body: VEO_API.provisioning,
    tone: 'neutral',
    action: 'request_access',
  };
}

/** Texte d'action externe — toujours explicite sur le fait que l'on sort de ProDay. */
export const VEO_EXTERNAL_HANDOFF_LABEL = 'Ouvrir sur la plateforme Veo';
export const VEO_EXTERNAL_HANDOFF_HOST = 'app.veo.co';

// ---------------------------------------------------------------------------
// Parcours de connexion — Vidéo › Appareils & connexions › Connecter Veo
// ---------------------------------------------------------------------------

/**
 * Ce qu'un utilisateur peut réellement faire depuis ProDay.
 *
 * `proday`      — ProDay exécute l'étape (éventuellement après provisionnement d'un accès).
 * `external`    — l'étape se fait dans une application ou un service tiers ; ProDay décrit
 *                 le parcours et propose le lien officiel, sans le simuler.
 */
export type VeoConnectionSurface = 'proday' | 'external';

export interface VeoConnectionMethod {
  id: 'account' | 'phone_rig_qr' | 'camera_bluetooth';
  label: string;
  /** Ce que la méthode associe réellement — jamais plus large que la documentation. */
  connects: string;
  surface: VeoConnectionSurface;
  /** ProDay peut-il déclencher l’étape aujourd’hui ? Distingue « codé » de « activable ». */
  executable: boolean;
  /** Pourquoi l’étape n’est pas exécutable dans ProDay, le cas échéant. */
  blockedReason?: string;
  /** Étapes issues de la documentation officielle, dans l’ordre. */
  steps: readonly string[];
  prerequisite: string;
  /** URL officielle du parcours décrit. */
  documentation: string;
  evidence: EvidenceLevel;
}

const VEO_GO_RECORDING_GUIDE =
  'https://support.veo.com/hc/en-us/articles/43899691605521-A-step-by-step-guide-to-recording-your-matches-with-Veo-Go';
const VEO_CAM_APP_GUIDE =
  'https://support.veo.com/hc/en-us/articles/21865049265809-How-to-connect-your-Veo-Cam-2-or-Veo-Cam-3-using-the-Veo-Cam-App';

export const VEO_CONNECTION_METHODS: readonly VeoConnectionMethod[] = [
  {
    id: 'account',
    label: 'Connecter un compte Veo',
    connects: 'Le compte Veo du club (Clubhouse) — c’est la seule méthode qui rattache des captations à ProDay.',
    surface: 'proday',
    executable: false,
    blockedReason:
      'Le seul flux documenté est un OAuth2 `grant_type=password` sur `tokenapi.veo.co.uk`, et l’application (identifiant + secret) ne peut être créée que par un représentant Veo. Tant que ce client n’est pas délivré, rien ne peut être déclaré connecté.',
    steps: [
      'Obtenir un client Veo (identifiant + secret) auprès d’un représentant Veo — étape administrative, pas technique.',
      'Renseigner le client côté serveur ProDay : le mot de passe Veo ne doit jamais transiter par le client mobile.',
      'Échanger les identifiants contre un jeton OAuth2 (durée documentée : environ 14 jours).',
      'Vérifier l’identité réellement reçue auprès du service, puis sélectionner le club Veo à rattacher.',
    ],
    prerequisite: 'Client Veo délivré par un représentant Veo (identifiant + secret).',
    documentation: 'https://developer.veo.co.uk/authentication',
    evidence: 'documented',
  },
  {
    id: 'phone_rig_qr',
    label: 'Associer deux iPhones Veo Go (QR)',
    connects:
      'Les deux iPhones qui forment le rig de captation Veo Go — pas le compte ProDay, et pas la caméra.',
    surface: 'external',
    executable: false,
    blockedReason:
      'Le QR est affiché par le premier iPhone (application Veo Go) et scanné par le second pour rejoindre la prise. ProDay n’est ni l’un ni l’autre, et aucune interface de session n’est documentée : un scanner ProDay serait un décor, pas une association.',
    steps: [
      'Ouvrir l’application Veo Go sur le premier iPhone et s’y connecter au compte Clubhouse.',
      'Appuyer sur « + », puis « Start Recording » ; autoriser caméra, micro et réseau local si demandé.',
      'Suivre les consignes de trépied, puis « Tripod ready », et choisir l’équipe capturée.',
      'Le QR code s’affiche à l’écran du premier iPhone.',
      'Sur le second iPhone : ouvrir l’appareil photo et scanner le QR, ou « Scan QR » depuis Veo Go.',
      'Appuyer sur « Join Recording » pour lier les deux appareils, puis fixer les deux iPhone sur le rig.',
    ],
    prerequisite:
      'Deux iPhones compatibles avec l’appli Veo Go, un abonnement Veo Go actif sur au moins un appareil, le rig et un trépied.',
    documentation: VEO_GO_RECORDING_GUIDE,
    evidence: 'documented',
  },
  {
    id: 'camera_bluetooth',
    label: 'Associer une caméra Veo Cam',
    connects: 'La caméra Veo Cam 2/3 et le compte Veo — pas ProDay directement.',
    surface: 'external',
    executable: false,
    blockedReason:
      'L’appairage se fait en Bluetooth depuis l’application Veo Cam. Il n’existe ni QR, ni interface d’appairage appelable depuis un autre client.',
    steps: [
      'Allumer la caméra (appui d’une seconde) et attendre que le premier voyant devienne fixe.',
      'Activer le Bluetooth sur le mobile et ouvrir l’application Veo Cam.',
      'Se connecter avec les identifiants Veo ; les caméras déjà connues apparaissent automatiquement.',
      'Sélectionner la caméra dans « Cameras found » — en vérifiant son numéro d’identification si plusieurs sont détectées.',
      'La caméra est reliée en Bluetooth ; le WiFi ne sert qu’à l’aperçu, et cet aperçu peut dégrader un direct en cours.',
    ],
    prerequisite: 'Application Veo Cam, Bluetooth et WiFi, identifiants Veo, caméra Veo Cam 2/3.',
    documentation: VEO_CAM_APP_GUIDE,
    evidence: 'documented',
  },
] as const;

/** Guide officiel Veo Go — affiché dans l’écran d’association. */
export const VEO_GO_GUIDE_URL = VEO_GO_RECORDING_GUIDE;

/**
 * Une méthode est-elle réellement exécutable maintenant ?
 * Une méthode `external` ne le sera jamais depuis ProDay, quel que soit l’accès obtenu.
 */
export function describeConnectionMethod(
  method: VeoConnectionMethod,
  input: VeoConnectionInput,
): { executable: boolean; reason: string; tone: 'success' | 'warning' | 'neutral' } {
  if (method.surface === 'external') {
    return {
      executable: false,
      reason: 'Se déroule dans une application Veo — ProDay décrit le parcours.',
      tone: 'neutral',
    };
  }
  if (input.accountVerified) {
    return { executable: true, reason: 'Compte Veo vérifié auprès du service.', tone: 'success' };
  }
  if (!input.clientConfigured) {
    return {
      executable: false,
      reason: 'Client Veo non délivré : la connexion ne peut pas être engagée.',
      tone: 'warning',
    };
  }
  return {
    executable: true,
    reason: 'Client Veo présent — la connexion reste à vérifier auprès du service.',
    tone: 'warning',
  };
}

// ---------------------------------------------------------------------------
// États distincts : compte · caméra · flux
// ---------------------------------------------------------------------------

export type VeoAccountState = 'disconnected' | 'connected';
export type VeoCameraState = 'unpaired' | 'paired_offline' | 'paired_available' | 'error';
export type VeoStreamState = 'unavailable' | 'starting' | 'live' | 'interrupted' | 'ended';

/**
 * **Une connexion de compte ne prouve pas qu’une caméra est associée, ni qu’un flux émet.**
 * Ces trois axes restent donc séparés dans le modèle comme dans l’interface.
 */
export const VEO_ACCOUNT_LABEL: Record<VeoAccountState, string> = {
  disconnected: 'Aucun compte connecté',
  connected: 'Compte connecté et vérifié',
};

export const VEO_CAMERA_LABEL: Record<VeoCameraState, string> = {
  unpaired: 'Aucune caméra associée',
  paired_offline: 'Associée · hors ligne',
  paired_available: 'Associée · disponible',
  error: 'Association en erreur',
};

export const VEO_STREAM_LABEL: Record<VeoStreamState, string> = {
  unavailable: 'Aucun flux',
  starting: 'Démarrage',
  live: 'Direct',
  interrupted: 'Interrompu',
  ended: 'Terminé',
};

/**
 * État du flux **déduit du document club persisté** (`kind` + `status`), jamais d’un
 * supposé direct. Un enregistrement marqué `live` mais encore `uploading` n’est pas
 * un direct : c’est un import en cours.
 */
export function resolveStreamState(
  record: { kind?: string; status?: string } | null | undefined,
): VeoStreamState {
  if (!record) return 'unavailable';
  const status = (record.status ?? '').trim();
  if (status === 'failed') return 'interrupted';
  if (status === 'recording') return record.kind === 'live' ? 'live' : 'starting';
  if (status === 'uploading' || status === 'processing') return 'starting';
  if (status === 'ready') return 'ended';
  return 'unavailable';
}

/**
 * État de la caméra, déduit du document `ClubCamera` persisté. Aucune inférence d’un
 * matériel qui n’aurait pas été enregistré au club.
 */
export function resolveCameraState(
  camera: { status?: string; sync_status?: string } | null | undefined,
): VeoCameraState {
  if (!camera) return 'unpaired';
  if (camera.status === 'error' || camera.sync_status === 'error') return 'error';
  if (camera.status === 'connected' || camera.status === 'pending') {
    return camera.sync_status === 'ok' ? 'paired_available' : 'paired_offline';
  }
  return 'paired_offline';
}
