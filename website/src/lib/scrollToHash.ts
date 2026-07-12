/** Défile vers l'élément ciblé par l'ancre (respecte scroll-margin-top sur la cible). */
export function scrollToHashElement(
  hash: string,
  behavior: ScrollBehavior = "smooth",
): boolean {
  const id = hash.replace(/^#/, "").trim();
  if (!id) return false;

  const el = document.getElementById(id);
  if (!el) return false;

  el.scrollIntoView({ behavior, block: "start" });
  return true;
}

/** Lit le hash courant (sans le #). */
export function currentHashId(): string {
  if (typeof window === "undefined") return "";
  return window.location.hash.replace(/^#/, "").trim();
}
