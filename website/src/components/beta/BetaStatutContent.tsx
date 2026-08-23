"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { IOS_BETA_LAUNCH_LABEL } from "@/lib/betaIosLaunch";
import { betaRoleLabel } from "@/lib/betaWelcomeEmail";
import { ROUTES } from "@/lib/routes";
import {
  readWaitlistStatus,
  type StoredWaitlistStatus,
} from "@/lib/waitlistStatusStorage";

type Status = StoredWaitlistStatus["status"];

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  if (local.length <= 2) return `${local[0] ?? "*"}***@${domain}`;
  return `${local.slice(0, 2)}***@${domain}`;
}

function copyFor(status: Status): {
  kicker: string;
  title: string;
  body: string;
} {
  if (status === "approved") {
    return {
      kicker: "Accès ouvert",
      title: "Tu es approuvé.",
      body: "Check ta boîte mail (et les spams) pour le lien d’accès à l’espace bêta.",
    };
  }
  if (status === "rejected") {
    return {
      kicker: "Non retenu",
      title: "Cette inscription n’est plus active.",
      body: "Contacte proday.admin@gmail.com si tu penses que c’est une erreur.",
    };
  }
  return {
    kicker: "Statut : en attente",
    title: "Inscription reçue. On te revient.",
    body: `Ton profil est en file de validation ProDay. Tu recevras un email dès qu’il sera validé, avec le lien programme / installer. Bêta iOS le ${IOS_BETA_LAUNCH_LABEL}.`,
  };
}

export function BetaStatutContent() {
  const [stored, setStored] = useState<StoredWaitlistStatus | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setStored(readWaitlistStatus());
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 sm:px-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-white/40">
          Chargement…
        </p>
      </div>
    );
  }

  const status: Status = stored?.status ?? "pending";
  const copy = copyFor(status);
  const roleLabel = stored?.role ? betaRoleLabel(stored.role) : null;

  return (
    <section className="border-b border-white/10 bg-black">
      <div className="mx-auto max-w-xl px-4 py-16 sm:px-6 sm:py-24">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#5B75FF]">
          {copy.kicker}
        </p>
        <h1 className="mt-4 font-display text-[clamp(2rem,6vw,3.2rem)] font-medium leading-[1.05] tracking-[-0.035em] text-white">
          {copy.title}
        </h1>
        <p className="mt-5 text-base leading-relaxed text-white/60">{copy.body}</p>

        {stored ? (
          <div className="mt-8 rounded-2xl border border-white/12 bg-white/[0.03] p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">
              Récap
            </p>
            <dl className="mt-3 space-y-2 text-sm text-white/70">
              <div className="flex justify-between gap-4">
                <dt className="text-white/40">Email</dt>
                <dd className="text-right text-white">{maskEmail(stored.email)}</dd>
              </div>
              {roleLabel ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-white/40">Rôle</dt>
                  <dd className="text-right text-white">{roleLabel}</dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-4">
                <dt className="text-white/40">Statut</dt>
                <dd className="text-right text-white">
                  {status === "pending"
                    ? "En attente"
                    : status === "approved"
                      ? "Approuvé"
                      : "Refusé"}
                </dd>
              </div>
            </dl>
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-white/12 bg-white/[0.03] p-5 text-sm text-white/55">
            Pas de détail d’inscription sur cet appareil. Si tu viens de t’inscrire,
            repars depuis le formulaire : sinon vérifie ta boîte mail.
          </div>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          {status === "pending" ? (
            <Link
              href={ROUTES.demo}
              className="bg-accent-gradient inline-flex min-h-12 items-center justify-center rounded-full px-6 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-white"
            >
              Voir la démo en attendant
            </Link>
          ) : status === "approved" ? (
            <Link
              href={ROUTES.betaProgramme}
              className="bg-accent-gradient inline-flex min-h-12 items-center justify-center rounded-full px-6 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-white"
            >
              Ouvrir l’espace bêta
            </Link>
          ) : null}
          <Link
            href={ROUTES.betaWaitlist}
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/20 px-6 font-mono text-[11px] uppercase tracking-[0.14em] text-white/75 transition hover:border-white/40 hover:text-white"
          >
            Nouvelle inscription
          </Link>
        </div>
      </div>
    </section>
  );
}
