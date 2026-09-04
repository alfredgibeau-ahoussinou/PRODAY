"use client";

import { Quote, Star, ShieldCheck, Users } from "lucide-react";

type Testimonial = {
  quote: string;
  author: string;
  role: string;
  club: string;
  rating: number;
  highlight: string;
};

const testimonials: Testimonial[] = [
  {
    highlight: "1 200 € économisés sur notre budget annuel",
    quote:
      "Sur SportEasy, payer 140€ par équipe pour nos 14 catégories devenait intenable pour un club de district. Avec ProDay, on paie 3€ par licencié pour tout le monde, avec en prime les cartes FUT que les jeunes s'arrachent !",
    author: "Christophe R.",
    role: "Président de Club",
    club: "Olympique Neuilly (320 licenciés)",
    rating: 5,
  },
  {
    highlight: "Les convocations de match se font en 2 minutes",
    quote:
      "Avant, je passais mes samedis matins à relancer les gars sur WhatsApp pour savoir qui venait. Maintenant, avec le bouton 1-tap et la relance push, à 20h le vendredi mon groupe de 14 est bouclé avec l'itinéraire Waze partagé.",
    author: "Mickaël B.",
    role: "Éducateur U17 & Séniors R2",
    club: "FC Plessis-Robinson",
    rating: 5,
  },
  {
    highlight: "Zéro pub pour les gamins, c'est rassurant pour les parents",
    quote:
      "Ce qui nous a convaincu par rapport à la version gratuite de SportEasy, c'est l'absence totale de bannières de pub pour les U11 et U13. Les parents adorent le module de covoiturage qui évite les spams.",
    author: "Sarah L.",
    role: "Secrétaire Générale & Responsable Féminines",
    club: "ES Meudon Football",
    rating: 5,
  },
];

export function EliteTestimonials() {
  return (
    <section className="relative bg-[#06090E] py-24 sm:py-32 border-t border-slate-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            APPROUVÉ PAR LE FOOTBALL DU TERRAIN
          </div>
          <h2 className="mt-4 font-display text-3xl font-black tracking-tight text-white sm:text-5xl">
            Ce que disent ceux qui ont{" "}
            <span className="bg-gradient-to-r from-[#00E676] to-[#38BDF8] bg-clip-text text-transparent">
              quitté SportEasy & WhatsApp
            </span>
          </h2>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="rounded-3xl border border-slate-800 bg-[#0E1322] p-6 sm:p-8 flex flex-col justify-between shadow-xl relative overflow-hidden"
            >
              <div>
                <div className="flex gap-1 text-amber-400">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400" />
                  ))}
                </div>

                <p className="mt-3 text-sm font-bold text-[#00E676]">{t.highlight}</p>
                <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed italic">
                  « {t.quote} »
                </p>
              </div>

              <div className="mt-6 border-t border-slate-800/80 pt-4">
                <p className="text-sm font-bold text-white">{t.author}</p>
                <p className="text-xs text-slate-400">{t.role}</p>
                <p className="text-xs font-semibold text-[#00E676] mt-0.5">{t.club}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
