import type { PoleId } from "@/lib/poles";

type PageBodyProps = {
  children: React.ReactNode;
  className?: string;
  /** Conteneur étroit (FAQ, formulaires) */
  narrow?: boolean;
  /** Fond légèrement relevé */
  tone?: "base" | "elevated";
  pole?: PoleId;
  py?: "default" | "none" | "sm";
  bordered?: boolean;
};

export function PageBody({
  children,
  className = "",
  narrow = false,
  tone = "base",
  pole: _pole,
  py = "default",
  bordered = false,
}: PageBodyProps) {
  void _pole;
  const bg = tone === "elevated" ? "bg-[#050505]" : "bg-black";
  const pyClass =
    py === "none" ? "" : py === "sm" ? "py-12 md:py-16" : "py-16 md:py-24";
  const maxW = narrow ? "max-w-2xl" : "max-w-6xl";

  return (
    <section
      className={`text-white ${bg} ${pyClass} ${
        bordered ? "border-b border-white/8" : ""
      } ${className}`}
    >
      <div className={`mx-auto ${maxW} px-4 sm:px-6`}>{children}</div>
    </section>
  );
}
