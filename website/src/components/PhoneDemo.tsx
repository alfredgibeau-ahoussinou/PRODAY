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
import { TABS } from "@/lib/content";

const ICONS = {
  home: Home,
  search: Search,
  calendar: Calendar,
  car: Car,
  heart: Heart,
  message: MessageCircle,
  user: User,
} as const;

const SCREENS: Record<
  (typeof TABS)[number]["id"],
  { title: string; body: string; image?: string; chips?: string[] }
> = {
  home: {
    title: "Accueil ProDay",
    body: "Hub de votre saison : stats, modules Arena & Sponsors, agenda du jour.",
    image: "/showcase/classic-discover-hero.jpg",
    chips: ["Pulse 72", "3 convocations", "Arena ouvert"],
  },
  recruit: {
    title: "Mercato",
    body: "Filtrez par poste, niveau et ville. Postulez en un tap.",
    image: "/showcase/classic-mercato.jpg",
    chips: ["Attaquant", "Régional", "Paris"],
  },
  matches: {
    title: "Matchs amicaux",
    body: "Proposez, cherchez ou acceptez un match — calendrier unifié.",
    image: "/showcase/classic-match.jpg",
    chips: ["Sam. 15h", "Loisir", "Confirmé"],
  },
  carpool: {
    title: "Covoiturage",
    body: "Proposez un trajet ou réservez une place pour le prochain match ou la détection.",
    chips: ["2 places", "Stade Nord", "Sam. 13h30"],
  },
  health: {
    title: "Pôle santé",
    body: "Kinés, coach mental, nutrition — annuaire vérifié et messagerie sécurisée.",
    chips: ["Coach mental", "Kiné sport", "Paris 75"],
  },
  messages: {
    title: "Messagerie",
    body: "Conversations entre profils inscrits. Staff vérifié débloqué.",
    chips: ["Coach vérifié", "Club FC Nord"],
  },
  profile: {
    title: "Profil & CV",
    body: "Stats saison, galerie, export PDF — alimenté par Live Stats.",
    image: "/showcase/classic-profile.jpg",
    chips: ["12 buts", "8 passes", "Export PDF"],
  },
};

type PhoneDemoProps = { fullPage?: boolean };

export function PhoneDemo({ fullPage }: PhoneDemoProps) {
  const [active, setActive] = useState<(typeof TABS)[number]["id"]>("home");
  const screen = SCREENS[active];

  return (
    <section
      className={`bg-neutral-900 text-white ${fullPage ? "py-16" : "scroll-mt-24 py-24"}`}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {!fullPage && (
          <Reveal>
            <p className="text-sm font-medium tracking-widest text-neutral-400">
              DÉMO INTERACTIVE
            </p>
            <h2 className="mt-2 text-3xl font-bold sm:text-4xl">
              Naviguez comme dans l&apos;app
            </h2>
            <p className="mt-4 max-w-xl text-neutral-400">
              Cliquez sur les onglets — l&apos;écran change avec des transitions
              fluides, comme sur mobile.
            </p>
          </Reveal>
        )}

        <div
          className={`flex flex-col items-center gap-12 lg:flex-row lg:justify-between ${fullPage ? "mt-4" : "mt-14"}`}
        >
          <motion.div
            layout
            className="relative w-full max-w-[320px] rounded-[2.5rem] border-4 border-neutral-700 bg-neutral-950 p-3 shadow-2xl"
          >
            <div className="mb-2 flex justify-center">
              <div className="h-5 w-24 rounded-full bg-neutral-800" />
            </div>
            <div className="overflow-hidden rounded-[1.75rem] bg-neutral-900">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.35 }}
                  className="min-h-[420px]"
                >
                  {screen.image ? (
                    <div className="relative h-44">
                      <Image
                        src={screen.image}
                        alt=""
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 to-transparent" />
                    </div>
                  ) : (
                    <div className="h-24 bg-gradient-to-b from-neutral-800 to-neutral-900" />
                  )}
                  <div className="p-5">
                    <h3 className="text-lg font-bold">{screen.title}</h3>
                    <p className="mt-2 text-sm text-neutral-400">
                      {screen.body}
                    </p>
                    {screen.chips && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {screen.chips.map((c) => (
                          <span
                            key={c}
                            className="rounded-full bg-neutral-800 px-3 py-1 text-xs"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="mt-3 flex justify-around rounded-2xl bg-neutral-800/80 p-2">
              {TABS.map((tab) => {
                const Icon = ICONS[tab.icon as keyof typeof ICONS];
                const isActive = active === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActive(tab.id)}
                    className="relative flex flex-col items-center gap-0.5 px-2 py-1"
                    aria-label={tab.label}
                    aria-pressed={isActive}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="tab-pill"
                        className="absolute inset-0 rounded-xl bg-white/15"
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 30,
                        }}
                      />
                    )}
                    <Icon
                      size={20}
                      className={isActive ? "text-white" : "text-neutral-500"}
                    />
                    <span
                      className={`text-[9px] ${isActive ? "text-white" : "text-neutral-500"}`}
                    >
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>

          <div className="max-w-md space-y-6">
            {TABS.map((tab, i) => (
              <motion.button
                key={tab.id}
                type="button"
                onClick={() => setActive(tab.id)}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className={`block w-full rounded-2xl border p-4 text-left transition ${
                  active === tab.id
                    ? "border-white/30 bg-white/10"
                    : "border-transparent hover:bg-white/5"
                }`}
              >
                <span className="text-xs text-neutral-500">0{i + 1}</span>
                <span className="ml-2 font-semibold">{tab.label}</span>
                <p className="mt-1 text-sm text-neutral-400">
                  {SCREENS[tab.id].body.slice(0, 60)}…
                </p>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
