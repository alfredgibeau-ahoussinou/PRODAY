"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { JoueurAdaptiveExperience } from "@/components/poles/JoueurAdaptiveExperience";
import {
  joueurHintsFromSearchParams,
  resolveJoueurExperienceTheme,
} from "@/lib/joueurExperienceTheme";
import {
  clearStoredJoueurProfile,
  hasJoueurExperienceProfile,
  joueurGateHref,
  mergeJoueurProfileHints,
  readStoredJoueurProfile,
  writeStoredJoueurProfile,
} from "@/lib/joueurProfileStorage";
import { ROUTES } from "@/lib/routes";

/**
 * /joueur/experience — charge le profil puis ouvre l’univers 3D adapté.
 */
export function JoueurExperiencePageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ready, setReady] = useState(false);
  const [stored, setStored] = useState<ReturnType<
    typeof readStoredJoueurProfile
  >>(null);

  useEffect(() => {
    setStored(readStoredJoueurProfile());
    setReady(true);
  }, []);

  const urlHints = useMemo(
    () => joueurHintsFromSearchParams(searchParams),
    [searchParams],
  );

  const hints = useMemo(
    () => mergeJoueurProfileHints(urlHints, stored),
    [urlHints, stored],
  );

  const complete = hasJoueurExperienceProfile(hints);

  useEffect(() => {
    if (!ready) return;
    if (!complete) {
      router.replace(
        joueurGateHref({
          gender: hints.gender ?? undefined,
        }),
      );
      return;
    }
    writeStoredJoueurProfile(hints);
  }, [ready, complete, hints, router]);

  if (!ready || !complete) {
    return (
      <div className="flex min-h-[100svh] flex-col items-center justify-center gap-4 bg-[#01040f] px-6 text-center">
        <div className="h-16 w-16 animate-pulse rounded-full bg-cyan-400/20 shadow-[0_0_40px_rgba(34,211,238,0.35)]" />
        <p className="font-display text-2xl text-white">Ouverture du monde…</p>
        <Link
          href={ROUTES.joueur}
          onClick={() => clearStoredJoueurProfile()}
          className="text-sm text-cyan-300/80 underline-offset-2 hover:underline"
        >
          Qui es tu ?
        </Link>
      </div>
    );
  }

  return <JoueurAdaptiveExperience theme={resolveJoueurExperienceTheme(hints)} />;
}
