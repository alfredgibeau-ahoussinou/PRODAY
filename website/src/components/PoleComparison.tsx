"use client";

import { motion } from "framer-motion";
import { Check, X, Minus, Filter } from "lucide-react";
import { useState } from "react";

const poles = [
  {
    id: "joueur",
    name: "Joueur",
    color: "#1E3AFF",
    features: {
      profile: true,
      stats: true,
      mercato: true,
      matches: true,
      arena: true,
      covoiturage: true,
      messaging: true,
      calendar: true,
      cvExport: true,
      visibility: true,
      recruiting: false,
      teamManagement: false,
      booking: false,
      sponsorship: false,
      community: true,
    },
  },
  {
    id: "pro",
    name: "Pro",
    color: "#7C3AED",
    features: {
      profile: true,
      stats: true,
      mercato: true,
      matches: true,
      arena: true,
      covoiturage: true,
      messaging: true,
      calendar: true,
      cvExport: false,
      visibility: true,
      recruiting: true,
      teamManagement: true,
      booking: false,
      sponsorship: false,
      community: false,
    },
  },
  {
    id: "partenaires",
    name: "Partenaires",
    color: "#EF4444",
    features: {
      profile: true,
      stats: false,
      mercato: false,
      matches: false,
      arena: true,
      covoiturage: false,
      messaging: true,
      calendar: false,
      cvExport: false,
      visibility: true,
      recruiting: false,
      teamManagement: false,
      booking: false,
      sponsorship: true,
      community: false,
    },
  },
  {
    id: "supporter",
    name: "Supporter",
    color: "#06B6D4",
    features: {
      profile: true,
      stats: false,
      mercato: false,
      matches: true,
      arena: false,
      covoiturage: false,
      messaging: false,
      calendar: false,
      cvExport: false,
      visibility: false,
      recruiting: false,
      teamManagement: false,
      booking: false,
      sponsorship: false,
      community: true,
    },
  },
];

const features = [
  { id: "profile", label: "Profil personnalisé", category: "Base" },
  { id: "stats", label: "Stats de match", category: "Performance" },
  { id: "mercato", label: "Mercato & recrutement", category: "Recrutement" },
  { id: "matches", label: "Gestion des matchs", category: "Compétition" },
  { id: "arena", label: "Tournois Arène", category: "Compétition" },
  { id: "covoiturage", label: "Covoiturage", category: "Logistique" },
  { id: "messaging", label: "Messagerie", category: "Communication" },
  { id: "calendar", label: "Calendrier", category: "Organisation" },
  { id: "cvExport", label: "Export CV PDF", category: "Carrière" },
  { id: "visibility", label: "Score de visibilité", category: "Carrière" },
  { id: "recruiting", label: "Outils recrutement", category: "Recrutement" },
  { id: "teamManagement", label: "Gestion effectif", category: "Management" },
  { id: "booking", label: "Prise de RDV", category: "Services" },
  { id: "sponsorship", label: "Partenariats", category: "Business" },
  { id: "community", label: "Fil communautaire", category: "Social" },
];

const categories = ["Tous", "Base", "Performance", "Recrutement", "Compétition", "Logistique", "Communication", "Organisation", "Carrière", "Management", "Services", "Business", "Social"];

export function PoleComparison() {
  const [selectedPole, setSelectedPole] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("Tous");
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);

  const filteredFeatures = selectedCategory === "Tous" 
    ? features 
    : features.filter(f => f.category === selectedCategory);

  const filteredPoles = showOnlyAvailable 
    ? poles.filter(pole => {
        const hasSelectedFeatures = filteredFeatures.every(feature => 
          pole.features[feature.id as keyof typeof pole.features] === true
        );
        return hasSelectedFeatures;
      })
    : poles;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {poles.map((pole) => (
          <motion.button
            key={pole.id}
            onClick={() => setSelectedPole(pole.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`relative overflow-hidden rounded-2xl border-2 p-4 transition-all ${
              selectedPole === pole.id
                ? "border-[var(--proday-accent)] bg-[var(--proday-accent)]/10"
                : "border-white/10 bg-white/5 hover:border-white/20"
            }`}
            style={
              selectedPole === pole.id
                ? { borderColor: pole.color, backgroundColor: `${pole.color}20` }
                : {}
            }
          >
            <div className="font-bold text-white">{pole.name}</div>
          </motion.button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-white/50" />
          <span className="text-sm font-medium text-white/70">Filtrer par :</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition ${
                selectedCategory === category
                  ? "bg-[var(--proday-accent)] text-white"
                  : "bg-white/10 text-white/70 hover:bg-white/20"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 ml-auto cursor-pointer">
          <input
            type="checkbox"
            checked={showOnlyAvailable}
            onChange={(e) => setShowOnlyAvailable(e.target.checked)}
            className="w-4 h-4 rounded border-white/30 bg-white/10 text-[var(--proday-accent)] focus:ring-[var(--proday-accent)]"
          />
          <span className="text-sm text-white/70">Uniquement disponibles</span>
        </label>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-4 py-3 text-left text-sm font-semibold text-white/70">
                Fonctionnalité
              </th>
              {filteredPoles.map((pole) => (
                <th
                  key={pole.id}
                  className="px-4 py-3 text-center text-sm font-semibold text-white"
                  style={{ color: pole.color }}
                >
                  {pole.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredFeatures.map((feature, index) => (
              <motion.tr
                key={feature.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border-b border-white/5 last:border-0"
              >
                <td className="px-4 py-3 text-sm text-white/90">
                  <div>
                    <div>{feature.label}</div>
                    <div className="text-xs text-white/40">{feature.category}</div>
                  </div>
                </td>
                {filteredPoles.map((pole) => {
                  const hasFeature = pole.features[feature.id as keyof typeof pole.features];
                  return (
                    <td key={pole.id} className="px-4 py-3 text-center">
                      {hasFeature === true ? (
                        <Check className="mx-auto h-5 w-5 text-green-500" />
                      ) : hasFeature === false ? (
                        <X className="mx-auto h-5 w-5 text-white/30" />
                      ) : (
                        <Minus className="mx-auto h-5 w-5 text-white/30" />
                      )}
                    </td>
                  );
                })}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedPole && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0 p-6"
        >
          <h3 className="font-display text-2xl font-extrabold uppercase tracking-[-0.03em] text-white mb-4">
            {poles.find((p) => p.id === selectedPole)?.name}
          </h3>
          <p className="text-white/70">
            {selectedPole === "joueur" &&
              "Le pôle Joueur est conçu pour les footballeurs et joueuses qui veulent gérer leur carrière, suivre leurs stats et se faire repérer par les clubs."}
            {selectedPole === "pro" &&
              "Le pôle Pro s'adresse aux coachs et clubs qui ont besoin d'outils avancés pour gérer leurs équipes et trouver des talents."}
            {selectedPole === "partenaires" &&
              "Le pôle Partenaires est conçu pour les sponsors et marques qui souhaitent s'associer à des événements et clubs de football."}
            {selectedPole === "supporter" &&
              "Le pôle Supporter permet aux passionnés de foot de suivre leurs clubs favoris, accéder aux matchs en direct et interagir avec la communauté."}
          </p>
        </motion.div>
      )}
    </div>
  );
}
