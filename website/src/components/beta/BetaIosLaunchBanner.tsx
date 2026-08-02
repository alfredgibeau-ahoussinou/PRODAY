"use client";

import { Clock, Smartphone } from "lucide-react";
import {
  IOS_BETA_LAUNCH_LABEL,
  getIosBetaStatusMessage,
  isIosBetaLaunched,
  isTestFlightAvailable,
} from "@/lib/betaIosLaunch";

export function BetaIosLaunchBanner() {
  const launched = isIosBetaLaunched();
  const testflightLive = isTestFlightAvailable();

  return (
    <div
      className={`mb-8 rounded-3xl border p-6 ${
        testflightLive
          ? "border-emerald-500/30 bg-emerald-500/10"
          : "border-[var(--proday-accent)]/30 bg-[#001854]/40"
      }`}
    >
      <div className="flex items-start gap-3">
        {testflightLive ? (
          <Smartphone className="mt-0.5 shrink-0 text-emerald-400" size={22} />
        ) : (
          <Clock className="mt-0.5 shrink-0 text-[var(--proday-accent)]" size={22} />
        )}
        <div>
          <p className="text-sm font-semibold text-white">
            {testflightLive ? "Bêta iOS ouverte" : "Bêta iOS — date confirmée"}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-white/65">
            {getIosBetaStatusMessage()}
            {!launched ? (
              <>
                {" "}
                Vous recevrez un email avec le lien TestFlight dès l&apos;ouverture.
              </>
            ) : null}
          </p>
          {!launched ? (
            <p className="mt-2 text-xs font-medium uppercase tracking-wider text-[var(--proday-accent)]">
              {IOS_BETA_LAUNCH_LABEL}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
