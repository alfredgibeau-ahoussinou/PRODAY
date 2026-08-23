import { existsSync } from "node:fs";
import path from "node:path";
import { isTestFlightAvailable } from "./betaIosLaunch";

const DEFAULT_APK_PATH = "/downloads/proday-beta.apk";

function resolveBetaApkUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_BETA_APK_URL?.trim();
  if (fromEnv) return fromEnv;

  const localApk = path.join(process.cwd(), "public", "downloads", "proday-beta.apk");
  if (existsSync(localApk)) {
    return DEFAULT_APK_PATH;
  }

  // Lien sur le site. redirect Netlify vers Firebase Storage en production.
  return DEFAULT_APK_PATH;
}

export const BETA_APK_URL = resolveBetaApkUrl();
export const BETA_APK_AVAILABLE = Boolean(BETA_APK_URL);

export const BETA_TESTFLIGHT_URL =
  process.env.NEXT_PUBLIC_BETA_TESTFLIGHT_URL?.trim() ?? "";

export const BETA_APP_VERSION = process.env.NEXT_PUBLIC_BETA_APP_VERSION?.trim() || "1.0.0";

export const BETA_FEATURES = [
  "Mercato : annonces, candidatures et suivi des réponses",
  "Invitations de match entre clubs : proposer, accepter, contre proposer",
  "Entraînement à domicile + coaching humain à l’heure",
  "Matchs et tournois : convocations, RSVP et calendrier",
  "Visibilité : score et dynamique de profil",
  "Fil, Reels et Arène : communauté, contenus et événements",
  "CV joueur : profil alimenté par vos matchs et stats",
  "Étapes selon votre rôle : Joueur, Club, Coach, Supporter ou Sponsor",
] as const;

const BETA_TIMELINE_BASE = [
  {
    step: 1,
    title: "Inscription confirmée",
    description:
      "Votre inscription est confirmée. Retrouvez ici le programme, les pôles et les guides d'installation.",
    done: true,
  },
  {
    step: 2,
    title: "Installation de l'app",
    description:
      "Android : APK sur l'onglet Installer. iOS : bêta TestFlight décalée au 15 août 2026 à 18 h (améliorations nécessaires). Lien envoyé par email à l'ouverture.",
    done: false,
  },
  {
    step: 3,
    title: "Tests & retours",
    description:
      "Ouvrez l'app, testez votre pôle et envoyez bugs ou idées. On lit chaque message.",
    done: false,
  },
  {
    step: 4,
    title: "Lancement public",
    description:
      "Les beta testeurs gardent l'accès prioritaire. On vous prévient de la date de sortie grand public.",
    done: false,
  },
] as const;

/** Calendrier bêta. L'étape installation passe en « done » dès que l'APK ou TestFlight est disponible. */
export function getBetaTimeline() {
  const installReady = BETA_APK_AVAILABLE || isTestFlightAvailable();
  return BETA_TIMELINE_BASE.map((item) =>
    item.step === 2 ? { ...item, done: installReady || item.done } : item,
  );
}

/** Étape courante (1 : 4) pour affichage dans le programme. */
export function getBetaCurrentStep(): number {
  const timeline = getBetaTimeline();
  const firstPending = timeline.find((item) => !item.done);
  return firstPending?.step ?? timeline[timeline.length - 1]!.step;
}

/** @deprecated Utiliser getBetaTimeline() pour tenir compte de l'APK disponible. */
export const BETA_TIMELINE = BETA_TIMELINE_BASE;

export const BETA_FAQ = [
  {
    question: "Qui peut participer à la bêta ?",
    answer:
      "Les personnes inscrites sur la liste d'attente et confirmées par email. Chaque lien d'accès est personnel et lié à votre adresse.",
  },
  {
    question: "Comment télécharger l'application ?",
    answer:
      "Android : connectez vous à l'espace bêta et téléchargez l'APK depuis Installer. iOS : bêta TestFlight décalée au 15 août 2026 à 18 h (améliorations nécessaires au bon développement) : vous recevrez le lien par email à l'ouverture.",
  },
  {
    question: "Puis je tester sur iPhone et Android ?",
    answer:
      "Oui, si vous avez les deux appareils. Installez la version adaptée à chaque plateforme. Les comptes ProDay sont les mêmes.",
  },
  {
    question: "L'app bêta est elle stable ?",
    answer:
      "C'est une version en cours de développement : certaines fonctionnalités peuvent changer, des bugs peuvent survenir. Vos retours nous aident à corriger avant le lancement public.",
  },
  {
    question: "Comment signaler un bug ou une idée ?",
    answer:
      "Utilisez le bouton « Envoyer un retour » sur la page Aide, ou répondez directement à l'email de bienvenue bêta. Indiquez votre profil, la version testée et une capture d'écran si possible.",
  },
  {
    question: "Mes données bêta seront elles conservées ?",
    answer:
      "Les comptes créés pendant la bêta restent actifs après le lancement. On peut réinitialiser certaines données de test. Vous serez prévenus à l'avance.",
  },
  {
    question: "Puis je partager mon lien d'accès ?",
    answer:
      "Non. Le lien email et le cookie de session sont personnels. Partagez plutôt la page publique d'inscription : proday75.fr/beta/inscription.",
  },
  {
    question: "Je n'ai pas reçu l'email de bienvenue",
    answer:
      "Vérifiez les spams et l'onglet Promotions. Si rien n'apparaît sous 24 h, écrivez à proday.admin@gmail.com depuis l'adresse utilisée lors de l'inscription.",
  },
] as const;
