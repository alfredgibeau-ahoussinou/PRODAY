"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { DemoPhoneStage } from "@/components/demo/DemoPhoneStage";
import { POLE_BRAND_HEX, SHOWCASE_POLES, pricingHrefForPole } from "@/lib/poles";
import {
  DEMO_POLE_SHORT_LABEL,
  demoUrlForPole,
  type DemoPoleId,
} from "@/lib/demoPoles";
import { ROUTES } from "@/lib/routes";

type DemoPageContentProps = {
  pole: DemoPoleId;
};

const POLE_BLURB: Record<DemoPoleId, string> = {
  joueur:
    "Profil, stats, covoiturage et Mercato. Pass optionnel pour IA et vidéo.",
  supporter: "Tribune gratuite : live, suivis et débats. Aucun paywall.",
  pro_club:
    "Équipes, convocations, compétitions et permissions. Amateur → Premium.",
  coach: "Tactique IA, effectif, IA et préparation match.",
  sponsor: "Campagnes, inventaire et contact clubs. KPIs lisibles.",
  sante: "Rôle intégré : agenda cabinet et demandes de sportifs.",
};

export function DemoPageContent({ pole }: DemoPageContentProps) {
  const router = useRouter();

  const onPoleChange = useCallback(
    (next: DemoPoleId) => {
      router.replace(demoUrlForPole(next), { scroll: false });
    },
    [router],
  );

  const accent = POLE_BRAND_HEX[pole] ?? "#006CFC";
  const showcaseIds = new Set(SHOWCASE_POLES.map((p) => p.id));
  const tabs = [
    ...SHOWCASE_POLES.map((p) => p.id as DemoPoleId),
    ...(pole === "sante" ? (["sante"] as DemoPoleId[]) : []),
  ];

  return (
    <section id="demo-app" className="scroll-mt-24 bg-black pb-20 sm:pb-28">
      <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6 sm:pt-14">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#4C8BFF]">
          Démo interactive
        </p>
        <h2 className="mt-3 max-w-xl font-display text-[clamp(1.8rem,4vw,2.8rem)] font-medium tracking-[-0.03em] text-white">
          Choisis un pôle. Touche l’écran.
        </h2>
        <p className="mt-3 max-w-lg text-sm text-white/55">
          Contenu illustratif : aucune donnée réelle. Navigue comme dans l’app, puis rejoins la
          bêta.
        </p>

        <div className="mt-10 overflow-hidden border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-3 sm:p-6">
          <div
            className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="tablist"
            aria-label="Choix du pôle de démo"
          >
            {tabs.map((id) => {
              const active = id === pole;
              const hex = POLE_BRAND_HEX[id] ?? "#006CFC";
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => onPoleChange(id)}
                  className={`shrink-0 rounded-full px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] transition sm:text-xs ${
                    active
                      ? "text-white"
                      : "border border-white/12 bg-white/[0.03] text-white/70 hover:text-white"
                  }`}
                  style={active ? { backgroundColor: hex } : undefined}
                >
                  {DEMO_POLE_SHORT_LABEL[id]}
                  {!showcaseIds.has(id) ? " · rôle" : ""}
                </button>
              );
            })}
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)_minmax(0,1fr)] lg:items-center">
            <div className="order-2 space-y-4 lg:order-1">
              <p className="font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: accent }}>
                Parcours actif
              </p>
              <motion.h3
                key={`title-${pole}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-display text-[clamp(1.8rem,3.6vw,2.6rem)] leading-[1.02] tracking-[-0.03em] text-white"
              >
                {DEMO_POLE_SHORT_LABEL[pole]}
              </motion.h3>
              <motion.p
                key={`blurb-${pole}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="max-w-sm text-sm leading-relaxed text-white/65"
              >
                {POLE_BLURB[pole]}
              </motion.p>
              {[
                "Changement de pôle instantané",
                "Onglets réalistes",
                "Passage direct vers la bêta",
              ].map((point) => (
                <div key={point} className="flex items-start gap-2 text-sm text-white/75">
                  <Check size={16} className="mt-0.5 shrink-0" style={{ color: accent }} />
                  <span>{point}</span>
                </div>
              ))}
            </div>

            <div className="order-1 border border-white/10 bg-black/40 p-2 sm:order-2 sm:p-4">
              <motion.p
                key={`label-${pole}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-4 text-center text-sm text-white/60"
              >
                Aperçu ·{" "}
                <span className="font-semibold text-white/85">{DEMO_POLE_SHORT_LABEL[pole]}</span>
              </motion.p>
              <DemoPhoneStage pole={pole} />
            </div>

            <div className="order-3 space-y-3 lg:pl-2">
              <div className="border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm text-white/80">
                  Pôle :{" "}
                  <span className="font-semibold text-white">{DEMO_POLE_SHORT_LABEL[pole]}</span>
                </p>
                <p className="mt-2 text-sm text-white/50">
                  Explore l’interface, puis ouvre la version complète en bêta.
                </p>
              </div>
              <Link
                href={ROUTES.betaWaitlist}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-full px-7 py-3 text-[12px] font-semibold uppercase tracking-[0.1em] text-white transition hover:brightness-110"
                style={{ backgroundColor: accent }}
              >
                Rejoindre la bêta
              </Link>
              <Link
                href={pricingHrefForPole(pole === "sante" ? "sante" : pole)}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-white/20 px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.1em] text-white/85 transition hover:border-white/40 hover:text-white"
              >
                Tarifs {DEMO_POLE_SHORT_LABEL[pole]}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
