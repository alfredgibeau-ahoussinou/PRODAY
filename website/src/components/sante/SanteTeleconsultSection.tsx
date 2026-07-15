"use client";

import Link from "next/link";
import { ExternalLink, ShieldCheck, Video } from "lucide-react";
import { ROUTES } from "@/lib/routes";

/**
 * Embed Cal.com (agenda + Cal Video / Daily.co) ou Whereby.
 * Configurer NEXT_PUBLIC_SANTE_BOOKING_EMBED_URL avec l’URL d’embed du partenaire.
 * Pas de Zoom / Google Meet : exigences HDS / données de santé.
 */
export function SanteTeleconsultSection() {
  const embedUrl = process.env.NEXT_PUBLIC_SANTE_BOOKING_EMBED_URL?.trim() ?? "";
  const bookingPageUrl =
    process.env.NEXT_PUBLIC_SANTE_BOOKING_PAGE_URL?.trim() || embedUrl;

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
          Agenda + visio sécurisée
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-white/65 sm:text-base">
          Pour le pôle Santé, la prise de RDV et la visioconférence passent par un partenaire
          conforme (Cal.com / Cal Video · Daily.co, ou Whereby Embedded) — pas Zoom ni Google Meet
          lorsque des données de santé sont échangées.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: ShieldCheck,
              title: "HDS & RGPD",
              body: "Flux vidéo et agenda via un sous-traitant adapté à la santé européenne — certification HDS côté hébergeur partenaire selon la formule.",
            },
            {
              icon: Video,
              title: "Lien unique",
              body: "À chaque créneau confirmé, un lien de visio unique est généré pour le sportif et le praticien — rien à installer.",
            },
            {
              icon: ExternalLink,
              title: "Lancement rapide",
              body: "Stack clé en main pour la bêta. Une visio 100 % ProDay (WebRTC) pourra venir plus tard si l’usage le justifie.",
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

        <div className="mt-10 overflow-hidden rounded-2xl border border-teal-400/25 bg-black/50">
          {embedUrl ? (
            <iframe
              title="Réservation téléconsultation Pro Day Santé"
              src={embedUrl}
              className="h-[min(720px,80vh)] w-full border-0 bg-white"
              allow="camera; microphone; fullscreen; display-capture; autoplay"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          ) : (
            <div className="flex flex-col items-center gap-4 px-6 py-14 text-center">
              <Video className="text-teal-300/80" size={36} />
              <p className="max-w-md text-sm leading-relaxed text-white/70">
                L&apos;embed de réservation sera activé dès le compte Cal.com (ou Whereby) ProDay
                configuré. En attendant, rejoignez la liste d&apos;attente praticiens — agenda app
                déjà en place, visio partenaire au branchement.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  href={ROUTES.betaWaitlist}
                  className="inline-flex min-h-11 items-center rounded-full bg-teal-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-teal-500"
                >
                  Accès anticipé Santé
                </Link>
                <a
                  href="https://cal.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center rounded-full border border-teal-400/40 px-6 py-2.5 text-sm font-semibold text-teal-100 transition hover:border-teal-300 hover:bg-teal-950/50"
                >
                  Découvrir Cal.com
                </a>
              </div>
              <p className="max-w-lg text-[11px] leading-relaxed text-white/35">
                Variable Netlify :{" "}
                <code className="text-white/50">NEXT_PUBLIC_SANTE_BOOKING_EMBED_URL</code>{" "}
                (iframe Cal.com / Whereby). Optionnel :{" "}
                <code className="text-white/50">NEXT_PUBLIC_SANTE_BOOKING_PAGE_URL</code>.
              </p>
            </div>
          )}
        </div>

        {bookingPageUrl && embedUrl ? (
          <p className="mt-4 text-center text-xs text-white/40">
            Problème d&apos;affichage ?{" "}
            <a
              href={bookingPageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-teal-300/90 underline underline-offset-2 hover:text-teal-200"
            >
              Ouvrir la prise de RDV dans un nouvel onglet
            </a>
          </p>
        ) : null}

        <p className="mt-8 text-center text-[11px] leading-relaxed text-white/35">
          Distinct de l&apos;onglet « Vidéos » de l&apos;app (contenus éducatifs publics). La
          téléconsultation concerne uniquement les RDV praticien ↔ sportif, avec consentement et
          confidentialité.
        </p>
      </div>
    </section>
  );
}
