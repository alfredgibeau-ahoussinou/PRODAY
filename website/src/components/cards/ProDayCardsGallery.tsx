"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FutSkinSwatch } from "@/components/cards/FutCardShell";
import { ProDayFutCard } from "@/components/cards/ProDayFutCard";
import {
  PassportTierPicker,
  ProDayPassportCard,
} from "@/components/cards/ProDayPassportCard";
import {
  CARD_ROLE_META,
  DEMO_CARDS,
  DEMO_PLAYER_CARD,
  type ProDayCardActionId,
  type ProDayCardData,
  type ProDayCardRole,
} from "@/lib/prodayCards";
import { FUT_SKINS, type FutSkinId } from "@/lib/futSkins";
import type { PassportTierId } from "@/lib/prodayPassport";
import { ROUTES } from "@/lib/routes";

const ROLES: Array<ProDayCardRole | "all"> = [
  "all",
  "player",
  "coach",
  "club",
  "supporter",
  "sponsor",
];

type Props = {
  initialRole?: ProDayCardRole | "all";
  hideFilters?: boolean;
  title?: string;
  support?: string;
  showMoreLink?: boolean;
  id?: string;
  showSkinPicker?: boolean;
  /** Mode passeport premium joueur */
  passportMode?: boolean;
};

export function ProDayCardsGallery({
  initialRole = "all",
  hideFilters = false,
  title = "Passeports numériques vivants.",
  support = "Carte Ultimate Team × tableau de bord × identité ProDay. Touchez pour ouvrir le passeport.",
  showMoreLink = false,
  id = "cartes-proday",
  showSkinPicker = false,
  passportMode = true,
}: Props) {
  const [filter, setFilter] = useState<ProDayCardRole | "all">(initialRole);
  const [skinId, setSkinId] = useState<FutSkinId | "auto">("auto");
  const [passportTier, setPassportTier] = useState<PassportTierId | "auto">("auto");
  const [toast, setToast] = useState<string | null>(null);

  const cards = useMemo(() => {
    const base =
      filter === "all" ? DEMO_CARDS : DEMO_CARDS.filter((c) => c.role === filter);
    if (skinId === "auto") return base;
    return base.map((c) => ({ ...c, skinId }) as ProDayCardData);
  }, [filter, skinId]);

  const playerShowcase = useMemo(() => {
    const tiers: PassportTierId[] =
      passportTier === "auto"
        ? ["bronze", "silver", "gold", "platinum", "diamond", "legend", "premium"]
        : [passportTier];
    return tiers.map((tier) => ({ tier, card: DEMO_PLAYER_CARD }));
  }, [passportTier]);

  function onAction(action: ProDayCardActionId, name: string) {
    setToast(`${name} · « ${action} »`);
    window.setTimeout(() => setToast(null), 2000);
  }

  const showPassportGrid = passportMode && (filter === "all" || filter === "player");

  return (
    <section id={id} className="relative border-t border-white/10 bg-black px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#FF6A00]">
              Passeport ProDay
            </p>
            <h2 className="mt-3 max-w-2xl font-display text-[clamp(1.8rem,4vw,2.8rem)] font-medium tracking-[-0.03em] text-white">
              {title}
            </h2>
            <p className="mt-3 max-w-xl text-sm text-white/55">{support}</p>
          </div>
          {showMoreLink ? (
            <Link
              href={ROUTES.cards}
              className="shrink-0 rounded-full border border-white/20 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-white"
            >
              Voir toutes les cartes
            </Link>
          ) : null}
        </div>

        {!hideFilters ? (
          <div className="mt-8 flex gap-2 overflow-x-auto pb-1">
            {ROLES.map((r) => {
              const on = filter === r;
              const label = r === "all" ? "Tous" : CARD_ROLE_META[r].label;
              const accent = r === "all" ? "#FF6A00" : CARD_ROLE_META[r].accent;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setFilter(r)}
                  className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.1em] ${
                    on ? "text-white" : "border border-white/15 text-white/65"
                  }`}
                  style={on ? { backgroundColor: accent } : undefined}
                >
                  {label}
                </button>
              );
            })}
          </div>
        ) : null}

        {showPassportGrid ? (
          <div className="mt-10">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">
              Niveau passeport joueur
            </p>
            <div className="mt-3">
              <PassportTierPicker value={passportTier} onChange={setPassportTier} />
            </div>
            <div
              className={`mt-12 grid justify-items-center gap-x-8 gap-y-14 ${
                playerShowcase.length === 1
                  ? "mx-auto max-w-[320px]"
                  : "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              }`}
            >
              {playerShowcase.map(({ tier, card }) => (
                <div key={tier} className="w-full max-w-[300px]">
                  <ProDayPassportCard
                    card={card}
                    tierOverride={tier}
                    onAction={(a) => onAction(a, card.displayName)}
                  />
                  <p className="mt-3 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
                    {tier === "premium" ? "ProDay Premium" : tier}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {showSkinPicker && !showPassportGrid ? (
          <div className="mt-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">
              Design cartes rôles
            </p>
            <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-12">
              {FUT_SKINS.map((s) => (
                <button key={s.id} type="button" onClick={() => setSkinId(s.id)} title={s.label}>
                  <FutSkinSwatch skin={s} active={skinId === s.id} />
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {filter !== "player" ? (
          <div
            className={`mt-14 grid justify-items-center gap-x-10 gap-y-16 ${
              cards.filter((c) => c.role !== "player").length === 1
                ? "mx-auto max-w-[360px]"
                : "md:grid-cols-2 xl:grid-cols-3"
            }`}
          >
            {cards
              .filter((c) => !(passportMode && c.role === "player"))
              .map((card) => (
                <ProDayFutCard
                  key={`${card.id}-${card.skinId ?? "d"}-${skinId}`}
                  card={card}
                  onAction={(a) => onAction(a, card.displayName)}
                />
              ))}
          </div>
        ) : null}

        {toast ? (
          <div className="fixed bottom-6 left-1/2 z-[90] -translate-x-1/2 rounded-full border border-white/15 bg-black/90 px-5 py-2.5 text-xs text-white">
            {toast}
          </div>
        ) : null}
      </div>
    </section>
  );
}
