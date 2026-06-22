import { clsx } from "clsx";

type PoleFullBleedProps = {
  children: React.ReactNode;
  className?: string;
  id?: string;
};

/** Section pleine largeur (`w-screen`) pour les blocs pôle (tarifs, hero). */
export function PoleFullBleed({ children, className, id }: PoleFullBleedProps) {
  return (
    <div
      id={id}
      className={clsx(
        "pole-section relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2",
        className,
      )}
    >
      {children}
    </div>
  );
}
