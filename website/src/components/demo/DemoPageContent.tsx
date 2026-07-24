"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { motion } from "framer-motion";
import { DemoPhoneStage } from "@/components/demo/DemoPhoneStage";
import { UNIVERSE_THEME } from "@/components/universe/universeTheme";
import { CAROUSEL_POLES, pricingHrefForPole } from "@/lib/poles";
import {
  DEMO_POLE_SHORT_LABEL,
  demoUrlForPole,
  themeIdForDemoPole,
  type DemoPoleId,
} from "@/lib/demoPoles";
import { ROUTES } from "@/lib/routes";

type DemoPageContentProps = {
  pole: DemoPoleId;
};

export function DemoPageContent({ pole }: DemoPageContentProps) {
  const router = useRouter();
  const theme = UNIVERSE_THEME[themeIdForDemoPole(pole)];

  const onPoleChange = useCallback(
    (next: DemoPoleId) => {
      router.replace(demoUrlForPole(next), { scroll: false });
    },
    [router],
  );

  return (
    <div id="demo-app" className="scroll-mt-24 bg-black pb-20">
      <div className="mx-auto max-w-5xl px-4 pt-10 sm:px-6">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.22em] text-white/40">
          Choisissez un pôle
        </p>
        <div
          className="mt-5 flex gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label="Pôles ProDay"
        >
          {CAROUSEL_POLES.map((item) => {
            const id = item.id as DemoPoleId;
            const active = id === pole;
            const activeTheme = UNIVERSE_THEME[themeIdForDemoPole(id)];
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onPoleChange(id)}
                className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                  active
                    ? `${activeTheme.pricingAccent} text-white shadow-[0_0_24px_rgba(255,255,255,0.08)]`
                    : "border border-white/10 bg-white/[0.03] text-white/55 hover:border-white/25 hover:text-white"
                }`}
              >
                {DEMO_POLE_SHORT_LABEL[id]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mx-auto mt-10 flex max-w-5xl flex-col items-center px-4 sm:px-6">
        <motion.p
          key={`label-${pole}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 text-center text-sm text-white/50"
        >
          Navigation{" "}
          <span className="font-semibold text-white/80">{DEMO_POLE_SHORT_LABEL[pole]}</span>
          {" · "}
          touchez les onglets
        </motion.p>
        <DemoPhoneStage pole={pole} />
      </div>

      <div className="mx-auto mt-16 max-w-xl px-4 text-center sm:px-6">
        <p className="text-sm text-white/45">
          Contenu illustratif. Pour tester l&apos;application réelle, rejoignez l&apos;accès
          anticipé.
        </p>
        <div className="mt-6">
          <Link
            href={ROUTES.betaWaitlist}
            className={`inline-flex min-h-12 items-center rounded-full px-8 py-3 text-sm font-bold text-white transition hover:opacity-90 ${theme.pricingAccent}`}
          >
            Rejoindre la bêta
          </Link>
        </div>
        <p className="mt-4 text-sm text-white/40">
          <Link
            href={pricingHrefForPole(pole)}
            className="underline underline-offset-4 transition hover:text-white/70"
          >
            Voir les tarifs {DEMO_POLE_SHORT_LABEL[pole]}
          </Link>
        </p>
      </div>
    </div>
  );
}
