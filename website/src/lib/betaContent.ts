export const BETA_APK_URL = process.env.NEXT_PUBLIC_BETA_APK_URL?.trim() ?? "";
export const BETA_TESTFLIGHT_URL =
  process.env.NEXT_PUBLIC_BETA_TESTFLIGHT_URL?.trim() ?? "";

export const BETA_FEATURES = [
  "Mercato — annonces, candidatures et suivi des réponses",
  "Matchs & tournois — convocations, RSVP et calendrier unifié",
  "Pulse — score de visibilité et dynamique de profil",
  "Fil, Reels & Arena — communauté, contenus et événements",
  "CV joueur — profil alimenté par vos matchs et stats",
  "Parcours par rôle — expérience adaptée à votre profil",
] as const;

export const BETA_TIMELINE = [
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
      "Recevez et suivez les liens TestFlight (iOS) et APK (Android), puis installez ProDay sur votre téléphone.",
    done: false,
  },
  {
    step: 3,
    title: "Tests & retours",
    description:
      "Explorez l'app, testez votre pôle et partagez bugs, idées ou retours UX — nous lisons chaque message.",
    done: false,
  },
  {
    step: 4,
    title: "Lancement public",
    description:
      "Les beta-testeurs conservent l'accès prioritaire ; vous serez informés de la date de sortie grand public.",
    done: false,
  },
] as const;

export const BETA_FAQ = [
  {
    question: "Qui peut participer à la bêta ?",
    answer:
      "Les personnes inscrites sur la liste d'attente et confirmées par email. Chaque lien d'accès est personnel et lié à votre adresse.",
  },
  {
    question: "Quand recevrai-je les liens de téléchargement ?",
    answer:
      "Les builds iOS (TestFlight) et Android (APK) sont déployés par vagues. Vous recevrez une invitation Apple ou un lien APK par email. Cette page affiche aussi les boutons dès que les liens publics sont actifs.",
  },
  {
    question: "Puis-je tester sur iPhone et Android ?",
    answer:
      "Oui, si vous avez les deux appareils. Installez la version adaptée à chaque plateforme — les comptes ProDay sont les mêmes.",
  },
  {
    question: "L'app bêta est-elle stable ?",
    answer:
      "C'est une version en cours de développement : certaines fonctionnalités peuvent changer, des bugs peuvent survenir. Vos retours nous aident à corriger avant le lancement public.",
  },
  {
    question: "Comment signaler un bug ou une idée ?",
    answer:
      "Utilisez le bouton « Envoyer un retour » sur la page Aide, ou répondez directement à l'email de bienvenue bêta. Indiquez votre profil, la version testée et une capture d'écran si possible.",
  },
  {
    question: "Mes données bêta seront-elles conservées ?",
    answer:
      "Les comptes créés pendant la bêta restent actifs après le lancement. Nous pouvons réinitialiser certaines données de test si nécessaire — vous serez prévenus à l'avance.",
  },
  {
    question: "Puis-je partager mon lien d'accès ?",
    answer:
      "Non. Le lien email et le cookie de session sont personnels. Partagez plutôt la page publique d'inscription : proday75.fr/beta/inscription.",
  },
  {
    question: "Je n'ai pas reçu l'email de bienvenue",
    answer:
      "Vérifiez les spams et l'onglet Promotions. Si rien n'apparaît sous 24 h, écrivez à support@proday.app depuis l'adresse utilisée lors de l'inscription.",
  },
] as const;
