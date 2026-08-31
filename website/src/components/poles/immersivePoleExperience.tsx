"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { Fragment, useState } from "react";
import { AnimatedMetric } from "@/components/immersive/AnimatedMetric";
import { HeroVideoBackground } from "@/components/HeroVideoBackground";
import { ROUTES } from "@/lib/routes";

const ease = [0.22, 1, 0.36, 1] as const;

type ImmersiveHeroProps = {
  brand: string;
  headline: string;
  support: string;
  video?: string;
  poster: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  /** Ligne de confiance sous les CTA (ex. parrainage). */
  perk?: string;
};

/** First viewport: brand + one headline + one sentence + CTAs on full-bleed media. */
export function ImmersivePoleHero({
  brand,
  headline,
  support,
  video,
  poster,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  perk,
}: ImmersiveHeroProps) {
  const reduce = useReducedMotion();

  return (
    <header className="relative isolate min-h-[100svh] overflow-hidden bg-black text-white">
      <div className="absolute inset-0">
        {video ? (
          <HeroVideoBackground sources={[video]} poster={poster} opacity={0.95} />
        ) : (
          <Image src={poster} alt="" fill priority className="object-cover" sizes="100vw" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/20" />
        <div
          className="absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% 100%, var(--pole-accent-glow, rgba(0,108,252,0.35)), transparent 55%)",
          }}
        />
      </div>

      <div className="relative mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end px-4 pb-[max(4rem,env(safe-area-inset-bottom))] pt-24 sm:px-6 sm:pb-24 sm:pt-28">
        <motion.p
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease }}
          className="font-display text-[clamp(1.35rem,3.5vw,2.4rem)] font-semibold tracking-[-0.03em] text-white"
        >
          {brand}
        </motion.p>
        <motion.h1
          initial={reduce ? false : { opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.06, ease }}
          className="mt-2 max-w-3xl font-display text-[clamp(2.2rem,8vw,5.6rem)] font-medium leading-[0.94] tracking-[-0.045em] sm:mt-3"
        >
          {headline}
        </motion.h1>
        <motion.p
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.14, ease }}
          className="mt-4 max-w-md text-sm leading-relaxed text-white/70 sm:mt-6 sm:text-base lg:text-lg"
        >
          {support}
        </motion.p>
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.22, ease }}
          className="mt-8 flex w-full flex-col gap-3 sm:mt-10 sm:w-auto sm:flex-row sm:flex-wrap"
        >
          <Link
            href={primaryHref}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--pole-accent,#7C3AED)] px-6 py-3.5 text-sm font-semibold text-white transition hover:brightness-110"
          >
            {primaryLabel}
            <ArrowRight size={16} />
          </Link>
          {secondaryHref && secondaryLabel ? (
            <Link
              href={secondaryHref}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/25 px-6 py-3.5 text-sm font-semibold text-white/85 transition hover:border-white/50 hover:bg-white/5"
            >
              {secondaryLabel}
            </Link>
          ) : null}
        </motion.div>
        {perk ? (
          <motion.p
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45, delay: 0.32, ease }}
            className="mt-5 max-w-lg font-mono text-[10px] uppercase tracking-[0.16em] text-white/45 sm:mt-6"
          >
            {perk}
          </motion.p>
        ) : null}
      </div>
    </header>
  );
}

type Zone = { id: string; label: string; title: string; body: string; x: string; y: string };

const CLUB_ZONES: Zone[] = [
  {
    id: "equipes",
    label: "01",
    title: "Équipes & licenciés",
    body: "Catégories, coachs, dirigeants, bénévoles et parents : permissions par invitation.",
    x: "16%",
    y: "26%",
  },
  {
    id: "sport",
    label: "02",
    title: "Matchs & compétitions",
    body: "Invitations club ↔ club, amicaux, calendrier, résultats, classements et joueur du match.",
    x: "72%",
    y: "22%",
  },
  {
    id: "bourse",
    label: "03",
    title: "Bourse de recrutement",
    body: "Poste manquant : vivier équipe B, réserve, autre catégorie, puis entre clubs ProDay.",
    x: "48%",
    y: "42%",
  },
  {
    id: "covoit",
    label: "04",
    title: "Covoiturage",
    body: "Matchs, entraînements, stages et détections. Suivi live pour les parents.",
    x: "22%",
    y: "68%",
  },
  {
    id: "hub",
    label: "05",
    title: "Direction du club",
    body: "Ce qui va bien, à surveiller, décisions : adhésions, sponsors, tournois.",
    x: "58%",
    y: "70%",
  },
  {
    id: "comms",
    label: "06",
    title: "Présences & comms",
    body: "Convocations, retards annoncés, annonces structure · sans tableurs ni WhatsApp.",
    x: "82%",
    y: "58%",
  },
];

/** Interactive pitch zones : one job: explore club capabilities. */
export function ClubPitchMap() {
  const [active, setActive] = useState(CLUB_ZONES[0]!.id);
  const current = CLUB_ZONES.find((z) => z.id === active) ?? CLUB_ZONES[0]!;
  const reduce = useReducedMotion();

  return (
    <section className="relative overflow-hidden border-t border-white/10 bg-black px-4 py-14 sm:px-6 sm:py-20 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--pole-accent,#7C3AED)]">
          Cockpit club
        </p>
        <h2 className="mt-3 max-w-xl font-display text-[clamp(1.65rem,4vw,2.8rem)] font-medium tracking-[-0.03em] text-white">
          Un terrain. Six commandes.
        </h2>
        <p className="mt-3 max-w-md text-sm text-white/55">
          Explorez les zones : chaque point ouvre une capacité du club.
        </p>

        {/* Mobile zone chips : easier than tiny map hits */}
        <div className="mt-6 flex gap-2 overflow-x-auto pb-1 lg:hidden">
          {CLUB_ZONES.map((z) => {
            const on = z.id === active;
            return (
              <button
                key={`chip-${z.id}`}
                type="button"
                onClick={() => setActive(z.id)}
                className={`shrink-0 rounded-full border px-3.5 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] transition ${
                  on
                    ? "border-[var(--pole-accent,#7C3AED)] bg-[var(--pole-accent,#7C3AED)] text-white"
                    : "border-white/20 text-white/55"
                }`}
              >
                {z.label} · {z.title.split(/[&·]/)[0]!.trim()}
              </button>
            );
          })}
        </div>

        <div className="mt-8 grid gap-6 sm:mt-10 sm:gap-8 lg:mt-12 lg:grid-cols-[minmax(0,1.6fr)_minmax(16rem,0.85fr)] lg:items-center xl:grid-cols-[minmax(0,1.7fr)_minmax(18rem,0.75fr)]">
          <div
            className="relative mx-auto w-full overflow-hidden border border-white/10
              aspect-[5/4] max-h-[min(52vh,22rem)]
              sm:aspect-[16/11] sm:max-h-[min(56vh,28rem)]
              lg:mx-0 lg:aspect-[16/10] lg:max-h-none lg:min-h-[min(58vh,28rem)]
              xl:min-h-[min(62vh,34rem)]
              2xl:min-h-[min(64vh,38rem)]"
            style={{
              background:
                "linear-gradient(160deg, #0a3d1a 0%, #14532d 40%, #166534 100%)",
            }}
          >
            {/* pitch lines */}
            <div className="pointer-events-none absolute inset-[6%] border border-white/25 sm:inset-[8%]" />
            <div className="pointer-events-none absolute left-1/2 top-[6%] bottom-[6%] w-px -translate-x-1/2 bg-white/25 sm:top-[8%] sm:bottom-[8%]" />
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-[clamp(18%,22%,26%)] w-[clamp(18%,22%,26%)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/25" />
            <div
              className="pointer-events-none absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(90deg, transparent, transparent 48px, rgba(255,255,255,0.04) 48px, rgba(255,255,255,0.04) 96px)",
              }}
            />

            {CLUB_ZONES.map((z) => {
              const on = z.id === active;
              return (
                <button
                  key={z.id}
                  type="button"
                  onClick={() => setActive(z.id)}
                  className="absolute z-10 -translate-x-1/2 -translate-y-1/2 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                  style={{ left: z.x, top: z.y }}
                  aria-pressed={on}
                  aria-label={z.title}
                >
                  <motion.span
                    animate={
                      reduce
                        ? undefined
                        : on
                          ? { scale: 1.12 }
                          : { scale: [1, 1.06, 1] }
                    }
                    transition={
                      on
                        ? { duration: 0.25 }
                        : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
                    }
                    className={`flex size-[clamp(2.35rem,3.8vw+0.6rem,3.35rem)] items-center justify-center rounded-full border text-[clamp(0.65rem,1.1vw,0.8rem)] font-bold tabular-nums ${
                      on
                        ? "border-white bg-[var(--pole-accent,#7C3AED)] text-white shadow-[0_0_28px_var(--pole-accent-glow)]"
                        : "border-white/40 bg-black/50 text-white/80 backdrop-blur-sm"
                    }`}
                  >
                    {z.label}
                  </motion.span>
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease }}
              className="flex flex-col justify-center border-t border-white/10 pt-6 sm:pt-8 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0 xl:pl-10"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">
                Zone {current.label}
              </p>
              <h3 className="mt-2 font-display text-xl font-medium tracking-[-0.02em] text-white sm:mt-3 sm:text-2xl lg:text-3xl">
                {current.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-white/65 sm:mt-4 sm:text-base">
                {current.body}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

export { ClubOffersInteractive } from '@/components/poles/ClubOffersInteractive';

const FORMATION_SPOTS = [
  { id: "gk", label: "GB", x: 50, y: 88 },
  { id: "lb", label: "AG", x: 18, y: 70 },
  { id: "cb1", label: "DC", x: 38, y: 72 },
  { id: "cb2", label: "DC", x: 62, y: 72 },
  { id: "rb", label: "AD", x: 82, y: 70 },
  { id: "cm1", label: "MC", x: 32, y: 48 },
  { id: "cm2", label: "MC", x: 50, y: 52 },
  { id: "cm3", label: "MC", x: 68, y: 48 },
  { id: "lw", label: "AG", x: 22, y: 28 },
  { id: "st", label: "BU", x: 50, y: 22 },
  { id: "rw", label: "AD", x: 78, y: 28 },
];

const CONSIGNES: Record<string, string> = {
  gk: "Sorties courtes. Relance pied gauche.",
  lb: "Chevauchement sur phases offensives.",
  cb1: "Couverture axe. Duels aériens.",
  cb2: "Relance longue sur ailier droit.",
  rb: "Largeur. Presses hautes sur 1er relais.",
  cm1: "Rupture. Presses après perte.",
  cm2: "Pivot. Tempo et orientation.",
  cm3: "Box-to-box. 2e ballon.",
  lw: "1v1. Centres bas.",
  st: "Appels dans le dos. Finitions 1 touche.",
  rw: "Couloirs. Coupe vers l’intérieur.",
};

/** Interactive 4-3-3 board preview for Coach pole. */
export function CoachTacticsBoard() {
  const [active, setActive] = useState("st");
  const reduce = useReducedMotion();

  return (
    <section className="relative overflow-hidden border-t border-white/10 bg-black px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--pole-accent,#22C55E)]">
          Tactique IA
        </p>
        <h2 className="mt-3 max-w-xl font-display text-[clamp(1.8rem,4vw,2.8rem)] font-medium tracking-[-0.03em] text-white">
          Composez. Touchez. Consignez.
        </h2>
        <p className="mt-3 max-w-md text-sm text-white/55">
          Sélectionnez un poste : consignes individuelles et collectives dans le même board.
        </p>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div
            className="relative aspect-[3/4] max-h-[560px] w-full overflow-hidden rounded-sm border border-white/10 sm:aspect-[4/5] lg:max-h-none lg:aspect-[3/4]"
            style={{
              background:
                "linear-gradient(180deg, #14532d 0%, #166534 45%, #0a3d1a 100%)",
            }}
          >
            <div className="pointer-events-none absolute inset-[6%] border border-white/20" />
            <div className="pointer-events-none absolute inset-x-[6%] top-1/2 h-px bg-white/20" />
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-[18%] w-[28%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20" />

            {FORMATION_SPOTS.map((s) => {
              const on = s.id === active;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActive(s.id)}
                  className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${s.x}%`, top: `${s.y}%` }}
                  aria-pressed={on}
                >
                  <motion.span
                    layout
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-[10px] font-bold ${
                      on
                        ? "bg-white text-[#0a3d1a] shadow-[0_0_24px_rgba(255,255,255,0.45)]"
                        : "border border-white/50 bg-[var(--pole-accent,#22C55E)]/90 text-white"
                    }`}
                    whileHover={reduce ? undefined : { scale: 1.08 }}
                    whileTap={reduce ? undefined : { scale: 0.96 }}
                  >
                    {s.label}
                  </motion.span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col justify-center gap-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={reduce ? false : { opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduce ? undefined : { opacity: 0, x: -8 }}
                transition={{ duration: 0.3, ease }}
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">
                  Consigne · {FORMATION_SPOTS.find((s) => s.id === active)?.label}
                </p>
                <p className="mt-3 text-lg leading-relaxed text-white/85">
                  {CONSIGNES[active]}
                </p>
              </motion.div>
            </AnimatePresence>

            <div className="grid grid-cols-2 gap-6 border-t border-white/10 pt-8">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                  Potentiel
                </p>
                <AnimatedMetric
                  value="86"
                  className="mt-1 font-display text-4xl font-medium text-white"
                />
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                  Disponible
                </p>
                <div className="mt-1 flex items-baseline gap-1">
                  <AnimatedMetric
                    value="78"
                    className="font-display text-4xl font-medium text-[var(--pole-accent,#22C55E)]"
                  />
                  <span className="text-sm text-white/45">%</span>
                </div>
              </div>
            </div>
            <p className="text-sm text-white/50">
              Analyse de forme : sommeil, fatigue, stress, récupération déclarée,
              minutes et présences · indicateurs, pas de diagnostic.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

type Capability = { title: string; body: string };

export function CoachCapabilityStrip({ items }: { items: Capability[] }) {
  const reduce = useReducedMotion();

  return (
    <section className="border-t border-white/10 bg-[#050505] px-4 py-20 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--pole-accent,#22C55E)]">
          Profil coach
        </p>
        <h2 className="mt-3 font-display text-[clamp(1.8rem,4vw,2.6rem)] font-medium tracking-[-0.03em] text-white">
          Tout le banc de touche.
        </h2>
        <ul className="mt-12 divide-y divide-white/10 border-y border-white/10">
          {items.map((item, i) => (
            <motion.li
              key={item.title}
              initial={reduce ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.05, duration: 0.4, ease }}
              className="grid gap-2 py-6 sm:grid-cols-[minmax(0,220px)_1fr] sm:gap-8"
            >
              <h3 className="font-display text-lg font-medium text-white">{item.title}</h3>
              <p className="text-sm leading-relaxed text-white/60">{item.body}</p>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
