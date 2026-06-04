"use client";

import { motion } from "framer-motion";
import { useState } from "react";

const NODES = [
  { id: "mercato", label: "Mercato", x: 50, y: 50, center: true },
  { id: "player", label: "Joueur", x: 18, y: 35 },
  { id: "coach", label: "Coach", x: 82, y: 35 },
  { id: "club", label: "Club", x: 18, y: 68 },
  { id: "organizer", label: "Organisateur", x: 82, y: 68 },
  { id: "arena", label: "Arena", x: 50, y: 18 },
  { id: "pulse", label: "Pulse", x: 50, y: 82 },
] as const;

const EDGES: [string, string][] = [
  ["player", "mercato"],
  ["coach", "mercato"],
  ["club", "mercato"],
  ["organizer", "arena"],
  ["mercato", "arena"],
  ["player", "pulse"],
  ["coach", "club"],
];

export function EcosystemMap() {
  const [active, setActive] = useState<string>("mercato");
  const node = NODES.find((n) => n.id === active);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-neutral-200 bg-gradient-to-br from-neutral-50 to-white">
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
                stroke={lit ? "#0a0a0a" : "#e5e5e5"}
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
                  ? "bg-proday-ink text-white ring-4 ring-neutral-200"
                  : "bg-proday-ink text-white scale-110"
                : "bg-white text-proday-ink hover:scale-105"
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
          className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6"
        >
          <h3 className="text-lg font-bold">{node.label}</h3>
          <p className="mt-2 text-proday-muted">
            {DESCRIPTIONS[node.id] ?? "Acteur de l'écosystème ProDay."}
          </p>
        </motion.div>
      )}
    </div>
  );
}

const DESCRIPTIONS: Record<string, string> = {
  mercato:
    "Hub recrutement — annonces, candidatures, filtres poste/niveau/ville.",
  player: "Profil, Pulse, stats, CV PDF et candidatures Mercato.",
  coach: "Vérification, détections, convocations et Live Stats équipe.",
  club: "Annonces actives, multi-équipes, exports candidatures.",
  organizer: "Tournois Arena — inscriptions et palmarès publiés.",
  arena: "Compétitions locales intégrées au calendrier saison.",
  pulse: "Score de visibilité — profil, activité et confiance.",
};
