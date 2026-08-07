"use client";

import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { Fragment, useState } from "react";
import { AnimatedMetric } from "@/components/immersive/AnimatedMetric";
import { ROUTES } from "@/lib/routes";

const ease = [0.22, 1, 0.36, 1] as const;

type TierId = "starter" | "territorial" | "national";

const TIERS: {
  id: TierId;
  name: string;
  price: string;
  tagline: string;
  highlight?: boolean;
}[] = [
  {
    id: "starter",
    name: "Découverte",
    price: "0",
    tagline: "Tester le terrain",
  },
  {
    id: "territorial",
    name: "Territorial",
    price: "49",
    tagline: "Un département",
  },
  {
    id: "national",
    name: "National Pro",
    price: "99",
    tagline: "Visibilité max",
    highlight: true,
  },
];

type Cell = boolean | string;

const COMPARE: { feature: string; group?: string; starter: Cell; territorial: Cell; national: Cell }[] = [
  {
    group: "Présence",
    feature: "Profil sponsor vérifié",
    starter: true,
    territorial: true,
    national: true,
  },
  {
    feature: "Offres actives",
    starter: "1",
    territorial: "Jusqu’à 5",
    national: "Illimitées",
  },
  {
    feature: "Zone géographique",
    starter: "Ville",
    territorial: "Département",
    national: "National + local",
  },
  {
    group: "Relation clubs",
    feature: "Messages clubs / mois",
    starter: "10",
    territorial: "Illimités",
    national: "Illimités",
  },
  {
    feature: "Prospects clubs recommandés",
    starter: false,
    territorial: true,
    national: true,
  },
  {
    feature: "Financement campagnes clubs",
    starter: false,
    territorial: true,
    national: true,
  },
  {
    group: "Visibilité",
    feature: "Logo mis en avant",
    starter: false,
    territorial: false,
    national: true,
  },
  {
    feature: "Campagnes ciblées",
    starter: false,
    territorial: false,
    national: true,
  },
  {
    feature: "Push géolocalisé (bêta)",
    starter: false,
    territorial: false,
    national: true,
  },
  {
    group: "Pilotage",
    feature: "Stats de base",
    starter: true,
    territorial: true,
    national: true,
  },
  {
    feature: "Dashboard ROI détaillé",
    starter: false,
    territorial: true,
    national: true,
  },
  {
    feature: "Account manager",
    starter: false,
    territorial: false,
    national: true,
  },
];

function CellView({ value }: { value: Cell }) {
  if (value === true) {
    return (
      <span className="inline-flex text-[var(--pole-accent,#D4AF37)]" aria-label="Inclus">
        <Check size={18} strokeWidth={2.5} />
      </span>
    );
  }
  if (value === false) {
    return <span className="text-white/25">—</span>;
  }
  return <span className="text-xs font-medium text-white/75">{value}</span>;
}

/** Interactive tier focus + full comparison table. */
export function SponsorTiersCompare() {
  const [focus, setFocus] = useState<TierId>("national");
  const tier = TIERS.find((t) => t.id === focus) ?? TIERS[2]!;
  const reduce = useReducedMotion();

  return (
    <section className="border-t border-white/10 bg-[#080706] px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--pole-accent,#D4AF37)]">
          Formules
        </p>
        <h2 className="mt-3 max-w-xl font-display text-[clamp(1.9rem,4.5vw,3rem)] font-medium tracking-[-0.03em] text-white">
          Trois niveaux.
          <br />
          <span className="text-white/40">Un seul terrain.</span>
        </h2>
        <p className="mt-4 max-w-lg text-sm text-white/55">
          Comparez Découverte, Territorial et National Pro — puis demandez un devis.
        </p>

        <div className="mt-10 flex flex-wrap gap-2" role="tablist">
          {TIERS.map((t) => {
            const on = t.id === focus;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setFocus(t.id)}
                className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                  on
                    ? "bg-[var(--pole-accent,#D4AF37)] text-black"
                    : "border border-white/15 text-white/70 hover:border-white/30"
                }`}
              >
                {t.name}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tier.id}
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease }}
            className="mt-8 flex flex-wrap items-end gap-6 border-b border-white/10 pb-10"
            role="tabpanel"
          >
            <div>
              <p className="text-sm text-white/45">{tier.tagline}</p>
              <p className="mt-1 flex items-baseline gap-1">
                <AnimatedMetric
                  value={tier.price}
                  className="font-display text-5xl font-medium tracking-[-0.04em] text-white"
                />
                <span className="text-sm text-white/40">€ / mois</span>
              </p>
            </div>
            <Link
              href={ROUTES.sponsorDevis}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--pole-accent,#D4AF37)] px-5 py-2.5 text-sm font-semibold text-black transition hover:brightness-110"
            >
              Demander un devis
              <ArrowRight size={14} />
            </Link>
          </motion.div>
        </AnimatePresence>

        <div className="mt-10 overflow-x-auto rounded-sm border border-white/10">
          <table className="w-full min-w-[680px] border-collapse text-left">
            <thead>
              <tr className="border-b border-white/10 bg-black/50">
                <th className="sticky left-0 z-10 bg-[#080706] px-4 py-4 text-xs font-medium uppercase tracking-[0.14em] text-white/40 sm:px-5">
                  Différences
                </th>
                {TIERS.map((t) => (
                  <th
                    key={t.id}
                    className={`px-3 py-4 text-center text-sm font-semibold sm:px-4 ${
                      t.highlight
                        ? "bg-[var(--pole-accent,#D4AF37)]/12 text-[var(--pole-accent,#D4AF37)]"
                        : "text-white/80"
                    }`}
                  >
                    {t.name}
                    <span className="mt-1 block font-display text-base font-medium tabular-nums text-white">
                      {t.price === "0" ? "Gratuit" : `${t.price} €`}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARE.map((row) => (
                <Fragment key={`${row.group ?? ""}-${row.feature}`}>
                  {row.group ? (
                    <tr className="border-t border-white/10 bg-white/[0.03]">
                      <td
                        colSpan={4}
                        className="px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--pole-accent,#D4AF37)] sm:px-5"
                      >
                        {row.group}
                      </td>
                    </tr>
                  ) : null}
                  <tr className="border-t border-white/[0.06] hover:bg-white/[0.02]">
                    <th
                      scope="row"
                      className="sticky left-0 z-10 bg-[#080706] px-4 py-3 text-sm font-medium text-white/80 sm:px-5"
                    >
                      {row.feature}
                    </th>
                    <td className="px-3 py-3 text-center sm:px-4">
                      <CellView value={row.starter} />
                    </td>
                    <td className="px-3 py-3 text-center sm:px-4">
                      <CellView value={row.territorial} />
                    </td>
                    <td
                      className={`px-3 py-3 text-center sm:px-4 ${
                        TIERS[2]?.highlight ? "bg-[var(--pole-accent,#D4AF37)]/[0.05]" : ""
                      }`}
                    >
                      <CellView value={row.national} />
                    </td>
                  </tr>
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

const CAPS = [
  {
    id: "geo",
    label: "Geo",
    title: "Près du terrain",
    body: "Ciblez une ville, un département ou le national. Vos offres touchent clubs et joueurs actifs — pas une audience hors-sol.",
  },
  {
    id: "roi",
    label: "ROI",
    title: "Mesure lisible",
    body: "Impressions, clics, leads. Chaque offre a son tableau de bord dans l’app.",
  },
  {
    id: "clubs",
    label: "Clubs",
    title: "Contact direct",
    body: "Messagerie avec structures vérifiées. Financement de campagnes club selon la formule.",
  },
];

export function SponsorCapabilityPlay() {
  const [active, setActive] = useState(CAPS[0]!.id);
  const cap = CAPS.find((c) => c.id === active) ?? CAPS[0]!;
  const reduce = useReducedMotion();

  return (
    <section className="border-t border-white/10 bg-black px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--pole-accent,#D4AF37)]">
          Sur le terrain
        </p>
        <h2 className="mt-3 max-w-xl font-display text-[clamp(1.9rem,4.5vw,3rem)] font-medium tracking-[-0.03em] text-white">
          Visibilité mesurée.
          <br />
          <span className="text-white/40">Pas de campagne fantôme.</span>
        </h2>

        <div className="mt-12 flex flex-wrap gap-2">
          {CAPS.map((c) => {
            const on = c.id === active;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setActive(c.id)}
                className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                  on
                    ? "bg-[var(--pole-accent,#D4AF37)] text-black"
                    : "border border-white/15 text-white/65 hover:border-white/30"
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={cap.id}
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0 }}
            transition={{ duration: 0.3, ease }}
            className="mt-10 max-w-xl border-l-2 border-[var(--pole-accent,#D4AF37)] pl-6"
          >
            <h3 className="font-display text-2xl font-medium text-white">{cap.title}</h3>
            <p className="mt-3 text-base leading-relaxed text-white/60">{cap.body}</p>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

export function SponsorWarmCta() {
  return (
    <section className="relative overflow-hidden border-t border-white/10 bg-black px-4 py-24 sm:px-6 sm:py-32">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 65% 50% at 50% 80%, rgba(212,175,55,0.22), transparent 60%)",
        }}
      />
      <div className="relative mx-auto max-w-3xl text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--pole-accent,#D4AF37)]">
          Partenaires
        </p>
        <h2 className="mt-4 font-display text-[clamp(2rem,5vw,3.2rem)] font-medium leading-[1.05] tracking-[-0.035em] text-white">
          Mettez votre marque
          <br />
          sur le terrain.
        </h2>
        <p className="mx-auto mt-5 max-w-md text-base text-white/55">
          Devis en ligne. L’équipe partenaires ProDay vous répond sous 48 h.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            href={ROUTES.sponsorDevis}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--pole-accent,#D4AF37)] px-7 py-3.5 text-sm font-semibold text-black transition hover:brightness-110"
          >
            Demander un devis
            <ArrowRight size={16} />
          </Link>
          <Link
            href={ROUTES.partenairesConvention}
            className="inline-flex items-center gap-2 rounded-full border border-white/25 px-7 py-3.5 text-sm font-semibold text-white/85 transition hover:border-white/50"
          >
            Voir la convention
          </Link>
        </div>
      </div>
    </section>
  );
}
