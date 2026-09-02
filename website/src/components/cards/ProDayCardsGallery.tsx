"use client";

import Link from "next/link";
import { useState } from "react";
import { ProDayFutCard } from "@/components/cards/ProDayFutCard";
import {
  CARD_ROLE_META,
  DEMO_CARDS,
  DEMO_PLAYER_CARD,
  type ProDayCardActionId,
  type ProDayCardData,
  type ProDayCardRole,
} from "@/lib/prodayCards";
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
  support = "Joueur, Coach, Club, Supporter, Sponsor : cartes interactives avec effet 3D, glare et actions.",
  showMoreLink = false,
  id = "cartes",
  passportMode = false,
}: Props) {
  const [filter, setFilter] = useState<ProDayCardRole | "all">(initialRole);
  const [toast, setToast] = useState<string | null>(null);

  const cards = filter === "all" ? DEMO_CARDS : DEMO_CARDS.filter((c) => c.role === filter);

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
  }

  return (
    <section id={id} className="bg-[#050505] py-20 sm:py-28 text-white relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 relative z-10">
        
        {/* En-tête */}
        <div className="mb-14 text-center">
          <h2 className="font-display text-4xl font-black tracking-tight text-white md:text-5xl lg:text-6xl">
            {title}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm font-medium leading-relaxed text-white/50 md:text-base">
            {support}
          </p>

          {!hideFilters && (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              {ROLES.map((r) => (
                <button
                  key={r}
                  onClick={() => setFilter(r)}
                  className={`rounded-full px-5 py-2 text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${
                    filter === r
                      ? "bg-white text-black shadow-lg"
                      : "bg-white/10 text-white/60 hover:bg-white/20 hover:text-white"
                  }`}
                >
                  {r === "all" ? "Toutes" : CARD_ROLE_META[r as ProDayCardRole].label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Gallery */}
        <div className="mx-auto grid max-w-4xl gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <ProDayFutCard
              key={card.id}
              card={card}
              onAction={(a) => onAction(a, card)}
            />
          ))}
        </div>

        {showMoreLink && (
          <div className="mt-14 flex justify-center">
            <Link
              href={ROUTES.cards}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-xs font-black uppercase tracking-widest text-white/80 transition-colors hover:bg-white hover:text-black"
            >
              Découvrir toutes les cartes
            </Link>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transform rounded-full border border-white/10 bg-black/80 px-6 py-3 font-mono text-xs uppercase tracking-wide text-white shadow-2xl backdrop-blur-md">
          {toast}
        </div>
      )}
    </section>
  );
}
