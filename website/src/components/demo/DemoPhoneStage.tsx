"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { AppTabBar } from "@/components/demo/AppTabBar";
import { screenForDemoPole } from "@/components/demo/demoScreens";
import { UNIVERSE_THEME } from "@/components/universe/universeTheme";
import {
  getVisibleMainTabsForDemoPole,
  type MainTabId,
} from "@/lib/appTabs";
import {
  DEMO_POLE_SHORT_LABEL,
  themeIdForDemoPole,
  type DemoPoleId,
} from "@/lib/demoPoles";

type DemoPhoneStageProps = {
  pole: DemoPoleId;
};

export function DemoPhoneStage({ pole }: DemoPhoneStageProps) {
  const themeId = themeIdForDemoPole(pole);
  const theme = UNIVERSE_THEME[themeId];
  const visible = getVisibleMainTabsForDemoPole(pole);
  const [selectedTab, setSelectedTab] = useState<MainTabId>(visible[0] ?? "home");

  useEffect(() => {
    const next = getVisibleMainTabsForDemoPole(pole);
    setSelectedTab(next[0] ?? "home");
  }, [pole]);

  const active = visible.includes(selectedTab) ? selectedTab : visible[0] ?? "home";
  const screen = screenForDemoPole(pole, active);
  const immersive = active === "reels";

  return (
    <motion.div
      key={pole}
      initial={{ opacity: 0, y: 28, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto w-full max-w-[332px] min-[390px]:max-w-[346px] min-[430px]:max-w-[372px] sm:max-w-[380px]"
    >
      <div className="relative rounded-[2.45rem] border-[5px] border-neutral-700 bg-neutral-950 p-1.5 shadow-[0_34px_70px_-24px_rgba(0,0,0,0.92)] min-[390px]:rounded-[2.6rem] min-[430px]:rounded-[2.75rem] sm:rounded-[2.9rem] sm:border-[6px] sm:p-2 sm:shadow-[0_44px_90px_-20px_rgba(0,0,0,0.92)]">
        <p className="pointer-events-none absolute left-4 top-4 z-20 text-[9px] font-medium uppercase tracking-[0.16em] text-white/35 min-[430px]:left-5 min-[430px]:top-5 sm:text-[10px] sm:tracking-[0.18em]">
          Démo
        </p>
        <div className="mb-1.5 flex justify-center pt-1">
          <div className="h-4 w-24 rounded-full border border-white/10 bg-neutral-800 sm:h-5 sm:w-28" />
        </div>

        <div
          className={`relative overflow-hidden rounded-[1.85rem] min-[390px]:rounded-[1.95rem] min-[430px]:rounded-[2.05rem] sm:rounded-[2.1rem] ${
            immersive ? "bg-black" : theme.screenBg
          }`}
        >
          {!immersive ? <div className={`h-1.5 w-full ${theme.accentBar}`} /> : null}

          <AnimatePresence mode="wait">
            <motion.div
              key={`${pole}-${active}`}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.28 }}
              className="flex min-h-[508px] flex-col min-[390px]:min-h-[522px] min-[430px]:min-h-[544px] sm:min-h-[560px]"
            >
              <div
                className={`border-b border-white/5 px-4 pb-3 pt-3.5 sm:px-5 sm:pb-4 sm:pt-4 ${
                  immersive ? "bg-black" : theme.screenSurface
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 text-left">
                    <h3 className="font-display text-[1.72rem] font-bold tracking-tight text-white min-[390px]:text-[1.82rem] min-[430px]:text-[1.95rem] sm:text-2xl">
                      {screen.title}
                    </h3>
                    <p className="mt-1 text-sm leading-snug text-white/65">{screen.subtitle}</p>
                  </div>
                  <div className="shrink-0 rounded-lg border border-white/12 bg-white/[0.03] px-2 py-1 text-right">
                    <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/40">
                      ProDay
                    </p>
                    <p className="mt-0.5 text-[11px] font-semibold text-white/80">
                      {DEMO_POLE_SHORT_LABEL[pole]}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-3 px-3.5 py-3.5 sm:px-4 sm:py-4">
                {screen.focus.map((item) => (
                  <div
                    key={item.title}
                    className={`rounded-2xl px-4 py-3 ${
                      immersive
                        ? "bg-white/5"
                        : `${theme.screenSurface} border border-white/8 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]`
                    }`}
                  >
                    <p className="text-sm font-bold text-white">{item.title}</p>
                    <p className="mt-1 text-[13px] leading-relaxed text-white/62">{item.body}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          <AppTabBar
            activeTab={active}
            onTabPress={setSelectedTab}
            demoPole={pole}
            accentInk={theme.brandAccent}
            tabActiveClass={theme.tabActive}
            tabInactiveClass={theme.tabInactive}
            dockSurfaceClass={theme.screenSurface}
          />
        </div>
      </div>
    </motion.div>
  );
}
