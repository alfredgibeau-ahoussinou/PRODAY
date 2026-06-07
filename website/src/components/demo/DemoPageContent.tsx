"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { PhoneDemo } from "@/components/PhoneDemo";
import { UNIVERSE_THEME } from "@/components/universe/universeTheme";
import { BRANDS_BY_LINE, type ProductLineWeb } from "@/lib/content";
import { demoUrlForUniverse, ROUTES } from "@/lib/routes";

const UNIVERSE_OPTIONS: { id: ProductLineWeb; label: string }[] = [
  { id: "homme", label: "Man" },
  { id: "woman", label: "Woman" },
  { id: "pro", label: "Pro" },
];

type DemoPageContentProps = {
  universe: ProductLineWeb;
};

export function DemoPageContent({ universe }: DemoPageContentProps) {
  const router = useRouter();
  const theme = UNIVERSE_THEME[universe];
  const brand = BRANDS_BY_LINE[universe];

  const onUniverseChange = useCallback(
    (line: ProductLineWeb) => {
      router.replace(demoUrlForUniverse(line), { scroll: false });
    },
    [router],
  );

  return (
    <>
      <div className="mx-auto mb-8 flex max-w-6xl flex-col items-center gap-4 px-4">
        <p className="text-center text-sm text-neutral-400">
          Parcourez les 7 onglets de l&apos;app — contenu adapté à{" "}
          <span className="font-medium text-neutral-200">{brand.name}</span>.
        </p>
        <div
          className="inline-flex rounded-full border border-neutral-800 bg-neutral-900/80 p-1"
          role="tablist"
          aria-label="Univers ProDay"
        >
          {UNIVERSE_OPTIONS.map((opt) => {
            const active = opt.id === universe;
            return (
              <button
                key={opt.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onUniverseChange(opt.id)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  active ? theme.demoTabActive : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <PhoneDemo key={universe} fullPage universe={universe} />

      <div className="mx-auto max-w-6xl px-4 pb-16 pt-10 text-center">
        <p className="mb-4 text-sm text-neutral-500">
          Cette démo est illustrative — rejoignez la beta pour tester l&apos;app réelle.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href={ROUTES.beta}
            className={`inline-flex rounded-full px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 ${theme.pricingAccent}`}
          >
            Rejoindre la beta
          </Link>
          <Link
            href={ROUTES.pricing}
            className="inline-flex rounded-full border border-neutral-700 px-6 py-3 text-sm font-medium text-neutral-300 transition hover:border-neutral-500 hover:text-white"
          >
            Voir les tarifs
          </Link>
        </div>
      </div>
    </>
  );
}
