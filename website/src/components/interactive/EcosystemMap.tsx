"use client";

import { motion } from "framer-motion";
import { useState } from "react";

const NODES = [
  { id: "mercato", label: "Mercato", x: 50, y: 50, center: true },
  { id: "player", label: "Joueur", x: 12, y: 35 },
  { id: "coach", label: "Coach", x: 88, y: 28 },
  { id: "agent", label: "Agent", x: 88, y: 52 },
  { id: "recruiter", label: "Recruteur", x: 72, y: 38 },
  { id: "club", label: "Club", x: 12, y: 68 },
  { id: "organizer", label: "Organisateur", x: 82, y: 78 },
  { id: "health", label: "Pôle santé", x: 28, y: 18 },
  { id: "arena", label: "Arena", x: 72, y: 12 },
  { id: "pulse", label: "Pulse", x: 50, y: 85 },
] as const;

const EDGES: [string, string][] = [
  ["player", "mercato"],
  ["coach", "mercato"],
  ["agent", "mercato"],
  ["recruiter", "mercato"],
  ["club", "mercato"],
  ["organizer", "arena"],
  ["mercato", "arena"],
  ["player", "pulse"],
  ["coach", "club"],
  ["agent", "club"],
  ["player", "health"],
  ["coach", "health"],
];

export function EcosystemMap() {
  const [active, setActive] = useState<string>("mercato");
  const node = NODES.find((n) => n.id === active);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0a0a0c] to-[#111]">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100">
          {EDGES.map(([a, b]) => {
            const na = NODES.find((n) => n.id === a)!;
            const nb = NODES.find((n) => n.id === b)!;
            const lit =
              active === a || active === b || active === "mercato";
            return (
              <motion.line
                key={`${a}-${b}`}
                x1={na.x}
                y1={na.y}
                x2={nb.x}
                y2={nb.y}
                stroke={lit ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.08)"}
                strokeWidth={lit ? 0.4 : 0.2}
                animate={{ opacity: lit ? 1 : 0.4 }}
              />
            );
          })}
        </svg>
        {NODES.map((n) => (
          <motion.button
            key={n.id}
            type="button"
            onClick={() => setActive(n.id)}
            className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full px-3 py-2 text-xs font-semibold shadow-md transition sm:text-sm ${
              active === n.id
                ? "center" in n && n.center
                  ? "bg-white text-neutral-950 ring-4 ring-white/20"
                  : "scale-110 bg-white text-neutral-950"
                : "bg-white/10 text-white hover:scale-105 hover:bg-white/20"
            }`}
            style={{ left: `${n.x}%`, top: `${n.y}%` }}
            whileTap={{ scale: 0.95 }}
          >
            {n.label}
          </motion.button>
        ))}
      </div>
      {node && (
        <motion.div
          key={node.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-premium mt-6 rounded-2xl p-6"
        >
          <h3 className="text-lg font-bold text-white">{node.label}</h3>
          <p className="mt-2 text-white/55">
            {DESCRIPTIONS[node.id] ?? "Acteur de l'écosystème ProDay."}
          </p>
        </motion.div>
      )}
    </div>
  );
}

const DESCRIPTIONS: Record<string, string> = {
  mercato:
    "Hub recrutement — annonces, candidatures, filtres poste/niveau/ville. Publié par les recruteurs Pro.",
  player: "Profil, Pulse, stats, CV PDF, pôle santé, covoiturage et candidatures Mercato.",
  coach: "Vérification diplôme, effectif, convocations et Live Stats équipe.",
  agent: "Mandats joueurs, repérage et contacts clubs sur Mercato Pro.",
  recruiter: "Rôle dédié — scouting, annonces Mercato Pro et suivi candidatures.",
  club: "Recruteur Pro — annonces actives, multi-équipes, exports candidatures.",
  organizer: "Tournois Arena — inscriptions et palmarès publiés.",
  health: "Kinés, coach mental, nutrition — annuaire vérifié et messagerie sécurisée.",
  arena: "Compétitions locales intégrées au calendrier saison.",
  pulse: "Score de visibilité — profil, activité et confiance.",
};
