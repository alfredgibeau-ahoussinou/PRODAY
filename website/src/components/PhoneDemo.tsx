"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";
import {
  Calendar,
  Car,
  Heart,
  Home,
  MessageCircle,
  Search,
  User,
} from "lucide-react";
import { Reveal } from "./Reveal";
import { UNIVERSE_THEME } from "@/components/universe/universeTheme";
import {
  BRANDS_BY_LINE,
  TABS,
  mercatoTabLabelForWeb,
  type ProductLineWeb,
} from "@/lib/content";

const ICONS = {
  home: Home,
  search: Search,
  calendar: Calendar,
  car: Car,
  heart: Heart,
  message: MessageCircle,
  user: User,
} as const;

type TabId = (typeof TABS)[number]["id"];

type ScreenMock = {
  caption: string;
  title: string;
  subtitle: string;
  stats: { value: string; label: string; highlight?: boolean }[];
  actionTiles?: string[];
  cards: { title: string; body: string; chips?: string[]; accent?: boolean }[];
};

const BASE_SCREENS: Record<TabId, ScreenMock> = {
  home: {
    caption: "Pro Day Man",
    title: "Accueil",
    subtitle: "Bonjour Alex — votre saison en un coup d'œil.",
    stats: [
      { value: "72", label: "Pulse" },
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
        body: "Mercato, Matchs, Arena, Shop — accès rapide.",
        chips: ["Arena ouvert"],
      },
    ],
  },
  recruit: {
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
        body: "FC Nord — Paris 75. Candidature en un tap.",
        chips: ["Attaquant", "Paris"],
        accent: true,
      },
      {
        title: "Milieu · National",
        body: "AS Lumière — recherche profil technique.",
        chips: ["Milieu", "Lyon"],
      },
    ],
  },
  matches: {
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
  carpool: {
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
        body: "Départ parking club — 2 places restantes.",
        chips: ["2 places", "Sam. 13h30"],
        accent: true,
      },
    ],
  },
  health: {
    caption: "Pro Day Santé",
    title: "Santé",
    subtitle: "Kinés, coach mental, nutrition — RDV ou messagerie.",
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
  messages: {
    caption: "Réseau",
    title: "Messages",
    subtitle: "Conversations entre profils inscrits.",
    stats: [
      { value: "3", label: "Non lus", highlight: true },
    ],
    cards: [
      {
        title: "Coach vérifié",
        body: "Convocation match + consignes tactiques.",
        chips: ["Staff vérifié"],
      },
    ],
  },
  profile: {
    caption: "Pro Day Man",
    title: "Profil",
    subtitle: "Complétion, Pulse et plan d'abonnement.",
    stats: [
      { value: "86%", label: "Profil" },
      { value: "72", label: "Pulse" },
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
};

const UNIVERSE_OVERRIDES: Record<
  ProductLineWeb,
  Partial<Record<TabId, Partial<ScreenMock>>>
> = {
  homme: {},
  woman: {
    home: {
      caption: "ProDay Woman",
      title: "Accueil",
      subtitle: "Bonjour Léa — Mercato F et Arena dédiés au féminin.",
    },
    recruit: { title: "Mercato F" },
    health: { title: "Santé F" },
  },
  pro: {
    home: {
      caption: "Pro Day Pro",
      title: "Accueil",
      subtitle: "Hub staff — Mercato Pro et réseau vérifié.",
    },
    recruit: { title: "Mercato Pro" },
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
    recruit: {
      caption: "Cabinet",
      title: "Patients",
      subtitle: "Suivi blessures et messagerie sécurisée.",
    },
    health: {
      title: "Annuaire",
      subtitle: "Votre vitrine près des clubs partenaires.",
    },
    profile: {
      title: "Profil praticien",
      subtitle: "Spécialité, créneaux et abonnement cabinet.",
    },
  },
};

function screenForTab(tabId: TabId, universe: ProductLineWeb): ScreenMock {
  const base = BASE_SCREENS[tabId];
  const override = UNIVERSE_OVERRIDES[universe][tabId];
  const brand = BRANDS_BY_LINE[universe];
  const merged = {
    ...base,
    ...override,
    caption: override?.caption ?? brand.name,
  };
  if (tabId === "recruit") {
    merged.title = mercatoTabLabelForWeb(universe);
  }
  return merged;
}

type PhoneDemoProps = { fullPage?: boolean; universe?: ProductLineWeb };

export function PhoneDemo({ fullPage, universe = "homme" }: PhoneDemoProps) {
  const [active, setActive] = useState<TabId>("home");
  const theme = UNIVERSE_THEME[universe];
  const brand = BRANDS_BY_LINE[universe];
  const screen = screenForTab(active, universe);
  const tabs = TABS.map((tab) =>
    tab.id === "recruit" ? { ...tab, label: mercatoTabLabelForWeb(universe) } : tab,
  );

  return (
    <section
      className={`${fullPage ? "bg-neutral-100 py-12" : "scroll-mt-24 bg-neutral-100 py-20"}`}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {!fullPage && (
          <Reveal>
            <p className="text-sm font-bold uppercase tracking-widest text-neutral-500">
              Démo interactive — UI 2026
            </p>
            <h2 className="mt-2 text-3xl font-bold text-neutral-900 sm:text-4xl">
              L&apos;app ProDay, écran par écran
            </h2>
            <p className="mt-4 max-w-xl text-neutral-600">
              Nouveau design : bandeau univers, en-têtes natifs, chips stats et
              boutons contrastés — comme sur iOS et Android.
            </p>
          </Reveal>
        )}

        <div
          className={`flex flex-col items-center gap-10 lg:flex-row lg:items-start lg:justify-between ${fullPage ? "mt-6" : "mt-12"}`}
        >
          <motion.div
            layout
            className="relative w-full max-w-[340px] shrink-0 rounded-[2.75rem] border-[6px] border-neutral-800 bg-neutral-900 p-2 shadow-2xl"
          >
            <div className="mb-1.5 flex justify-center">
              <div className="h-5 w-28 rounded-full bg-neutral-800" />
            </div>

            <div
              className={`overflow-hidden rounded-[2.1rem] ${theme.screenBg}`}
            >
              <div className={`h-1 w-full ${theme.accentBar}`} />

              <AnimatePresence mode="wait">
                <motion.div
                  key={`${universe}-${active}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.28 }}
                  className="min-h-[460px] flex flex-col"
                >
                  {/* AppTabHeader */}
                  <div className={`border-b border-black/5 px-4 pb-3 pt-3 ${theme.screenSurface}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">
                          {screen.caption}
                        </p>
                        <h3 className="text-xl font-extrabold tracking-tight text-neutral-900">
                          {screen.title}
                        </h3>
                        <p className="mt-0.5 text-xs leading-snug text-neutral-500">
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
                      <div className={`mb-3 rounded-2xl border border-black/5 p-2.5 ${theme.screenMuted}`}>
                        <p className="mb-2 text-[9px] font-bold uppercase tracking-wider text-neutral-500">
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
                            card.accent ? theme.moduleCard : `${theme.screenSurface} border border-black/5`
                          }`}
                        >
                          <p className="text-xs font-extrabold text-neutral-900">
                            {card.title}
                          </p>
                          <p className="mt-1 text-[11px] leading-relaxed text-neutral-600">
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

              {/* Tab bar */}
              <div className={`px-1 py-1.5 ${theme.tabBar}`}>
                <div className="flex justify-around">
                  {tabs.map((tab) => {
                    const Icon = ICONS[tab.icon as keyof typeof ICONS];
                    const isActive = active === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActive(tab.id)}
                        className="flex min-w-0 flex-1 flex-col items-center gap-0.5 px-0.5 py-1"
                        aria-label={tab.label}
                        aria-pressed={isActive}
                      >
                        <Icon
                          size={17}
                          className={isActive ? theme.tabActive : theme.tabInactive}
                          strokeWidth={isActive ? 2.5 : 2}
                        />
                        <span
                          className={`max-w-full truncate text-[7px] font-bold leading-none ${
                            isActive ? theme.tabActive : theme.tabInactive
                          }`}
                        >
                          {tab.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>

          <div className="max-w-md flex-1 space-y-2">
            <p className="mb-3 text-sm font-semibold text-neutral-800">
              Univers : {brand.name}
            </p>
            {tabs.map((tab, i) => {
              const mock = screenForTab(tab.id, universe);
              return (
                <motion.button
                  key={tab.id}
                  type="button"
                  onClick={() => setActive(tab.id)}
                  initial={{ opacity: 0, x: 16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.04 }}
                  className={`block w-full rounded-2xl border p-4 text-left transition ${
                    active === tab.id
                      ? `border-transparent ${theme.chipHighlight} text-white`
                      : "border-neutral-200 bg-white hover:border-neutral-300"
                  }`}
                >
                  <span className={`text-xs ${active === tab.id ? "text-white/70" : "text-neutral-400"}`}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="ml-2 font-bold">{tab.label}</span>
                  <p className={`mt-1 text-sm ${active === tab.id ? "text-white/85" : "text-neutral-500"}`}>
                    {mock.subtitle}
                  </p>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
