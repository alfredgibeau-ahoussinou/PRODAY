"use client";

import Link from "next/link";
import { CalendarCheck, ShieldCheck, Stethoscope, Video } from "lucide-react";
import { ROUTES } from "@/lib/routes";

/**
 * Téléconsultation pôle Santé : chaque praticien inscrit connecte son propre agenda (Cal.com / Whereby).
 * Pas de calendrier personnel fondateur — le RDV se fait via la fiche praticien (app / annuaire).
 */
export function SanteTeleconsultSection() {
  return (
    <section
      id="teleconsultation"
      className="scroll-mt-24 border-y border-teal-500/15 bg-gradient-to-b from-teal-950/40 to-black py-14 sm:py-16"
    >
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <p className="text-center text-xs font-bold uppercase tracking-[0.28em] text-teal-300/90">
          Téléconsultation
        </p>
        <h2 className="font-display mt-3 text-center text-2xl font-bold text-white sm:text-3xl">
          Un agenda par praticien
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-white/65 sm:text-base">
          Ce ne sont pas les fondateurs ProDay qui reçoivent les sportifs : ce sont les{" "}
          <strong className="font-semibold text-white/85">professionnels de santé</strong> inscrits
          sur le pôle Santé. Chaque praticien connecte son propre calendrier (Cal.com / visio
          conforme) — le sportif réserve depuis la fiche du praticien dans l&apos;annuaire / l&apos;app.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: Stethoscope,
              title: "Praticiens inscrits",
              body: "Kinés, ostéos, coachs mental, nutritionnistes… : inscription pôle Santé, validation, puis fiche visible près des clubs.",
            },
            {
              icon: CalendarCheck,
              title: "Leur agenda, pas le nôtre",
              body: "Chacun branche son Cal.com (ou outil HDS équivalent). Pas de créneau unique « ProDay » au nom d’une personne.",
            },
            {
              icon: ShieldCheck,
              title: "Visio conforme",
              body: "Cal Video / Daily.co ou Whereby — pas Zoom ni Google Meet dès que des données de santé sont échangées.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-2xl border border-teal-400/20 bg-teal-950/30 p-5"
            >
              <Icon className="text-teal-300" size={22} />
              <h3 className="mt-3 text-sm font-bold text-white">{title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-white/60">{body}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-teal-400/25 bg-black/50 p-8 text-center sm:p-10">
          <Video className="mx-auto text-teal-300/90" size={32} />
          <h3 className="font-display mt-4 text-xl font-bold text-white">
            Comment ça se passe ?
          </h3>
          <ol className="mx-auto mt-5 max-w-lg space-y-3 text-left text-sm text-white/70">
            <li className="flex gap-3">
              <span className="font-bold text-teal-300">1.</span>
              Le praticien s&apos;inscrit au pôle Santé et complète son cabinet.
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-teal-300">2.</span>
              Il connecte son lien de prise de RDV / visio (Cal.com recommandé pour le lancement).
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-teal-300">3.</span>
              Le sportif choisit un pro dans l&apos;annuaire et réserve sur{" "}
              <em className="not-italic text-white/85">la fiche de ce praticien</em>.
            </li>
          </ol>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href={ROUTES.betaWaitlist}
              className="inline-flex min-h-11 items-center rounded-full bg-teal-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-teal-500"
            >
              Je suis praticien — accès anticipé
            </Link>
            <Link
              href={ROUTES.demo}
              className="inline-flex min-h-11 items-center rounded-full border border-teal-400/40 px-6 py-2.5 text-sm font-semibold text-teal-100 transition hover:border-teal-300 hover:bg-teal-950/50"
            >
              Voir la démo app
            </Link>
          </div>
        </div>

        <p className="mt-8 text-center text-[11px] leading-relaxed text-white/35">
          Distinct de l&apos;onglet « Vidéos » de l&apos;app (contenus éducatifs publics). La
          téléconsultation = RDV praticien ↔ sportif, avec consentement et confidentialité.
        </p>
      </div>
    </section>
  );
}
