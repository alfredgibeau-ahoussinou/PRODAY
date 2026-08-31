/**
 * Miroir site de `src/content/videoOffers.ts` (source de vérité mobile).
 * Garder les libellés / prix alignés — ne pas inventer de tarifs catalogue ici.
 * Schéma site volontairement aplati (priceLabel / priceNote) pour la vitrine.
 */

export type VideoOfferId = "proday_pro_camera";

export type VideoCameraVendor =
  | "smartphone"
  | "tablet"
  | "veo"
  | "xbotgo"
  | "trace"
  | "pixellot"
  | "spiideo"
  | "generic";

export type VideoHardwareAcquisition = "own_camera" | "lease" | "purchase";

export type VideoAnalysisCapability =
  | "auto_clip"
  | "highlights"
  | "goals"
  | "saves"
  | "cards"
  | "substitutions"
  | "heatmaps"
  | "stats"
  | "ai_reports";

export type VideoOfferDefinition = {
  id: VideoOfferId;
  label: string;
  tagline: string;
  audience: string;
  cameraRequired: false;
  hardwareIncluded: boolean;
  annualEur: number | null;
  priceLabel: string;
  priceNote: string;
  includes: string[];
  hardwareExtras?: string[];
  supportedInputs: VideoCameraVendor[];
  hardwareAcquisition?: VideoHardwareAcquisition[];
};

export const VIDEO_VENDORS: { id: VideoCameraVendor; label: string }[] = [
  { id: "smartphone", label: "Smartphone" },
  { id: "tablet", label: "Tablette" },
  { id: "veo", label: "Veo" },
  { id: "xbotgo", label: "XbotGo" },
  { id: "trace", label: "Trace" },
  { id: "pixellot", label: "Pixellot" },
  { id: "spiideo", label: "Spiideo" },
  { id: "generic", label: "Autre caméra / import" },
];

export const VIDEO_ANALYSIS_LABELS: { id: VideoAnalysisCapability; label: string }[] = [
  { id: "auto_clip", label: "Découpage automatique" },
  { id: "highlights", label: "Temps forts" },
  { id: "goals", label: "Buts" },
  { id: "saves", label: "Arrêts" },
  { id: "cards", label: "Cartons" },
  { id: "substitutions", label: "Remplacements" },
  { id: "heatmaps", label: "Heatmaps" },
  { id: "stats", label: "Statistiques" },
  { id: "ai_reports", label: "Rapports IA" },
];

export const VIDEO_HARDWARE_OPTIONS: Record<
  VideoHardwareAcquisition,
  { title: string; body: string }
> = {
  own_camera: {
    title: "Caméra déjà possédée",
    body: "Le club a déjà une Veo, XbotGo ou autre caméra compatible. ProDay se connecte, pas d’achat forcé.",
  },
  lease: {
    title: "Location via ProDay",
    body: "Offre clé en main sur devis : caméra, trépied, installation, formation, cloud · selon adhérents et équipes.",
  },
  purchase: {
    title: "Achat via ProDay",
    body: "Achat caméra + pack installation / configuration / formation. Prix catalogue sur devis (pas de tarif fixe affiché).",
  },
};

export const VIDEO_OFFERS: Record<VideoOfferId, VideoOfferDefinition> = {
  proday_pro_camera: {
    id: "proday_pro_camera",
    label: "ProDay Pro + Veo",
    tagline: "Formule Premium clé en main",
    audience:
      "Tout inclus + caméra (achat, location ou déjà possédée), cloud et découpage auto.",
    cameraRequired: false,
    hardwareIncluded: true,
    annualEur: null,
    priceLabel: "Sur devis",
    priceNote: "Sur devis · adhérents, équipes & matériel",
    includes: [
      "Toutes les fonctions Tout inclus",
      "Analyse vidéo BYO (smartphone / tablette / caméra existante)",
      "Tableau tactique, IA, entraînements, admin",
    ],
    hardwareExtras: [
      "Module Caméra : achat, location ou intégration (Veo, XbotGo…)",
      "Trépied / installation / formation selon devis",
      "Synchronisation automatique & stockage cloud",
      "Traitement vidéo, analyse IA, découpage automatique",
      "Bibliothèque vidéo, causeries & partage joueurs",
      "Export des séquences",
    ],
    supportedInputs: [
      "smartphone",
      "tablet",
      "veo",
      "xbotgo",
      "trace",
      "pixellot",
      "spiideo",
      "generic",
    ],
    hardwareAcquisition: ["own_camera", "lease", "purchase"],
  },
};

export const VIDEO_OFFER_ORDER: VideoOfferId[] = ["proday_pro_camera"];

export const VIDEO_MODULE_PRINCIPLE =
  "Vous avez une caméra ? Connectez la à ProDay. Veo, XbotGo, Spiideo, Pixellot, Trace, smartphone · jamais limité à une marque. Matériel jamais obligatoire.";
