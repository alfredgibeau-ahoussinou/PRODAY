"use client";

import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import type { JoueurAgeGroup } from "@/lib/joueurExperienceTheme";
import {
  joueurExperienceHref,
  writeStoredJoueurProfile,
} from "@/lib/joueurProfileStorage";

const GenderEmblemCanvas = dynamic(
  () =>
    import("./joueurWorld/GenderEmblemCanvas").then((m) => m.GenderEmblemCanvas),
  { ssr: false },
);

const JoueurWorldCanvas = dynamic(
  () =>
    import("./joueurWorld/JoueurWorldCanvas").then((m) => m.JoueurWorldCanvas),
  { ssr: false },
);

const ease = [0.16, 1, 0.3, 1] as const;

type GenderChoice = "women" | "men";

const AGE_BANDS: {
  id: JoueurAgeGroup;
  age: number;
  label: string;
  world: string;
  vibe: string;
  detail: string;
}[] = [
  {
    id: "youth",
    age: 11,
    label: "< 13",
    world: "Univers jeune",
    vibe: "Défis · étoiles · mini-terrain",
    detail: "Parcours ludique, objectifs simples, suivi parent discret.",
  },
  {
    id: "teen",
    age: 15,
    label: "13–17",
    world: "Univers ado",
    vibe: "Niveau · vitesse · stats live",
    detail: "HUD de progression, missions, stats animées.",
  },
  {
    id: "adult",
    age: 22,
    label: "18+",
    world: "Univers adulte",
    vibe: "Data · heatmap · performance",
    detail: "Analyse, historique, environnement de performance.",
  },
];

/**
 * Porte Qui es-tu ? — menu libre, 3D isolées (pas de calques superposés).
 */
export function JoueurWhoAreYouGate() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reduce = useReducedMotion();

  const pref = searchParams.get("gender");
  const initialGender: GenderChoice | null =
    pref === "women" || pref === "woman" || pref === "female"
      ? "women"
      : pref === "men" || pref === "man" || pref === "male"
        ? "men"
        : null;

  const [gender, setGender] = useState<GenderChoice | null>(initialGender);
  const [hoverGender, setHoverGender] = useState<GenderChoice | null>(null);
  const [ageBand, setAgeBand] = useState<JoueurAgeGroup | null>(null);
  const [phase, setPhase] = useState<"gender" | "age" | "launch">(
    initialGender ? "age" : "gender",
  );
  const [launching, setLaunching] = useState(false);

  const band = AGE_BANDS.find((b) => b.id === ageBand) ?? null;

  function enter() {
    if (!gender || !band || launching) return;
    setLaunching(true);
    setPhase("launch");
    const hints = { age: band.age, gender };
    writeStoredJoueurProfile(hints);
    window.setTimeout(
      () => router.push(joueurExperienceHref(hints)),
      reduce ? 150 : 650,
    );
  }

  return (
    <div className="relative min-h-[100svh] bg-[#01040f]">
      {/* Fond simple — pas de canvas plein écran sous le menu / les cartes */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            gender === "women" || hoverGender === "women"
              ? "radial-gradient(ellipse 60% 45% at 50% 0%, rgba(125,211,199,0.14), transparent 55%), #01040f"
              : "radial-gradient(ellipse 60% 45% at 50% 0%, rgba(30, 58, 255,0.18), transparent 55%), #01040f",
        }}
      />

      <div
        className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-5xl flex-col px-4 pb-10 sm:px-6 lg:px-8"
        style={{ paddingTop: "var(--joueur-nav-offset, 5.5rem)" }}
      >
        <div className="flex-1 flex flex-col justify-center py-6 sm:py-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={phase === "launch" ? "age" : phase}
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: launching ? 0.45 : 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease }}
            >
              <p className="font-display text-base font-semibold tracking-[-0.03em] text-white sm:text-lg">
                Pro Day Joueur
              </p>
              <h1 className="mt-2 max-w-[12ch] font-display text-[clamp(2.3rem,9vw,4.8rem)] font-medium leading-[0.92] tracking-[-0.045em]">
                Qui es tu&nbsp;?
              </h1>
              <p className="mt-3 max-w-md text-sm text-white/60 sm:text-base">
                {phase === "gender"
                  ? "Choisis joueuse ou joueur — chaque carte a sa propre scène 3D."
                  : "Choisis ton âge pour ouvrir l’univers adapté. Les tarifs IA / coach suivent."}
              </p>

              {phase === "gender" ? (
                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <GenderEmblemCard
                    label="Joueuse"
                    caption="Football féminin"
                    gender="female"
                    choice="women"
                    active={hoverGender === "women"}
                    onHover={setHoverGender}
                    onSelect={() => {
                      setGender("women");
                      setPhase("age");
                    }}
                  />
                  <GenderEmblemCard
                    label="Joueur"
                    caption="Football masculin"
                    gender="male"
                    choice="men"
                    active={hoverGender === "men"}
                    onHover={setHoverGender}
                    onSelect={() => {
                      setGender("men");
                      setPhase("age");
                    }}
                  />
                </div>
              ) : null}

              {phase === "age" || phase === "launch" ? (
                <div className="mt-8">
                  <div className="mb-4 flex flex-wrap items-center gap-3">
                    <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-cyan-300/80">
                      Ton âge
                    </p>
                    <button
                      type="button"
                      onClick={() => setPhase("gender")}
                      className="text-xs text-white/45 underline-offset-2 hover:text-white/80 hover:underline"
                    >
                      {gender === "women" ? "Joueuse" : "Joueur"} · modifier
                    </button>
                  </div>

                  {/* Petite scène 3D dédiée — une seule, dans un cadre, pas plein écran */}
                  <div className="joueur-3d-stage mb-5 h-[160px] w-full rounded-2xl border border-white/10 bg-black/40 sm:h-[200px]">
                    <JoueurWorldCanvas
                      kind="gate"
                      accent={gender === "women" ? "#7DD3C7" : "#F5D04A"}
                      intensity="medium"
                      className="h-full w-full"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    {AGE_BANDS.map((b) => {
                      const on = ageBand === b.id;
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setAgeBand(b.id)}
                          className={`rounded-2xl border p-4 text-left sm:p-5 ${
                            on
                              ? "border-cyan-300/55 bg-cyan-400/15"
                              : "border-white/15 bg-white/[0.05] hover:border-white/35"
                          }`}
                        >
                          <span className="font-display text-2xl tracking-[-0.04em] sm:text-3xl">
                            {b.label}
                          </span>
                          <span className="mt-1 block text-sm font-semibold text-white/90">
                            {b.world}
                          </span>
                          <span className="mt-1 block text-xs text-white/50">
                            {b.vibe}
                          </span>
                          <span className="mt-2 block text-[11px] text-white/40">
                            {b.detail}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    disabled={!band || launching}
                    onClick={enter}
                    className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#FFFFFF] to-cyan-400 px-6 text-sm font-semibold text-white disabled:opacity-35 sm:mt-8 sm:w-auto sm:min-h-14 sm:px-8"
                  >
                    {launching ? "Ouverture…" : "Entrer dans mon univers"}
                    <ArrowRight size={16} />
                  </button>
                </div>
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {launching ? (
        <motion.div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-[#01040f]"
          style={{ top: "var(--joueur-nav-offset, 5.5rem)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />
      ) : null}
    </div>
  );
}

function GenderEmblemCard({
  label,
  caption,
  gender,
  choice,
  active,
  onHover,
  onSelect,
}: {
  label: string;
  caption: string;
  gender: "female" | "male";
  choice: GenderChoice;
  active: boolean;
  onHover: (g: GenderChoice | null) => void;
  onSelect: () => void;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      onPointerEnter={() => onHover(choice)}
      onPointerLeave={() => onHover(null)}
      whileHover={reduce ? undefined : { y: -2 }}
      whileTap={reduce ? undefined : { scale: 0.99 }}
      className={`overflow-hidden rounded-2xl border text-left ${
        active
          ? "border-cyan-300/45 bg-white/[0.06]"
          : "border-white/15 bg-black/45 hover:border-white/30"
      }`}
    >
      <div className="joueur-3d-stage relative h-[180px] w-full sm:h-[210px]">
        <GenderEmblemCanvas
          gender={gender}
          active={active}
          className="h-full w-full"
        />
      </div>
      <div className="border-t border-white/10 px-4 py-4 sm:px-5">
        <p className="font-display text-2xl tracking-[-0.03em]">{label}</p>
        <p className="mt-1 text-xs text-white/55 sm:text-sm">{caption}</p>
      </div>
    </motion.button>
  );
}
