"use client";

import Link from "next/link";
import { Fragment, useMemo, useState } from "react";
import { ArrowRight, Check, Minus } from "lucide-react";
import { VeoCameraMark } from "@/components/poles/VeoCameraMark";
import { NO_COMMITMENT_BADGE, NO_COMMITMENT_QUOTE_LINE } from "@/lib/commercialCopy";
import { ROUTES } from "@/lib/routes";

type OfferCol = {
  id: string;
  label: string;
  price: string;
  unit: string;
  tagline: string;
  priceHint?: string;
  highlight?: boolean;
  /** Show mini 3D Veo camera instead of spelling “Veo”. */
  showVeoMark?: boolean;
};

const CLUB_OFFER_COLS: OfferCol[] = [
  {
    id: "amateur",
    label: "Amateur",
    price: "4,99 €",
    unit: "/ mois",
    tagline: "Petits clubs",
  },
  {
    id: "essentiel",
    label: "Essentiel",
    price: "11,99 €",
    unit: "/ mois",
    tagline: "Gestion club",
  },
  {
    id: "premium",
    label: "Tout inclus",
    price: "Sur devis",
    unit: "",
    tagline: "Votre matériel",
    priceHint: "À partir de 3 € / adhérent · sur devis",
    highlight: true,
  },
  {
    id: "video_pro",
    label: "Pro +",
    price: "Sur devis",
    unit: "",
    tagline: "Clé en main",
    priceHint: "À partir de 3 € / adhérent · sur devis (+ option caméra)",
    showVeoMark: true,
  },
];

type Cell = boolean | string;

type CompareRow = {
  feature: string;
  group?: string;
  cells: Cell[];
};

const CLUB_COMPARE_ROWS: CompareRow[] = [
  {
    group: "Gestion",
    feature: "Gestion des licenciés",
    cells: [true, true, true, true],
  },
  {
    feature: "Convocations & présences",
    cells: [true, true, true, true],
  },
  {
    feature: "Calendrier & communication",
    cells: [true, true, true, true],
  },
  {
    feature: "Covoiturage",
    cells: [true, true, true, true],
  },
  {
    feature: "Résultats & classements auto",
    cells: [true, true, true, true],
  },
  {
    group: "Compétition",
    feature: "Centre compétitions complet",
    cells: [false, true, true, true],
  },
  {
    feature: "Administration multi équipes",
    cells: ["Basique", true, true, true],
  },
  {
    feature: "Suivi des recrutements",
    cells: [false, true, true, true],
  },
  {
    feature: "Analyse de forme",
    cells: [true, true, true, true],
  },
  {
    feature: "Suivi de charge & récupération",
    cells: [true, true, true, true],
  },
  {
    group: "Performance",
    feature: "Tactique IA (tableau, formations)",
    cells: [false, "Coach abo.", true, true],
  },
  {
    feature: "Assistant IA & rapports auto",
    cells: [false, "Coach abo.", true, true],
  },
  {
    feature: "Analyse vidéo (smartphone / tablette)",
    cells: [false, "Coach abo.", true, true],
  },
  {
    feature: "Entraînements IA (collectifs & individuels)",
    cells: [false, "Coach abo.", true, true],
  },
  {
    group: "Matériel vidéo",
    feature: "Caméra obligatoire",
    cells: ["Non", "Non", "Non", "Non"],
  },
  {
    feature: "Pack caméra (trépied, install…)",
    cells: [false, false, false, true],
  },
  {
    feature: "Cloud, découpage auto, bibliothèque",
    cells: [false, false, "Votre mat.", true],
  },
  {
    group: "Qui paie ?",
    feature: "Coachs inclus (0 € pour eux)",
    cells: [false, false, true, true],
  },
  {
    feature: "Staff & dirigeants inclus",
    cells: [false, false, true, true],
  },
  {
    feature: "Joueurs couverts par le club",
    cells: [false, false, true, true],
  },
  {
    feature: "Pass Joueur Premium (option)",
    cells: ["3,99 €/joueur", "3,99 €/joueur", "3,99 €/joueur", "3,99 €/joueur"],
  },
];

function CompareCell({ value }: { value: Cell }) {
  if (value === true) {
    return (
      <span
        className="inline-flex items-center justify-center text-[var(--pole-accent,#7C3AED)]"
        aria-label="Inclus"
      >
        <Check size={18} strokeWidth={2.5} />
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="text-white/25" aria-label="Non inclus">
        …
      </span>
    );
  }
  return (
    <span className="text-xs font-medium leading-snug text-white/70">{value}</span>
  );
}

function MobileFeatureValue({ value }: { value: Cell }) {
  if (value === true) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[var(--pole-accent-bright,#F5D04A)]">
        <Check size={15} strokeWidth={2.5} />
        <span className="text-xs font-medium">Inclus</span>
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="inline-flex items-center gap-1.5 text-white/30">
        <Minus size={14} />
        <span className="text-xs">Non</span>
      </span>
    );
  }
  return <span className="text-xs font-medium text-white/75">{value}</span>;
}

function buildPlanFeatures(colIndex: number) {
  const groups: { name: string; rows: { feature: string; value: Cell }[] }[] = [];
  let current: { name: string; rows: { feature: string; value: Cell }[] } | null =
    null;

  for (const row of CLUB_COMPARE_ROWS) {
    if (row.group) {
      current = { name: row.group, rows: [] };
      groups.push(current);
    }
    if (!current) {
      current = { name: "Offre", rows: [] };
      groups.push(current);
    }
    current.rows.push({
      feature: row.feature,
      value: row.cells[colIndex] ?? false,
    });
  }
  return groups;
}

/** Comparative table desktop + card picker mobile. */
export function ClubOffersInteractive() {
  const [activeId, setActiveId] = useState(
    () => CLUB_OFFER_COLS.find((c) => c.highlight)?.id ?? CLUB_OFFER_COLS[0]!.id,
  );
  const activeIndex = CLUB_OFFER_COLS.findIndex((c) => c.id === activeId);
  const colIndex = activeIndex >= 0 ? activeIndex : 0;
  const activeCol = CLUB_OFFER_COLS[colIndex]!;
  const planGroups = useMemo(() => buildPlanFeatures(colIndex), [colIndex]);

  return (
    <section className="relative border-t border-white/10 bg-[#050505] px-4 py-14 sm:px-6 sm:py-20 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--pole-accent,#7C3AED)]">
          Comparatif
        </p>
        <h2 className="mt-3 max-w-2xl font-display text-[clamp(1.65rem,4vw,2.8rem)] font-medium tracking-[-0.03em] text-white">
          Quatre formules Club
        </h2>
        <p className="mt-3 max-w-lg text-sm text-white/55">
          Amateur · Essentiel · Tout inclus · Pro + Veo. Analyse de forme incluse.
          Sur devis = à partir de 3 € / adhérent. Caméra jamais obligatoire.{" "}
          {NO_COMMITMENT_QUOTE_LINE}
        </p>

        {/* Mobile: plan picker + feature card */}
        <div className="mt-8 md:hidden">
          <div
            className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="tablist"
            aria-label="Formules Club"
          >
            {CLUB_OFFER_COLS.map((col) => {
              const on = col.id === activeId;
              return (
                <button
                  key={col.id}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => setActiveId(col.id)}
                  className={`shrink-0 rounded-full border px-3.5 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] transition ${
                    on
                      ? col.highlight
                        ? "border-[var(--pole-accent,#7C3AED)] bg-[var(--pole-accent,#7C3AED)] text-white"
                        : "border-white bg-white text-black"
                      : "border-white/20 text-white/55"
                  }`}
                >
                  {col.showVeoMark ? "Pro +" : col.label}
                </button>
              );
            })}
          </div>

          <article
            className={`mt-4 border p-4 ${
              activeCol.highlight
                ? "border-[var(--pole-accent,#7C3AED)]/45 bg-[var(--pole-accent,#7C3AED)]/[0.08]"
                : "border-white/10 bg-[#0a0a0c]"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {activeCol.showVeoMark ? (
                  <div className="mb-2">
                    <VeoCameraMark size="sm" caption />
                  </div>
                ) : null}
                <h3 className="font-display text-xl font-medium tracking-[-0.02em] text-white">
                  {activeCol.showVeoMark ? (
                    <>
                      Pro + <span className="sr-only">Veo</span>
                    </>
                  ) : (
                    activeCol.label
                  )}
                </h3>
                <p className="mt-1 text-[11px] text-white/45">{activeCol.tagline}</p>
              </div>
              <div className="shrink-0 text-right">
                <p
                  className={`font-display text-xl font-medium tabular-nums tracking-[-0.03em] ${
                    activeCol.highlight
                      ? "text-[var(--pole-accent-bright,#F5D04A)]"
                      : "text-white"
                  }`}
                >
                  {activeCol.price}
                </p>
                {activeCol.unit ? (
                  <p className="text-[10px] text-white/40">{activeCol.unit}</p>
                ) : null}
                <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-white/40">
                  {NO_COMMITMENT_BADGE}
                </p>
                {activeCol.priceHint ? (
                  <p className="mt-1 max-w-[9rem] text-[10px] leading-snug text-white/45">
                    {activeCol.priceHint}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="mt-5 space-y-5">
              {planGroups.map((group) => (
                <div key={group.name}>
                  <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--pole-accent,#7C3AED)]">
                    {group.name}
                  </p>
                  <ul className="mt-2 divide-y divide-white/8 border-t border-white/10">
                    {group.rows.map((row) => (
                      <li
                        key={row.feature}
                        className="flex items-center justify-between gap-3 py-2.5"
                      >
                        <span className="min-w-0 text-[13px] leading-snug text-white/75">
                          {row.feature}
                        </span>
                        <span className="shrink-0">
                          <MobileFeatureValue value={row.value} />
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <Link
              href={
                activeCol.price === "Sur devis"
                  ? ROUTES.clubDevis
                  : ROUTES.betaWaitlist
              }
              className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[var(--pole-accent,#7C3AED)] px-5 text-sm font-semibold text-white"
            >
              {activeCol.price === "Sur devis" ? "Demander un devis" : "Commencer"}
              <ArrowRight size={16} />
            </Link>
          </article>
        </div>

        {/* Desktop / tablet: comparison table */}
        <div className="mt-12 hidden overflow-x-auto rounded-sm border border-white/10 md:block">
          <table className="w-full min-w-[820px] border-collapse text-left">
            <thead>
              <tr className="border-b border-white/10 bg-black/60">
                <th
                  scope="col"
                  className="sticky left-0 z-10 bg-[#050505] px-4 py-5 text-xs font-medium uppercase tracking-[0.14em] text-white/40 sm:px-5"
                >
                  Fonctionnalité
                </th>
                {CLUB_OFFER_COLS.map((col) => (
                  <th
                    key={col.id}
                    scope="col"
                    className={`px-3 py-5 text-center sm:px-4 ${
                      col.highlight
                        ? "bg-[var(--pole-accent,#7C3AED)]/15 ring-1 ring-inset ring-[var(--pole-accent,#7C3AED)]/40"
                        : ""
                    }`}
                  >
                    {col.showVeoMark ? (
                      <div className="mb-3 flex justify-center py-1">
                        <VeoCameraMark size="md" caption />
                      </div>
                    ) : null}
                    <span
                      className={`block font-display text-base font-medium tracking-[-0.02em] sm:text-lg ${
                        col.highlight ? "text-white" : "text-white/90"
                      }`}
                    >
                      {col.showVeoMark ? (
                        <>
                          Pro + <span className="sr-only">Veo</span>
                        </>
                      ) : (
                        col.label
                      )}
                    </span>
                    <span className="mt-1 block text-[10px] text-white/45 sm:text-[11px]">
                      {col.tagline}
                    </span>
                    <span
                      className={`mt-2 block font-display text-lg font-medium tabular-nums tracking-[-0.03em] sm:text-xl ${
                        col.highlight
                          ? "text-[var(--pole-accent,#F5D04A)]"
                          : "text-white"
                      }`}
                    >
                      {col.price}
                      {col.unit ? (
                        <span className="ml-1 text-[10px] font-sans font-normal text-white/40 sm:text-xs">
                          {col.unit}
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.12em] text-white/40">
                      {NO_COMMITMENT_BADGE}
                    </span>
                    {col.priceHint ? (
                      <span className="mt-1 block text-[10px] font-normal leading-snug text-white/45">
                        {col.priceHint}
                      </span>
                    ) : null}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CLUB_COMPARE_ROWS.map((row) => (
                <Fragment key={`${row.group ?? ""}-${row.feature}`}>
                  {row.group ? (
                    <tr className="border-t border-white/10 bg-white/[0.03]">
                      <td
                        colSpan={5}
                        className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--pole-accent,#7C3AED)] sm:px-5"
                      >
                        {row.group}
                      </td>
                    </tr>
                  ) : null}
                  <tr className="border-t border-white/[0.06] transition hover:bg-white/[0.02]">
                    <th
                      scope="row"
                      className="sticky left-0 z-10 bg-[#050505] px-4 py-3.5 text-sm font-medium text-white/80 sm:px-5"
                    >
                      {row.feature}
                    </th>
                    {row.cells.map((cell, i) => (
                      <td
                        key={`${row.feature}-${i}`}
                        className={`px-3 py-3.5 text-center sm:px-4 ${
                          i === 2 && CLUB_OFFER_COLS[2]?.highlight
                            ? "bg-[var(--pole-accent,#7C3AED)]/[0.06]"
                            : ""
                        }`}
                      >
                        <CompareCell value={cell} />
                      </td>
                    ))}
                  </tr>
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <p className="max-w-xl text-xs leading-relaxed text-white/40">
            « Coach abo. » = Tactique IA / IA / vidéo via abonnement Coach individuel. Pro + Veo :
            prix catalogue ajustable depuis l’administration.
          </p>
          <Link
            href={ROUTES.clubDevis}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[var(--pole-accent,#7C3AED)] px-5 text-sm font-semibold text-white transition hover:brightness-110 sm:min-h-0"
          >
            Demander un devis
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
