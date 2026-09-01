"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowRight, Sparkles, Check, ChevronRight } from "lucide-react";
import { CAROUSEL_POLES, SPONSOR_POLE, POLE_IMAGES } from "@/lib/poles";

interface PoleFeatureHighlight {
  id: string;
  n: string;
  poleId: string;
  title: string;
  subtitle: string;
  description: string;
  href: string;
  logo: string;
  image: string;
  accent: string;
  badgeBg: string;
  keyFeatures: {
    tag: string;
    title: string;
    description: string;
  }[];
  stat: {
    label: string;
    value: string;
  };
}

const UNIVERSES: PoleFeatureHighlight[] = [
  {
    id: "joueur",
    n: "01",
    poleId: "joueur",
    title: "Joueur",
    subtitle: "Accueil · Matchs · Saison · Pass Pro",
    description:
      "Construisez votre carrière sportive, suivez votre analyse de forme quotidienne, accédez au centre de match et développez votre visibilité auprès des recruteurs.",
    href: CAROUSEL_POLES[0].href,
    logo: "/branding/logo-proday-mark-joueur.png",
    image: POLE_IMAGES.joueur,
    accent: "#E8B923",
    badgeBg: "bg-white/10 text-white border-white/20",
    keyFeatures: [
      {
        tag: "Forme & Bio",
        title: "Analyse de Forme IA",
        description: "Suivi physiologique, score de fraîcheur et alertes blessures avant match.",
      },
      {
        tag: "Compétition",
        title: "Centre Match & Convocations",
        description: "RSVP en 1 clic, feuille de match, météo et coordonnées GPS du terrain.",
      },
      {
        tag: "Carrière",
        title: "Mercato & CV Sportif",
        description: "Profil dynamique certifié, statistiques réelles et opportunités de détection.",
      },
    ],
    stat: {
      label: "Pass Optionnel",
      value: "3,99 € / mois",
    },
  },
  {
    id: "pro_club",
    n: "02",
    poleId: "pro_club",
    title: "Club",
    subtitle: "Équipes · Licenciés · Matchs · Finances",
    description:
      "Le système d'exploitation complet de votre club : gestion administrative, suivi des effectifs, planification des tournois, covoiturage et billetterie intégrée.",
    href: CAROUSEL_POLES[1].href,
    logo: "/branding/logo-proday-mark-club.png",
    image: POLE_IMAGES.pro_club,
    accent: "#2563EB",
    badgeBg: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    keyFeatures: [
      {
        tag: "Organisation",
        title: "Gestion Multi-équipes",
        description: "Effectifs, staffs, plannings d'entraînement et assignation des terrains.",
      },
      {
        tag: "Réseau",
        title: "Invitations & Matchs Amicaux",
        description: "Trouvez des clubs adverses de même niveau et confirmez les créneaux.",
      },
      {
        tag: "Événements",
        title: "Tournois & Détections",
        description: "Création d'arènes, billetterie, tableaux de scores et streaming club.",
      },
    ],
    stat: {
      label: "Tout inclus",
      value: "Dès 3 € / adhérent",
    },
  },
  {
    id: "coach",
    n: "03",
    poleId: "coach",
    title: "Coach",
    subtitle: "Banc de touche digital · Tactique IA · Effectif",
    description:
      "Préparez vos séances et vos rencontres avec des outils pro : composition tactique interactive, analyse de forme de l'équipe et bilans d'après-match.",
    href: CAROUSEL_POLES[2].href,
    logo: "/branding/logo-proday-mark-coach.png",
    image: POLE_IMAGES.coach,
    accent: "#E8B923",
    badgeBg: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    keyFeatures: [
      {
        tag: "Tactique",
        title: "Tableau Noir & Tactique IA",
        description: "Schémas animés, animations sur coup de pied arrêté et causerie d'avant-match.",
      },
      {
        tag: "Santé Effectif",
        title: "Matrice de Forme du Groupe",
        description: "Vue d'ensemble de l'état physique de l'effectif pour optimiser les rotations.",
      },
      {
        tag: "Coaching",
        title: "Séances Individuelles",
        description: "Planification de modules personnalisés et coaching humain à l'heure.",
      },
    ],
    stat: {
      label: "Outils Coach",
      value: "Pro & Académie",
    },
  },
  {
    id: "parent",
    n: "04",
    poleId: "parent",
    title: "Parent",
    subtitle: "Supervision · Messages · Agenda · Trajets",
    description:
      "Accompagnez la pratique sportive de votre enfant en toute sérénité : calendrier des matchs, validation des covoiturages et communication directe avec les éducateurs.",
    href: CAROUSEL_POLES[3].href,
    logo: "/branding/logo-proday-mark-parent.png",
    image: POLE_IMAGES.parent,
    accent: "#84CC16",
    badgeBg: "bg-lime-500/15 text-lime-400 border-lime-500/30",
    keyFeatures: [
      {
        tag: "Famille",
        title: "Liaison Compte Enfant",
        description: "Supervision bienveillante, respect de la vie privée et contrôle du temps d'écran.",
      },
      {
        tag: "Logistique",
        title: "Covoiturage Sécurisé",
        description: "Organisation des trajets entre parents vérifiés pour les entraînements et déplacements.",
      },
      {
        tag: "Suivi",
        title: "Alertes Directes Éducateur",
        description: "Notifications instantanées en cas de retard, report de match ou consigne club.",
      },
    ],
    stat: {
      label: "Accès Famille",
      value: "100% Inclus",
    },
  },
  {
    id: "supporter",
    n: "05",
    poleId: "supporter",
    title: "Supporter",
    subtitle: "Matchs · Scores · Live · Tribune",
    description:
      "Vivez la passion du football local et régional : suivez vos clubs favoris, commentez les matchs en direct, accédez aux classements et partagez les meilleurs moments.",
    href: CAROUSEL_POLES[4].href,
    logo: "/branding/logo-proday-mark-supporter.png",
    image: POLE_IMAGES.supporter,
    accent: "#8B5CF6",
    badgeBg: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    keyFeatures: [
      {
        tag: "Temps Réel",
        title: "Match Center & Livescore",
        description: "Scores en direct, chronologie des actions, compositions et statistiques de match.",
      },
      {
        tag: "Communauté",
        title: "Tribune & Réactions",
        description: "Espace d'échange entre fans, pronostics amicaux et encouragement de l'équipe.",
      },
      {
        tag: "Médias",
        title: "Reels & Meilleurs Moments",
        description: "Vidéos de buts, arrêts décisifs et résumés partagés par la communauté.",
      },
    ],
    stat: {
      label: "Expérience Fan",
      value: "Gratuit",
    },
  },
  {
    id: "sponsor",
    n: "06",
    poleId: "sponsor",
    title: "Sponsor",
    subtitle: "Ciblage · Visibilité · Partenariats · ROI",
    description:
      "Connectez votre marque aux clubs et événements sportifs : sponsoring digital, visibilité maillot et terrain, suivi d'impact en direct et génération de devis instantané.",
    href: SPONSOR_POLE.href,
    logo: "/branding/logo-proday-mark-sponsor.png",
    image: POLE_IMAGES.sponsor,
    accent: "#EF4444",
    badgeBg: "bg-red-500/15 text-red-400 border-red-500/30",
    keyFeatures: [
      {
        tag: "Partenariats",
        title: "Catalogue d'Opportunités",
        description: "Sélectionnez des clubs et compétitions locales selon votre zone de chalandise.",
      },
      {
        tag: "Activations",
        title: "Visibilité Numérique & Terrain",
        description: "Bannières ciblées, intégration match center, naming et panneaux interactifs.",
      },
      {
        tag: "Mesure",
        title: "Dashboard ROI & Analytics",
        description: "Indicateurs précis d'impressions, engagement communauté et retombées locales.",
      },
    ],
    stat: {
      label: "Formules Sponsor",
      value: "Dès Découverte",
    },
  },
];

export function UniverseScroll() {
  const [activeTab, setActiveTab] = useState<string>("joueur");
  const questionRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const activeUniverse = UNIVERSES.find((u) => u.id === activeTab) ?? UNIVERSES[0];

  const { scrollYProgress: qProgress } = useScroll({
    target: questionRef,
    offset: ["start end", "end start"],
  });

  const qOpacity = useTransform(qProgress, [0.2, 0.4, 0.7, 0.85], [0, 1, 1, 0.15]);
  const qY = useTransform(qProgress, [0.2, 0.4], [28, 0]);

  return (
    <>
      {/* Question section */}
      <section
        ref={questionRef}
        id="univers"
        className="relative h-[130vh] bg-[#f3f2ec]"
      >
        <div className="sticky top-0 flex min-h-[100dvh] items-center">
          <motion.div
            style={{ opacity: qOpacity, y: qY }}
            className="mx-auto w-full max-w-4xl px-5 sm:px-8"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#052424]/40">
              Même écosystème
            </p>
            <h2 className="mt-6 font-display text-[clamp(2.1rem,6vw,4rem)] font-medium leading-[1.05] tracking-[-0.04em] text-[#052424]">
              Des portes d&apos;entrée.
              <br />
              Un seul football.
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-[#052424]/55">
              Joueur, Club, Coach, Parent, Supporter, Sponsor : ce ne sont pas
              des produits séparés. Chaque univers ouvre le même graphe · objets
              métier reliés, même donnée.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Interactive Universe Cards Explorer */}
      <section
        ref={listRef}
        className="border-t border-[#052424]/10 bg-[#07100c] py-20 text-white sm:py-28"
      >
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#F5D04A]">
                  Sélecteur interactif
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#F5D04A]/15 px-2.5 py-0.5 font-mono text-[9px] font-bold text-[#F5D04A]">
                  <Sparkles size={10} />
                  6 Pôles
                </span>
              </div>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Explorez les fonctionnalités par rôle
              </h2>
            </div>
            <p className="max-w-md text-sm text-white/60">
              Sélectionnez un univers pour prévisualiser ses modules clés, outils métier et opportunités.
            </p>
          </div>

          {/* Universe Pills Selector */}
          <div className="mt-10 flex flex-wrap gap-2 sm:gap-3">
            {UNIVERSES.map((universe) => {
              const isActive = universe.id === activeTab;
              return (
                <button
                  key={universe.id}
                  type="button"
                  onClick={() => setActiveTab(universe.id)}
                  className={`group inline-flex items-center gap-2.5 rounded-full border px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition duration-200 ${
                    isActive
                      ? "border-[#F5D04A] bg-[#F5D04A] text-black shadow-[0_0_20px_rgba(245,208,74,0.3)]"
                      : "border-white/15 bg-white/5 text-white/70 hover:border-white/30 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span
                    className={`font-mono text-[10px] ${
                      isActive ? "text-black/60" : "text-white/40"
                    }`}
                  >
                    {universe.n}
                  </span>
                  <span>{universe.title}</span>
                </button>
              );
            })}
          </div>

          {/* Active Universe Interactive Showcase Card */}
          <motion.div
            key={activeUniverse.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="mt-8 overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-6 backdrop-blur-xl sm:p-8 lg:p-10"
          >
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
              {/* Left Column : Details & Features */}
              <div className="flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3.5">
                    <Image
                      src={activeUniverse.logo}
                      alt={activeUniverse.title}
                      width={44}
                      height={44}
                      className="rounded-xl bg-white/10 p-1 ring-1 ring-white/20"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] uppercase tracking-widest text-[#F5D04A]">
                          Pôle {activeUniverse.n}
                        </span>
                        <span
                          className={`rounded-full border px-2 py-0.5 font-mono text-[9px] font-semibold uppercase ${activeUniverse.badgeBg}`}
                        >
                          {activeUniverse.stat.value}
                        </span>
                      </div>
                      <h3 className="font-display text-2xl font-bold uppercase tracking-tight text-white sm:text-3xl">
                        Espace {activeUniverse.title}
                      </h3>
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-relaxed text-white/70 sm:text-base">
                    {activeUniverse.description}
                  </p>

                  {/* Feature Highlights Grid */}
                  <div className="mt-8 space-y-3">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                      Fonctionnalités Phares
                    </p>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {activeUniverse.keyFeatures.map((feat) => (
                        <div
                          key={feat.title}
                          className="rounded-2xl border border-white/10 bg-black/40 p-3.5 transition hover:border-white/20"
                        >
                          <span className="inline-block rounded-md bg-white/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase text-[#F5D04A]">
                            {feat.tag}
                          </span>
                          <h4 className="mt-2 font-display text-xs font-bold text-white">
                            {feat.title}
                          </h4>
                          <p className="mt-1 text-[11px] leading-relaxed text-white/55">
                            {feat.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* CTAs */}
                <div className="mt-8 flex flex-wrap items-center gap-3 pt-6 border-t border-white/10">
                  <Link
                    href={activeUniverse.href}
                    className="inline-flex items-center gap-2 rounded-full bg-[#F5D04A] px-6 py-3 text-xs font-bold uppercase tracking-wider text-black transition hover:bg-[#E8B923]"
                  >
                    <span>Entrer dans l&apos;espace {activeUniverse.title}</span>
                    <ArrowRight size={14} />
                  </Link>
                  <Link
                    href={activeUniverse.href}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-5 py-3 text-xs font-semibold text-white transition hover:border-white/40 hover:bg-white/10"
                  >
                    <span>Détails du pôle</span>
                    <ChevronRight size={14} />
                  </Link>
                </div>
              </div>

              {/* Right Column : Visual Hero Preview */}
              <div className="relative min-h-[260px] overflow-hidden rounded-2xl border border-white/10 sm:min-h-[320px] lg:min-h-full">
                <Image
                  src={activeUniverse.image}
                  alt={activeUniverse.title}
                  fill
                  className="object-cover transition duration-700 hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 500px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                
                <div className="absolute bottom-5 left-5 right-5">
                  <div className="rounded-xl border border-white/15 bg-black/60 p-4 backdrop-blur-md">
                    <p className="text-xs font-semibold text-white/90">
                      {activeUniverse.subtitle}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-white/50">
                      <span>ProDay Infrastructure</span>
                      <span className="flex items-center gap-1 text-[#F5D04A]">
                        <Check size={12} />
                        Synchronisé
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quick full list below */}
          <div className="mt-14 border-t border-white/10 pt-10">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/40">
              Navigation directe
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {UNIVERSES.map((u) => (
                <Link
                  key={u.id}
                  href={u.href}
                  className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-white/25 hover:bg-white/[0.07]"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-white/40 group-hover:text-[#F5D04A]">
                      {u.n}
                    </span>
                    <div>
                      <h4 className="text-sm font-semibold text-white group-hover:text-[#F5D04A] transition">
                        {u.title}
                      </h4>
                      <p className="text-xs text-white/45 truncate max-w-[160px]">
                        {u.subtitle}
                      </p>
                    </div>
                  </div>
                  <ArrowRight
                    size={15}
                    className="text-white/30 transition group-hover:translate-x-1 group-hover:text-white"
                  />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
