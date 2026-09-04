"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Zap,
  Play,
  CheckCircle2,
  Users,
  MapPin,
  Calendar,
  Sparkles,
  Award,
  ArrowRight,
  Send,
  AlertTriangle,
  Car,
  Bell,
} from "lucide-react";
import { ROUTES } from "@/lib/routes";

type RoleTab = "joueur" | "coach" | "club" | "parent";

export function ProDayEliteHero() {
  const [activeTab, setActiveTab] = useState<RoleTab>("joueur");
  const [playerRsvp, setPlayerRsvp] = useState<"yes" | "no" | null>("yes");
  const [coachReminded, setCoachReminded] = useState(false);
  const [emergencyAlertSent, setEmergencyAlertSent] = useState(false);
  const [carpoolBooked, setCarpoolBooked] = useState(false);

  return (
    <section className="relative overflow-hidden bg-[#06090E] pt-28 pb-20 sm:pt-36 sm:pb-28 lg:pb-36">
      {/* Background glowing gradients */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-[#00E676]/15 via-[#00B0FF]/10 to-transparent blur-3xl opacity-70" />
      <div className="pointer-events-none absolute top-1/3 -left-48 w-96 h-96 bg-[#00E676]/10 blur-3xl rounded-full" />
      <div className="pointer-events-none absolute top-1/2 -right-48 w-96 h-96 bg-[#F59E0B]/10 blur-3xl rounded-full" />

      {/* Grid pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Top Header Badge */}
        <div className="flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-[#00E676]/30 bg-[#00E676]/10 px-4 py-1.5 backdrop-blur-md"
          >
            <span className="flex h-2 w-2 rounded-full bg-[#00E676] animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[#00E676]">
              ⚡ LA NOUVELLE RÉFÉRENCE DU FOOTBALL AMATEUR ET PRO
            </span>
          </motion.div>

          {/* Main Hero Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-6 max-w-4xl font-display text-4xl font-black tracking-tight text-white sm:text-6xl sm:leading-[1.1] lg:text-7xl"
          >
            Le football a enfin son infrastructure{" "}
            <span className="bg-gradient-to-r from-[#00E676] via-[#38BDF8] to-[#F59E0B] bg-clip-text text-transparent">
              tout-en-un d&apos;élite.
            </span>
          </motion.h1>

          {/* Subtitle establishing superiority */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 max-w-3xl text-base leading-relaxed text-slate-300 sm:text-xl sm:leading-relaxed"
          >
            Dites adieu aux groupes WhatsApp désorganisés, aux tableurs Excel perdus et aux abonnements
            SportEasy ruineux. <strong className="text-white font-semibold">ProDay</strong> réunit club,
            coachs, joueurs, parents et sponsors dans une expérience sans pub, propulsée par l&apos;IA tactique FFF
            et des cartes FUT 3D.
          </motion.p>

          {/* High-conversion CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-5"
          >
            <Link
              href={ROUTES.proClub}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00E676] to-[#00C853] px-8 py-4 text-base font-bold text-black shadow-lg shadow-[#00E676]/25 transition hover:scale-[1.02] hover:shadow-xl hover:shadow-[#00E676]/35 active:scale-[0.99]"
            >
              <Zap className="h-5 w-5 fill-black" />
              Créer mon Club Gratuitement
            </Link>

            <a
              href="#demo-interactive"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-7 py-4 text-base font-semibold text-white backdrop-blur-md transition hover:border-slate-500 hover:bg-slate-800"
            >
              <Play className="h-4 w-4 text-[#00E676]" />
              Tester les Démos en Direct
            </a>

            <a
              href="#comparatif-direct"
              className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-slate-400 underline-offset-4 hover:text-white hover:underline transition"
            >
              Voir le comparatif vs SportEasy & MyCoach
              <ArrowRight className="h-4 w-4" />
            </a>
          </motion.div>

          {/* Social Proof Bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs font-medium text-slate-400 sm:text-sm"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-amber-400">★★★★★</span>
              <span className="text-white font-bold">4.9/5</span> sur les stores
            </div>
            <div className="h-1 w-1 rounded-full bg-slate-600 hidden sm:block" />
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-[#00E676]" />
              <span><strong className="text-white">+500 clubs</strong> & 25 000 licenciés</span>
            </div>
            <div className="h-1 w-1 rounded-full bg-slate-600 hidden sm:block" />
            <div className="flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-[#38BDF8]" />
              <span>100% Conforme RGPD & FFF</span>
            </div>
            <div className="h-1 w-1 rounded-full bg-slate-600 hidden sm:block" />
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-[#00E676]" />
              <span className="text-[#00E676] font-semibold">Zéro publicité intrusive</span>
            </div>
          </motion.div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Interactive Multi-Pole Device Mockup Showcase                    */}
        {/* ---------------------------------------------------------------- */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-14 sm:mt-18"
        >
          {/* Device Frame */}
          <div className="rounded-3xl border border-slate-800 bg-[#0B0F19] p-3 sm:p-5 shadow-2xl shadow-black/80 ring-1 ring-white/10">
            {/* Mockup Header Bar with Role Switcher */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800/80 pb-4 px-2">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-rose-500/80" />
                  <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                  <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                </div>
                <div className="hidden sm:flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-1 text-xs text-slate-400">
                  <Shield className="h-3.5 w-3.5 text-[#00E676]" />
                  <span>proday.app/app/dashboard</span>
                </div>
              </div>

              {/* Role Switcher Tabs */}
              <div className="flex items-center rounded-xl bg-slate-900/90 p-1 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab("joueur")}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    activeTab === "joueur"
                      ? "bg-[#00E676] text-black shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  ⚽ Joueur
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("coach")}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    activeTab === "coach"
                      ? "bg-[#00E676] text-black shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  📋 Coach
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("club")}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    activeTab === "club"
                      ? "bg-[#00E676] text-black shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  🏛️ Club
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("parent")}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    activeTab === "parent"
                      ? "bg-[#00E676] text-black shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  🚗 Parent
                </button>
              </div>
            </div>

            {/* Mockup Screen Content Container */}
            <div className="mt-4 rounded-2xl bg-[#080C14] p-4 sm:p-6 lg:p-8 min-h-[480px]">
              <AnimatePresence mode="wait">
                {/* ---------------- TAB 1: JOUEUR ---------------- */}
                {activeTab === "joueur" && (
                  <motion.div
                    key="joueur"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.25 }}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
                  >
                    {/* Left: Next Match Hero Card */}
                    <div className="lg:col-span-7 space-y-4">
                      <div className="rounded-2xl border border-slate-800 bg-[#101522] p-5 sm:p-6 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 h-32 w-32 bg-[#00E676]/10 rounded-full blur-2xl pointer-events-none" />

                        {/* Card header */}
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#00E676]/15 border border-[#00E676]/30 px-3 py-1 text-xs font-bold text-[#00E676]">
                            MATCH OFFICIEL · J14
                          </span>
                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            <span>Dimanche · 15:00</span>
                          </div>
                        </div>

                        {/* Match Confrontation */}
                        <div className="mt-5 grid grid-cols-7 items-center text-center">
                          <div className="col-span-3 flex flex-col items-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#00E676]/20 border border-[#00E676]/40 text-[#00E676]">
                              <Shield className="h-7 w-7" />
                            </div>
                            <span className="mt-2 text-sm font-bold text-white">FC ProDay</span>
                            <span className="text-[10px] font-semibold text-[#00E676]">DOMICILE</span>
                          </div>

                          <div className="col-span-1 flex flex-col items-center">
                            <span className="text-xl font-black text-slate-500">VS</span>
                            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300 mt-1">
                              {playerRsvp === "yes" ? "14/14" : "13/14"} prêts
                            </span>
                          </div>

                          <div className="col-span-3 flex flex-col items-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 border border-slate-700 text-slate-300">
                              <Shield className="h-7 w-7" />
                            </div>
                            <span className="mt-2 text-sm font-bold text-slate-200">AS Meudon</span>
                            <span className="text-[10px] font-semibold text-slate-400">EXTÉRIEUR</span>
                          </div>
                        </div>

                        {/* Stadium & Location */}
                        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-900/90 border border-slate-800 p-3">
                          <div className="flex items-center gap-2 text-xs text-slate-300">
                            <MapPin className="h-4 w-4 text-emerald-400 shrink-0" />
                            <span>Stade Jean Moulin · 12 min en voiture</span>
                          </div>
                          <span className="text-xs font-semibold text-[#00E676]">Itinéraire Waze ↗</span>
                        </div>

                        {/* Interactive 1-Tap RSVP */}
                        <div className="mt-5 border-t border-slate-800/80 pt-4">
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                            Votre présence pour ce match :
                          </p>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() => setPlayerRsvp("yes")}
                              className={`flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition ${
                                playerRsvp === "yes"
                                  ? "bg-[#00E676] text-black ring-2 ring-[#00E676]/50 shadow-lg shadow-[#00E676]/20"
                                  : "bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800"
                              }`}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              Je serai là ✅
                            </button>
                            <button
                              type="button"
                              onClick={() => setPlayerRsvp("no")}
                              className={`flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition ${
                                playerRsvp === "no"
                                  ? "bg-rose-500 text-white ring-2 ring-rose-500/50 shadow-lg shadow-rose-500/20"
                                  : "bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800"
                              }`}
                            >
                              Absent ❌
                            </button>
                          </div>
                          {playerRsvp === "yes" && (
                            <p className="mt-2 text-center text-xs font-medium text-[#00E676]">
                              ✓ Présence confirmée au coach • Rendez-vous 13h45 au vestiaire !
                            </p>
                          )}
                        </div>
                      </div>

                      {/* AI Quick Copilot Pill */}
                      <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-[#101522] p-3 text-xs text-slate-300">
                        <Sparkles className="h-4 w-4 text-[#00E676] shrink-0" />
                        <span className="flex-1">
                          <strong>Copilote IA :</strong> Meudon joue en 3-5-2 avec des latéraux très hauts. Prépare-toi à attaquer leur dos.
                        </span>
                      </div>
                    </div>

                    {/* Right: FUT 3D Card Preview */}
                    <div className="lg:col-span-5 flex flex-col items-center">
                      <div className="relative w-full max-w-[280px] rounded-2xl border-2 border-amber-500/40 bg-gradient-to-b from-[#1E1B10] via-[#0D131F] to-[#0A0E17] p-5 shadow-2xl shadow-amber-500/10">
                        <div className="flex items-start justify-between">
                          <div className="text-left">
                            <span className="font-mono text-3xl font-black text-amber-400 leading-none">88</span>
                            <p className="text-[10px] font-bold text-amber-300">ATT</p>
                            <p className="text-[9px] text-slate-400">D1 IDF</p>
                          </div>
                          <div className="h-10 w-10 rounded-full border border-amber-400/40 bg-amber-400/20 flex items-center justify-center text-amber-300">
                            <Award className="h-5 w-5" />
                          </div>
                        </div>

                        {/* Player Photo Avatar Placeholder */}
                        <div className="my-3 flex flex-col items-center">
                          <div className="h-24 w-24 rounded-full border-2 border-amber-400/60 bg-slate-800 flex items-center justify-center overflow-hidden shadow-inner">
                            <span className="text-3xl">⚡</span>
                          </div>
                          <h4 className="mt-2 text-base font-black text-white tracking-wide">MAXIME D.</h4>
                          <span className="text-[11px] font-semibold text-[#00E676]">FC PRODAY</span>
                        </div>

                        {/* FUT Attributes */}
                        <div className="grid grid-cols-3 gap-2 border-t border-amber-500/30 pt-3 text-center">
                          <div>
                            <span className="text-xs font-bold text-white">91</span>
                            <p className="text-[9px] text-slate-400 font-mono">VIT</p>
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white">86</span>
                            <p className="text-[9px] text-slate-400 font-mono">TIR</p>
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white">84</span>
                            <p className="text-[9px] text-slate-400 font-mono">PAS</p>
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white">89</span>
                            <p className="text-[9px] text-slate-400 font-mono">DRI</p>
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white">52</span>
                            <p className="text-[9px] text-slate-400 font-mono">DEF</p>
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white">78</span>
                            <p className="text-[9px] text-slate-400 font-mono">PHY</p>
                          </div>
                        </div>

                        <div className="mt-3 rounded-lg bg-amber-500/15 border border-amber-500/30 p-2 text-center text-[10px] font-bold text-amber-300">
                          ⭐️ 3x Homme du Match cette saison
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ---------------- TAB 2: COACH ---------------- */}
                {activeTab === "coach" && (
                  <motion.div
                    key="coach"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.25 }}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
                  >
                    {/* Left: Tactical Pitch */}
                    <div className="lg:col-span-7 space-y-4">
                      <div className="rounded-2xl border border-emerald-800/40 bg-gradient-to-b from-[#0B2516] to-[#07170E] p-5 shadow-xl relative overflow-hidden">
                        <div className="flex items-center justify-between border-b border-emerald-700/30 pb-3">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-[#00E676] animate-ping" />
                            <span className="text-xs font-bold uppercase tracking-wider text-[#00E676]">
                              TABLEAU NOIR TACTIQUE · 4-3-3 OFFENSIF
                            </span>
                          </div>
                          <span className="text-xs text-emerald-300 font-mono">11 titulaires placés</span>
                        </div>

                        {/* Pitch Graphic with player dots */}
                        <div className="mt-4 relative h-64 rounded-xl border border-emerald-600/30 bg-emerald-950/60 p-4 flex flex-col justify-between">
                          {/* Attack row */}
                          <div className="flex justify-around">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#00E676] text-black font-black text-[11px] shadow-lg">11</span>
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#00E676] text-black font-black text-[11px] shadow-lg">9</span>
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#00E676] text-black font-black text-[11px] shadow-lg">7</span>
                          </div>
                          {/* Midfield row */}
                          <div className="flex justify-around px-8">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#00E676] text-black font-black text-[11px] shadow-lg">8</span>
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#00E676] text-black font-black text-[11px] shadow-lg">6</span>
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#00E676] text-black font-black text-[11px] shadow-lg">10</span>
                          </div>
                          {/* Defense row */}
                          <div className="flex justify-around">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#00E676] text-black font-black text-[11px] shadow-lg">3</span>
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#00E676] text-black font-black text-[11px] shadow-lg">4</span>
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#00E676] text-black font-black text-[11px] shadow-lg">5</span>
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#00E676] text-black font-black text-[11px] shadow-lg">2</span>
                          </div>
                          {/* Goalkeeper */}
                          <div className="flex justify-center">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-400 text-black font-black text-[11px] shadow-lg">1</span>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between text-xs text-emerald-300">
                          <span>Consigne : Pressing haut dès la perte à 5 secondes</span>
                          <span className="text-[#00E676] font-bold">Modifier le schéma ↗</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Convocation & 1-Click Reminder */}
                    <div className="lg:col-span-5 space-y-4">
                      <div className="rounded-2xl border border-slate-800 bg-[#101522] p-5 shadow-xl">
                        <h4 className="text-sm font-bold text-white flex items-center justify-between">
                          <span>Convocations Dimanche</span>
                          <span className="rounded-full bg-[#00E676]/20 text-[#00E676] px-2.5 py-0.5 text-xs">
                            14 / 16 répondus
                          </span>
                        </h4>

                        <div className="mt-4 space-y-2 text-xs">
                          <div className="flex items-center justify-between rounded-lg bg-slate-900/90 p-2.5">
                            <span className="font-semibold text-white">Maxime D. (Attaquant)</span>
                            <span className="text-[#00E676] font-bold">Présent ✓</span>
                          </div>
                          <div className="flex items-center justify-between rounded-lg bg-slate-900/90 p-2.5">
                            <span className="font-semibold text-white">Lucas B. (Milieu)</span>
                            <span className="text-[#00E676] font-bold">Présent ✓</span>
                          </div>
                          <div className="flex items-center justify-between rounded-lg bg-rose-950/40 border border-rose-800/40 p-2.5">
                            <span className="font-semibold text-rose-200">Karim S. (Défenseur)</span>
                            <span className="text-rose-400 font-bold">Absent ✗ (blessé)</span>
                          </div>
                          <div className="flex items-center justify-between rounded-lg bg-amber-950/40 border border-amber-800/40 p-2.5">
                            <span className="font-semibold text-amber-200">Thomas P. (Gardien)</span>
                            <span className="text-amber-400 font-bold">En attente ?</span>
                          </div>
                        </div>

                        {/* Relancer en 1 clic */}
                        <div className="mt-5 border-t border-slate-800 pt-4">
                          <button
                            type="button"
                            onClick={() => setCoachReminded(true)}
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00E676] to-[#00C853] py-3 text-xs font-black text-black shadow-lg shadow-[#00E676]/20 transition hover:scale-[1.01]"
                          >
                            <Send className="h-4 w-4" />
                            {coachReminded ? "✓ 2 Rappels SMS & Push envoyés !" : "Relancer les 2 retardataires en 1 clic"}
                          </button>
                        </div>
                      </div>

                      {/* Coach AI Causerie */}
                      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 text-xs text-slate-300">
                        <div className="flex items-center gap-2 font-bold text-[#00E676] mb-1">
                          <Sparkles className="h-4 w-4" />
                          <span>Causerie d&apos;avant-match IA</span>
                        </div>
                        <p className="text-slate-400 leading-relaxed">
                          « Les gars, l&apos;entame sera la clé. 15 premières minutes à haute intensité. On ne concède aucune faute dans l&apos;axe... »
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ---------------- TAB 3: CLUB & PRÉSIDENT ---------------- */}
                {activeTab === "club" && (
                  <motion.div
                    key="club"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.25 }}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
                  >
                    {/* Left: Licences FFF Tracker */}
                    <div className="lg:col-span-7 space-y-4">
                      <div className="rounded-2xl border border-slate-800 bg-[#101522] p-5 shadow-xl">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                          <h4 className="text-sm font-bold text-white flex items-center gap-2">
                            <Shield className="h-4 w-4 text-[#38BDF8]" />
                            Suivi des Licences FFF 2026-2027
                          </h4>
                          <span className="text-xs font-bold text-[#00E676]">282 / 300 licenciés (94%)</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-4">
                          <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden flex">
                            <div className="bg-[#00E676] h-full" style={{ width: "82%" }} title="Validées FFF" />
                            <div className="bg-amber-400 h-full" style={{ width: "12%" }} title="Cotisation attente" />
                            <div className="bg-rose-500 h-full" style={{ width: "6%" }} title="Certificat manquant" />
                          </div>
                          <div className="mt-2 flex justify-between text-[11px] text-slate-400">
                            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#00E676]" /> 246 Validées</span>
                            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-400" /> 36 Paiement attente</span>
                            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-500" /> 18 Certificat manquant</span>
                          </div>
                        </div>

                        {/* Urgent Broadcast Module */}
                        <div className="mt-6 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              <h5 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                                Alerte Urgente Club · Intempéries
                              </h5>
                              <p className="text-xs text-slate-300">
                                « Arrêté municipal : Terrain pelouse fermé ce weekend. Tous les matchs basculent sur le synthétique 2. »
                              </p>
                              <button
                                type="button"
                                onClick={() => setEmergencyAlertSent(true)}
                                className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-bold text-black hover:bg-amber-300 transition"
                              >
                                <Bell className="h-3.5 w-3.5" />
                                {emergencyAlertSent ? "✓ Notification push envoyée à 300 membres !" : "Diffuser la notification push aux 18 équipes"}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: Club Finances & Cotisations */}
                    <div className="lg:col-span-5 space-y-4">
                      <div className="rounded-2xl border border-slate-800 bg-[#101522] p-5 shadow-xl">
                        <h4 className="text-sm font-bold text-white mb-3">Cotisations Collectées</h4>
                        <p className="text-3xl font-black text-white">
                          42 300 € <span className="text-xs font-medium text-slate-400">/ 45 000 €</span>
                        </p>
                        <p className="text-xs text-[#00E676] font-semibold mt-1">
                          +15% par rapport à l&apos;année précédente grâce au paiement en ligne ProDay
                        </p>

                        <div className="mt-4 border-t border-slate-800 pt-3 space-y-2 text-xs text-slate-300">
                          <div className="flex justify-between">
                            <span>Sponsors locaux signés :</span>
                            <span className="font-bold text-amber-400">4 partenaires (4 200 €)</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Coût ProDay Club :</span>
                            <span className="font-bold text-[#00E676]">3 € / licencié (900 € / an)</span>
                          </div>
                          <div className="flex justify-between border-t border-slate-800/80 pt-2 font-bold text-white">
                            <span>Bénéfice net club :</span>
                            <span className="text-[#00E676]">+3 300 € d&apos;excédent</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ---------------- TAB 4: PARENT & COVOITURAGE ---------------- */}
                {activeTab === "parent" && (
                  <motion.div
                    key="parent"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.25 }}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
                  >
                    <div className="lg:col-span-7 space-y-4">
                      <div className="rounded-2xl border border-slate-800 bg-[#101522] p-5 shadow-xl">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                          <h4 className="text-sm font-bold text-white flex items-center gap-2">
                            <Car className="h-4 w-4 text-[#00E676]" />
                            Covoiturage Match Extérieur U15
                          </h4>
                          <span className="text-xs font-semibold text-slate-400">Départ 13h15 · Stade Municipal</span>
                        </div>

                        <div className="mt-4 space-y-3">
                          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <h5 className="text-xs font-bold text-white">Voiture de Thomas M. (Papa de Nathan)</h5>
                                <p className="text-xs text-slate-400 mt-0.5">Peugeot 3008 · 2 places restantes</p>
                              </div>
                              <span className="rounded-full bg-[#00E676]/20 text-[#00E676] px-2.5 py-0.5 text-xs font-bold">
                                2 dispos
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => setCarpoolBooked(true)}
                              className="mt-3 w-full rounded-lg bg-[#00E676] py-2 text-xs font-bold text-black transition hover:bg-[#00C853]"
                            >
                              {carpoolBooked ? "✓ Place réservée pour votre enfant !" : "Réserver 1 place pour mon enfant"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-5 space-y-4">
                      <div className="rounded-2xl border border-slate-800 bg-[#101522] p-5 shadow-xl">
                        <h4 className="text-sm font-bold text-white mb-2">Sécurité & Suivi Parent</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Fini le stress des déplacements. Vous savez exactement avec quel parent votre enfant voyage, à quelle heure il arrive et son heure de retour.
                        </p>
                        <div className="mt-4 rounded-xl bg-slate-900/90 p-3 border border-slate-800 text-xs text-slate-300 space-y-1.5">
                          <div className="flex items-center gap-2 text-[#00E676]">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Numéro du coach disponible en 1 clic</span>
                          </div>
                          <div className="flex items-center gap-2 text-[#00E676]">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Confirmation d&apos;arrivée au vestiaire</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
