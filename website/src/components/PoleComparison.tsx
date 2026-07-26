"use client";

import { motion } from "framer-motion";
import { Check, X, Minus } from "lucide-react";
import { useState } from "react";

const poles = [
  {
    id: "joueur",
    name: "Joueur",
    color: "#4C8BFF",
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
    color: "#006CFC",
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
    id: "sante",
    name: "Santé",
    color: "#00CCB4",
    features: {
      profile: true,
      stats: false,
      mercato: false,
      matches: false,
      arena: false,
      covoiturage: false,
      messaging: true,
      calendar: true,
      cvExport: false,
      visibility: true,
      recruiting: false,
      teamManagement: false,
      booking: true,
      sponsorship: false,
      community: false,
    },
  },
  {
    id: "partenaires",
    name: "Partenaires",
    color: "#D4AF37",
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
    color: "#3C00F0",
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
  { id: "profile", label: "Profil personnalisé" },
  { id: "stats", label: "Stats de match" },
  { id: "mercato", label: "Mercato & recrutement" },
  { id: "matches", label: "Gestion des matchs" },
  { id: "arena", label: "Tournois Arena" },
  { id: "covoiturage", label: "Covoiturage" },
  { id: "messaging", label: "Messagerie" },
  { id: "calendar", label: "Calendrier" },
  { id: "cvExport", label: "Export CV PDF" },
  { id: "visibility", label: "Score de visibilité" },
  { id: "recruiting", label: "Outils recrutement" },
  { id: "teamManagement", label: "Gestion effectif" },
  { id: "booking", label: "Prise de RDV" },
  { id: "sponsorship", label: "Partenariats" },
  { id: "community", label: "Fil communautaire" },
];

export function PoleComparison() {
  const [selectedPole, setSelectedPole] = useState<string | null>(null);

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

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-4 py-3 text-left text-sm font-semibold text-white/70">
                Fonctionnalité
              </th>
              {poles.map((pole) => (
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
            {features.map((feature, index) => (
              <motion.tr
                key={feature.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border-b border-white/5 last:border-0"
              >
                <td className="px-4 py-3 text-sm text-white/90">{feature.label}</td>
                {poles.map((pole) => {
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
              "Le pôle Pro s'adresse aux coachs, recruteurs, clubs et agents qui ont besoin d'outils avancés pour gérer leurs équipes et trouver des talents."}
            {selectedPole === "sante" &&
              "Le pôle Santé est destiné aux professionnels de santé (kinés, médecins, coachs mentaux) qui travaillent avec des sportifs."}
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
