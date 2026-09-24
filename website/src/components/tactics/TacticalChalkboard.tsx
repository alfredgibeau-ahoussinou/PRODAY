"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Play,
  Pause,
  Sliders,
  CheckCircle2,
} from "lucide-react";

export type FormationId = "4-3-3" | "4-2-3-1" | "3-5-2" | "4-4-2" | "5-3-2" | "3-4-3";
export type TacticalPhase = "idle" | "attack" | "defense" | "counter" | "pressing";

export type TacticalPlayerSpot = {
  id: string;
  num: number;
  label: string;
  name: string;
  role: string;
  baseX: number; // 0 - 100
  baseY: number; // 0 - 100
  attackX: number;
  attackY: number;
  defX: number;
  defY: number;
  counterX: number;
  counterY: number;
  pressingX: number;
  pressingY: number;
  consigne: string;
  instructionType: "offensive" | "defensive" | "balance";
};

const FORMATIONS: Record<
  FormationId,
  {
    name: string;
    style: string;
    players: TacticalPlayerSpot[];
  }
> = {
  "4-3-3": {
    name: "4-3-3 Attaque & Possession",
    style: "Écartement maximal, jeu dans les intervalles, pressing haut",
    players: [
      {
        id: "gk",
        num: 1,
        label: "GB",
        name: "L. Chevalier",
        role: "Gardien Relanceur",
        baseX: 50,
        baseY: 90,
        attackX: 50,
        attackY: 84,
        defX: 50,
        defY: 94,
        counterX: 50,
        counterY: 88,
        pressingX: 50,
        pressingY: 82,
        consigne: "Relance courte axiale. Couverture de la profondeur en libéro.",
        instructionType: "defensive",
      },
      {
        id: "lb",
        num: 3,
        label: "DG",
        name: "T. Hernandez",
        role: "Latéral Offensif",
        baseX: 16,
        baseY: 72,
        attackX: 12,
        attackY: 42,
        defX: 20,
        defY: 80,
        counterX: 10,
        counterY: 34,
        pressingX: 18,
        pressingY: 55,
        consigne: "Dédoublements intérieurs et chevauchement sur les ailes.",
        instructionType: "offensive",
      },
      {
        id: "cb1",
        num: 4,
        label: "DCG",
        name: "W. Saliba",
        role: "Défenseur Relanceur",
        baseX: 38,
        baseY: 76,
        attackX: 36,
        attackY: 60,
        defX: 38,
        defY: 84,
        counterX: 36,
        counterY: 68,
        pressingX: 36,
        pressingY: 52,
        consigne: "Casser les lignes à la passe. Prise au corps de l'attaquant.",
        instructionType: "defensive",
      },
      {
        id: "cb2",
        num: 5,
        label: "DCD",
        name: "I. Konaté",
        role: "Stoppeur Couverture",
        baseX: 62,
        baseY: 76,
        attackX: 64,
        attackY: 60,
        defX: 62,
        defY: 84,
        counterX: 64,
        counterY: 68,
        pressingX: 64,
        pressingY: 52,
        consigne: "Sécurité axiale, domination aérienne et couverture des montées.",
        instructionType: "defensive",
      },
      {
        id: "rb",
        num: 2,
        label: "DD",
        name: "J. Koundé",
        role: "Latéral Inversé",
        baseX: 84,
        baseY: 72,
        attackX: 80,
        attackY: 46,
        defX: 80,
        defY: 80,
        counterX: 86,
        counterY: 38,
        pressingX: 82,
        pressingY: 55,
        consigne: "Resserrer l'axe à la perte. Appui dans le demi-espace droit.",
        instructionType: "balance",
      },
      {
        id: "cdm",
        num: 6,
        label: "MDC",
        name: "A. Tchouaméni",
        role: "Sentinelle Régulatrice",
        baseX: 50,
        baseY: 56,
        attackX: 50,
        attackY: 48,
        defX: 50,
        defY: 68,
        counterX: 50,
        counterY: 52,
        pressingX: 50,
        pressingY: 38,
        consigne: "Équilibre du bloc, orientation du jeu et blocage des contre-attaques.",
        instructionType: "defensive",
      },
      {
        id: "cm1",
        num: 8,
        label: "MCG",
        name: "E. Camavinga",
        role: "Milieu Box-to-Box",
        baseX: 32,
        baseY: 46,
        attackX: 28,
        attackY: 32,
        defX: 32,
        defY: 60,
        counterX: 26,
        counterY: 26,
        pressingX: 28,
        pressingY: 30,
        consigne: "Percussions balle au pied et projections dans la surface adverse.",
        instructionType: "offensive",
      },
      {
        id: "cm2",
        num: 10,
        label: "MCD",
        name: "A. Griezmann",
        role: "Meneur Créateur",
        baseX: 68,
        baseY: 44,
        attackX: 66,
        attackY: 28,
        defX: 68,
        defY: 58,
        counterX: 68,
        counterY: 24,
        pressingX: 66,
        pressingY: 28,
        consigne: "Dernière passe, changements d'aile et temporisation intelligente.",
        instructionType: "offensive",
      },
      {
        id: "lw",
        num: 11,
        label: "AG",
        name: "B. Barcola",
        role: "Ailier Percutant",
        baseX: 18,
        baseY: 26,
        attackX: 20,
        attackY: 16,
        defX: 18,
        defY: 48,
        counterX: 14,
        counterY: 12,
        pressingX: 22,
        pressingY: 20,
        consigne: "Fixer en 1v1, repiquer intérieur sur le pied droit pour frapper.",
        instructionType: "offensive",
      },
      {
        id: "st",
        num: 9,
        label: "BU",
        name: "K. Mbappé",
        role: "Attaquant Décrochage & Profondeur",
        baseX: 50,
        baseY: 20,
        attackX: 50,
        attackY: 10,
        defX: 50,
        defY: 42,
        counterX: 50,
        counterY: 8,
        pressingX: 50,
        pressingY: 14,
        consigne: "Attaquer les espaces dans le dos, finitions chirurgicales 1 touche.",
        instructionType: "offensive",
      },
      {
        id: "rw",
        num: 7,
        label: "AD",
        name: "O. Dembélé",
        role: "Ailier Dribbleur",
        baseX: 82,
        baseY: 26,
        attackX: 80,
        attackY: 16,
        defX: 82,
        defY: 48,
        counterX: 86,
        counterY: 12,
        pressingX: 78,
        pressingY: 20,
        consigne: "Étirer le bloc adverse, centres tendus au 2e poteau.",
        instructionType: "offensive",
      },
    ],
  },
  "4-2-3-1": {
    name: "4-2-3-1 Équilibre & Contre-Pressing",
    style: "Double pivot solide, meneur axé créativité, transitions foudroyantes",
    players: [
      { id: "gk", num: 1, label: "GB", name: "L. Chevalier", role: "Gardien", baseX: 50, baseY: 90, attackX: 50, attackY: 84, defX: 50, defY: 94, counterX: 50, counterY: 88, pressingX: 50, pressingY: 82, consigne: "Sécuriser l'espace aérien.", instructionType: "defensive" },
      { id: "lb", num: 3, label: "DG", name: "T. Hernandez", role: "Latéral Moderne", baseX: 16, baseY: 74, attackX: 14, attackY: 46, defX: 20, defY: 82, counterX: 12, counterY: 36, pressingX: 18, pressingY: 58, consigne: "Appui constant sur l'aile.", instructionType: "offensive" },
      { id: "cb1", num: 4, label: "DC", name: "W. Saliba", role: "Défenseur Axe", baseX: 38, baseY: 78, attackX: 36, attackY: 62, defX: 38, defY: 86, counterX: 36, counterY: 70, pressingX: 36, pressingY: 54, consigne: "Contrôle de l'avant-centre.", instructionType: "defensive" },
      { id: "cb2", num: 5, label: "DC", name: "I. Konaté", role: "Stoppeur", baseX: 62, baseY: 78, attackX: 64, attackY: 62, defX: 62, defY: 86, counterX: 64, counterY: 70, pressingX: 64, pressingY: 54, consigne: "Duels au sol et aériens.", instructionType: "defensive" },
      { id: "rb", num: 2, label: "DD", name: "J. Koundé", role: "Latéral Équilibre", baseX: 84, baseY: 74, attackX: 82, attackY: 48, defX: 80, defY: 82, counterX: 86, counterY: 40, pressingX: 82, pressingY: 58, consigne: "Sécurité à la perte.", instructionType: "balance" },
      { id: "cdm1", num: 6, label: "MDC", name: "A. Tchouaméni", role: "Pivot Défensif", baseX: 38, baseY: 58, attackX: 36, attackY: 50, defX: 38, defY: 68, counterX: 36, counterY: 54, pressingX: 36, pressingY: 42, consigne: "Gratter le premier ballon.", instructionType: "defensive" },
      { id: "cdm2", num: 8, label: "MDC", name: "E. Camavinga", role: "Relayeur Vertical", baseX: 62, baseY: 58, attackX: 64, attackY: 48, defX: 62, defY: 68, counterX: 64, counterY: 52, pressingX: 64, pressingY: 42, consigne: "Transition rapide vers l'avant.", instructionType: "balance" },
      { id: "lam", num: 11, label: "MOG", name: "B. Barcola", role: "Milieu Excentré Gauche", baseX: 22, baseY: 36, attackX: 20, attackY: 20, defX: 22, defY: 52, counterX: 16, counterY: 16, pressingX: 24, pressingY: 24, consigne: "Percussion et fixation.", instructionType: "offensive" },
      { id: "cam", num: 10, label: "MOC", name: "A. Griezmann", role: "Meneur Électron Libre", baseX: 50, baseY: 34, attackX: 50, attackY: 22, defX: 50, defY: 54, counterX: 50, counterY: 18, pressingX: 50, pressingY: 22, consigne: "Passe décisive et décrochage.", instructionType: "offensive" },
      { id: "ram", num: 7, label: "MOD", name: "O. Dembélé", role: "Milieu Excentré Droit", baseX: 78, baseY: 36, attackX: 80, attackY: 20, defX: 78, defY: 52, counterX: 84, counterY: 16, pressingX: 76, pressingY: 24, consigne: "Dribble et centre instantané.", instructionType: "offensive" },
      { id: "st", num: 9, label: "BU", name: "K. Mbappé", role: "Buteur de Rupture", baseX: 50, baseY: 18, attackX: 50, attackY: 10, defX: 50, defY: 38, counterX: 50, counterY: 8, pressingX: 50, pressingY: 12, consigne: "Prendre la profondeur.", instructionType: "offensive" },
    ],
  },
  "3-5-2": {
    name: "3-5-2 Pistons & Densité Axiale",
    style: "3 centraux imperméables, pistons tout-terrain, 2 pointes d'attaque",
    players: [
      { id: "gk", num: 1, label: "GB", name: "L. Chevalier", role: "Gardien", baseX: 50, baseY: 90, attackX: 50, attackY: 84, defX: 50, defY: 94, counterX: 50, counterY: 88, pressingX: 50, pressingY: 82, consigne: "Relances longues précises.", instructionType: "defensive" },
      { id: "cb1", num: 3, label: "DCG", name: "L. Hernandez", role: "Central Gauche", baseX: 28, baseY: 76, attackX: 24, attackY: 62, defX: 28, defY: 84, counterX: 24, counterY: 70, pressingX: 24, pressingY: 54, consigne: "Couverture du piston gauche.", instructionType: "defensive" },
      { id: "cb2", num: 4, label: "DC", name: "W. Saliba", role: "Libéro Central", baseX: 50, baseY: 78, attackX: 50, attackY: 64, defX: 50, defY: 86, counterX: 50, counterY: 72, pressingX: 50, pressingY: 56, consigne: "Patron de la défense.", instructionType: "defensive" },
      { id: "cb3", num: 5, label: "DCD", name: "I. Konaté", role: "Central Droit", baseX: 72, baseY: 76, attackX: 76, attackY: 62, defX: 72, defY: 84, counterX: 76, counterY: 70, pressingX: 76, pressingY: 54, consigne: "Couverture du piston droit.", instructionType: "defensive" },
      { id: "lwb", num: 11, label: "PIS.G", name: "T. Hernandez", role: "Piston Gauche", baseX: 12, baseY: 52, attackX: 10, attackY: 28, defX: 14, defY: 72, counterX: 8, counterY: 20, pressingX: 12, pressingY: 38, consigne: "Box-to-box couloir complet.", instructionType: "offensive" },
      { id: "cm1", num: 6, label: "MCG", name: "A. Tchouaméni", role: "Milieu Travailleur", baseX: 35, baseY: 50, attackX: 32, attackY: 38, defX: 35, defY: 64, counterX: 32, counterY: 44, pressingX: 32, pressingY: 34, consigne: "Fermeture des passes axiales.", instructionType: "defensive" },
      { id: "cm2", num: 10, label: "MOC", name: "A. Griezmann", role: "Maestro Relayeur", baseX: 50, baseY: 42, attackX: 50, attackY: 26, defX: 50, defY: 58, counterX: 50, counterY: 22, pressingX: 50, pressingY: 26, consigne: "Distributeur de caviars.", instructionType: "offensive" },
      { id: "cm3", num: 8, label: "MCD", name: "E. Camavinga", role: "Milieu Dynamique", baseX: 65, baseY: 50, attackX: 68, attackY: 38, defX: 65, defY: 64, counterX: 68, counterY: 44, pressingX: 68, pressingY: 34, consigne: "Pressing et percées.", instructionType: "balance" },
      { id: "rwb", num: 2, label: "PIS.D", name: "J. Koundé", role: "Piston Droit", baseX: 88, baseY: 52, attackX: 90, attackY: 28, defX: 86, defY: 72, counterX: 92, counterY: 20, pressingX: 88, pressingY: 38, consigne: "Centres et replis défensifs.", instructionType: "offensive" },
      { id: "st1", num: 9, label: "AC", name: "K. Mbappé", role: "Attaquant Vitesse", baseX: 38, baseY: 20, attackX: 36, attackY: 10, defX: 38, defY: 40, counterX: 34, counterY: 8, pressingX: 36, pressingY: 14, consigne: "Attaque de la profondeur.", instructionType: "offensive" },
      { id: "st2", num: 7, label: "AC", name: "M. Thuram", role: "Point d'Appui & Pivot", baseX: 62, baseY: 20, attackX: 64, attackY: 10, defX: 62, defY: 40, counterX: 66, counterY: 8, pressingX: 64, pressingY: 14, consigne: "Pivoter, remiser, peser.", instructionType: "offensive" },
    ],
  },
  "4-4-2": {
    name: "4-4-2 Compact & Contre-Attaque",
    style: "Deux lignes de 4 ultra étanches, jeu direct, pressing coordonné",
    players: [
      { id: "gk", num: 1, label: "GB", name: "L. Chevalier", role: "Gardien", baseX: 50, baseY: 90, attackX: 50, attackY: 84, defX: 50, defY: 94, counterX: 50, counterY: 88, pressingX: 50, pressingY: 82, consigne: "Arrêts réflexes.", instructionType: "defensive" },
      { id: "lb", num: 3, label: "DG", name: "T. Hernandez", role: "Défenseur Gauche", baseX: 18, baseY: 74, attackX: 16, attackY: 48, defX: 20, defY: 82, counterX: 14, counterY: 38, pressingX: 18, pressingY: 58, consigne: "Blocage du couloir.", instructionType: "defensive" },
      { id: "cb1", num: 4, label: "DC", name: "W. Saliba", role: "Stoppeur", baseX: 38, baseY: 76, attackX: 36, attackY: 62, defX: 38, defY: 84, counterX: 36, counterY: 70, pressingX: 36, pressingY: 54, consigne: "Interceptions basses.", instructionType: "defensive" },
      { id: "cb2", num: 5, label: "DC", name: "I. Konaté", role: "Couverture", baseX: 62, baseY: 76, attackX: 64, attackY: 62, defX: 62, defY: 84, counterX: 64, counterY: 70, pressingX: 64, pressingY: 54, consigne: "Marquage serré.", instructionType: "defensive" },
      { id: "rb", num: 2, label: "DD", name: "J. Koundé", role: "Défenseur Droit", baseX: 82, baseY: 74, attackX: 84, attackY: 48, defX: 80, defY: 82, counterX: 86, counterY: 38, pressingX: 82, pressingY: 58, consigne: "Fermeture des angles.", instructionType: "defensive" },
      { id: "lm", num: 11, label: "MG", name: "B. Barcola", role: "Milieu Gauche", baseX: 20, baseY: 48, attackX: 18, attackY: 26, defX: 22, defY: 62, counterX: 14, counterY: 18, pressingX: 20, pressingY: 36, consigne: "Repli défensif et contre.", instructionType: "offensive" },
      { id: "cm1", num: 6, label: "MC", name: "A. Tchouaméni", role: "Sentinelle", baseX: 40, baseY: 52, attackX: 38, attackY: 42, defX: 40, defY: 66, counterX: 38, counterY: 48, pressingX: 38, pressingY: 38, consigne: "Râtissage milieu.", instructionType: "defensive" },
      { id: "cm2", num: 8, label: "MC", name: "E. Camavinga", role: "Milieu Central", baseX: 60, baseY: 52, attackX: 62, attackY: 42, defX: 60, defY: 66, counterX: 62, counterY: 48, pressingX: 62, pressingY: 38, consigne: "Projection et passes.", instructionType: "balance" },
      { id: "rm", num: 7, label: "MD", name: "O. Dembélé", role: "Milieu Droit", baseX: 80, baseY: 48, attackX: 82, attackY: 26, defX: 78, defY: 62, counterX: 86, counterY: 18, pressingX: 80, pressingY: 36, consigne: "Débordement éclair.", instructionType: "offensive" },
      { id: "st1", num: 9, label: "BU", name: "K. Mbappé", role: "Attaquant Libre", baseX: 40, baseY: 22, attackX: 38, attackY: 12, defX: 40, defY: 44, counterX: 36, counterY: 8, pressingX: 38, pressingY: 16, consigne: "Appels dans l'espace.", instructionType: "offensive" },
      { id: "st2", num: 10, label: "BU", name: "A. Griezmann", role: "Deuxième Attaquant", baseX: 60, baseY: 26, attackX: 62, attackY: 14, defX: 60, defY: 46, counterX: 64, counterY: 10, pressingX: 62, pressingY: 18, consigne: "Lien milieu-attaque.", instructionType: "offensive" },
    ],
  },
  "5-3-2": {
    name: "5-3-2 Verrou Défensif & Contre",
    style: "Mur à 5 derrière, 3 milieux axiaux denses, 2 flèches en contre",
    players: [
      { id: "gk", num: 1, label: "GB", name: "L. Chevalier", role: "Gardien", baseX: 50, baseY: 90, attackX: 50, attackY: 86, defX: 50, defY: 94, counterX: 50, counterY: 88, pressingX: 50, pressingY: 84, consigne: "Relances directes.", instructionType: "defensive" },
      { id: "lwb", num: 3, label: "PIS.G", name: "T. Hernandez", role: "Piston Défensif", baseX: 14, baseY: 68, attackX: 12, attackY: 40, defX: 16, defY: 80, counterX: 10, counterY: 28, pressingX: 14, pressingY: 54, consigne: "Bloquer le couloir.", instructionType: "balance" },
      { id: "cb1", num: 4, label: "DCG", name: "L. Hernandez", role: "Central Gauche", baseX: 30, baseY: 78, attackX: 28, attackY: 66, defX: 30, defY: 86, counterX: 28, counterY: 72, pressingX: 28, pressingY: 58, consigne: "Marquage strict.", instructionType: "defensive" },
      { id: "cb2", num: 5, label: "DC", name: "W. Saliba", role: "Verrou Central", baseX: 50, baseY: 80, attackX: 50, attackY: 68, defX: 50, defY: 88, counterX: 50, counterY: 74, pressingX: 50, pressingY: 60, consigne: "Dégagement axe.", instructionType: "defensive" },
      { id: "cb3", num: 6, label: "DCD", name: "I. Konaté", role: "Central Droit", baseX: 70, baseY: 78, attackX: 72, attackY: 66, defX: 70, defY: 86, counterX: 72, counterY: 72, pressingX: 72, pressingY: 58, consigne: "Impact physique.", instructionType: "defensive" },
      { id: "rwb", num: 2, label: "PIS.D", name: "J. Koundé", role: "Piston Droit", baseX: 86, baseY: 68, attackX: 88, attackY: 40, defX: 84, defY: 80, counterX: 90, counterY: 28, pressingX: 86, pressingY: 54, consigne: "Rideau défensif.", instructionType: "balance" },
      { id: "cm1", num: 8, label: "MC", name: "A. Tchouaméni", role: "Sentinelle", baseX: 34, baseY: 52, attackX: 32, attackY: 44, defX: 34, defY: 68, counterX: 32, counterY: 50, pressingX: 32, pressingY: 42, consigne: "Protection des centraux.", instructionType: "defensive" },
      { id: "cm2", num: 10, label: "MC", name: "A. Griezmann", role: "Meneur Relayeur", baseX: 50, baseY: 46, attackX: 50, attackY: 34, defX: 50, defY: 62, counterX: 50, counterY: 36, pressingX: 50, pressingY: 36, consigne: "Première relance propre.", instructionType: "offensive" },
      { id: "cm3", num: 7, label: "MC", name: "E. Camavinga", role: "Milieu Gratteur", baseX: 66, baseY: 52, attackX: 68, attackY: 44, defX: 66, defY: 68, counterX: 68, counterY: 50, pressingX: 68, pressingY: 42, consigne: "Harceler le porteur adverse.", instructionType: "defensive" },
      { id: "st1", num: 9, label: "AC", name: "K. Mbappé", role: "Flèche de Contre", baseX: 40, baseY: 22, attackX: 38, attackY: 10, defX: 40, defY: 46, counterX: 36, counterY: 8, pressingX: 38, pressingY: 18, consigne: "Sprint dans le dos.", instructionType: "offensive" },
      { id: "st2", num: 11, label: "AC", name: "B. Barcola", role: "Percussion Contre", baseX: 60, baseY: 22, attackX: 62, attackY: 10, defX: 60, defY: 46, counterX: 64, counterY: 8, pressingX: 62, pressingY: 18, consigne: "1 contre 1 en transition.", instructionType: "offensive" },
    ],
  },
  "3-4-3": {
    name: "3-4-3 Largeur & Pressing Agressif",
    style: "Occupation totale des ailes, surnombre offensif, Gegenpressing immédiat",
    players: [
      { id: "gk", num: 1, label: "GB", name: "L. Chevalier", role: "Gardien", baseX: 50, baseY: 90, attackX: 50, attackY: 84, defX: 50, defY: 94, counterX: 50, counterY: 88, pressingX: 50, pressingY: 82, consigne: "Ligne haute.", instructionType: "defensive" },
      { id: "cb1", num: 3, label: "DCG", name: "L. Hernandez", role: "Central Gauche", baseX: 26, baseY: 76, attackX: 24, attackY: 60, defX: 26, defY: 84, counterX: 24, counterY: 68, pressingX: 24, pressingY: 52, consigne: "Couverture profondeur.", instructionType: "defensive" },
      { id: "cb2", num: 4, label: "DC", name: "W. Saliba", role: "Tour de Contrôle", baseX: 50, baseY: 78, attackX: 50, attackY: 62, defX: 50, defY: 86, counterX: 50, counterY: 70, pressingX: 50, pressingY: 54, consigne: "Interceptions hautes.", instructionType: "defensive" },
      { id: "cb3", num: 5, label: "DCD", name: "I. Konaté", role: "Central Droit", baseX: 74, baseY: 76, attackX: 76, attackY: 60, defX: 74, defY: 84, counterX: 76, counterY: 68, pressingX: 76, pressingY: 52, consigne: "Duels d'autorité.", instructionType: "defensive" },
      { id: "lm", num: 11, label: "MG", name: "T. Hernandez", role: "Milieu Latéral Gauche", baseX: 12, baseY: 50, attackX: 10, attackY: 28, defX: 14, defY: 68, counterX: 8, counterY: 20, pressingX: 12, pressingY: 34, consigne: "Chevauchement et centres.", instructionType: "offensive" },
      { id: "cm1", num: 6, label: "MC", name: "A. Tchouaméni", role: "Sentinelle Pivot", baseX: 38, baseY: 54, attackX: 36, attackY: 44, defX: 38, defY: 66, counterX: 36, counterY: 48, pressingX: 36, pressingY: 38, consigne: "Orientation transversale.", instructionType: "defensive" },
      { id: "cm2", num: 8, label: "MC", name: "E. Camavinga", role: "Moteur Central", baseX: 62, baseY: 54, attackX: 64, attackY: 44, defX: 62, defY: 66, counterX: 64, counterY: 48, pressingX: 64, pressingY: 38, consigne: "Percées balle au pied.", instructionType: "balance" },
      { id: "rm", num: 2, label: "MD", name: "O. Dembélé", role: "Milieu Latéral Droit", baseX: 88, baseY: 50, attackX: 90, attackY: 28, defX: 86, defY: 68, counterX: 92, counterY: 20, pressingX: 88, pressingY: 34, consigne: "Fixer la ligne de touche.", instructionType: "offensive" },
      { id: "lw", num: 7, label: "AG", name: "B. Barcola", role: "Attaquant Intérieur", baseX: 24, baseY: 24, attackX: 22, attackY: 14, defX: 24, defY: 46, counterX: 18, counterY: 10, pressingX: 24, pressingY: 18, consigne: "Coupe intérieure.", instructionType: "offensive" },
      { id: "st", num: 9, label: "BU", name: "K. Mbappé", role: "Finisseur Élite", baseX: 50, baseY: 18, attackX: 50, attackY: 8, defX: 50, defY: 40, counterX: 50, counterY: 6, pressingX: 50, pressingY: 12, consigne: "Tirs cadrés sans contrôle.", instructionType: "offensive" },
      { id: "rw", num: 10, label: "AD", name: "A. Griezmann", role: "Attaquant Créatif", baseX: 76, baseY: 24, attackX: 78, attackY: 14, defX: 76, defY: 46, counterX: 82, counterY: 10, pressingX: 76, pressingY: 18, consigne: "Passe clé dans le dos.", instructionType: "offensive" },
    ],
  },
};

const TACTICAL_PRESETS = [
  {
    id: "tiki-taka",
    name: "Tiki-Taka Domination",
    formation: "4-3-3" as FormationId,
    phase: "attack" as TacticalPhase,
    hauteurBloc: 85,
    largeurJeu: 75,
    pressingIntensity: 80,
    tempo: 90,
    styleRelance: "Courte & Construction",
    description: "Possession haute, dédoublements intérieurs, passes courtes chirurgicales.",
  },
  {
    id: "gegenpressing",
    name: "Gegenpressing Éclair",
    formation: "4-2-3-1" as FormationId,
    phase: "pressing" as TacticalPhase,
    hauteurBloc: 92,
    largeurJeu: 60,
    pressingIntensity: 95,
    tempo: 94,
    styleRelance: "Verticalité Immédiate",
    description: "Récupération en moins de 4 secondes, harcèlement total du porteur.",
  },
  {
    id: "bloc-bas",
    name: "Bloc Bas & Contre Foudroyant",
    formation: "5-3-2" as FormationId,
    phase: "counter" as TacticalPhase,
    hauteurBloc: 30,
    largeurJeu: 40,
    pressingIntensity: 50,
    tempo: 88,
    styleRelance: "Transversales & Flèches",
    description: "Verrou hermétique à 5, aspiration de l'adversaire et sprint dans l'espace.",
  },
  {
    id: "pistons-attaque",
    name: "Pistons & Surnombre Axial",
    formation: "3-5-2" as FormationId,
    phase: "attack" as TacticalPhase,
    hauteurBloc: 78,
    largeurJeu: 90,
    pressingIntensity: 75,
    tempo: 85,
    styleRelance: "Changements d'Aile",
    description: "Pistons qui étirent la défense, 2 attaquants qui combinent dans la surface.",
  },
];

type Props = {
  headline?: string;
  subtitle?: string;
  interactive?: boolean;
};

export function TacticalChalkboard({
  headline = "Tableau Noir Tactique & Démonstrateur Interactif",
  subtitle = "Animez vos schémas de jeu en direct dans le navigateur : basculez les formations, activez les phases de jeu (Attaque, Bloc Bas, Contre, Pressing) et ajustez les consignes de chaque joueur.",
}: Props) {
  const [formationId, setFormationId] = useState<FormationId>("4-3-3");
  const [phase, setPhase] = useState<TacticalPhase>("attack");
  const [isPlaying, setIsPlaying] = useState(true);
  const [activePlayerId, setActivePlayerId] = useState<string>("st");
  
  // Tactical sliders
  const [hauteurBloc, setHauteurBloc] = useState(75);
  const [largeurJeu, setLargeurJeu] = useState(70);
  const [pressingIntensity, setPressingIntensity] = useState(80);
  const [tempo, setTempo] = useState(85);

  const currentFormation = FORMATIONS[formationId] || FORMATIONS["4-3-3"];
  const players = currentFormation.players;
  const activePlayer = players.find((p) => p.id === activePlayerId) || players[0]!;

  // Auto animation loop between phases if playing
  useEffect(() => {
    if (!isPlaying) return;
    const phases: TacticalPhase[] = ["attack", "counter", "pressing", "defense"];
    const interval = window.setInterval(() => {
      setPhase((prev) => {
        const nextIdx = (phases.indexOf(prev) + 1) % phases.length;
        return phases[nextIdx] ?? "attack";
      });
    }, 4500);
    return () => window.clearInterval(interval);
  }, [isPlaying]);

  const applyPreset = (preset: (typeof TACTICAL_PRESETS)[number]) => {
    setFormationId(preset.formation);
    setPhase(preset.phase);
    setHauteurBloc(preset.hauteurBloc);
    setLargeurJeu(preset.largeurJeu);
    setPressingIntensity(preset.pressingIntensity);
    setTempo(preset.tempo);
  };

  return (
    <section className="relative overflow-hidden border-t border-white/10 bg-[#030806] px-4 py-16 sm:px-6 sm:py-24">
      {/* Background emerald tactical glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 30% 10%, rgba(34, 197, 94, 0.16), transparent 65%), radial-gradient(ellipse 50% 40% at 85% 85%, rgba(22, 101, 52, 0.22), transparent 60%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col gap-3 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-[#22C55E] animate-pulse" />
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#22C55E]">
              Tableau Noir Tactique IA
            </p>
          </div>
          <h2 className="font-display text-[clamp(1.75rem,3.8vw,2.8rem)] font-medium tracking-[-0.03em] text-white">
            {headline}
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-white/60">
            {subtitle}
          </p>
        </div>

        {/* Quick Presets Bar */}
        <div className="mt-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40 mb-3">
            Plans de Jeu & Presets Tactiques :
          </p>
          <div className="flex gap-2.5 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {TACTICAL_PRESETS.map((pst) => (
              <button
                key={pst.id}
                type="button"
                onClick={() => applyPreset(pst)}
                className="group shrink-0 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-white/80 transition hover:border-[#22C55E] hover:bg-[#22C55E]/10 hover:text-white"
              >
                <span className="rounded bg-white/10 px-2 py-0.5 font-mono text-[10px] text-[#22C55E] group-hover:bg-[#22C55E] group-hover:text-black transition">
                  {pst.formation}
                </span>
                <span>{pst.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tactical Stage : Chalkboard Pitch on Left/Center, Controls on Right */}
        <div className="mt-10 grid gap-8 lg:grid-cols-[1.3fr_0.9fr] items-start">
          
          {/* THE CHALKBOARD PITCH */}
          <div className="relative rounded-2xl border border-white/15 bg-[#0a2313] p-4 sm:p-6 shadow-2xl overflow-hidden">
            
            {/* Pitch header bar */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div>
                <span className="font-mono text-[11px] font-black uppercase tracking-wider text-[#22C55E]">
                  {currentFormation.name}
                </span>
                <p className="text-[10px] text-white/50">{currentFormation.style}</p>
              </div>

              {/* Phase Switcher */}
              <div className="flex items-center gap-1.5 rounded-lg bg-black/40 p-1 border border-white/10">
                {(["attack", "defense", "counter", "pressing"] as TacticalPhase[]).map((ph) => {
                  const on = phase === ph;
                  const labelMap: Record<TacticalPhase, string> = {
                    idle: "Neutre",
                    attack: "Attaque",
                    defense: "Bloc Bas",
                    counter: "Contre",
                    pressing: "Pressing",
                  };
                  return (
                    <button
                      key={ph}
                      type="button"
                      onClick={() => {
                        setPhase(ph);
                        setIsPlaying(false);
                      }}
                      className={`rounded-md px-2.5 py-1 text-[10px] font-black uppercase tracking-wider transition ${
                        on
                          ? "bg-[#22C55E] text-black shadow"
                          : "text-white/60 hover:text-white"
                      }`}
                    >
                      {labelMap[ph]}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  title={isPlaying ? "Mettre en pause l'animation" : "Lancer l'animation continue"}
                  className="ml-1 flex h-6 w-6 items-center justify-center rounded-md border border-white/20 text-white/80 hover:text-[#22C55E] transition"
                >
                  {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                </button>
              </div>
            </div>

            {/* SVG Interactive Pitch Canvas */}
            <div
              className="relative w-full aspect-[4/5] sm:aspect-[1/1] max-h-[580px] rounded-xl overflow-hidden border border-white/20 select-none"
              style={{
                background:
                  "radial-gradient(circle at 50% 50%, #155728 0%, #0d3819 60%, #082410 100%)",
                boxShadow: "inset 0 0 40px rgba(0,0,0,0.6)",
              }}
            >
              {/* Chalkboard Texture / Grass stripes */}
              <div
                className="pointer-events-none absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(0deg, transparent 0px, transparent 40px, rgba(255,255,255,0.06) 40px, rgba(255,255,255,0.06) 80px)",
                }}
              />

              {/* Pitch Chalk Lines */}
              <div className="pointer-events-none absolute inset-[5%] border-2 border-white/30 rounded-sm" />
              {/* Half-way line */}
              <div className="pointer-events-none absolute inset-x-[5%] top-1/2 h-0.5 bg-white/30" />
              {/* Center Circle */}
              <div className="pointer-events-none absolute left-1/2 top-1/2 h-[22%] w-[22%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/30" />
              <div className="pointer-events-none absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/40" />

              {/* Top Penalty Box (Adverse) */}
              <div className="pointer-events-none absolute left-1/2 top-[5%] h-[16%] w-[42%] -translate-x-1/2 border-2 border-t-0 border-white/30" />
              <div className="pointer-events-none absolute left-1/2 top-[5%] h-[7%] w-[20%] -translate-x-1/2 border-2 border-t-0 border-white/30" />
              {/* Top Goal */}
              <div className="pointer-events-none absolute left-1/2 top-[2%] h-[3%] w-[14%] -translate-x-1/2 border border-white/40 bg-white/10" />

              {/* Bottom Penalty Box (Notre camp) */}
              <div className="pointer-events-none absolute left-1/2 bottom-[5%] h-[16%] w-[42%] -translate-x-1/2 border-2 border-b-0 border-white/30" />
              <div className="pointer-events-none absolute left-1/2 bottom-[5%] h-[7%] w-[20%] -translate-x-1/2 border-2 border-b-0 border-white/30" />
              {/* Bottom Goal */}
              <div className="pointer-events-none absolute left-1/2 bottom-[2%] h-[3%] w-[14%] -translate-x-1/2 border border-white/40 bg-white/10" />

              {/* Tactical Vectors / Chalk Arrows in Phase Mode */}
              <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
                <defs>
                  <marker
                    id="chalk-arrow"
                    viewBox="0 0 10 10"
                    refX="5"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(34,197,94,0.7)" />
                  </marker>
                </defs>

                {phase === "attack" && (
                  <>
                    {/* Animated attack passing lines */}
                    <path
                      d="M 50% 56% Q 30% 40% 20% 18%"
                      fill="none"
                      stroke="rgba(34,197,94,0.6)"
                      strokeWidth="2.5"
                      strokeDasharray="6,4"
                      markerEnd="url(#chalk-arrow)"
                    />
                    <path
                      d="M 20% 18% Q 35% 14% 50% 10%"
                      fill="none"
                      stroke="rgba(245,208,74,0.7)"
                      strokeWidth="2.5"
                      strokeDasharray="6,4"
                      markerEnd="url(#chalk-arrow)"
                    />
                    <path
                      d="M 68% 44% Q 78% 30% 80% 16%"
                      fill="none"
                      stroke="rgba(34,197,94,0.6)"
                      strokeWidth="2.5"
                      strokeDasharray="6,4"
                      markerEnd="url(#chalk-arrow)"
                    />
                  </>
                )}

                {phase === "counter" && (
                  <>
                    <path
                      d="M 50% 68% L 50% 12%"
                      fill="none"
                      stroke="rgba(239,68,68,0.7)"
                      strokeWidth="3"
                      strokeDasharray="8,4"
                      markerEnd="url(#chalk-arrow)"
                    />
                    <path
                      d="M 20% 80% L 10% 34%"
                      fill="none"
                      stroke="rgba(239,68,68,0.5)"
                      strokeWidth="2"
                      strokeDasharray="6,4"
                      markerEnd="url(#chalk-arrow)"
                    />
                  </>
                )}

                {phase === "pressing" && (
                  <>
                    <circle cx="50%" cy="14%" r="38" fill="rgba(239,68,68,0.12)" stroke="rgba(239,68,68,0.4)" strokeDasharray="4,4" />
                    <circle cx="22%" cy="20%" r="30" fill="rgba(239,68,68,0.1)" stroke="rgba(239,68,68,0.3)" strokeDasharray="4,4" />
                    <circle cx="78%" cy="20%" r="30" fill="rgba(239,68,68,0.1)" stroke="rgba(239,68,68,0.3)" strokeDasharray="4,4" />
                  </>
                )}
              </svg>

              {/* Player Tokens on Pitch */}
              {players.map((p) => {
                let targetX = p.baseX;
                let targetY = p.baseY;

                if (phase === "attack") {
                  targetX = p.attackX;
                  targetY = p.attackY;
                } else if (phase === "defense") {
                  targetX = p.defX;
                  targetY = p.defY;
                } else if (phase === "counter") {
                  targetX = p.counterX;
                  targetY = p.counterY;
                } else if (phase === "pressing") {
                  targetX = p.pressingX;
                  targetY = p.pressingY;
                }

                // Adjust slightly with sliders
                if (phase === "attack" && p.id !== "gk") {
                  targetY = targetY * (hauteurBloc / 80);
                }

                const isSelected = activePlayerId === p.id;

                return (
                  <motion.button
                    key={p.id}
                    type="button"
                    onClick={() => setActivePlayerId(p.id)}
                    className="absolute z-20 -translate-x-1/2 -translate-y-1/2 focus:outline-none"
                    animate={{
                      left: `${targetX}%`,
                      top: `${targetY}%`,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 120,
                      damping: 18,
                    }}
                    aria-label={`${p.label} - ${p.name}`}
                  >
                    <div
                      className={`relative flex flex-col items-center group`}
                    >
                      {/* Halo on select */}
                      {isSelected && (
                        <div className="absolute -inset-2 rounded-full bg-[#22C55E]/30 animate-ping" />
                      )}

                      {/* Token Bubble */}
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-black shadow-lg transition-transform ${
                          isSelected
                            ? "border-white bg-[#22C55E] text-black scale-110 ring-4 ring-[#22C55E]/40"
                            : p.instructionType === "offensive"
                            ? "border-emerald-300 bg-[#0e3a1d] text-white hover:scale-105"
                            : p.instructionType === "defensive"
                            ? "border-blue-300 bg-[#0d2838] text-white hover:scale-105"
                            : "border-amber-300 bg-[#2d280e] text-white hover:scale-105"
                        }`}
                      >
                        {p.label}
                      </div>

                      {/* Name Label */}
                      <span className="mt-1 max-w-[70px] truncate rounded bg-black/75 px-1 py-0.5 text-[8px] font-bold text-white shadow-sm">
                        {p.name.split(" ").pop()}
                      </span>
                    </div>
                  </motion.button>
                );
              })}

              {/* Animated Match Ball in Phase Mode */}
              <motion.div
                className="absolute z-30 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-black bg-white shadow-md flex items-center justify-center pointer-events-none"
                animate={{
                  left:
                    phase === "attack"
                      ? ["50%", "20%", "50%"]
                      : phase === "counter"
                      ? ["50%", "50%", "50%"]
                      : phase === "pressing"
                      ? ["50%", "36%", "50%"]
                      : ["50%", "38%", "50%"],
                  top:
                    phase === "attack"
                      ? ["56%", "18%", "10%"]
                      : phase === "counter"
                      ? ["68%", "35%", "8%"]
                      : phase === "pressing"
                      ? ["14%", "20%", "14%"]
                      : ["80%", "72%", "80%"],
                }}
                transition={{
                  duration: 4.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <div className="h-1.5 w-1.5 rounded-full bg-black" />
              </motion.div>
            </div>

            {/* Pitch legend footer */}
            <div className="mt-4 flex flex-wrap items-center justify-between text-[10px] text-white/50">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#0e3a1d] border border-emerald-400" />
                  Offensif
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#0d2838] border border-blue-400" />
                  Défensif
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#2d280e] border border-amber-400" />
                  Équilibre
                </span>
              </div>
              <span>Cliquez sur un joueur pour éditer sa consigne</span>
            </div>

          </div>

          {/* RIGHT SIDEBAR : FORMATION SELECTOR + SLIDERS + PLAYER INSTRUCTION CARD */}
          <div className="space-y-6">
            
            {/* Formations Grid */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-md">
              <label className="block font-mono text-[10px] uppercase tracking-[0.2em] text-[#22C55E] mb-2.5">
                Système & Formation
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(FORMATIONS) as FormationId[]).map((fId) => {
                  const on = formationId === fId;
                  return (
                    <button
                      key={fId}
                      type="button"
                      onClick={() => setFormationId(fId)}
                      className={`rounded-xl border p-2.5 text-center font-display text-sm font-bold transition ${
                        on
                          ? "border-[#22C55E] bg-[#22C55E]/15 text-white shadow-lg shadow-[#22C55E]/20"
                          : "border-white/10 bg-white/[0.02] text-white/60 hover:text-white hover:border-white/25"
                      }`}
                    >
                      {fId}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Player Consigne Card */}
            <div className="rounded-2xl border border-[#22C55E]/30 bg-gradient-to-br from-[#22C55E]/10 to-transparent p-5 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#22C55E] font-black text-black text-sm">
                    {activePlayer.label}
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold text-white">
                      {activePlayer.name} ({activePlayer.num})
                    </h3>
                    <p className="text-[11px] text-[#22C55E] font-semibold">
                      {activePlayer.role}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-white/70">
                  Consigne Active
                </span>
              </div>

              <div className="mt-4 rounded-xl border border-white/10 bg-black/40 p-3.5">
                <p className="text-xs leading-relaxed text-white/90">
                  &ldquo;{activePlayer.consigne}&rdquo;
                </p>
              </div>

              <div className="mt-3 flex items-center justify-between text-[10px] text-white/50">
                <span>Phase active : <strong className="text-white uppercase">{phase}</strong></span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 size={11} /> Synchronisé avec l&apos;IA Coach
                </span>
              </div>
            </div>

            {/* Tactical Sliders Panel */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/60">
                  Consignes Collectives & Intensité
                </span>
                <Sliders size={13} className="text-[#22C55E]" />
              </div>

              {/* Slider 1: Hauteur du bloc */}
              <div>
                <div className="flex justify-between text-xs font-bold text-white mb-1">
                  <span>Hauteur de la ligne défensive</span>
                  <span className="text-[#22C55E] tabular-nums">{hauteurBloc}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="95"
                  value={hauteurBloc}
                  onChange={(e) => setHauteurBloc(Number(e.target.value))}
                  className="w-full h-1.5 bg-white/15 rounded-lg cursor-pointer accent-[#22C55E]"
                />
                <div className="flex justify-between text-[8px] font-mono text-white/35 mt-0.5">
                  <span>Bloc Bas</span>
                  <span>Bloc Médian</span>
                  <span>Ligne Très Haute</span>
                </div>
              </div>

              {/* Slider 2: Largeur du jeu */}
              <div>
                <div className="flex justify-between text-xs font-bold text-white mb-1">
                  <span>Largeur offensive & Écartement</span>
                  <span className="text-[#22C55E] tabular-nums">{largeurJeu}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="95"
                  value={largeurJeu}
                  onChange={(e) => setLargeurJeu(Number(e.target.value))}
                  className="w-full h-1.5 bg-white/15 rounded-lg cursor-pointer accent-[#22C55E]"
                />
                <div className="flex justify-between text-[8px] font-mono text-white/35 mt-0.5">
                  <span>Axe Resserré</span>
                  <span>Équilibré</span>
                  <span>Couloirs Max</span>
                </div>
              </div>

              {/* Slider 3: Intensité Pressing */}
              <div>
                <div className="flex justify-between text-xs font-bold text-white mb-1">
                  <span>Intensité du Gegenpressing</span>
                  <span className="text-[#22C55E] tabular-nums">{pressingIntensity}%</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="99"
                  value={pressingIntensity}
                  onChange={(e) => setPressingIntensity(Number(e.target.value))}
                  className="w-full h-1.5 bg-white/15 rounded-lg cursor-pointer accent-[#22C55E]"
                />
                <div className="flex justify-between text-[8px] font-mono text-white/35 mt-0.5">
                  <span>Cadrage patient</span>
                  <span>Harcèlement à la perte</span>
                  <span>Tout Terrain</span>
                </div>
              </div>

              {/* Slider 4: Tempo */}
              <div>
                <div className="flex justify-between text-xs font-bold text-white mb-1">
                  <span>Rythme & Vitesse de transmission</span>
                  <span className="text-[#22C55E] tabular-nums">{tempo}%</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="99"
                  value={tempo}
                  onChange={(e) => setTempo(Number(e.target.value))}
                  className="w-full h-1.5 bg-white/15 rounded-lg cursor-pointer accent-[#22C55E]"
                />
                <div className="flex justify-between text-[8px] font-mono text-white/35 mt-0.5">
                  <span>Temporisation</span>
                  <span>Jeu fluide</span>
                  <span>Transitions Éclair</span>
                </div>
              </div>

            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
