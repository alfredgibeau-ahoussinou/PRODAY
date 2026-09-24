"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";

type Solution = {
  id: "proday" | "whatsapp_excel" | "sporteasy" | "assoconnect";
  name: string;
  badge?: string;
  tagline: string;
  isHero?: boolean;
};

const solutions: Solution[] = [
  {
    id: "proday",
    name: "ProDay",
    badge: "Tout-en-un IA & Vidéo",
    tagline: "L'écosystème nouvelle génération pour clubs, coachs, joueurs & sponsors",
    isHero: true,
  },
  {
    id: "sporteasy",
    name: "SportEasy",
    tagline: "Gestion d'équipes et convocations classiques",
  },
  {
    id: "assoconnect",
    name: "AssoConnect",
    tagline: "Comptabilité et adhésions associatives générales",
  },
  {
    id: "whatsapp_excel",
    name: "WhatsApp + Excel",
    tagline: "Méthode artisanale fragmentée et chronophage",
  },
];

type FeatureRow = {
  name: string;
  description: string;
  category: "Pôles & Expérience" | "Sport & IA" | "Gestion & Cotisations" | "Monétisation & Sponsors";
  proday: boolean | string;
  sporteasy: boolean | string;
  assoconnect: boolean | string;
  whatsapp_excel: boolean | string;
};

const comparisonData: FeatureRow[] = [
  // Pôles & Expérience
  {
    name: "Écosystème unifié 6 Pôles",
    description: "Interfaces sur mesure pour Joueur, Coach, Club, Parent, Sponsor et Supporter",
    category: "Pôles & Expérience",
    proday: "6 Pôles dédiés",
    sporteasy: "Coach / Joueur uniquement",
    assoconnect: "Bureau association",
    whatsapp_excel: "Groupes mélangés",
  },
  {
    name: "Expérience Gamifiée & Carte FUT 3D",
    description: "Cartes de joueur dynamiques, stats réelles, progression XP et niveau",
    category: "Pôles & Expérience",
    proday: true,
    sporteasy: false,
    assoconnect: false,
    whatsapp_excel: false,
  },
  {
    name: "Covoiturage club intégré & sécurisé",
    description: "Organisation des trajets de match avec géolocalisation et rsvp parents",
    category: "Pôles & Expérience",
    proday: true,
    sporteasy: "Partiel",
    assoconnect: false,
    whatsapp_excel: "Spam dans les groupes",
  },

  // Sport & IA
  {
    name: "Tableau Noir Tactique interactif",
    description: "Composition dynamique, consignes d'animation, flèches de pressing et bloc",
    category: "Sport & IA",
    proday: true,
    sporteasy: "Compo basique 2D",
    assoconnect: false,
    whatsapp_excel: false,
  },
  {
    name: "IA d'Analyse de Forme & Recommandations",
    description: "Détection de surmenage, conseils personnalisés d'entraînement et stats intelligentes",
    category: "Sport & IA",
    proday: true,
    sporteasy: false,
    assoconnect: false,
    whatsapp_excel: false,
  },
  {
    name: "Intégration Vidéo & Veo Camera",
    description: "Highlights de matchs, découpage automatique d'actions et tag vidéo",
    category: "Sport & IA",
    proday: "Module Veo natif",
    sporteasy: "Non",
    assoconnect: "Non",
    whatsapp_excel: "Fichiers lourds perdus",
  },

  // Gestion & Cotisations
  {
    name: "Paiement des cotisations & échéanciers",
    description: "Paiement en ligne CB sécurisé Stripe, relances auto et suivi en temps réel",
    category: "Gestion & Cotisations",
    proday: true,
    sporteasy: true,
    assoconnect: true,
    whatsapp_excel: "Chèques & virements manuels",
  },
  {
    name: "Validation licences & Certificats médicaux",
    description: "Upload instantané de documents, validation en 1 clic et alertes expiration",
    category: "Gestion & Cotisations",
    proday: true,
    sporteasy: "Partiel",
    assoconnect: true,
    whatsapp_excel: "Dossiers papier / emails",
  },
  {
    name: "Convocations instantanées & alertes push",
    description: "Présence confirmée en 1 tap, rappels automatiques et gestion remplaçants",
    category: "Gestion & Cotisations",
    proday: true,
    sporteasy: true,
    assoconnect: false,
    whatsapp_excel: "Sondages illisibles",
  },

  // Monétisation & Sponsors
  {
    name: "Espace Sponsor & Métriques de Visibilité",
    description: "Génération de devis sponsors, mise en avant digitale locale et calcul de ROI",
    category: "Monétisation & Sponsors",
    proday: true,
    sporteasy: false,
    assoconnect: false,
    whatsapp_excel: false,
  },
  {
    name: "Boutique & Billetterie Club intégrée",
    description: "Vente d'équipements aux couleurs du club et places de match",
    category: "Monétisation & Sponsors",
    proday: true,
    sporteasy: "Option payante",
    assoconnect: true,
    whatsapp_excel: false,
  },
  {
    name: "Garantie Sans Engagement",
    description: "Résiliation libre à tout moment, mensualisation ou formule annuelle à -20%",
    category: "Monétisation & Sponsors",
    proday: true,
    sporteasy: "Abonnement annuel",
    assoconnect: "Abonnement annuel",
    whatsapp_excel: "Gratuit mais chronophage",
  },
];

const categories = [
  "Toutes les fonctionnalités",
  "Pôles & Expérience",
  "Sport & IA",
  "Gestion & Cotisations",
  "Monétisation & Sponsors",
] as const;

export function CompetitorComparisonGrid() {
  const [selectedCategory, setSelectedCategory] = useState<string>("Toutes les fonctionnalités");

  const filtered = selectedCategory === "Toutes les fonctionnalités"
    ? comparisonData
    : comparisonData.filter((item) => item.category === selectedCategory);

  const renderCell = (val: boolean | string, isProday = false) => {
    if (typeof val === "boolean") {
      return val ? (
        <div className={`inline-flex items-center justify-center rounded-full p-1 ${isProday ? "bg-emerald-500/20 text-emerald-400" : "text-emerald-500"}`}>
          <Check size={18} strokeWidth={2.5} />
        </div>
      ) : (
        <div className="inline-flex items-center justify-center text-white/20">
          <X size={18} />
        </div>
      );
    }
    return (
      <span className={`text-xs font-medium ${isProday ? "text-[#E8B923] font-semibold" : "text-white/70"}`}>
        {val}
      </span>
    );
  };

  return (
    <div className="space-y-8">
      {/* Category Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {categories.map((cat) => {
          const on = cat === selectedCategory;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                on
                  ? "bg-white text-black shadow-lg"
                  : "border border-white/10 bg-white/5 text-white/60 hover:border-white/25 hover:text-white"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-neutral-950/80 shadow-2xl backdrop-blur-xl">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.02]">
              <th className="w-2/5 px-6 py-5 text-sm font-semibold text-white/50">Fonctionnalités clés</th>
              {solutions.map((sol) => (
                <th
                  key={sol.id}
                  className={`px-4 py-5 text-center align-top ${
                    sol.isHero ? "bg-[#E8B923]/10 relative border-x border-[#E8B923]/20" : ""
                  }`}
                >
                  {sol.isHero && (
                    <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-[#E8B923] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black">
                      <Sparkles size={11} />
                      {sol.badge}
                    </div>
                  )}
                  <div className={`text-base font-bold ${sol.isHero ? "text-[#E8B923]" : "text-white"}`}>
                    {sol.name}
                  </div>
                  <p className="mt-1 text-[11px] font-normal leading-tight text-white/40">
                    {sol.tagline}
                  </p>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            <AnimatePresence mode="popLayout">
              {filtered.map((item) => (
                <motion.tr
                  key={item.name}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="font-semibold text-sm text-white">{item.name}</div>
                    <div className="text-xs text-white/45 mt-0.5">{item.description}</div>
                  </td>
                  <td className="px-4 py-4 text-center bg-[#E8B923]/5 border-x border-[#E8B923]/20">
                    {renderCell(item.proday, true)}
                  </td>
                  <td className="px-4 py-4 text-center">
                    {renderCell(item.sporteasy)}
                  </td>
                  <td className="px-4 py-4 text-center">
                    {renderCell(item.assoconnect)}
                  </td>
                  <td className="px-4 py-4 text-center">
                    {renderCell(item.whatsapp_excel)}
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* CTA Box */}
      <div className="rounded-2xl border border-[#E8B923]/30 bg-gradient-to-r from-[#E8B923]/15 via-black to-[#E8B923]/10 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#E8B923]">
            <ShieldCheck size={16} />
            Migration assistée & 0 engagement
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white">
            Prêt à remplacer 4 outils par un seul écosystème ?
          </h3>
          <p className="text-sm text-white/60">
            Import de vos effectifs et licences en 5 minutes, sans changer vos habitudes.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 shrink-0">
          <Link
            href={ROUTES.clubDevis}
            className="rounded-full bg-[#E8B923] px-6 py-3 text-sm font-bold text-black transition hover:brightness-110 shadow-lg flex items-center gap-2"
          >
            Calculer mes économies
            <ArrowRight size={16} />
          </Link>
          <Link
            href={ROUTES.demo}
            className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/50"
          >
            Tester la démo
          </Link>
        </div>
      </div>
    </div>
  );
}
