import type { PoleId } from "@/lib/poles";
import { POLE_STYLES } from "@/lib/poles";

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
  pole,
  py = "default",
  bordered = false,
}: PageBodyProps) {
  const poleStyles = pole ? POLE_STYLES[pole] : null;
  const bg =
    tone === "elevated"
      ? "bg-[#050505]"
      : poleStyles?.surface ?? "bg-[#030303]";
  const pyClass =
    py === "none" ? "" : py === "sm" ? "py-12" : "py-16 sm:py-20";
  const maxW = narrow ? "max-w-2xl" : "max-w-6xl";

  return (
    <section
      className={`text-white ${bg} ${poleStyles?.accentTop ?? ""} ${pyClass} ${
        bordered ? "border-b border-white/8" : ""
      } ${className}`}
    >
      <div className={`mx-auto ${maxW} px-4 sm:px-6`}>{children}</div>
    </section>
  );
}
