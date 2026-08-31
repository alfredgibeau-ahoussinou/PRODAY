"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowRight } from "lucide-react";
import { ROUTES } from "@/lib/routes";

const FIELDS = [
  { id: "clubName", label: "Nom du club", required: true },
  { id: "ownerName", label: "Nom du responsable", required: true },
  { id: "role", label: "Fonction", required: false },
  { id: "members", label: "Nombre d’adhérents", required: false },
  { id: "teams", label: "Nombre d’équipes", required: false },
  { id: "coaches", label: "Nombre de coachs", required: false },
  { id: "categories", label: "Catégories concernées", required: false },
  { id: "needs", label: "Besoins du club", required: false, area: true },
  { id: "video", label: "Matériel vidéo disponible", required: false },
  { id: "phone", label: "Téléphone", required: false },
  { id: "email", label: "Email", required: true },
] as const;

export default function ClubDevisPage() {
  const [sent, setSent] = useState(false);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <main className="min-h-screen bg-[#050505] px-4 py-16 text-white sm:px-6">
      <div className="mx-auto max-w-xl">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#F5D04A]">
          Offre Club
        </p>
        <h1 className="mt-3 font-display text-3xl font-medium tracking-[-0.03em]">
          Demander un devis
        </h1>
        <p className="mt-3 text-sm text-white/55">
          Tout inclus : Sur devis · À partir de 3 € / adhérent. Tarif adapté selon la
          taille du club.
        </p>

        {sent ? (
          <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="font-display text-xl">Merci !</h2>
            <p className="mt-3 text-sm leading-relaxed text-white/65">
              Notre équipe va étudier les besoins de votre club et vous proposer une offre
              adaptée à votre nombre d’adhérents.
            </p>
            <Link
              href={ROUTES.proClub}
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#F5D04A]"
            >
              Retour au pôle Club
              <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-10 space-y-4">
            {FIELDS.map((f) => (
              <label key={f.id} className="block">
                <span className="text-xs text-white/50">
                  {f.label}
                  {f.required ? " *" : ""}
                </span>
                {"area" in f && f.area ? (
                  <textarea
                    name={f.id}
                    required={f.required}
                    rows={4}
                    className="mt-1.5 w-full rounded-xl border border-white/15 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-[#F5D04A]"
                  />
                ) : (
                  <input
                    name={f.id}
                    required={f.required}
                    type={f.id === "email" ? "email" : "text"}
                    className="mt-1.5 w-full rounded-xl border border-white/15 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-[#F5D04A]"
                  />
                )}
              </label>
            ))}
            <button
              type="submit"
              className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#7C3AED] text-sm font-semibold text-white"
            >
              Envoyer la demande
              <ArrowRight size={16} />
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
