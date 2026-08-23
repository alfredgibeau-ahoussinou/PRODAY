"use client";

import { MessageCircle, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { pricingHrefForPath } from "@/lib/poles";
import { ROUTES } from "@/lib/routes";

type HelpEntry = {
  id: string;
  question: string;
  answer: string;
  href?: string;
  hrefLabel?: string;
};

const COMMON_ENTRIES: HelpEntry[] = [
  {
    id: "pulse-accueil",
    question: "Visibilité ou Accueil. Quelle différence ?",
    answer:
      "Accueil est l'onglet principal de la barre. La Visibilité est votre score affiché dans l'Accueil. Ce n'est pas un onglet séparé.",
    href: ROUTES.pulse,
    hrefLabel: "Voir Visibilité ProDay",
  },
  {
    id: "sponsors",
    question: "Où sont les sponsors ?",
    answer:
      "Pas d'onglet Sponsors dans la barre de l'app : ouvrez l'Accueil puis le module Sponsors. Sur le site, c'est la page Sponsor (/sponsor).",
    href: ROUTES.sponsor,
    hrefLabel: "Pôle Sponsor",
  },
  {
    id: "shop",
    question: "Qui a accès au Shop ?",
    answer:
      "Le Shop est dans le menu de chaque pôle (Joueur, Club, Coach, Supporter…), sauf le parcours praticien santé et les campagnes sponsor marque.",
    href: ROUTES.shop,
    hrefLabel: "Voir le Shop",
  },
  {
    id: "demo",
    question: "Comment tester l'app ?",
    answer:
      "La démo interactive reprend la navigation réelle des cinq pôles (Joueur, Club, Coach, Supporter, Sponsor). Téléphone et onglets, sans compte.",
    href: ROUTES.demo,
    hrefLabel: "Ouvrir la démo",
  },
  {
    id: "cartes",
    question: "C’est quoi les cartes ProDay ?",
    answer:
      "Des fiches sportives digitales pour Joueur et Coach : stats, postes, vidéos. Sans note artificielle ni badge Elite.",
    href: ROUTES.cards,
    hrefLabel: "Voir les cartes",
  },
  {
    id: "beta",
    question: "Comment rejoindre la bêta ?",
    answer: "Inscrivez vous sur la liste d'attente. Validation par l'équipe, puis accès à l'espace bêta par email.",
    href: ROUTES.betaWaitlist,
    hrefLabel: "Liste d'attente",
  },
];

function entriesForPath(pathname: string, pricingHref: string): HelpEntry[] {
  const poleHint: HelpEntry[] = [];
  if (
    pathname.startsWith("/joueur") ||
    pathname.startsWith("/amateur") ||
    pathname.startsWith("/pro-joueur") ||
    pathname.startsWith("/homme") ||
    pathname.startsWith("/woman")
  ) {
    poleHint.push({
      id: "pole-joueur",
      question: "Que regroupe le Pôle Joueur ?",
      answer:
      "Un seul espace Joueur : carte sportive, Mercato, CV, confidentialité contacts et demandes de message. Sans badge de prestige.",
      href: ROUTES.joueur,
      hrefLabel: "Pôle Joueur",
    });
  }
  if (
    pathname.startsWith("/pro-club") ||
    pathname.startsWith("/coach") ||
    pathname.startsWith("/pro-staff") ||
    pathname === "/pro"
  ) {
    poleHint.push({
      id: "pole-pro",
      question: "Club ou Coach ?",
      answer:
        "Club : équipes, invitations de match entre clubs, compétitions, permissions, covoiturage. Coach : Tactique IA, IA, effectif, et proposition de match pour son équipe.",
      href: ROUTES.coach,
      hrefLabel: "Pôle Coach",
    });
    poleHint.push({
      id: "match-invite",
      question: "Comment proposer un match à un autre club ?",
      answer:
        "Dans l’app : Matchs → + Proposer un match. Recherchez le club (ville, distance, catégorie), envoyez l’invitation. Le destinataire accepte, refuse ou propose une autre date. Confirmé = calendriers + convocations.",
      href: ROUTES.proClub,
      hrefLabel: "Pôle Club",
    });
  }
  if (pathname.startsWith("/supporter")) {
    poleHint.push({
      id: "pole-supporter",
      question: "Que regroupe le pôle Supporter ?",
      answer: "Tribune, Matchs, Suivis, Débats, Moments (vidéos), Shop et Compte. 100 % gratuit.",
      href: ROUTES.supporter,
      hrefLabel: "Pôle Supporter",
    });
  }

  return [
    ...poleHint,
    ...COMMON_ENTRIES,
    {
      id: "tarifs",
      question: "Où voir les tarifs du pôle courant ?",
      answer: "La page Tarifs s'ouvre directement sur le module lié au pôle que vous consultez.",
      href: pricingHref,
      hrefLabel: "Voir les tarifs",
    },
  ];
}

export function SiteHelpChatbot() {
  const pathname = usePathname();
  const pricingHref = pricingHrefForPath(pathname);
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const entries = useMemo(() => entriesForPath(pathname, pricingHref), [pathname, pricingHref]);
  const active = entries.find((e) => e.id === activeId) ?? null;

  if (pathname.startsWith("/beta")) return null;

  return (
    <div className="pointer-events-none fixed bottom-5 left-4 z-[60] flex flex-col items-start gap-3 sm:bottom-6 sm:left-6">
      {open ? (
        <div className="pointer-events-auto flex max-h-[min(70vh,520px)] w-[min(100vw-2rem,22rem)] flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#0a0a0f]/95 shadow-2xl shadow-black/50 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--proday-accent)]">
                Aide ProDay
              </p>
              <p className="mt-0.5 text-sm text-white/70">Une question rapide ?</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setActiveId(null);
              }}
              className="rounded-full border border-white/10 p-2 text-white/60 transition hover:border-white/25 hover:text-white"
              aria-label="Fermer l'aide"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {active ? (
              <div className="rounded-xl border border-[var(--proday-accent)]/25 bg-[var(--proday-accent-muted)] p-4">
                <p className="text-sm font-semibold text-white">{active.question}</p>
                <p className="mt-2 text-sm leading-relaxed text-white/75">{active.answer}</p>
                {active.href ? (
                  <Link
                    href={active.href}
                    className="mt-3 inline-flex text-sm font-semibold text-[var(--proday-accent)] underline underline-offset-4"
                    onClick={() => setOpen(false)}
                  >
                    {active.hrefLabel ?? "En savoir plus"}
                  </Link>
                ) : null}
                <button
                  type="button"
                  onClick={() => setActiveId(null)}
                  className="mt-4 block text-xs font-medium text-white/50 hover:text-white/80"
                >
                  ← Autres questions
                </button>
              </div>
            ) : (
              entries.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => setActiveId(entry.id)}
                  className="block w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-left text-sm text-white/85 transition hover:border-[var(--proday-accent)]/40 hover:bg-[var(--proday-accent-muted)]"
                >
                  {entry.question}
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="bg-accent-gradient pointer-events-auto inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-bold text-white shadow-lg shadow-[0_12px_32px_-10px_rgba(30, 58, 255,0.45)] transition hover:brightness-110"
        aria-expanded={open}
        aria-label={open ? "Fermer l'aide" : "Ouvrir l'aide ProDay"}
      >
        {open ? <X size={18} /> : <MessageCircle size={18} />}
        <span className="hidden sm:inline">{open ? "Fermer" : "Aide"}</span>
      </button>
    </div>
  );
}
