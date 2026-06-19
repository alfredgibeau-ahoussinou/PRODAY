"use client";

import { Check, Minus, X } from "lucide-react";
import { COMPARISON_ROWS } from "@/lib/content";

function Cell({ value }: { value: boolean | "partial" }) {
  if (value === true)
    return <Check className="mx-auto text-emerald-400" size={20} />;
  if (value === "partial")
    return <Minus className="mx-auto text-amber-400" size={20} />;
  return <X className="mx-auto text-white/25" size={20} />;
}

export function ComparisonTable() {
  return (
    <div className="card-premium overflow-x-auto rounded-2xl">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-white/5">
            <th className="p-4 font-semibold text-white">Fonctionnalité</th>
            <th className="p-4 text-center font-bold text-white">ProDay</th>
            <th className="p-4 text-center text-white/50">WhatsApp</th>
            <th className="p-4 text-center text-white/50">Tableur</th>
          </tr>
        </thead>
        <tbody>
          {COMPARISON_ROWS.map((row) => (
            <tr key={row.feature} className="border-b border-white/5">
              <td className="p-4 font-medium text-white/85">{row.feature}</td>
              <td className="bg-white/5 p-4">
                <Cell value={row.proday} />
              </td>
              <td className="p-4">
                <Cell value={row.whatsapp} />
              </td>
              <td className="p-4">
                <Cell value={row.excel} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
