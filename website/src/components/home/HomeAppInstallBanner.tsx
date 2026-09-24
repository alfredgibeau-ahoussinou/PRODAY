"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Apple, Play, Download, Smartphone, Sparkles, X } from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { BETA_APK_URL } from "@/lib/betaContent";
import { getTestFlightUrl, isTestFlightAvailable, IOS_BETA_LAUNCH_LABEL } from "@/lib/betaIosLaunch";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function HomeAppInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isPwaInstalled, setIsPwaInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const testFlightUrl = getTestFlightUrl();
  const testFlightReady = isTestFlightAvailable();

  useEffect(() => {
    // Check if running as PWA / standalone
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (isStandalone) {
      setIsPwaInstalled(true);
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsPwaInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallPwa = async () => {
    if (!deferredPrompt) {
      return;
    }
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsPwaInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (isDismissed) return null;

  return (
    <section className="relative z-20 border-b border-white/10 bg-gradient-to-r from-[#07100c] via-[#091813] to-[#07100c] px-4 py-3.5 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
            <Smartphone size={20} className="text-[#F5D04A]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-sm font-semibold tracking-wide text-white">
                ProDay sur mobile &amp; bureau
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#F5D04A]/15 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-[#F5D04A]">
                <Sparkles size={10} />
                PWA &amp; App Store
              </span>
            </div>
            <p className="text-xs text-white/60">
              Installez l&apos;application PWA instantanément ou testez nos versions TestFlight et APK.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {deferredPrompt && !isPwaInstalled && (
            <button
              type="button"
              onClick={handleInstallPwa}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#F5D04A] px-3.5 py-1.5 text-xs font-semibold text-black transition hover:bg-[#E8B923]"
            >
              <Download size={13} />
              <span>Installer PWA</span>
            </button>
          )}

          {testFlightReady && testFlightUrl ? (
            <a
              href={testFlightUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-medium text-white transition hover:border-white/40 hover:bg-white/10"
            >
              <Apple size={13} className="text-white" />
              <span>TestFlight iOS</span>
            </a>
          ) : (
            <Link
              href={ROUTES.betaInstaller}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/90 transition hover:border-white/40 hover:bg-white/10"
              title={`iOS TestFlight : ${IOS_BETA_LAUNCH_LABEL}`}
            >
              <Apple size={13} className="text-white" />
              <span>iOS (App Store / TestFlight)</span>
            </Link>
          )}

          <a
            href={BETA_APK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-medium text-white transition hover:border-white/40 hover:bg-white/10"
          >
            <Play size={13} className="text-emerald-400" />
            <span>Android APK</span>
          </a>

          <Link
            href={ROUTES.betaInstaller}
            className="inline-flex items-center rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 transition hover:bg-white/20 hover:text-white"
          >
            Guide
          </Link>

          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            aria-label="Fermer la bannière"
            className="ml-1 rounded-full p-1.5 text-white/40 transition hover:bg-white/10 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </section>
  );
}
