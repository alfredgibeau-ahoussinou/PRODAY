"use client";

import Link from "next/link";
import { CalendarCheck, ShieldCheck, Stethoscope, Video } from "lucide-react";
import { ROUTES } from "@/lib/routes";

/**
 * Téléconsultation pôle Santé — salles Daily sécurisées in-app (cam/mic/écran/chat).
 * Cal.com reste l’agenda public du praticien ; la visio rejoint depuis l’app ProDay.
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
          Visio sécurisée dans l&apos;app
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-white/65 sm:text-base">
          Chaque{" "}
          <strong className="font-semibold text-white/85">praticien</strong> lie son agenda
          (Cal.com) à sa fiche ProDay. Les{" "}
          <strong className="font-semibold text-white/85">sportifs</strong> réservent depuis
          l&apos;annuaire, puis rejoignent une salle Daily privée (lien unique + token) —
          caméra, micro, partage d&apos;écran et chat pendant la consultation.
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
              title: "Agenda + confirmation",
              body: "Créneaux ProDay et identité Cal.com du praticien. Le sportif réserve sans compte Cal.com.",
            },
            {
              icon: ShieldCheck,
              title: "Salle Daily privée",
              body: "Visio HD dans l’app (token sécurisé). Pas Zoom ni Google Meet dès que des données de santé sont échangées.",
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
            Comment rejoindre un appel ?
          </h3>
          <ol className="mx-auto mt-5 max-w-lg space-y-3 text-left text-sm text-white/70">
            <li className="flex gap-3">
              <span className="font-bold text-teal-300">1.</span>
              Le praticien s&apos;inscrit au pôle Santé et renseigne son username Cal.com.
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-teal-300">2.</span>
              Le sportif réserve un créneau visio depuis la fiche praticien dans l&apos;app.
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-teal-300">3.</span>
              Une fois le RDV confirmé, praticien et joueur appuient sur{" "}
              <em className="not-italic text-white/85">Rejoindre la visio</em> — salle privée
              Daily, contrôles caméra / micro / écran / chat, puis fin d&apos;appel.
            </li>
          </ol>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href={`${ROUTES.betaWaitlist}?role=physio`}
              className="inline-flex min-h-11 items-center rounded-full bg-teal-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-teal-500"
            >
              Je suis praticien · rejoindre la bêta
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
          Flag admin <code className="text-white/50">sante_visio</code> requis pour activer
          le join en production.
        </p>
      </div>
    </section>
  );
}
