type TerminalListProps = {
  items: string[];
  className?: string;
};

/** Sparse feature lines — no icons, no cards. */
export function TerminalList({ items, className = "" }: TerminalListProps) {
  return (
    <ul className={`divide-y divide-white/10 border-y border-white/10 ${className}`}>
      {items.map((item) => (
        <li
          key={item}
          className="py-4 text-sm leading-relaxed text-white/65 sm:text-base"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}
