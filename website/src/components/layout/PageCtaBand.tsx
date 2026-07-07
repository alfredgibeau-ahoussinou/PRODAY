import type { PoleId } from "@/lib/poles";
import { POLE_STYLES } from "@/lib/poles";

type PageCtaBandProps = {
  children: React.ReactNode;
  pole?: PoleId;
  className?: string;
  align?: "center" | "between";
};

export function PageCtaBand({
  children,
  pole,
  className = "",
  align = "center",
}: PageCtaBandProps) {
  const poleStyles = pole ? POLE_STYLES[pole] : null;
  const layout =
    align === "between"
      ? "flex flex-col gap-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
      : "flex flex-wrap items-center justify-center gap-4";

  return (
    <section
      className={`border-t border-white/8 bg-[#030303] py-14 md:py-16 ${
        poleStyles?.accentTop ?? ""
      } ${className}`}
    >
      <div className={`mx-auto max-w-6xl px-4 sm:px-6 ${layout}`}>
        {children}
      </div>
    </section>
  );
}
