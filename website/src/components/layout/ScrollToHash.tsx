"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { currentHashId, scrollToHashElement } from "@/lib/scrollToHash";
import { ROUTES } from "@/lib/routes";

function retryScrollToHash(hash: string, maxAttempts = 16): () => void {
  let attempts = 0;
  let frame = 0;

  const tick = () => {
    if (scrollToHashElement(hash)) return;
    attempts += 1;
    if (attempts < maxAttempts) {
      frame = requestAnimationFrame(tick);
    }
  };

  frame = requestAnimationFrame(tick);

  return () => cancelAnimationFrame(frame);
}

export function ScrollToHash() {
  const pathname = usePathname();

  useEffect(() => {
    const hash = currentHashId();
    if (!hash) return;

    const delay = pathname === ROUTES.pricing ? 280 : 120;
    const cancel = retryScrollToHash(`#${hash}`, pathname === ROUTES.pricing ? 32 : 16);
    const timeout = window.setTimeout(() => scrollToHashElement(`#${hash}`), delay);

    return () => {
      cancel();
      window.clearTimeout(timeout);
    };
  }, [pathname]);

  useEffect(() => {
    const onHashChange = () => {
      const hash = currentHashId();
      if (hash) retryScrollToHash(`#${hash}`);
    };

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return null;
}
