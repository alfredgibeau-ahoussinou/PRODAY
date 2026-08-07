"use client";

import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Car,
  Calendar,
  Heart,
  Home,
  Menu,
  MessageCircle,
  Search,
  Shield,
  ShoppingBag,
  Sparkles,
  User,
  Video,
  Handshake,
} from "lucide-react";
import {
  getMobileRailLayoutForWeb,
  getTabLabelForDemoPole,
  getTabLabelForWeb,
  getVisibleMainTabsForDemoPole,
  getVisibleMainTabsForWeb,
  type MainTabId,
} from "@/lib/appTabs";
import type { DemoPoleId } from "@/lib/demoPoles";
import type { ProductLineWeb } from "@/lib/content";
import { TabOverflowSheet } from "./TabOverflowSheet";

const TAB_ICONS: Record<MainTabId, LucideIcon> = {
  home: Home,
  recrutement: Search,
  matchs: Handshake,
  covoiturage: Car,
  sante: Heart,
  feed: Sparkles,
  reels: Video,
  famille: Shield,
  messages: MessageCircle,
  profil: User,
  shop: ShoppingBag,
};

const PHYSIO_ICONS: Partial<Record<MainTabId, LucideIcon>> = {
  matchs: Calendar,
  profil: Heart,
};

type AppTabBarProps = {
  activeTab: MainTabId;
  onTabPress: (tab: MainTabId) => void;
  /** Context legacy (embeds). Ignoré si `demoPole` est fourni. */
  universe?: ProductLineWeb;
  demoPole?: DemoPoleId;
  unreadCount?: number;
  accentInk?: string;
  tabActiveClass: string;
  tabInactiveClass: string;
  dockSurfaceClass: string;
};

export function AppTabBar({
  activeTab,
  onTabPress,
  universe = "homme",
  demoPole,
  unreadCount = 3,
  accentInk = "#10b981",
  tabActiveClass,
  tabInactiveClass,
  dockSurfaceClass,
}: AppTabBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isPhysio = demoPole === "sante" || universe === "sante";
  const immersive = activeTab === "reels";

  const rail = useMemo(() => {
    const visible = demoPole
      ? getVisibleMainTabsForDemoPole(demoPole)
      : getVisibleMainTabsForWeb(universe);
    return getMobileRailLayoutForWeb(visible);
  }, [demoPole, universe]);

  const labelFor = (tab: MainTabId) =>
    demoPole ? getTabLabelForDemoPole(tab, demoPole) : getTabLabelForWeb(tab, universe);

  const menuActive = rail.overflow.includes(activeTab);

  const resolveIcon = (tab: MainTabId): LucideIcon => {
    if (isPhysio && PHYSIO_ICONS[tab]) return PHYSIO_ICONS[tab]!;
    return TAB_ICONS[tab];
  };

  const inkActive = immersive ? "#fff" : accentInk;
  const inkMuted = immersive ? "rgba(255,255,255,0.78)" : undefined;

  const renderSideTab = (tab: MainTabId) => {
    const active = tab === activeTab;
    const Icon = resolveIcon(tab);
    const label = labelFor(tab);
    const badge = tab === "messages" ? unreadCount : 0;
    const ink = active ? inkActive : inkMuted;

    return (
      <button
        key={tab}
        type="button"
        onClick={() => onTabPress(tab)}
        className="relative flex min-h-[50px] min-w-[58px] flex-col items-center justify-center gap-1 px-0.5 min-[390px]:min-w-[62px] min-[430px]:min-w-[64px] sm:min-h-[52px] sm:px-1"
        aria-label={label}
        aria-pressed={active}
      >
        <span className="relative flex h-7 w-8 items-center justify-center min-[430px]:h-8 min-[430px]:w-9">
          {active ? (
            <span
              className="absolute inset-0 rounded-2xl transition-colors"
              style={{
                backgroundColor: immersive ? "rgba(255,255,255,0.28)" : `${accentInk}29`,
                boxShadow: active && !immersive ? `0 0 16px ${accentInk}44` : undefined,
              }}
            />
          ) : null}
          <Icon
            size={24}
            className={active ? tabActiveClass : tabInactiveClass}
            style={ink ? { color: ink } : undefined}
            strokeWidth={active ? 2.5 : 2}
            fill={active ? "currentColor" : "none"}
          />
          {badge > 0 ? (
            <span
              className="absolute -right-2 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[9px] font-extrabold text-white"
              style={{
                backgroundColor: immersive ? accentInk : inkActive,
                border: `2px solid ${immersive ? "rgba(0,0,0,0.5)" : "var(--dock-border, #111816)"}`,
              }}
            >
              {badge > 99 ? "99+" : badge > 9 ? "9+" : badge}
            </span>
          ) : null}
        </span>
        <span
          className={`max-w-[64px] truncate text-center text-[10px] font-semibold min-[390px]:max-w-[68px] min-[390px]:text-[10.5px] min-[430px]:max-w-[72px] min-[430px]:text-[11px] ${
            active ? "font-extrabold" : ""
          } ${active ? tabActiveClass : tabInactiveClass}`}
          style={ink ? { color: ink } : undefined}
        >
          {label}
        </span>
      </button>
    );
  };

  const centerTab = rail.center;
  const centerActive = centerTab === activeTab;

  return (
    <>
      <div
        className={`px-1.5 pt-1 min-[390px]:px-2 ${immersive ? "bg-black" : ""}`}
        style={{ paddingBottom: 6 }}
      >
        <div
          className={`flex min-h-[60px] items-end border px-0.5 pb-1 min-[390px]:min-h-[62px] min-[390px]:px-1 ${
            immersive
              ? "rounded-none border-white/10 bg-black/95"
              : `rounded-[18px] border-white/10 ${dockSurfaceClass}`
          }`}
          style={
            immersive
              ? undefined
              : ({ "--dock-border": "#111816" } as Record<string, string>)
          }
        >
          <div className="flex flex-1 justify-evenly">{rail.left.map(renderSideTab)}</div>

          {centerTab ? (
            <button
              type="button"
              onClick={() => onTabPress(centerTab)}
              className="-mt-3.5 flex w-[70px] flex-col items-center gap-1 min-[390px]:w-[76px] min-[430px]:w-20"
              aria-label={labelFor(centerTab)}
              aria-pressed={centerActive}
            >
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-full border-[3px] shadow-lg min-[390px]:h-[52px] min-[390px]:w-[52px] min-[430px]:h-14 min-[430px]:w-14 ${
                  centerActive || immersive ? "" : "border-[#111816] bg-neutral-900"
                }`}
                style={{
                  backgroundColor: centerActive || immersive ? accentInk : undefined,
                  borderColor: immersive
                    ? "rgba(255,255,255,0.2)"
                    : centerActive
                      ? accentInk
                      : undefined,
                  boxShadow:
                    centerActive || immersive
                      ? `0 0 24px ${accentInk}66`
                      : undefined,
                }}
              >
                <Video
                  size={26}
                  className={centerActive || immersive ? "text-white" : tabInactiveClass}
                  fill="currentColor"
                />
              </span>
              <span
                className={`text-[10px] font-bold min-[390px]:text-[10.5px] min-[430px]:text-[11px] ${centerActive ? "font-extrabold" : ""} ${
                  centerActive ? tabActiveClass : tabInactiveClass
                }`}
                style={
                  immersive
                    ? { color: "#fff" }
                    : centerActive
                      ? { color: accentInk }
                      : undefined
                }
              >
                {labelFor(centerTab)}
              </span>
            </button>
          ) : (
            <div className="w-[70px] min-[390px]:w-[76px] min-[430px]:w-20" />
          )}

          <div className="flex flex-1 justify-evenly">
            {rail.right.map(renderSideTab)}
            {rail.overflow.length > 0 ? (
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                className="flex min-h-[50px] min-w-[58px] flex-col items-center justify-center gap-1 px-0.5 min-[390px]:min-w-[62px] min-[430px]:min-w-[64px] sm:min-h-[52px] sm:px-1"
                aria-label="Menu navigation"
                aria-pressed={menuActive}
              >
                <Menu
                  size={24}
                  className={menuActive ? tabActiveClass : tabInactiveClass}
                  style={{
                    color: menuActive
                      ? inkActive
                      : immersive
                        ? "rgba(255,255,255,0.78)"
                        : undefined,
                  }}
                  strokeWidth={menuActive ? 2.5 : 2}
                />
                <span
                  className={`text-[10px] font-semibold min-[390px]:text-[10.5px] min-[430px]:text-[11px] ${
                    menuActive ? "font-extrabold" : ""
                  } ${menuActive ? tabActiveClass : tabInactiveClass}`}
                  style={{
                    color: menuActive
                      ? inkActive
                      : immersive
                        ? "rgba(255,255,255,0.78)"
                        : undefined,
                  }}
                >
                  Menu
                </span>
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <TabOverflowSheet
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        tabs={rail.overflow}
        activeTab={activeTab}
        universe={universe}
        demoPole={demoPole}
        onSelect={onTabPress}
        accentClass={tabActiveClass}
        immersive={immersive}
      />
    </>
  );
}
