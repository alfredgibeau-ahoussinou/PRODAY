"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Reveal } from "./Reveal";
import { AppTabBar } from "@/components/demo/AppTabBar";
import { UNIVERSE_THEME } from "@/components/universe/universeTheme";
import {
  getTabLabelForWeb,
  getVisibleMainTabsForWeb,
  getVisibleTabsWithLabels,
  type MainTabId,
} from "@/lib/appTabs";
import { BRANDS_BY_LINE, type ProductLineWeb } from "@/lib/content";
import { ROUTES, demoUrlForUniverse } from "@/lib/routes";

type ScreenMock = {
  caption: string;
  title: string;
  subtitle: string;
  stats: { value: string; label: string; highlight?: boolean }[];
  actionTiles?: string[];
  cards: { title: string; body: string; chips?: string[]; accent?: boolean }[];
};

const BASE_SCREENS: Record<MainTabId, ScreenMock> = {
  home: {
    caption: "Pro Day Man",
    title: "Accueil",
    subtitle: "Bonjour Alex. Votre saison sur l'Accueil.",
    stats: [
      { value: "72", label: "Visibilité" },
      { value: "3", label: "Convocs", highlight: true },
      { value: "12", label: "Annonces" },
    ],
    cards: [
      {
        title: "Prochain match",
        body: "Sam. 15h · Stade Nord · Convocation confirmée.",
        chips: ["Amical", "Loisir"],
      },
      {
        title: "Modules",
        body: "Mercato, Matchs, Reels, Fil, Arena. Accès rapide.",
        chips: ["Reels", "Question hebdo"],
      },
    ],
  },
  recrutement: {
    caption: "Mercato",
    title: "Candidater",
    subtitle: "Annonces live, filtres poste et suivi candidatures.",
    stats: [
      { value: "24", label: "Live" },
      { value: "8", label: "Clubs" },
      { value: "2", label: "Envoyées", highlight: true },
    ],
    cards: [
      {
        title: "Attaquant · Régional",
        body: "FC Nord · Paris 75. Candidature envoyée.",
        chips: ["Attaquant", "Paris"],
        accent: true,
      },
      {
        title: "Milieu · National",
        body: "AS Lumière. Recherche profil technique.",
        chips: ["Milieu", "Lyon"],
      },
    ],
  },
  matchs: {
    caption: "Saison",
    title: "Matchs",
    subtitle: "Calendrier, scores live et convocations.",
    stats: [
      { value: "6", label: "Événements" },
      { value: "1", label: "En direct", highlight: true },
      { value: "2", label: "À répondre", highlight: true },
    ],
    actionTiles: ["Convocation", "Centre", "Proposer", "Rechercher"],
    cards: [
      {
        title: "Cette semaine",
        body: "Entraînement mar. · Match amical sam.",
        chips: ["Sam. 15h"],
      },
    ],
  },
  reels: {
    caption: "Découverte",
    title: "Reels",
    subtitle: "Moments forts et séquences. Fil vertical par pôle.",
    stats: [
      { value: "12", label: "Nouveaux" },
      { value: "Foot", label: "Pôle actif", highlight: true },
      { value: "4", label: "Favoris" },
    ],
    cards: [
      {
        title: "Skill du jour",
        body: "Enchaînement technique. Like, partage et ajout au profil.",
        chips: ["Mercato", "Reels"],
        accent: true,
      },
      {
        title: "Highlight match",
        body: "But en direct remonté depuis Live Stats vers votre CV.",
        chips: ["Live"],
      },
    ],
  },
  feed: {
    caption: "Communauté",
    title: "Fil",
    subtitle: "Question de la semaine, actualités ProDay et réponses partagées.",
    stats: [
      { value: "48", label: "Réponses" },
      { value: "Hebdo", label: "Question", highlight: true },
      { value: "3", label: "Sondages" },
    ],
    cards: [
      {
        title: "Question de la semaine",
        body: "« Quel est votre objectif principal cette saison ? » Répondez et voyez la communauté.",
        chips: ["Question hebdo", "Communauté"],
        accent: true,
      },
      {
        title: "Actualités ProDay",
        body: "Nouveautés Arena, Mercato et partenaires.",
        chips: ["Actualités"],
      },
    ],
  },
  covoiturage: {
    caption: "Équipe",
    title: "Covoiturage",
    subtitle: "Trajets vers matchs et détections.",
    stats: [
      { value: "2", label: "Places" },
      { value: "Sam.", label: "13h30" },
    ],
    cards: [
      {
        title: "Trajet Stade Nord",
        body: "Départ parking club. 2 places restantes.",
        chips: ["2 places", "Sam. 13h30"],
        accent: true,
      },
    ],
  },
  sante: {
    caption: "Pro Day Santé",
    title: "Santé",
    subtitle: "Kinés, coach mental, nutrition. RDV ou messagerie.",
    stats: [
      { value: "3", label: "Spécialités" },
      { value: "RDV", label: "En ligne" },
      { value: "24h", label: "Messages" },
    ],
    cards: [
      {
        title: "Annuaire santé",
        body: "Kinés et coach mental près de votre club.",
        chips: ["Kiné", "Coach mental"],
        accent: true,
      },
      {
        title: "Conseil prévention",
        body: "Échauffement, récupération et signalement douleur.",
        chips: ["Prévention"],
      },
    ],
  },
  famille: {
    caption: "Famille",
    title: "Espace Famille",
    subtitle: "Lien tuteur, contrôle parental et espace jeunes.",
    stats: [
      { value: "1", label: "Tuteur lié" },
      { value: "OK", label: "Contrôle", highlight: true },
    ],
    cards: [
      {
        title: "Portail tuteur",
        body: "Validation des inscriptions et suivi des activités mineures.",
        chips: ["Tuteur", "Mineur"],
        accent: true,
      },
    ],
  },
  messages: {
    caption: "Réseau",
    title: "Messages",
    subtitle: "Conversations entre profils inscrits.",
    stats: [{ value: "3", label: "Non lus", highlight: true }],
    cards: [
      {
        title: "Coach vérifié",
        body: "Convocation match + consignes tactiques.",
        chips: ["Staff vérifié"],
      },
    ],
  },
  profil: {
    caption: "Pro Day Man",
    title: "Profil",
    subtitle: "Complétion, Visibilité et plan d'abonnement.",
    stats: [
      { value: "86%", label: "Profil" },
      { value: "72", label: "Visibilité" },
      { value: "Free", label: "Plan" },
    ],
    cards: [
      {
        title: "CV joueur",
        body: "Stats saison, galerie et export PDF.",
        chips: ["12 buts", "Export PDF"],
        accent: true,
      },
    ],
  },
  shop: {
    caption: "Shop",
    title: "Boutique",
    subtitle: "Équipements, abonnements et offres partenaires.",
    stats: [
      { value: "12", label: "Articles" },
      { value: "-15%", label: "Membre", highlight: true },
    ],
    cards: [
      {
        title: "Pack équipe",
        body: "Maillots et accessoires avec tarif club.",
        chips: ["Équipement"],
        accent: true,
      },
    ],
  },
};

const UNIVERSE_OVERRIDES: Record<
  ProductLineWeb,
  Partial<Record<MainTabId, Partial<ScreenMock>>>
> = {
  homme: {},
  woman: {
    home: {
      caption: "ProDay Woman",
      title: "Accueil",
      subtitle: "Bonjour Léa. Mercato F, Reels et Fil dédiés au féminin.",
    },
    recrutement: { title: "Mercato F" },
    reels: {
      title: "Reels F",
      subtitle: "Moments forts et séquences. Visibilité sur le foot féminin.",
    },
    feed: {
      subtitle: "Question hebdo et voix des joueuses sur ProDay Woman.",
    },
    sante: { title: "Santé F" },
  },
  amateur: {
    home: {
      caption: "Pro Day Amateur",
      title: "Accueil",
      subtitle: "Joueur ou coach. Mercato local, matchs et effectif.",
    },
    recrutement: { title: "Mercato Amateur" },
    reels: {
      subtitle: "Coulisses d'équipe et moments forts. Format vertical.",
    },
    feed: {
      subtitle: "Actualités réseau amateur. Joueurs et coachs.",
    },
    sante: { title: "Santé" },
  },
  supporter: {
    home: {
      caption: "Pro Day Supporter",
      title: "Accueil",
      subtitle: "Bonjour Sam. Matchs, réels et fil de votre tribune.",
    },
    matchs: {
      title: "Matchs",
      subtitle: "Calendrier et live des clubs que vous suivez.",
    },
    reels: {
      title: "Reels",
      subtitle: "Moments forts et séquences. Vibrez avec la communauté.",
    },
    feed: {
      subtitle: "Fil communautaire, réactions et question hebdo.",
    },
    messages: {
      subtitle: "Échanges avec la communauté supporter.",
    },
    profil: {
      subtitle: "Clubs favoris et profil tribune.",
    },
  },
  pro: {
    home: {
      caption: "Pro Day Pro",
      title: "Accueil",
      subtitle: "Hub staff. Mercato Pro, Reels et réseau vérifié.",
    },
    recrutement: { title: "Mercato Pro" },
    reels: {
      subtitle: "Coulisses Mercato, détections et pôle santé. Format vertical.",
    },
    feed: {
      subtitle: "Actualités réseau pro et sondages staff.",
    },
  },
  sante: {
    home: {
      caption: "Pro Day Santé",
      title: "Cabinet",
      subtitle: "Agenda RDV, messagerie patients et visibilité clubs.",
      stats: [
        { value: "5", label: "RDV jour" },
        { value: "2", label: "Messages", highlight: true },
      ],
    },
    matchs: {
      caption: "Cabinet",
      title: "Agenda",
      subtitle: "Créneaux RDV et suivi séances.",
    },
    messages: {
      title: "Patients",
      subtitle: "Messagerie sécurisée et suivi blessures.",
    },
    profil: {
      title: "Cabinet",
      subtitle: "Spécialité, créneaux et abonnement cabinet.",
    },
  },
};

function screenForTab(tabId: MainTabId, universe: ProductLineWeb): ScreenMock {
  const base = BASE_SCREENS[tabId];
  const override = UNIVERSE_OVERRIDES[universe][tabId];
  const brand = BRANDS_BY_LINE[universe];
  const merged = {
    ...base,
    ...override,
    caption: override?.caption ?? brand.name,
  };
  if (tabId === "recrutement" || tabId === "matchs" || tabId === "messages" || tabId === "profil") {
    merged.title = getTabLabelForWeb(tabId, universe);
  }
  return merged;
}

type PhoneDemoProps = { fullPage?: boolean; compact?: boolean; universe?: ProductLineWeb };

export function PhoneDemo({ fullPage, compact, universe = "homme" }: PhoneDemoProps) {
  const tabs = getVisibleTabsWithLabels(universe);
  const visibleTabs = getVisibleMainTabsForWeb(universe);
  const [selectedTab, setSelectedTab] = useState<MainTabId>(() => visibleTabs[0] ?? "home");
  const active = visibleTabs.includes(selectedTab) ? selectedTab : visibleTabs[0] ?? "home";
  const theme = UNIVERSE_THEME[universe];
  const brand = BRANDS_BY_LINE[universe];
  const screen = screenForTab(active, universe);
  const immersive = active === "reels";

  return (
    <section
      id={fullPage ? undefined : "decouvrir"}
      className={`${
        fullPage
          ? "bg-[#030303] py-12"
          : compact
            ? "scroll-mt-24 bg-[#030303] py-10 md:py-14"
            : "scroll-mt-24 bg-[#030303] py-20"
      }`}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {!fullPage && (
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
              Démo interactive
            </p>
            <h2 className="font-display mt-2 text-2xl font-bold text-white sm:text-3xl">
              L&apos;app ProDay, écran par écran
            </h2>
            {!compact ? (
              <p className="mt-4 max-w-xl text-white/55">
                Même navigation que l&apos;application. Barre mobile avec Reels au centre et menu
                overflow. Parcourez les onglets comme sur votre téléphone.
              </p>
            ) : (
              <p className="mt-3 max-w-xl text-sm text-white/55">
                Parcourez les onglets comme sur votre téléphone. Démo complète sur la page dédiée.
              </p>
            )}
          </Reveal>
        )}

        <div
          className={`flex flex-col items-center ${
            compact
              ? "gap-6"
              : "gap-10 lg:flex-row lg:items-start lg:justify-between"
          } ${fullPage ? "mt-6" : compact ? "mt-8" : "mt-12"}`}
        >
          <motion.div
            layout
            className="relative w-full max-w-[340px] shrink-0 rounded-[2.75rem] border-[6px] border-neutral-800 bg-neutral-900 p-2 shadow-2xl"
          >
            <span className="pointer-events-none absolute right-5 top-5 z-20 rounded-full border border-amber-400/40 bg-amber-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-200">
              Démo
            </span>
            <div className="mb-1.5 flex justify-center">
              <div className="h-5 w-28 rounded-full bg-neutral-800" />
            </div>

            <div
              className={`relative overflow-hidden rounded-[2.1rem] ${
                immersive ? "bg-black" : theme.screenBg
              }`}
            >
              {!immersive ? <div className={`h-1 w-full ${theme.accentBar}`} /> : null}

              <AnimatePresence mode="wait">
                <motion.div
                  key={`${universe}-${active}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.28 }}
                  className={`flex flex-col ${compact ? "min-h-[380px]" : "min-h-[460px]"}`}
                >
                  <div
                    className={`border-b border-white/5 px-4 pb-3 pt-3 ${
                      immersive ? "bg-black" : theme.screenSurface
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-white/40">
                          {screen.caption}
                        </p>
                        <h3 className="text-xl font-extrabold tracking-tight text-white">
                          {screen.title}
                        </h3>
                        <p className="mt-0.5 text-xs leading-snug text-white/45">
                          {screen.subtitle}
                        </p>
                      </div>
                      <Image
                        src={brand.logo}
                        alt=""
                        width={36}
                        height={36}
                        className="shrink-0 opacity-90"
                      />
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {screen.stats.map((stat) => (
                        <span
                          key={stat.label}
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                            stat.highlight ? theme.chipHighlight : theme.chip
                          }`}
                        >
                          {stat.value} · {stat.label}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto px-3 py-3">
                    {screen.actionTiles ? (
                      <div
                        className={`mb-3 rounded-2xl border border-white/5 p-2.5 ${
                          immersive ? "bg-white/5" : theme.screenMuted
                        }`}
                      >
                        <p className="mb-2 text-[9px] font-bold uppercase tracking-wider text-white/40">
                          Actions rapides
                        </p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {screen.actionTiles.map((label, i) => (
                            <div
                              key={label}
                              className={`rounded-xl px-2 py-2 text-center text-[10px] font-bold ${
                                i === 0 ? theme.actionTileActive : theme.actionTile
                              }`}
                            >
                              {label}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div className="space-y-2">
                      {screen.cards.map((card) => (
                        <div
                          key={card.title}
                          className={`rounded-xl p-3 ${
                            card.accent
                              ? theme.moduleCard
                              : `${immersive ? "bg-white/5" : theme.screenSurface} border border-white/5`
                          }`}
                        >
                          <p className="text-xs font-extrabold text-white">{card.title}</p>
                          <p className="mt-1 text-[11px] leading-relaxed text-white/50">
                            {card.body}
                          </p>
                          {card.chips ? (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {card.chips.map((chip) => (
                                <span
                                  key={chip}
                                  className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${theme.chip}`}
                                >
                                  {chip}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              <AppTabBar
                activeTab={active}
                onTabPress={setSelectedTab}
                universe={universe}
                accentInk={theme.brandAccent}
                tabActiveClass={theme.tabActive}
                tabInactiveClass={theme.tabInactive}
                dockSurfaceClass={theme.screenSurface}
              />
            </div>
          </motion.div>

          {compact ? (
            <div className="flex w-full max-w-xl flex-col items-center gap-5">
              <div className="scroll-snap-x flex w-full gap-2 overflow-x-auto px-1 pb-1">
                {tabs.map((tab) => (
                  <button
                    key={`compact-${tab.id}`}
                    type="button"
                    onClick={() => setSelectedTab(tab.id)}
                    className={`shrink-0 snap-start rounded-full border px-4 py-2 text-sm transition ${
                      active === tab.id
                        ? `border-transparent ${theme.chipHighlight} text-white`
                        : `${theme.moduleIdle} text-white/70`
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <Link
                href={demoUrlForUniverse(universe)}
                className="text-sm font-semibold text-[var(--proday-accent)] underline underline-offset-4 transition hover:text-[#4C8BFF]"
              >
                Voir la démo complète
              </Link>
            </div>
          ) : (
          <div className="w-full max-w-md flex-1 space-y-2 lg:max-w-none">
            <p className="mb-3 text-sm font-semibold text-white/70">
              Univers : {brand.name}. Onglets visibles
            </p>
            <div className="scroll-snap-x -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 lg:mx-0 lg:hidden lg:flex-col lg:gap-2 lg:overflow-visible lg:px-0 lg:pb-0">
              {tabs.map((tab) => (
                <motion.button
                  key={`mobile-${tab.id}`}
                  type="button"
                  onClick={() => setSelectedTab(tab.id)}
                  className={`shrink-0 snap-start rounded-full border px-4 py-2.5 text-left text-sm transition ${
                    active === tab.id
                      ? `border-transparent ${theme.chipHighlight} text-white`
                      : `${theme.moduleIdle} text-white/70`
                  }`}
                >
                  <span className="font-bold">{tab.label}</span>
                </motion.button>
              ))}
            </div>
            <div className="hidden space-y-2 lg:block">
            {tabs.map((tab, i) => {
              const mock = screenForTab(tab.id, universe);
              return (
                <motion.button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedTab(tab.id)}
                  initial={{ opacity: 0, x: 16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.04 }}
                  className={`block w-full rounded-2xl border p-4 text-left transition ${
                    active === tab.id
                      ? `border-transparent ${theme.chipHighlight} text-white`
                      : `${theme.moduleIdle} text-white/70`
                  }`}
                >
                  <span
                    className={`text-xs ${active === tab.id ? "text-white/70" : "text-white/40"}`}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="ml-2 font-bold">{tab.label}</span>
                  <p
                    className={`mt-1 text-sm ${
                      active === tab.id ? "text-white/85" : "text-white/45"
                    }`}
                  >
                    {mock.subtitle}
                  </p>
                </motion.button>
              );
            })}
            </div>
          </div>
          )}
        </div>
      </div>
    </section>
  );
}
