"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ACC_COMMAND_ITEMS } from "@/lib/adminCc/nav";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function AccCommandPalette({ open, onClose }: Props) {
  const router = useRouter();
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return ACC_COMMAND_ITEMS.slice(0, 12);
    return ACC_COMMAND_ITEMS.filter(
      (i) => i.keywords.includes(needle) || i.label.toLowerCase().includes(needle),
    ).slice(0, 16);
  }, [q]);

  if (!open) return null;

  function close() {
    setQ("");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/70 px-3 pt-[12vh]">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Fermer" onClick={close} />
      <div
        role="dialog"
        aria-modal
        aria-label="Command palette"
        className="relative w-full max-w-lg border border-[var(--acc-line)] bg-[var(--acc-surface)] shadow-2xl"
      >
        <div className="border-b border-[var(--acc-line)] px-3 py-2">
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Aller à… (ex. devis, santé, utilisateurs)"
            className="h-11 w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30"
          />
        </div>
        <ul className="max-h-[50vh] overflow-y-auto py-1">
          {results.map((item) => (
            <li key={item.href + item.label}>
              <button
                type="button"
                className="flex w-full items-center px-3 py-2.5 text-left text-sm text-white/70 transition hover:bg-white/[0.04] hover:text-white"
                onClick={() => {
                  close();
                  router.push(item.href);
                }}
              >
                {item.label}
              </button>
            </li>
          ))}
          {results.length === 0 ? (
            <li className="px-3 py-6 text-center text-xs text-white/35">Aucun résultat</li>
          ) : null}
        </ul>
        <p className="border-t border-[var(--acc-line)] px-3 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-white/30">
          ⌘K / Ctrl+K · Esc pour fermer
        </p>
      </div>
    </div>
  );
}
