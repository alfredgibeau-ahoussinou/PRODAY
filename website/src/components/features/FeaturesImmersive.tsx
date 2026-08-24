"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { useState, type CSSProperties } from "react";
import { ImmersivePoleHero } from "@/components/poles/immersivePoleExperience";
import { TerminalCta } from "@/components/terminal";
import { MODULES } from "@/lib/content";
import { SHOWCASE_POLES, poleNavAccentHex, poleSectionHref } from "@/lib/poles";
import { getRoleVisuals } from "@/lib/roleVisuals";
import {
  COACH_APP_HREF,
  JOUEUR_APP_HREF,
  PARENT_APP_HREF,
  PRESIDENT_HUB_HREF,
  ROUTES,
} from "@/lib/routes";

const ease = [0.22, 1, 0.36, 1] as const;

const POLE_CAPABILITIES: Record<
  string,
  { title: string; items: string[] }
> = {
  joueur: {
    title: "Ce que fait le joueur",
    items: [
      "Accueil & parcours : forme, objectifs, carte joueur",
      "Centre Match : calendrier, lieu, préparation",
      "Saison, stats et profil — Pass 3,99 € optionnel",
      "Convocations, covoiturage, Mercato",
    ],
  },
  pro_club: {
    title: "Ce que fait le club",
    items: [
      "Analyse de forme incluse dans l’offre",
      "Équipes, licenciés, espace président",
      "Invitations, tournois, covoiturage",
      "À partir de 3 € / adhérent (sur devis)",
    ],
  },
  president: {
    title: "Ce que fait le président",
    items: [
      "Cockpit club : équipes, alertes, décisions",
      "Finances, adhésions et sponsors",
      "Assistant IA pour prioriser",
      "Même graphe que le Pôle Club — pas une app à part",
    ],
  },
  coach: {
    title: "Ce que fait le coach",
    items: [
      "Analyse de forme de l’effectif",
      "Entraînements & générateur IA",
      "Tactique IA & consignes joueurs",
      "Convocations, comptes rendus, invitations",
    ],
  },
  supporter: {
    title: "Ce que fait le supporter",
    items: [
      "Tribune 100 % gratuite",
      "Scores live & clubs suivis",
      "Débats et moments",
      "Aucun paywall",
    ],
  },
  sponsor: {
    title: "Ce que fait le sponsor",
    items: [
      "Campagnes locales & nationales",
      "Contact clubs et joueurs actifs",
      "KPIs lisibles",
      "Vitrine partenaire vérifiée",
    ],
  },
};

/** Modules transverses mis en avant (hors vitrine pôle). */
const FEATURE_MODULE_IDS = [
  "smart-tactics",
  "mercato",
  "matchs",
  "carpool",
  "pulse",
  "feed",
  "reels",
  "sponsors",
] as const;

const CROSS_MODULES = MODULES.filter((m) =>
  (FEATURE_MODULE_IDS as readonly string[]).includes(m.id),
);

type FeaturePoleTab = {
  id: string;
  kicker: string;
  navLabel: string;
  title: string;
  subtitle: string;
  description: string;
  href: string;
};

const PRESIDENT_FEATURE_TAB: FeaturePoleTab = {
  id: "president",
  kicker: "PÔLE PRÉSIDENT",
  navLabel: "Président",
  title: "Le club en un coup d’œil",
  subtitle: "Cockpit · Finances · Assistant IA",
  description:
    "Dirigeants, DS et bureau : cockpit, finances et assistant IA, liés au Pôle Club.",
  href: PRESIDENT_HUB_HREF,
};

const FEATURE_POLES: FeaturePoleTab[] = SHOWCASE_POLES.flatMap((pole) => {
  const tab: FeaturePoleTab = {
    id: pole.id,
    kicker: pole.kicker,
    navLabel: pole.navLabel,
    title: pole.title,
    subtitle: pole.subtitle,
    description: pole.description,
    href:
      pole.id === "joueur"
        ? JOUEUR_APP_HREF
        : pole.id === "coach"
          ? COACH_APP_HREF
          : pole.id === "parent"
            ? PARENT_APP_HREF
            : pole.href,
  };
  return pole.id === "pro_club" ? [tab, PRESIDENT_FEATURE_TAB] : [tab];
});

export function FeaturesImmersive() {
  const visuals = getRoleVisuals("fonctionnalites");
  const [activePole, setActivePole] = useState(FEATURE_POLES[0]!.id);
  const [activeModule, setActiveModule] = useState(CROSS_MODULES[0]!.id);
  const reduce = useReducedMotion();

  const pole = FEATURE_POLES.find((p) => p.id === activePole) ?? FEATURE_POLES[0]!;
  const caps = POLE_CAPABILITIES[pole.id] ?? POLE_CAPABILITIES.joueur!;
  const mod = CROSS_MODULES.find((m) => m.id === activeModule) ?? CROSS_MODULES[0]!;
  const accent = poleNavAccentHex(pole.href);

  return (
    <div
      style={
        {
          "--pole-accent": accent,
          "--pole-accent-glow": `${accent}55`,
        } as CSSProperties
      }
    >
      <ImmersivePoleHero
        brand="Pro Day"
        headline="Ce que fait ProDay."
        support="Cinq portes. Un seul système. Joueur, Club, Coach, Supporter, Sponsor : les modules suivent le métier."
        video={visuals.heroVideo}
        poster={visuals.hero}
        primaryHref={ROUTES.demo}
        primaryLabel="Ouvrir la démo"
        secondaryHref="#poles"
        secondaryLabel="Voir les pôles"
      />

      {/* Interactive poles */}
      <section
        id="poles"
        className="scroll-mt-24 border-t border-white/10 bg-black px-4 py-20 sm:px-6 sm:py-28"
      >
        <div className="mx-auto max-w-6xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--pole-accent,#7C3AED)]">
            Cinq portes
          </p>
          <h2 className="mt-3 max-w-2xl font-display text-[clamp(1.8rem,4vw,2.8rem)] font-medium tracking-[-0.03em] text-white">
            Choisis ton entrée.
          </h2>
          <p className="mt-3 max-w-lg text-sm text-white/55">
            Santé, agent et recruteur ne sont plus des portes produit.
          </p>

          <div
            className="mt-10 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="tablist"
            aria-label="Pôles ProDay"
          >
            {FEATURE_POLES.map((p) => {
              const on = p.id === activePole;
              const hex = poleNavAccentHex(p.href);
              return (
                <button
                  key={p.id}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => setActivePole(p.id)}
                  className={`shrink-0 rounded-full px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.1em] transition ${
                    on
                      ? "text-white"
                      : "border border-white/15 bg-white/[0.03] text-white/65 hover:text-white"
                  }`}
                  style={on ? { backgroundColor: hex } : undefined}
                >
                  {p.navLabel}
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={pole.id}
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease }}
              className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center"
            >
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">
                  {pole.kicker}
                </p>
                <h3 className="mt-2 font-display text-3xl font-medium tracking-[-0.03em] text-white sm:text-4xl">
                  {pole.title}
                </h3>
                <p className="mt-2 text-sm text-white/50">{pole.subtitle}</p>
                <p className="mt-5 max-w-xl text-base leading-relaxed text-white/70">
                  {pole.description}
                </p>
                <ul className="mt-8 space-y-3">
                  {caps.items.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-white/80">
                      <Check
                        size={16}
                        className="mt-0.5 shrink-0"
                        style={{ color: accent }}
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={pole.href.includes("#") ? pole.href : poleSectionHref(pole)}
                  className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-white transition hover:opacity-80"
                  style={{ color: accent }}
                >
                  Explorer {pole.navLabel}
                  <ArrowRight size={16} />
                </Link>
              </div>

              <div className="relative aspect-[4/5] overflow-hidden border border-white/10 sm:aspect-[5/6]">
                <Image
                  src={
                    pole.id === "joueur"
                      ? "/images/football-action-01.jpg"
                      : pole.id === "pro_club" || pole.id === "president"
                        ? "/images/football-team-01.jpg"
                        : pole.id === "coach"
                          ? "/images/football-tactics-01.jpg"
                          : pole.id === "supporter"
                            ? "/images/football-crowd-01.jpg"
                            : "/images/football-handshake-01.jpg"
                  }
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 40vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <p className="font-display text-2xl font-medium text-white">{pole.navLabel}</p>
                  <p className="mt-1 text-sm text-white/60">{caps.title}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* Cross modules explorer */}
      <section className="border-t border-white/10 bg-[#050505] px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/40">
            Modules
          </p>
          <h2 className="mt-3 max-w-2xl font-display text-[clamp(1.8rem,4vw,2.8rem)] font-medium tracking-[-0.03em] text-white">
            Les briques du terrain.
          </h2>
          <p className="mt-3 max-w-md text-sm text-white/55">
            Tactique IA, Mercato, matchs, covoiturage, fil, reels : selon ton pôle.
          </p>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {CROSS_MODULES.map((m) => {
              const on = m.id === activeModule;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setActiveModule(m.id)}
                  className={`border px-4 py-4 text-left transition ${
                    on
                      ? "border-white/30 bg-white/[0.08]"
                      : "border-white/10 bg-transparent hover:border-white/20 hover:bg-white/[0.03]"
                  }`}
                >
                  <p className="font-display text-lg font-medium text-white">{m.title}</p>
                  <p className="mt-1 text-xs text-white/45">{m.subtitle}</p>
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={mod.id}
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0 }}
              transition={{ duration: 0.35, ease }}
              className="mt-10 grid gap-6 overflow-hidden border border-white/10 lg:grid-cols-[1fr_1.1fr]"
            >
              <div className="relative min-h-[220px] lg:min-h-[320px]">
                <Image
                  src={mod.image}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
              <div className="flex flex-col justify-center p-6 sm:p-10">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">
                  {mod.subtitle}
                </p>
                <h3 className="mt-2 font-display text-2xl font-medium text-white sm:text-3xl">
                  {mod.title}
                </h3>
                <p className="mt-4 text-base leading-relaxed text-white/65">{mod.description}</p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      <section className="border-t border-white/10 bg-black px-4 py-20 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/40">
            Système
          </p>
          <h2 className="mt-3 font-display text-[clamp(1.8rem,4vw,2.6rem)] font-medium tracking-[-0.03em] text-white">
            Une plateforme. Plusieurs métiers.
          </h2>
          <ul className="mt-12 divide-y divide-white/10 border-y border-white/10">
            {[
              {
                title: "Pôles clairs",
                body: "Cinq portes marketing. Agent, recruteur et Santé ne sont plus proposés.",
              },
              {
                title: "Club au centre",
                body: "Effectif, compétitions, covoiturage et permissions. Le club orchestre ; coachs et joueurs se branchent.",
              },
              {
                title: "Prix par pôle",
                body: "Pass Joueur optionnel 3,99 €. Club sur devis selon adhérents. Caméra en option. Coach Premium. Supporter gratuit.",
              },
            ].map((item) => (
              <li
                key={item.title}
                className="grid gap-2 py-6 sm:grid-cols-[minmax(0,220px)_1fr] sm:gap-8"
              >
                <h3 className="font-display text-lg font-medium text-white">{item.title}</h3>
                <p className="text-sm leading-relaxed text-white/60">{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <TerminalCta
        title="Tester avant de s’inscrire."
        description="La démo interactive reprend la navigation réelle. Puis la liste d’attente pour la bêta."
        primaryHref={ROUTES.demo}
        primaryLabel="Ouvrir la démo"
        secondaryHref={ROUTES.betaWaitlist}
        secondaryLabel="Liste d’attente"
      />
    </div>
  );
}
