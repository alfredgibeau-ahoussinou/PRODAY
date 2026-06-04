"use client";

import { Check, Minus, X } from "lucide-react";
import { COMPARISON_ROWS } from "@/lib/content";

function Cell({ value }: { value: boolean | "partial" }) {
  if (value === true)
    return <Check className="mx-auto text-proday-success" size={20} />;
  if (value === "partial")
    return <Minus className="mx-auto text-orange-500" size={20} />;
  return <X className="mx-auto text-neutral-300" size={20} />;
}

export function ComparisonTable() {
  return (
    <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead>
          <tr className="border-b border-neutral-100 bg-neutral-50">
            <th className="p-4 font-semibold">Fonctionnalité</th>
            <th className="p-4 text-center font-bold">ProDay</th>
            <th className="p-4 text-center text-proday-muted">WhatsApp</th>
            <th className="p-4 text-center text-proday-muted">Tableur</th>
          </tr>
        </thead>
        <tbody>
          {COMPARISON_ROWS.map((row) => (
            <tr key={row.feature} className="border-b border-neutral-50">
              <td className="p-4 font-medium">{row.feature}</td>
              <td className="bg-neutral-50/80 p-4">
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
