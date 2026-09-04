"use client";

import { Check, X, Sparkles, Shield, Trophy, Zap, HelpCircle } from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";

type Solution = {
  id: "proday" | "sporteasy" | "mycoach" | "whatsapp";
  name: string;
  badge?: string;
  isWinner?: boolean;
};

const solutions: Solution[] = [
  {
    id: "proday",
    name: "PRODAY ELITE",
    badge: "🏆 Le Tout-en-Un n°1",
    isWinner: true,
  },
  {
    id: "sporteasy",
    name: "SportEasy",
    badge: "150€ / équipe",
  },
  {
    id: "mycoach",
    name: "MyCoach FFF",
    badge: "Orienté coach seul",
  },
  {
    id: "whatsapp",
    name: "WhatsApp + Excel",
    badge: "Désorganisé",
  },
];

type ComparisonRow = {
  feature: string;
  description: string;
  proday: string | boolean;
  sporteasy: string | boolean;
  mycoach: string | boolean;
  whatsapp: string | boolean;
};

const rows: ComparisonRow[] = [
  {
    feature: "Tarification Club Annuelle",
    description: "Coût réel pour un club de 16 équipes (environ 250 licenciés)",
    proday: "750 € / an (3€ / licencié)",
    sporteasy: "Jusqu'à 2 400 € / an",
    mycoach: "Sur devis rigide",
    whatsapp: "0 € (mais 20h/sem perdues)",
  },
  {
    feature: "Zéro Publicité Intrusive",
    description: "Protection de la vie privée des jeunes licenciés et concentration",
    proday: true,
    sporteasy: false, // SportEasy gratuit a des bannières pub
    mycoach: true,
    whatsapp: true,
  },
  {
    feature: "Copilote IA Tactique & Causeries",
    description: "Génération de séances d'entraînement adaptées FFF et causeries de match",
    proday: "IA FFF Intégrée",
    sporteasy: false,
    mycoach: false,
    whatsapp: false,
  },
  {
    feature: "Cartes Joueur FUT 3D & Progression",
    description: "Gamification avec note OVR, radar des 6 attributs et niveau d'XP",
    proday: "Cartes 3D réelles",
    sporteasy: false,
    mycoach: false,
    whatsapp: false,
  },
  {
    feature: "Convocations 1-Tap & Relances Auto",
    description: "Réponse instantanée, géolocalisation Waze et relance des retardataires en 1 clic",
    proday: true,
    sporteasy: "Partiel",
    mycoach: "Basique",
    whatsapp: false,
  },
  {
    feature: "Suivi des Licences FFF & Cotisations",
    description: "Certificat médical, adhésion en ligne et validation de ligue en direct",
    proday: true,
    sporteasy: "Manuel",
    mycoach: "Basique",
    whatsapp: false,
  },
  {
    feature: "Covoiturage Club Sécurisé",
    description: "Réservation de places pour les déplacements et contacts parents vérifiés",
    proday: true,
    sporteasy: "Limité",
    mycoach: false,
    whatsapp: "Spam dans les groupes",
  },
  {
    feature: "Monétisation Sponsors Locaux",
    description: "Espace partenaire dédié pour générer des recettes financières pour le club",
    proday: "Jusqu'à +5 000 € / an",
    sporteasy: false,
    mycoach: false,
    whatsapp: false,
  },
];

export function ProDayVersusMatrix() {
  return (
    <section id="comparatif-direct" className="relative bg-[#090D16] py-24 sm:py-32 border-t border-slate-800/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-400">
            <Trophy className="h-3.5 w-3.5" />
            POURQUOI PRODAY EST LE CHOIX ÉVIDENT
          </div>
          <h2 className="mt-4 font-display text-3xl font-black tracking-tight text-white sm:text-5xl">
            La comparaison sans tabou avec{" "}
            <span className="bg-gradient-to-r from-[#00E676] to-[#38BDF8] bg-clip-text text-transparent">
              SportEasy & MyCoach FFF
            </span>
          </h2>
          <p className="mt-4 text-base text-slate-300 sm:text-lg">
            Comparez objectivement les fonctionnalités, le modèle économique et l&apos;impact réel sur votre club.
          </p>
        </div>

        {/* Comparison Table Desktop */}
        <div className="mt-16 overflow-x-auto rounded-3xl border border-slate-800 bg-[#0C111D] shadow-2xl">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60">
                <th className="p-6 text-sm font-bold uppercase tracking-wider text-slate-400 w-1/3">
                  Fonctionnalités & Valeur Club
                </th>
                {solutions.map((s) => (
                  <th
                    key={s.id}
                    className={`p-6 text-center ${
                      s.isWinner
                        ? "bg-[#00E676]/10 border-x-2 border-t-2 border-[#00E676] relative"
                        : ""
                    }`}
                  >
                    {s.isWinner && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#00E676] px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-black shadow-md">
                        {s.badge}
                      </span>
                    )}
                    <p className={`text-base font-black ${s.isWinner ? "text-[#00E676]" : "text-white"}`}>
                      {s.name}
                    </p>
                    {!s.isWinner && (
                      <span className="text-[11px] font-medium text-slate-400">{s.badge}</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {rows.map((row, idx) => (
                <tr
                  key={idx}
                  className={`hover:bg-slate-800/30 transition ${
                    idx % 2 === 0 ? "bg-transparent" : "bg-slate-900/20"
                  }`}
                >
                  <td className="p-5 sm:p-6">
                    <p className="text-sm font-bold text-white">{row.feature}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{row.description}</p>
                  </td>

                  {/* ProDay column (highlighted) */}
                  <td className="p-5 sm:p-6 text-center bg-[#00E676]/5 border-x-2 border-[#00E676]">
                    {typeof row.proday === "boolean" ? (
                      row.proday ? (
                        <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#00E676]/20 text-[#00E676]">
                          <Check className="h-5 w-5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/20 text-rose-400">
                          <X className="h-5 w-5" />
                        </div>
                      )
                    ) : (
                      <span className="inline-block rounded-lg bg-[#00E676]/20 border border-[#00E676]/40 px-3 py-1 text-xs font-black text-[#00E676]">
                        {row.proday}
                      </span>
                    )}
                  </td>

                  {/* SportEasy column */}
                  <td className="p-5 sm:p-6 text-center text-xs font-medium text-slate-300">
                    {typeof row.sporteasy === "boolean" ? (
                      row.sporteasy ? (
                        <div className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-slate-300">
                          <Check className="h-4 w-4" />
                        </div>
                      ) : (
                        <div className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-rose-950/50 text-rose-400">
                          <X className="h-4 w-4" />
                        </div>
                      )
                    ) : (
                      <span>{row.sporteasy}</span>
                    )}
                  </td>

                  {/* MyCoach column */}
                  <td className="p-5 sm:p-6 text-center text-xs font-medium text-slate-300">
                    {typeof row.mycoach === "boolean" ? (
                      row.mycoach ? (
                        <div className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-slate-300">
                          <Check className="h-4 w-4" />
                        </div>
                      ) : (
                        <div className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-rose-950/50 text-rose-400">
                          <X className="h-4 w-4" />
                        </div>
                      )
                    ) : (
                      <span>{row.mycoach}</span>
                    )}
                  </td>

                  {/* WhatsApp + Excel column */}
                  <td className="p-5 sm:p-6 text-center text-xs font-medium text-slate-400">
                    {typeof row.whatsapp === "boolean" ? (
                      row.whatsapp ? (
                        <div className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-slate-300">
                          <Check className="h-4 w-4" />
                        </div>
                      ) : (
                        <div className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-rose-950/50 text-rose-400">
                          <X className="h-4 w-4" />
                        </div>
                      )
                    ) : (
                      <span>{row.whatsapp}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bottom Callout */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-6 rounded-2xl border border-[#00E676]/30 bg-gradient-to-r from-[#00E676]/10 to-[#38BDF8]/10 p-6 sm:p-8 backdrop-blur-md">
          <div>
            <h3 className="text-lg font-bold text-white">
              Prêt à économiser jusqu&apos;à 1 500 € par an tout en équipant vos licenciés ?
            </h3>
            <p className="text-sm text-slate-300 mt-1">
              Migration assistée gratuite en 48h depuis SportEasy, AssoConnect ou vos fichiers Excel.
            </p>
          </div>
          <Link
            href={ROUTES.proClub}
            className="inline-flex items-center justify-center gap-2 shrink-0 rounded-xl bg-[#00E676] px-6 py-3 text-sm font-bold text-black transition hover:bg-[#00C853]"
          >
            <Zap className="h-4 w-4 fill-black" />
            Migrer mon Club vers ProDay
          </Link>
        </div>
      </div>
    </section>
  );
}
