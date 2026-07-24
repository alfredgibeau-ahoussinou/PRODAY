"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Reveal } from "./Reveal";
import { JOURNEYS } from "@/lib/content";
import { POLE_STYLES } from "@/lib/poles";
import type { PoleId } from "@/lib/poles";

type JourneyRolesProps = { fullPage?: boolean };

const POLE_GROUPS: {
  pole: PoleId;
  label: string;
  journeyIds: string[];
}[] = [
  {
    pole: "amateur",
    label: "Pôle Amateur",
    journeyIds: ["player", "coach", "parent"],
  },
  {
    pole: "supporter",
    label: "Pôle Supporter",
    journeyIds: ["supporter"],
  },
  {
    pole: "pro_joueur",
    label: "Pôle Pro Joueur",
    journeyIds: ["player"],
  },
  {
    pole: "pro_club",
    label: "Pôle Pro Club",
    journeyIds: ["club"],
  },
  {
    pole: "pro_staff",
    label: "Pôle Pro Staff",
    journeyIds: ["coach", "recruiter", "agent", "organizer"],
  },
  {
    pole: "sante",
    label: "Pôle Santé",
    journeyIds: ["medical"],
  },
  {
    pole: "sponsor",
    label: "Pôle Partenaires",
    journeyIds: [],
  },
];

function journeysForGroup(ids: string[]) {
  return JOURNEYS.filter((j) => ids.includes(j.id));
}

export function JourneyRoles({ fullPage }: JourneyRolesProps) {
  const [activePole, setActivePole] = useState<PoleId>("amateur");
  const [activeJourney, setActiveJourney] = useState(0);

  const group = POLE_GROUPS.find((g) => g.pole === activePole) ?? POLE_GROUPS[0];
  const poleJourneys = journeysForGroup(group.journeyIds);
  const journey = poleJourneys[activeJourney] ?? poleJourneys[0];
  const styles = POLE_STYLES[activePole];

  return (
    <section
      id={fullPage ? "parcours" : undefined}
      className={`bg-[#030303] ${fullPage ? "scroll-mt-24 py-12" : "scroll-mt-24 py-24"}`}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {!fullPage && (
          <Reveal>
            <p className="text-sm font-medium tracking-widest text-white/40">PARCOURS</p>
            <h2 className="font-display mt-2 text-3xl font-bold text-white sm:text-4xl">
              Chaque rôle, un chemin clair
            </h2>
          </Reveal>
        )}

        <div className={`flex flex-wrap gap-2 ${fullPage ? "mt-4" : "mt-10"}`}>
          {POLE_GROUPS.map((g) => (
            <button
              key={g.pole}
              type="button"
              onClick={() => {
                setActivePole(g.pole);
                setActiveJourney(0);
              }}
              className={`rounded-full px-5 py-2.5 text-sm font-medium transition ${
                activePole === g.pole
                  ? POLE_STYLES[g.pole].navActive
                  : "bg-white/5 text-white/60 ring-1 ring-white/10 hover:text-white"
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>

        {poleJourneys.length === 0 ? (
          <div className={`mt-12 card-premium rounded-2xl p-8 ${styles.card}`}>
            <p className="text-white/70">
              Les parcours partenaires (sponsors & marques) sont détaillés sur la page{" "}
              <span className="font-semibold text-amber-300">Espace Partenaires</span> : visibilité
              clubs, offres locales et campagnes nationales.
            </p>
          </div>
        ) : (
          <>
            {poleJourneys.length > 1 && (
              <div className="mt-8 flex flex-wrap gap-2">
                {poleJourneys.map((j, i) => (
                  <button
                    key={j.id}
                    type="button"
                    onClick={() => setActiveJourney(i)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      activeJourney === i
                        ? styles.navActive
                        : "bg-white/5 text-white/60 ring-1 ring-white/10 hover:text-white"
                    }`}
                  >
                    {j.role}
                  </button>
                ))}
              </div>
            )}

            {journey && (
              <motion.ol
                key={journey.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
              >
                {journey.steps.map((step, i) => (
                  <motion.li
                    key={step}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="card-premium relative rounded-2xl p-6"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-lg font-bold text-white">
                      {i + 1}
                    </span>
                    <p className="mt-4 font-medium leading-snug text-white/85">{step}</p>
                    {i < journey.steps.length - 1 && (
                      <span className="absolute -right-2 top-1/2 hidden h-0.5 w-4 bg-white/20 lg:block" />
                    )}
                  </motion.li>
                ))}
              </motion.ol>
            )}
          </>
        )}
      </div>
    </section>
  );
}
