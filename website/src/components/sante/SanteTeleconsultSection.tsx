"use client";

import { ExternalLink, ShieldCheck, Video } from "lucide-react";

/**
 * Embed Cal.com (agenda + Cal Video / Daily.co) ou Whereby.
 * Défaut : profil Cal.com ProDay — override via NEXT_PUBLIC_SANTE_BOOKING_*.
 * Pas de Zoom / Google Meet : exigences HDS / données de santé.
 */
const DEFAULT_CAL_EMBED =
  "https://cal.com/alfred-gibeau-ahoussinou-crbca7?embed=true";
const DEFAULT_CAL_PAGE = "https://cal.com/alfred-gibeau-ahoussinou-crbca7";

export function SanteTeleconsultSection() {
  const embedUrl =
    process.env.NEXT_PUBLIC_SANTE_BOOKING_EMBED_URL?.trim() || DEFAULT_CAL_EMBED;
  const bookingPageUrl =
    process.env.NEXT_PUBLIC_SANTE_BOOKING_PAGE_URL?.trim() || DEFAULT_CAL_PAGE;

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
          conforme (Cal.com / Cal Video · Daily.co) — pas Zoom ni Google Meet lorsque des
          données de santé sont échangées. Créneaux 15 min et 30 min.
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
          <iframe
            title="Réservation téléconsultation Pro Day Santé"
            src={embedUrl}
            className="h-[min(720px,80vh)] w-full border-0 bg-white"
            allow="camera; microphone; fullscreen; display-capture; autoplay"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

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

        <p className="mt-8 text-center text-[11px] leading-relaxed text-white/35">
          Distinct de l&apos;onglet « Vidéos » de l&apos;app (contenus éducatifs publics). La
          téléconsultation concerne uniquement les RDV praticien ↔ sportif, avec consentement et
          confidentialité.
        </p>
      </div>
    </section>
  );
}
