"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { BRAND, HOMME_BRAND, PRO_BRAND, WOMAN_BRAND } from "@/lib/content";
import { NAV_ITEMS, ROUTES } from "@/lib/routes";

function navBrandForPath(pathname: string) {
  if (pathname.startsWith("/woman")) {
    return { name: WOMAN_BRAND.name, logo: "/branding/logo-woman-picto.png", cta: "bg-pink-700 hover:bg-pink-800" };
  }
  if (pathname.startsWith("/pro")) {
    return { name: PRO_BRAND.name, logo: "/branding/logo-pro-picto.png", cta: "bg-blue-700 hover:bg-blue-800" };
  }
  if (pathname.startsWith("/homme")) {
    return { name: HOMME_BRAND.name, logo: "/branding/logo-man-picto.png", cta: "bg-proday-ink hover:bg-neutral-800" };
  }
  return { name: BRAND.name, logo: "/branding/logo-light.png", cta: "bg-proday-ink hover:bg-neutral-800" };
}

export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { scrollY } = useScroll();
  const bg = useTransform(
    scrollY,
    [0, 80],
    ["rgba(247,247,247,0)", "rgba(247,247,247,0.92)"],
  );
  const border = useTransform(
    scrollY,
    [0, 80],
    ["rgba(229,229,229,0)", "rgba(229,229,229,1)"],
  );

  const brand = navBrandForPath(pathname);

  return (
    <motion.header
      style={{ backgroundColor: bg, borderBottomColor: border }}
      className="fixed top-0 z-50 w-full border-b backdrop-blur-md"
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href={ROUTES.home} className="flex items-center gap-2.5">
          <Image
            src={brand.logo}
            alt={brand.name}
            width={36}
            height={36}
            className="rounded-lg"
          />
          <span className="text-lg font-bold tracking-tight">{brand.name}</span>
        </Link>

        <ul className="hidden items-center gap-5 xl:flex">
          {NAV_ITEMS.map((l) => {
            const active = pathname === l.href;
            const accent = "accent" in l ? l.accent : undefined;
            const accentClass =
              accent === "woman"
                ? "font-medium text-pink-700 hover:text-pink-800"
                : accent === "pro"
                  ? "font-medium text-blue-700 hover:text-blue-800"
                  : "text-proday-muted hover:text-proday-ink";
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={`text-sm transition ${
                    active ? "font-semibold text-proday-ink" : accentClass
                  }`}
                >
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href={ROUTES.beta}
            className={`rounded-full px-5 py-2 text-sm font-medium text-white transition ${brand.cta}`}
          >
            Rejoindre la beta
          </Link>
        </div>

        <button
          type="button"
          className="rounded-lg p-2 xl:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="border-t bg-white px-4 pb-4 xl:hidden"
        >
          {NAV_ITEMS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="block py-3 text-sm"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href={ROUTES.beta}
            className="mt-2 block rounded-full bg-proday-ink py-3 text-center text-sm text-white"
            onClick={() => setOpen(false)}
          >
            Rejoindre la beta
          </Link>
        </motion.div>
      )}
    </motion.header>
  );
}
