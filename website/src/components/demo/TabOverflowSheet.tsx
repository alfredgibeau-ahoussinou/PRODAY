"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Car,
  Calendar,
  Heart,
  Home,
  MessageCircle,
  Search,
  Shield,
  ShoppingBag,
  Sparkles,
  User,
  Video,
  Handshake,
} from "lucide-react";
import type { MainTabId } from "@/lib/appTabs";
import { getTabLabelForDemoPole, getTabLabelForWeb } from "@/lib/appTabs";
import type { DemoPoleId } from "@/lib/demoPoles";
import type { ProductLineWeb } from "@/lib/content";

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

type TabOverflowSheetProps = {
  open: boolean;
  onClose: () => void;
  tabs: MainTabId[];
  activeTab: MainTabId;
  universe: ProductLineWeb;
  demoPole?: DemoPoleId;
  onSelect: (tab: MainTabId) => void;
  accentClass: string;
  immersive?: boolean;
};

export function TabOverflowSheet({
  open,
  onClose,
  tabs,
  activeTab,
  universe,
  demoPole,
  onSelect,
  accentClass,
  immersive = false,
}: TabOverflowSheetProps) {
  const isPhysio = demoPole === "sante" || universe === "sante";

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Fermer le menu"
            className="absolute inset-0 z-40 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-label="Menu navigation"
            className={`absolute inset-x-0 bottom-0 z-50 rounded-t-2xl border-t px-4 pb-6 pt-4 ${
              immersive
                ? "border-white/10 bg-neutral-950"
                : "border-white/10 bg-[#111816]"
            }`}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />
            <p className="mb-4 text-base font-extrabold text-white">Navigation</p>
            <div className="grid grid-cols-2 gap-3">
              {tabs.map((tab) => {
                const active = tab === activeTab;
                const Icon = (isPhysio ? PHYSIO_ICONS[tab] : undefined) ?? TAB_ICONS[tab];
                const label = demoPole
                  ? getTabLabelForDemoPole(tab, demoPole)
                  : getTabLabelForWeb(tab, universe);
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => {
                      onSelect(tab);
                      onClose();
                    }}
                    className={`flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-xl border p-3 transition ${
                      active
                        ? `border-white/30 bg-white/10 ${accentClass}`
                        : "border-white/10 bg-white/5 text-white/55 hover:border-white/20"
                    }`}
                    aria-pressed={active}
                  >
                    <Icon
                      size={28}
                      className={active ? "text-white" : "text-white/50"}
                      strokeWidth={active ? 2.5 : 2}
                    />
                    <span
                      className={`text-center text-sm font-semibold ${
                        active ? "font-extrabold text-white" : "text-white/55"
                      }`}
                    >
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
