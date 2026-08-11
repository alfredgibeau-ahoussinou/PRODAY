import type { CSSProperties } from "react";

type TerminalPageProps = {
  children: React.ReactNode;
  className?: string;
  /** Official pole accent CSS vars (from poleAccentCssVars). */
  accentStyle?: CSSProperties;
};

/** Full-bleed black body under PageHeader : Terminal cinema shell. */
export function TerminalPage({
  children,
  className = "",
  accentStyle,
}: TerminalPageProps) {
  return (
    <div className={`bg-black text-white ${className}`} style={accentStyle}>
      {children}
    </div>
  );
}
