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
  CARD_ACTION_LABELS,
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

async function shareCard(card: ProDayCardData) {
  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}${ROUTES.cards}#${card.id}`
      : `${ROUTES.cards}#${card.id}`;
  const title = `${card.displayName} · Carte ProDay`;
  const text = `Découvre la carte ${CARD_ROLE_META[card.role].label} de ${card.displayName} sur ProDay.`;

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return "Partagé";
    } catch {
      /* cancelled */
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    return "Lien copié";
  } catch {
    return `Lien : ${url}`;
  }
}

export function ProDayCardsGallery({
  initialRole = "all",
  hideFilters = false,
  title = "Cinq identités. Une collection.",
          support = "Joueur, Coach, Club, Supporter, Sponsor : cartes carrées interactives : tilt 3D, glare, flip et actions.",
  showMoreLink = false,
  id = "cartes",
  showSkinPicker = true,
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

  function flash(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2600);
  }

  async function onAction(action: ProDayCardActionId, card: ProDayCardData) {
    const name = card.displayName;
    const meta = CARD_ROLE_META[card.role];

    if (action === "share") {
      flash(`${name} · ${await shareCard(card)}`);
      return;
    }

    if (action === "view_profile" || action === "view_club") {
      flash(`${name} · ouverture du pôle ${meta.label}`);
      window.setTimeout(() => {
        window.location.href = meta.poleHref;
      }, 400);
      return;
    }

    flash(
      `${name} · ${CARD_ACTION_LABELS[action]} : dispo dans l’app. Rejoins la bêta.`,
    );
  }

  const showPassportGrid = passportMode && (filter === "all" || filter === "player");

  const futToShow =
    filter === "player" && passportMode
      ? cards.filter((c) => c.role === "player")
      : filter === "all" && passportMode
        ? cards.filter((c) => c.role !== "player")
        : cards;

  return (
    <section id={id} className="relative border-t border-white/10 bg-black px-4 py-14 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#FF6A00]">
              Passeport ProDay
            </p>
            <h2 className="mt-3 max-w-2xl font-display text-[clamp(1.65rem,4vw,2.8rem)] font-medium tracking-[-0.03em] text-white">
              {title}
            </h2>
            <p className="mt-3 max-w-xl text-sm text-white/55">{support}</p>
          </div>
          {showMoreLink ? (
            <Link
              href={ROUTES.cards}
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border border-white/20 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-white"
            >
              Voir toutes les cartes
            </Link>
          ) : null}
        </div>

        {!hideFilters ? (
          <div
            className="mt-8 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="tablist"
            aria-label="Filtrer par rôle"
          >
            {ROLES.map((r) => {
              const on = filter === r;
              const label = r === "all" ? "Tous" : CARD_ROLE_META[r].label;
              const accent = r === "all" ? "#FF6A00" : CARD_ROLE_META[r].accent;
              return (
                <button
                  key={r}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => setFilter(r)}
                  className={`min-h-11 shrink-0 rounded-full px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.1em] transition ${
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
            <div className="mt-3 overflow-x-auto pb-1">
              <PassportTierPicker value={passportTier} onChange={setPassportTier} />
            </div>
            <div
              className={`mt-10 grid justify-items-center gap-x-6 gap-y-12 sm:gap-x-8 sm:gap-y-14 ${
                playerShowcase.length === 1
                  ? "mx-auto max-w-[320px]"
                  : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              }`}
            >
              {playerShowcase.map(({ tier, card }) => (
                <div
                  key={tier}
                  id={tier === "gold" ? card.id : undefined}
                  className="w-full max-w-[300px]"
                >
                  <ProDayPassportCard
                    card={card}
                    tierOverride={tier}
                    onAction={(a) => onAction(a, card)}
                  />
                  <p className="mt-3 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
                    {tier === "premium" ? "ProDay Premium" : tier}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {showSkinPicker && (!showPassportGrid || filter !== "player") ? (
          <div className="mt-10">
            <div className="flex items-center justify-between gap-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">
                Skins FUT
              </p>
              <button
                type="button"
                onClick={() => setSkinId("auto")}
                className={`min-h-11 shrink-0 rounded-full px-3 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                  skinId === "auto" ? "bg-white text-black" : "text-white/45"
                }`}
              >
                Auto
              </button>
            </div>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-2 sm:grid sm:overflow-visible sm:grid-cols-6 lg:grid-cols-12">
              {FUT_SKINS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSkinId(s.id)}
                  title={s.label}
                  className="w-14 shrink-0 sm:w-auto"
                >
                  <FutSkinSwatch skin={s} active={skinId === s.id} />
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {futToShow.length > 0 ? (
          <div className="mt-12">
            {filter === "player" && passportMode ? (
              <p className="mb-6 font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">
                Éditions collection joueur
              </p>
            ) : filter === "all" ? (
              <p className="mb-6 font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">
                Coach · Club · Supporter · Sponsor
              </p>
            ) : null}
            <div
              className={`grid justify-items-center gap-x-8 gap-y-14 ${
                futToShow.length === 1
                  ? "mx-auto max-w-[360px]"
                  : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
              }`}
            >
              {futToShow.map((card) => (
                <div
                  key={`${card.id}-${card.skinId ?? "d"}-${skinId}`}
                  id={card.id}
                  className="w-full"
                >
                  <ProDayFutCard card={card} onAction={(a) => onAction(a, card)} />
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {toast ? (
          <div className="fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-1/2 z-[90] flex max-w-[min(92vw,28rem)] -translate-x-1/2 flex-col items-center gap-2">
            <div className="rounded-full border border-white/15 bg-black/90 px-5 py-2.5 text-center text-xs text-white shadow-xl">
              {toast}
            </div>
            {toast.includes("bêta") ? (
              <Link
                href={ROUTES.betaWaitlist}
                className="min-h-11 inline-flex items-center rounded-full bg-[#FF6A00] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white"
              >
                Liste d’attente
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
