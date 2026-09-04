"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sliders,
  Sparkles,
  Trophy,
  Shield,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Play,
  Flame,
  Clock,
  Send,
  Users,
} from "lucide-react";

type FormationId = "4-3-3" | "4-2-3-1" | "3-5-2";

export function EliteInteractiveShowcase() {
  // Demo 1 State (Tactics)
  const [formation, setFormation] = useState<FormationId>("4-3-3");
  const [pressingLevel, setPressingLevel] = useState(80);

  // Demo 2 State (FUT Card)
  const [playerName, setPlayerName] = useState("MAXIME");
  const [pace, setPace] = useState(89);
  const [shooting, setShooting] = useState(84);
  const [passing, setPassing] = useState(82);
  const [dribbling, setDribbling] = useState(87);
  const [defending, setDefending] = useState(54);
  const [physical, setPhysical] = useState(79);

  // Calculate Overall dynamically
  const overall = Math.round(
    pace * 0.25 +
      shooting * 0.25 +
      dribbling * 0.2 +
      passing * 0.15 +
      physical * 0.1 +
      defending * 0.05,
  );

  return (
    <section id="demo-interactive" className="relative bg-[#06090E] py-24 sm:py-32 border-t border-slate-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#00E676]/30 bg-[#00E676]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#00E676]">
            <Sparkles className="h-3.5 w-3.5" />
            EXPÉRIMENTEZ LA PUISSANCE DE PRODAY
          </div>
          <h2 className="mt-4 font-display text-3xl font-black tracking-tight text-white sm:text-5xl">
            Testez nos outils en direct,{" "}
            <span className="bg-gradient-to-r from-[#00E676] to-[#38BDF8] bg-clip-text text-transparent">
              sans créer de compte
            </span>
          </h2>
          <p className="mt-4 text-base text-slate-300 sm:text-lg">
            Glissez les curseurs, changez la tactique et observez la fluidité des fonctionnalités ProDay Elite.
          </p>
        </div>

        {/* 2 Big Interactive Grids */}
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* ---------------- DEMO 1: LE TABLEAU NOIR TACTIQUE DU COACH ---------------- */}
          <div className="rounded-3xl border border-slate-800 bg-[#0D121F] p-6 sm:p-8 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-3 w-3 rounded-full bg-[#00E676] animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#00E676]">
                    DÉMO 1 · TABLEAU TACTIQUE DU COACH
                  </span>
                </div>
                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300">
                  Schéma : {formation}
                </span>
              </div>

              <h3 className="mt-4 text-xl font-bold text-white sm:text-2xl">
                Animez votre équipe comme un pro UEFA
              </h3>
              <p className="mt-2 text-xs text-slate-400">
                Sélectionnez un schéma tactique et ajustez la hauteur du bloc pour générer instantanément les consignes d&apos;animation.
              </p>

              {/* Formation Selector buttons */}
              <div className="mt-5 flex gap-2">
                {(["4-3-3", "4-2-3-1", "3-5-2"] as FormationId[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFormation(f)}
                    className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
                      formation === f
                        ? "bg-[#00E676] text-black shadow-lg shadow-[#00E676]/20"
                        : "bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/* Interactive Pitch Canvas */}
              <div className="mt-5 relative h-64 rounded-2xl border border-emerald-600/40 bg-gradient-to-b from-[#0B2516] to-[#06170E] p-4 flex flex-col justify-between overflow-hidden">
                {/* Center Circle */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-24 w-24 rounded-full border border-emerald-500/20 pointer-events-none" />
                <div className="absolute top-1/2 inset-x-0 h-px bg-emerald-500/20 pointer-events-none" />

                {/* Formation Render Dynamic */}
                {formation === "4-3-3" && (
                  <>
                    <div className="flex justify-around">
                      <span className="h-6 w-6 rounded-full bg-[#00E676] text-black font-black text-[10px] flex items-center justify-center shadow">11</span>
                      <span className="h-6 w-6 rounded-full bg-[#00E676] text-black font-black text-[10px] flex items-center justify-center shadow">9</span>
                      <span className="h-6 w-6 rounded-full bg-[#00E676] text-black font-black text-[10px] flex items-center justify-center shadow">7</span>
                    </div>
                    <div className="flex justify-around px-8">
                      <span className="h-6 w-6 rounded-full bg-[#00E676] text-black font-black text-[10px] flex items-center justify-center shadow">8</span>
                      <span className="h-6 w-6 rounded-full bg-[#00E676] text-black font-black text-[10px] flex items-center justify-center shadow">6</span>
                      <span className="h-6 w-6 rounded-full bg-[#00E676] text-black font-black text-[10px] flex items-center justify-center shadow">10</span>
                    </div>
                    <div className="flex justify-around">
                      <span className="h-6 w-6 rounded-full bg-[#00E676] text-black font-black text-[10px] flex items-center justify-center shadow">3</span>
                      <span className="h-6 w-6 rounded-full bg-[#00E676] text-black font-black text-[10px] flex items-center justify-center shadow">4</span>
                      <span className="h-6 w-6 rounded-full bg-[#00E676] text-black font-black text-[10px] flex items-center justify-center shadow">5</span>
                      <span className="h-6 w-6 rounded-full bg-[#00E676] text-black font-black text-[10px] flex items-center justify-center shadow">2</span>
                    </div>
                  </>
                )}

                {formation === "4-2-3-1" && (
                  <>
                    <div className="flex justify-center">
                      <span className="h-6 w-6 rounded-full bg-[#00E676] text-black font-black text-[10px] flex items-center justify-center shadow">9</span>
                    </div>
                    <div className="flex justify-around px-6">
                      <span className="h-6 w-6 rounded-full bg-[#00E676] text-black font-black text-[10px] flex items-center justify-center shadow">11</span>
                      <span className="h-6 w-6 rounded-full bg-[#00E676] text-black font-black text-[10px] flex items-center justify-center shadow">10</span>
                      <span className="h-6 w-6 rounded-full bg-[#00E676] text-black font-black text-[10px] flex items-center justify-center shadow">7</span>
                    </div>
                    <div className="flex justify-center gap-12">
                      <span className="h-6 w-6 rounded-full bg-[#00E676] text-black font-black text-[10px] flex items-center justify-center shadow">6</span>
                      <span className="h-6 w-6 rounded-full bg-[#00E676] text-black font-black text-[10px] flex items-center justify-center shadow">8</span>
                    </div>
                    <div className="flex justify-around">
                      <span className="h-6 w-6 rounded-full bg-[#00E676] text-black font-black text-[10px] flex items-center justify-center shadow">3</span>
                      <span className="h-6 w-6 rounded-full bg-[#00E676] text-black font-black text-[10px] flex items-center justify-center shadow">4</span>
                      <span className="h-6 w-6 rounded-full bg-[#00E676] text-black font-black text-[10px] flex items-center justify-center shadow">5</span>
                      <span className="h-6 w-6 rounded-full bg-[#00E676] text-black font-black text-[10px] flex items-center justify-center shadow">2</span>
                    </div>
                  </>
                )}

                {formation === "3-5-2" && (
                  <>
                    <div className="flex justify-center gap-16">
                      <span className="h-6 w-6 rounded-full bg-[#00E676] text-black font-black text-[10px] flex items-center justify-center shadow">9</span>
                      <span className="h-6 w-6 rounded-full bg-[#00E676] text-black font-black text-[10px] flex items-center justify-center shadow">11</span>
                    </div>
                    <div className="flex justify-between px-2">
                      <span className="h-6 w-6 rounded-full bg-[#00E676] text-black font-black text-[10px] flex items-center justify-center shadow">3</span>
                      <div className="flex gap-4">
                        <span className="h-6 w-6 rounded-full bg-[#00E676] text-black font-black text-[10px] flex items-center justify-center shadow">8</span>
                        <span className="h-6 w-6 rounded-full bg-[#00E676] text-black font-black text-[10px] flex items-center justify-center shadow">6</span>
                        <span className="h-6 w-6 rounded-full bg-[#00E676] text-black font-black text-[10px] flex items-center justify-center shadow">10</span>
                      </div>
                      <span className="h-6 w-6 rounded-full bg-[#00E676] text-black font-black text-[10px] flex items-center justify-center shadow">2</span>
                    </div>
                    <div className="flex justify-around px-8">
                      <span className="h-6 w-6 rounded-full bg-[#00E676] text-black font-black text-[10px] flex items-center justify-center shadow">5</span>
                      <span className="h-6 w-6 rounded-full bg-[#00E676] text-black font-black text-[10px] flex items-center justify-center shadow">4</span>
                      <span className="h-6 w-6 rounded-full bg-[#00E676] text-black font-black text-[10px] flex items-center justify-center shadow">6</span>
                    </div>
                  </>
                )}

                {/* Goalkeeper */}
                <div className="flex justify-center">
                  <span className="h-6 w-6 rounded-full bg-amber-400 text-black font-black text-[10px] flex items-center justify-center shadow">1</span>
                </div>
              </div>

              {/* Slider Pressing */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Intensité du Pressing :</span>
                  <span className="font-bold text-[#00E676]">{pressingLevel}%</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="100"
                  value={pressingLevel}
                  onChange={(e) => setPressingLevel(Number(e.target.value))}
                  className="mt-2 w-full accent-[#00E676] cursor-pointer"
                />
              </div>
            </div>

            {/* AI Output Pill */}
            <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/90 p-3.5 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-[#00E676]">
                <Sparkles className="h-4 w-4" />
                <span>Recommandation Copilote FFF :</span>
              </div>
              <p className="mt-1 text-slate-300 leading-relaxed">
                En {formation} à {pressingLevel}% d&apos;intensité, vos ailiers doivent fermer l&apos;axe pour contraindre la relance adverse vers la touche.
              </p>
            </div>
          </div>

          {/* ---------------- DEMO 2: LE GÉNÉRATEUR DE CARTE FUT 3D ---------------- */}
          <div className="rounded-3xl border border-slate-800 bg-[#0D121F] p-6 sm:p-8 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-3 w-3 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    DÉMO 2 · CARTE JOUEUR FUT & RADAR
                  </span>
                </div>
                <span className="rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 px-3 py-1 text-xs font-black">
                  OVR {overall}
                </span>
              </div>

              <h3 className="mt-4 text-xl font-bold text-white sm:text-2xl">
                La carte de joueur ultime pour motiver votre effectif
              </h3>
              <p className="mt-2 text-xs text-slate-400">
                Ajustez les curseurs pour voir votre carte FUT ProDay se mettre à jour en direct avec vos statistiques.
              </p>

              {/* Sliders Grid */}
              <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <div className="flex justify-between text-slate-400">
                    <span>Vitesse</span>
                    <span className="font-bold text-white">{pace}</span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="99"
                    value={pace}
                    onChange={(e) => setPace(Number(e.target.value))}
                    className="w-full accent-[#00E676] cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-slate-400">
                    <span>Tir</span>
                    <span className="font-bold text-white">{shooting}</span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="99"
                    value={shooting}
                    onChange={(e) => setShooting(Number(e.target.value))}
                    className="w-full accent-[#00E676] cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-slate-400">
                    <span>Passe</span>
                    <span className="font-bold text-white">{passing}</span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="99"
                    value={passing}
                    onChange={(e) => setPassing(Number(e.target.value))}
                    className="w-full accent-[#00E676] cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-slate-400">
                    <span>Dribble</span>
                    <span className="font-bold text-white">{dribbling}</span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="99"
                    value={dribbling}
                    onChange={(e) => setDribbling(Number(e.target.value))}
                    className="w-full accent-[#00E676] cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-slate-400">
                    <span>Défense</span>
                    <span className="font-bold text-white">{defending}</span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="99"
                    value={defending}
                    onChange={(e) => setDefending(Number(e.target.value))}
                    className="w-full accent-[#00E676] cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-slate-400">
                    <span>Physique</span>
                    <span className="font-bold text-white">{physical}</span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="99"
                    value={physical}
                    onChange={(e) => setPhysical(Number(e.target.value))}
                    className="w-full accent-[#00E676] cursor-pointer"
                  />
                </div>
              </div>

              {/* Dynamic Card Display */}
              <div className="mt-6 flex justify-center">
                <div className="w-60 rounded-2xl border-2 border-amber-400/50 bg-gradient-to-b from-[#2A2312] via-[#0E1522] to-[#0A0E17] p-4 shadow-xl shadow-amber-500/10">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-mono text-3xl font-black text-amber-400 leading-none">{overall}</span>
                      <p className="text-[10px] font-bold text-amber-300">ATT · PRODAY</p>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                      <Trophy className="h-4 w-4" />
                    </div>
                  </div>

                  <div className="my-2 flex flex-col items-center">
                    <div className="h-16 w-16 rounded-full border border-amber-400/50 bg-slate-800 flex items-center justify-center text-2xl">
                      ⚽
                    </div>
                    <h5 className="mt-1 text-sm font-black text-white">{playerName}</h5>
                  </div>

                  <div className="grid grid-cols-3 gap-1 border-t border-amber-500/30 pt-2 text-center text-[10px]">
                    <div><span className="font-bold text-white">{pace}</span> <span className="text-slate-400">VIT</span></div>
                    <div><span className="font-bold text-white">{shooting}</span> <span className="text-slate-400">TIR</span></div>
                    <div><span className="font-bold text-white">{passing}</span> <span className="text-slate-400">PAS</span></div>
                    <div><span className="font-bold text-white">{dribbling}</span> <span className="text-slate-400">DRI</span></div>
                    <div><span className="font-bold text-white">{defending}</span> <span className="text-slate-400">DEF</span></div>
                    <div><span className="font-bold text-white">{physical}</span> <span className="text-slate-400">PHY</span></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-xl bg-slate-900/90 border border-slate-800 p-3 text-center text-xs text-slate-400">
              ⚡ Disponible en carte 3D interactive sur mobile et imprimable en physique pour vos remises de fin de saison.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
