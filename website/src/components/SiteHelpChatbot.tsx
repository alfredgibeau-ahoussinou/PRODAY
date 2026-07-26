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
      "Pas d'onglet Sponsors dans la barre de l'app : ouvrez l'Accueil puis le module Sponsors. Sur le site, c'est la page Partenaires.",
    href: ROUTES.sponsor,
    hrefLabel: "Pôle Sponsor",
  },
  {
    id: "shop",
    question: "Qui a accès au Shop ?",
    answer:
      "Le Shop est dans le menu de chaque pôle (Amateur, Supporter, Pro Joueur, Club, Staff…), sauf le pôle Santé praticien et les sponsors marque.",
    href: ROUTES.shop,
    hrefLabel: "Voir le Shop",
  },
  {
    id: "sante-video",
    question: "Y a-t-il des vidéos dans le pôle Santé ?",
    answer:
      "Oui. Onglet Vidéos pour du contenu éducatif. La téléconsultation : 1 visio offerte en essai pour le praticien, puis abonnement. Le sportif réserve sans compte Cal.com.",
    href: `${ROUTES.sante}#teleconsultation`,
    hrefLabel: "Téléconsultation Santé",
  },
  {
    id: "sante-hds",
    question: "Qui reçoit les rendez-vous santé ?",
    answer:
      "Les professionnels du pôle Santé (chacun son Cal.com). Les joueurs / sportifs n’ont pas besoin de compte Cal.com. Ils réservent comme invités. Visio conforme (Cal.com / Whereby), pas Zoom.",
    href: `${ROUTES.sante}#teleconsultation`,
    hrefLabel: "Voir la téléconsultation",
  },
  {
    id: "demo",
    question: "Comment tester l'app ?",
    answer:
      "La démo interactive reprend la navigation réelle des pôles (Amateur, Supporter, Santé, Pro Joueur, Club, Staff, Sponsor). Téléphone et onglets, sans compte.",
    href: ROUTES.demo,
    hrefLabel: "Ouvrir la démo",
  },
  {
    id: "beta",
    question: "Comment rejoindre la bêta ?",
    answer: "Inscrivez-vous sur la liste d'attente. Validation par l'équipe, puis accès à l'espace bêta par email.",
    href: ROUTES.betaWaitlist,
    hrefLabel: "Liste d'attente",
  },
];

function entriesForPath(pathname: string, pricingHref: string): HelpEntry[] {
  const poleHint: HelpEntry[] = [];
  if (pathname.startsWith("/amateur") || pathname.startsWith("/homme") || pathname.startsWith("/woman")) {
    poleHint.push({
      id: "pole-amateur",
      question: "Que regroupe le pôle Amateur ?",
      answer:
        "Équipe, Club, Matchs, Covoiturage, Reels, Shop et Santé. Plus le module Sponsors depuis l'Accueil.",
      href: ROUTES.amateur,
      hrefLabel: "Pôle Amateur",
    });
  }
  if (pathname.startsWith("/pro-joueur") || pathname.startsWith("/pro")) {
    poleHint.push({
      id: "pole-pro",
      question: "Que regroupe Pro Joueur ?",
      answer:
        "Carrière (avec Visibilité), Opportunités, Réels, Groupe, Shop et Profil. Sponsors via le module Accueil.",
      href: ROUTES.proJoueur,
      hrefLabel: "Pro Joueur",
    });
  }
  if (pathname.startsWith("/sante")) {
    poleHint.push({
      id: "pole-sante",
      question: "Quels onglets pour un praticien ?",
      answer: "Accueil, Agenda, Demandes, Vidéos, Messages et Cabinet. Sans Shop ni Mercato (profil praticien).",
      href: ROUTES.sante,
      hrefLabel: "Pôle Santé",
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
    <div className="pointer-events-none fixed bottom-5 right-4 z-[60] flex flex-col items-end gap-3 sm:bottom-7 sm:right-7">
      {open ? (
        <div className="pointer-events-auto flex max-h-[min(78vh,580px)] w-[min(100vw-1.5rem,26rem)] flex-col overflow-hidden rounded-3xl border border-white/15 bg-[#0a0a0f]/96 shadow-2xl shadow-black/50 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3.5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--proday-accent)]">
                Centre d&apos;aide
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
        className="pointer-events-auto inline-flex min-h-[52px] items-center gap-2.5 rounded-full bg-[var(--proday-accent)] px-5 py-3.5 text-sm font-extrabold text-black shadow-[0_16px_40px_-10px_rgba(0,84,240,0.55)] ring-2 ring-white/20 transition hover:bg-[#2a6fff] sm:min-h-[56px] sm:px-6 sm:text-base"
        aria-expanded={open}
        aria-label={open ? "Fermer le centre d'aide" : "Ouvrir le centre d'aide ProDay"}
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
        <span>{open ? "Fermer" : "Centre d'aide"}</span>
      </button>
    </div>
  );
}
