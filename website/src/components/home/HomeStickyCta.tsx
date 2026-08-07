"use client";

import Link from "next/link";

export function HomeStickyCta() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
      <Link
        href="#inscription"
        className="sticky-cta-bar flex min-h-12 items-center justify-center rounded-xl px-4 text-[13px] font-semibold uppercase tracking-[0.08em]"
      >
        Tester l&apos;app · bêta gratuite
      </Link>
    </div>
  );
}
