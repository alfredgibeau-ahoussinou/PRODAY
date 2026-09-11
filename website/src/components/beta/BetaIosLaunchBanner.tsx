"use client";

import { Clock, Smartphone } from "lucide-react";
import {
  IOS_BETA_DELAY_NOTICE,
  IOS_BETA_LAUNCH_LABEL,
  getIosBetaStatusMessage,
  isIosBetaLaunched,
  isTestFlightAvailable,
} from "@/lib/betaIosLaunch";

export function BetaIosLaunchBanner({ compact = false }: { compact?: boolean }) {
  const launched = isIosBetaLaunched();
  const testflightLive = isTestFlightAvailable();

  if (compact) {
    return (
      <div
        className={`mb-5 border px-3 py-2.5 ${
          testflightLive
            ? "border-[var(--proday-accent)]/35 bg-[var(--proday-accent-muted)]"
            : "border-white/10 bg-[#0c0c0e]"
        }`}
      >
        <div className="flex items-center gap-2.5">
          {testflightLive ? (
            <Smartphone size={14} className="shrink-0 text-[var(--proday-accent-bright)]" />
          ) : (
            <Clock size={14} className="shrink-0 text-white/45" />
          )}
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--proday-accent-bright)]">
              {testflightLive ? "iOS ouverte" : (launched ? "Bêta iOS · Déploiement" : "Bêta · reportée")}
              {!launched ? ` · ${IOS_BETA_LAUNCH_LABEL}` : ""}
            </p>
            <p className="mt-0.5 truncate text-[11px] leading-snug text-white/50">
              {getIosBetaStatusMessage()}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`mb-8 border px-5 py-4 ${
        testflightLive
          ? "border-[var(--proday-accent)]/35 bg-[var(--proday-accent-muted)]"
          : "border-white/10 bg-transparent"
      }`}
    >
      <div className="flex items-start gap-3.5">
        <div
          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center border ${
            testflightLive
              ? "border-[var(--proday-accent)]/40 bg-[var(--proday-accent-muted)] text-[var(--proday-accent-bright)]"
              : "border-white/15 text-white/65"
          }`}
        >
          {testflightLive ? <Smartphone size={16} /> : <Clock size={16} />}
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--proday-accent-bright)]">
            {testflightLive ? "iOS ouverte" : (launched ? "Bêta iOS · Déploiement TestFlight" : "Bêta · décalée au 15 août 2026")}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-white/55">
            {!launched ? (
              <>
                {IOS_BETA_DELAY_NOTICE} Ouverture iOS via TestFlight le{" "}
                <strong className="font-medium text-white/75">{IOS_BETA_LAUNCH_LABEL}</strong>.
                Tu recevras un email avec le lien dès l&apos;ouverture.
              </>
            ) : (
              getIosBetaStatusMessage()
            )}
          </p>
          {!launched ? (
            <p className="mt-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">
              Nouvelle date · {IOS_BETA_LAUNCH_LABEL}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
