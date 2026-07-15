"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";
import { AppTabBar } from "@/components/demo/AppTabBar";
import { screenForDemoPole } from "@/components/demo/demoScreens";
import { UNIVERSE_THEME } from "@/components/universe/universeTheme";
import {
  getVisibleMainTabsForDemoPole,
  type MainTabId,
} from "@/lib/appTabs";
import {
  brandForDemoPole,
  themeIdForDemoPole,
  type DemoPoleId,
} from "@/lib/demoPoles";

type DemoPhoneStageProps = {
  pole: DemoPoleId;
};

export function DemoPhoneStage({ pole }: DemoPhoneStageProps) {
  const themeId = themeIdForDemoPole(pole);
  const theme = UNIVERSE_THEME[themeId];
  const brand = brandForDemoPole(pole);
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
      className="relative mx-auto w-full max-w-[360px]"
    >
      <div className="relative rounded-[2.75rem] border-[6px] border-neutral-800 bg-neutral-950 p-2 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.85)]">
        <p className="pointer-events-none absolute left-5 top-5 z-20 text-[10px] font-medium uppercase tracking-[0.18em] text-white/35">
          Démo
        </p>
        <div className="mb-1.5 flex justify-center pt-1">
          <div className="h-5 w-28 rounded-full bg-neutral-800" />
        </div>

        <div
          className={`relative overflow-hidden rounded-[2.1rem] ${
            immersive ? "bg-black" : theme.screenBg
          }`}
        >
          {!immersive ? <div className={`h-1 w-full ${theme.accentBar}`} /> : null}

          <AnimatePresence mode="wait">
            <motion.div
              key={`${pole}-${active}`}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.28 }}
              className="flex min-h-[480px] flex-col"
            >
              <div
                className={`border-b border-white/5 px-5 pb-4 pt-4 ${
                  immersive ? "bg-black" : theme.screenSurface
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 text-left">
                    <h3 className="font-display text-2xl font-bold tracking-tight text-white">
                      {screen.title}
                    </h3>
                    <p className="mt-1 text-sm leading-snug text-white/50">{screen.subtitle}</p>
                  </div>
                  <Image
                    src={brand.logo}
                    alt=""
                    width={40}
                    height={40}
                    className="shrink-0 opacity-90"
                  />
                </div>
              </div>

              <div className="flex-1 space-y-3 px-4 py-4">
                {screen.focus.map((item) => (
                  <div
                    key={item.title}
                    className={`rounded-2xl px-4 py-3 ${
                      immersive
                        ? "bg-white/5"
                        : `${theme.screenSurface} border border-white/5`
                    }`}
                  >
                    <p className="text-sm font-bold text-white">{item.title}</p>
                    <p className="mt-1 text-[13px] leading-relaxed text-white/50">{item.body}</p>
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
