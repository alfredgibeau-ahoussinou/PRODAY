"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { ArrowRight, Sparkles, Building, CheckCircle2 } from "lucide-react";
import { ClubRoiCalculator } from "@/components/poles/ClubRoiCalculator";
import { ROUTES } from "@/lib/routes";

const FIELDS = [
  { id: "clubName", label: "Nom du club", required: true },
  { id: "ownerName", label: "Nom du responsable / Dirigeant", required: true },
  { id: "role", label: "Fonction (Président, Secrétaire, DS...)", required: false },
  { id: "members", label: "Nombre d’adhérents estimé", required: false, type: "number" },
  { id: "teams", label: "Nombre d’équipes", required: false, type: "number" },
  { id: "coaches", label: "Nombre d’éducateurs / coachs", required: false, type: "number" },
  { id: "categories", label: "Catégories concernées (U11, U15, Seniors...)", required: false },
  { id: "needs", label: "Priorités (gain de temps, cotisations, covoiturage, tactique IA...)", required: false, area: true },
  { id: "video", label: "Matériel vidéo envisagé (caméra Veo, smartphones...)", required: false },
  { id: "phone", label: "Téléphone", required: false, type: "tel" },
  { id: "email", label: "Email professionnel ou club", required: true, type: "email" },
] as const;

function ClubDevisForm() {
  const searchParams = useSearchParams();
  const initialMembersParam = searchParams.get("members");
  const initialMembers = initialMembersParam ? parseInt(initialMembersParam, 10) || 220 : 220;

  const [sent, setSent] = useState(false);
  const [membersCount, setMembersCount] = useState<number>(initialMembers);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="space-y-12">
      {/* Introduction */}
      <div className="text-center sm:text-left">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#F5D04A]/10 px-3.5 py-1 font-mono text-[10px] uppercase tracking-[0.28em] text-[#F5D04A] ring-1 ring-[#F5D04A]/25">
          <Sparkles size={12} />
          <span>Offre Club Tout Inclus</span>
        </div>
        <h1 className="mt-4 font-display text-3xl sm:text-4xl font-bold tracking-tight text-white">
          Demande de devis & Simulation Club
        </h1>
        <p className="mt-3 text-sm sm:text-base text-white/60 max-w-2xl leading-relaxed">
          À partir de 3 € / adhérent · formule tout inclus sans frais cachés.
          Simulez vos gains de temps et financiers, puis transmettez votre dossier à notre équipe.
        </p>
      </div>

      {/* 1. Calculatrice d'économies intégrée */}
      <ClubRoiCalculator initialMembers={membersCount} showCta={false} />

      {/* 2. Formulaire de demande de devis */}
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#0c0a06] via-[#0a0a0f] to-black p-6 sm:p-10 shadow-2xl">
        <div className="flex items-center gap-3 border-b border-white/10 pb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 ring-1 ring-purple-500/30">
            <Building size={20} className="text-purple-400" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-white">
              Transmettre votre demande de devis
            </h2>
            <p className="text-xs text-white/50">
              Réponse personnalisée & validation tarifaire sous 48 h ouvrées.
            </p>
          </div>
        </div>

        {sent ? (
          <div className="mt-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center sm:text-left">
            <div className="flex items-center gap-3 text-emerald-400">
              <CheckCircle2 size={24} />
              <h3 className="font-display text-xl font-bold text-white">Demande enregistrée avec succès !</h3>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-white/70 max-w-xl">
              Notre équipe dédiée aux clubs et présidents a bien reçu vos informations. Un chargé d&apos;accompagnement va vous contacter avec un chiffrage calibré pour votre effectif.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={ROUTES.proClub}
                className="inline-flex items-center gap-2 rounded-full bg-[#7C3AED] px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110"
              >
                Retour au pôle Club
                <ArrowRight size={15} />
              </Link>
              <Link
                href={ROUTES.president}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/5"
              >
                Découvrir le Pôle Président
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              {FIELDS.map((f) => (
                <div
                  key={f.id}
                  className={
                    "area" in f && f.area
                      ? "sm:col-span-2"
                      : f.id === "clubName" || f.id === "ownerName"
                      ? "sm:col-span-1"
                      : ""
                  }
                >
                  <label className="block text-xs font-medium text-white/70">
                    {f.label}
                    {f.required ? <span className="text-amber-400"> *</span> : ""}
                  </label>
                  {"area" in f && f.area ? (
                    <textarea
                      name={f.id}
                      required={f.required}
                      rows={4}
                      placeholder="Vos objectifs majeurs pour la saison..."
                      className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/60 px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-[#F5D04A] focus:ring-1 focus:ring-[#F5D04A]"
                    />
                  ) : (
                    <input
                      name={f.id}
                      required={f.required}
                      type={"type" in f ? f.type : "text"}
                      defaultValue={f.id === "members" ? String(membersCount) : undefined}
                      onChange={
                        f.id === "members"
                          ? (e) => setMembersCount(Number(e.target.value) || 220)
                          : undefined
                      }
                      className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/60 px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-[#F5D04A] focus:ring-1 focus:ring-[#F5D04A]"
                    />
                  )}
                </div>
              ))}
            </div>

            <button
              type="submit"
              className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#7C3AED] to-purple-600 px-8 py-3.5 text-sm font-bold text-white shadow-xl transition hover:brightness-110"
            >
              Envoyer la demande de devis club
              <ArrowRight size={16} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ClubDevisPage() {
  return (
    <main className="min-h-screen bg-[#050505] px-4 py-16 text-white sm:px-6">
      <div className="mx-auto max-w-4xl">
        <Suspense fallback={<div className="py-20 text-center text-white/50">Chargement…</div>}>
          <ClubDevisForm />
        </Suspense>
      </div>
    </main>
  );
}
