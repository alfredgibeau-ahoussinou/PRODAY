type DemoDisclaimerProps = {
  className?: string;
};

/** Bandeau — écrans et données de démo, pas l’app connectée. */
export function DemoDisclaimer({ className = "" }: DemoDisclaimerProps) {
  return (
    <div
      className={`mx-auto max-w-6xl rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-center text-sm text-amber-100/90 sm:px-6 ${className}`}
      role="note"
    >
      <span className="font-semibold text-amber-200">Démo interactive</span>
      {" — "}
      Navigation et contenus illustratifs. Aucune donnée réelle ni compte connecté.
    </div>
  );
}
