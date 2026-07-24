function preferredScrollBehavior(
  behavior: ScrollBehavior = "smooth",
): ScrollBehavior {
  if (behavior === "auto") return "auto";
  if (typeof window === "undefined") return behavior;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "auto"
    : behavior;
}

/** Défile vers l'élément ciblé par l'ancre (respecte scroll-margin-top sur la cible). */
export function scrollToHashElement(
  hash: string,
  behavior: ScrollBehavior = "smooth",
): boolean {
  const id = hash.replace(/^#/, "").trim();
  if (!id) return false;

  const el = document.getElementById(id);
  if (!el) return false;

  el.scrollIntoView({
    behavior: preferredScrollBehavior(behavior),
    block: "start",
  });
  return true;
}

/** Lit le hash courant (sans le #). */
export function currentHashId(): string {
  if (typeof window === "undefined") return "";
  return window.location.hash.replace(/^#/, "").trim();
}
