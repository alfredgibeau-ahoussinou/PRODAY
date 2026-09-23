import React from 'react';
import Svg, { Circle, Path, Rect, Polygon, G } from 'react-native-svg';
import { colors } from '../../theme/designTokens';

const GOLD = '#FAFAFA';

/** Filigrane tactique tableau noir (lignes de terrain, flèches, croix). */
export function ChalkboardPitchWatermark({ width = 180, height = 150 }: { width?: number; height?: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 200 160" fill="none">
      {/* Lignes terrain */}
      <Path
        d="M 10 10 L 190 10 L 190 150 L 10 150 Z"
        stroke="rgba(255,255,255,0.07)"
        strokeWidth={1.2}
      />
      <Path
        d="M 10 80 L 190 80"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={1.2}
      />
      <Circle
        cx={100}
        cy={80}
        r={32}
        stroke="rgba(255,255,255,0.07)"
        strokeWidth={1.2}
      />
      <Circle
        cx={100}
        cy={80}
        r={2.5}
        fill="rgba(255,255,255,0.12)"
      />
      {/* Surface réparation */}
      <Path
        d="M 45 10 L 45 45 L 155 45 L 155 10"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={1.2}
      />
      {/* Flèche tactique courbe */}
      <Path
        d="M 130 115 C 145 90, 160 85, 175 60"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth={1.5}
        strokeDasharray="4 3"
        strokeLinecap="round"
      />
      <Polygon
        points="175,55 180,63 170,62"
        fill="rgba(255,255,255,0.14)"
      />
      {/* Croix tactiques */}
      <G stroke="rgba(255,255,255,0.12)" strokeWidth={1.5} strokeLinecap="round">
        <Path d="M 35 48 L 45 58 M 45 48 L 35 58" />
        <Path d="M 140 30 L 150 40 M 150 30 L 140 40" />
        <Path d="M 155 130 L 165 140 M 165 130 L 155 140" />
      </G>
    </Svg>
  );
}

/** Filigrane blason royal ProDay avec couronne, bouclier et ballon. */
export function CrestWatermark({
  width = 90,
  height = 105,
  color = GOLD,
  opacity = 0.25,
}: {
  width?: number;
  height?: number;
  color?: string;
  opacity?: number;
}) {
  return (
    <Svg width={width} height={height} viewBox="0 0 100 120" fill="none" opacity={opacity}>
      {/* Couronne Royale Supérieure */}
      <Path
        d="M 28 26 L 22 9 L 36 18 L 50 4 L 64 18 L 78 9 L 72 26 Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
        fill="none"
      />
      {/* Gemmes de la couronne */}
      <Circle cx={50} cy={10} r={1.5} fill={color} />
      <Circle cx={25} cy={13} r={1.2} fill={color} />
      <Circle cx={75} cy={13} r={1.2} fill={color} />

      {/* Grand Bouclier / Écu */}
      <Path
        d="M 18 28 L 82 28 C 82 64, 72 94, 50 114 C 28 94, 18 64, 18 28 Z"
        stroke={color}
        strokeWidth={2.2}
        strokeLinejoin="round"
        fill="none"
      />
      {/* Bordure intérieure du bouclier */}
      <Path
        d="M 23 33 L 77 33 C 77 62, 68 88, 50 106 C 32 88, 23 62, 23 33 Z"
        stroke={color}
        strokeWidth={1.2}
        strokeLinejoin="round"
        opacity={0.7}
        fill="none"
      />

      {/* Rayures héraldiques diagonales (côté gauche) */}
      <Path
        d="M 25 44 L 46 65 M 25 58 L 52 85 M 27 74 L 44 91"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.65}
      />

      {/* Étoile de championnat (côté droit supérieur) */}
      <Polygon
        points="70,42 72,47 77,47 73,50 75,55 70,52 65,55 67,50 63,47 68,47"
        fill={color}
        opacity={0.75}
      />

      {/* Ballon de football officiel au cœur du bouclier */}
      <Circle
        cx={50}
        cy={70}
        r={16}
        stroke={color}
        strokeWidth={1.8}
      />
      {/* Panneaux pentagones du ballon */}
      <Polygon
        points="50,64 54,67 52,72 48,72 46,67"
        stroke={color}
        strokeWidth={1.2}
        fill={color}
        opacity={0.4}
      />
      <Path
        d="M 50 64 L 50 54 M 54 67 L 64 64 M 52 72 L 60 81 M 48 72 L 40 81 M 46 67 L 36 64"
        stroke={color}
        strokeWidth={1.2}
      />

      {/* Lignes de vitesse / ailes */}
      <Path
        d="M 68 64 C 74 65, 78 69, 80 75 M 68 76 C 73 78, 76 82, 77 87"
        stroke={color}
        strokeWidth={1.4}
        strokeLinecap="round"
        opacity={0.5}
      />
    </Svg>
  );
}

/** Icône batterie avec jauge dynamique et éclair (Énergie). */
export function EnergyBatteryIcon({
  size = 32,
  color = GOLD,
  activeCrans = 3,
}: {
  size?: number;
  color?: string;
  activeCrans?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      {/* Borne */}
      <Rect x={11} y={2} width={6} height={2.5} rx={1} fill={color} />
      {/* Corps batterie */}
      <Rect
        x={6}
        y={4.5}
        width={16}
        height={21}
        rx={3}
        stroke={color}
        strokeWidth={1.8}
        fill="rgba(255,255,255,0.04)"
      />
      {/* 3 Niveaux de jauge intérieure */}
      {/* Cran 1 (bas) */}
      <Rect
        x={8.5}
        y={19}
        width={11}
        height={4.2}
        rx={1.5}
        fill={activeCrans >= 1 ? color : 'rgba(255,255,255,0.12)'}
        opacity={activeCrans >= 1 ? 0.9 : 0.4}
      />
      {/* Cran 2 (milieu) */}
      <Rect
        x={8.5}
        y={13.2}
        width={11}
        height={4.2}
        rx={1.5}
        fill={activeCrans >= 2 ? color : 'rgba(255,255,255,0.12)'}
        opacity={activeCrans >= 2 ? 0.9 : 0.4}
      />
      {/* Cran 3 (haut) */}
      <Rect
        x={8.5}
        y={7.4}
        width={11}
        height={4.2}
        rx={1.5}
        fill={activeCrans >= 3 ? color : 'rgba(255,255,255,0.12)'}
        opacity={activeCrans >= 3 ? 0.9 : 0.4}
      />
      {/* Éclair central dynamique */}
      <Path
        d="M 15 7.5 L 11.5 14 L 14 14 L 13 20 L 17 12.8 L 14.5 12.8 Z"
        fill={activeCrans >= 2 ? '#FFFFFF' : color}
        opacity={activeCrans >= 2 ? 0.95 : 0.7}
      />
    </Svg>
  );
}

/** Icône croissant de lune avec z z dynamiques (Sommeil). */
export function SleepMoonIcon({
  size = 32,
  color = GOLD,
  activeCrans = 3,
}: {
  size?: number;
  color?: string;
  activeCrans?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      {/* Croissant de lune avec ombrage */}
      <Path
        d="M 17.5 5 C 10.5 6 7 12 8 18 C 9 22 13 25 18 24 C 11.5 22.5 10 15 15.5 8.5 C 16.2 7.5 17 6.5 17.5 5 Z"
        stroke={color}
        strokeWidth={1.8}
        fill={activeCrans >= 3 ? `${color}25` : 'rgba(255,255,255,0.06)'}
        strokeLinejoin="round"
      />
      {/* Lignes de texture lune */}
      <Path
        d="M 11 13 C 12 15, 12 17, 13 19"
        stroke={color}
        strokeWidth={1}
        strokeLinecap="round"
        opacity={activeCrans >= 2 ? 0.8 : 0.3}
      />
      {/* Z Z Z selon activeCrans */}
      {/* Z 1 */}
      {activeCrans >= 3 && (
        <Path
          d="M 19 3 L 23 3 L 19 7 L 23 7"
          stroke={color}
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {/* Z 2 */}
      {activeCrans >= 2 && (
        <Path
          d="M 22 8 L 25.5 8 L 22 11.5 L 25.5 11.5"
          stroke={color}
          strokeWidth={1.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {/* Z 3 */}
      {activeCrans >= 1 && (
        <Path
          d="M 24 13 L 26.5 13 L 24 15.5 L 26.5 15.5"
          stroke={color}
          strokeWidth={1.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.8}
        />
      )}
    </Svg>
  );
}

/** Icône muscle bicep avec fibres musculaires dynamiques (Muscles). */
export function MuscleFiberIcon({
  size = 32,
  color = GOLD,
  activeCrans = 1,
}: {
  size?: number;
  color?: string;
  activeCrans?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Path
        d="M 7 21 C 5 15, 8 7, 16 5 C 22 7, 24 14, 21 21 C 18 24, 10 24, 7 21 Z"
        stroke={color}
        strokeWidth={activeCrans >= 2 ? 2.2 : 1.8}
        fill={activeCrans === 1 ? `${color}22` : 'rgba(255,255,255,0.06)'}
        strokeLinejoin="round"
      />
      {/* Fibres intérieures selon tension */}
      <Path
        d="M 11 19 C 10 14, 12 9, 16 7"
        stroke={color}
        strokeWidth={1.4}
        strokeLinecap="round"
        opacity={activeCrans >= 1 ? 0.9 : 0.4}
      />
      <Path
        d="M 14 21 C 14 16, 16 11, 19 9"
        stroke={color}
        strokeWidth={1.4}
        strokeLinecap="round"
        opacity={activeCrans >= 2 ? 0.95 : 0.4}
      />
      <Path
        d="M 17 21 C 18 18, 19 14, 21 13"
        stroke={color}
        strokeWidth={1.2}
        strokeLinecap="round"
        opacity={activeCrans >= 3 ? 1 : 0.3}
      />
    </Svg>
  );
}


/** Icône bouteille d'eau & feuille (Hydratation & Nutrition). */
export function HydrationNutritionIcon({ size = 42, color = GOLD }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      {/* Bouchon */}
      <Rect x={11} y={4} width={8} height={3} rx={1} fill={color} />
      {/* Bouteille */}
      <Path
        d="M 12 7 L 12 10 C 9 12, 9 15, 9 18 L 9 29 C 9 31, 10 32, 12 32 L 18 32 C 20 32, 21 31, 21 29 L 21 18 C 21 15, 21 12, 18 10 L 18 7 Z"
        stroke={color}
        strokeWidth={1.8}
        fill="rgba(255,255,255,0.06)"
      />
      {/* Lignes de grip bouteille */}
      <Path d="M 11 16 L 19 16 M 11 20 L 19 20" stroke={color} strokeWidth={1} opacity={0.7} />
      {/* Goutte / Feuille à côté */}
      <Path
        d="M 23 20 C 23 16, 27 15, 29 14 C 29 17, 28 22, 25 23 C 23.5 23.5, 23 22, 23 20 Z"
        stroke={color}
        strokeWidth={1.5}
        fill="rgba(255,255,255,0.12)"
      />
      <Path d="M 24 21 C 26 19, 27 17, 28 15" stroke={color} strokeWidth={1} />
    </Svg>
  );
}

/** Icône silhouette mobilité / stretching. */
export function MobilityStretchIcon({ size = 42, color = GOLD }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      {/* Tête */}
      <Circle cx={18} cy={9} r={3.5} stroke={color} strokeWidth={1.8} fill="rgba(255,255,255,0.12)" />
      {/* Corps & jambes en étirement */}
      <Path
        d="M 18 13 C 15 15, 14 19, 15 23 L 13 31"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Path
        d="M 15 23 L 23 31"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      {/* Bras étirés en arc */}
      <Path
        d="M 17 14 C 20 12, 21 8, 20 6"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      {/* Ligne de sol */}
      <Path
        d="M 9 31 L 27 31"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        opacity={0.6}
      />
    </Svg>
  );
}

/** Icône cerveau avec badge play (Visualisation). */
export function VisualizationBrainIcon({ size = 42, color = GOLD }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      {/* Cerveau avec hémisphères */}
      <Path
        d="M 18 10 C 15 7, 10 8, 8 13 C 6 17, 7 23, 10 25 C 12 26, 14 25, 16 23"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        fill="rgba(255,255,255,0.06)"
      />
      <Path
        d="M 18 10 C 21 7, 26 8, 28 13 C 30 17, 29 23, 26 25 C 24 26, 22 25, 20 23"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        fill="rgba(255,255,255,0.06)"
      />
      {/* Sillons */}
      <Path
        d="M 13 14 C 11 16, 13 18, 14 20 M 23 14 C 25 16, 23 18, 22 20"
        stroke={color}
        strokeWidth={1.2}
        strokeLinecap="round"
      />
      {/* Badge vidéo / play en bas à droite */}
      <Rect
        x={18}
        y={19}
        width={13}
        height={10}
        rx={2.5}
        stroke={color}
        strokeWidth={1.6}
        fill="#1C1E2A"
      />
      <Polygon
        points="23,21.5 23,26.5 27,24"
        fill={color}
      />
    </Svg>
  );
}

/** Illustration terrain en perspective et ballon de match lumineux (Hero match empty state). */
export function TacticalPitchBallHero({
  width = 280,
  height = 100,
  color = '#FAFAFA',
}: {
  width?: number;
  height?: number;
  color?: string;
}) {
  return (
    <Svg width={width} height={height} viewBox="0 0 280 100" fill="none">
      {/* Ligne médiane horizon */}
      <Path
        d="M 25 54 L 255 54"
        stroke={color}
        strokeWidth={1.2}
        opacity={0.35}
      />

      {/* Rond central en perspective */}
      <Path
        d="M 90 54 C 90 40, 190 40, 190 54 C 190 68, 90 68, 90 54 Z"
        stroke={color}
        strokeWidth={1.5}
        opacity={0.7}
        fill="none"
      />

      {/* But gauche en perspective */}
      <Path
        d="M 72 54 L 74 44 L 98 44 L 96 54"
        stroke={color}
        strokeWidth={1.2}
        opacity={0.4}
        fill="none"
      />

      {/* But droit en perspective */}
      <Path
        d="M 184 54 L 182 44 L 206 44 L 208 54"
        stroke={color}
        strokeWidth={1.2}
        opacity={0.4}
        fill="none"
      />

      {/* Ballon officiel au centre */}
      <G transform="translate(140, 50)">
        {/* Ombre / Fond ballon */}
        <Circle cx={0} cy={0} r={17} fill={colors.surface} stroke={color} strokeWidth={1.8} />

        {/* Pentagone central */}
        <Polygon
          points="0,-6 6,-2 4,5 -4,5 -6,-2"
          stroke={color}
          strokeWidth={1.2}
          fill="rgba(255,255,255,0.06)"
        />

        {/* Coutures rayonnantes */}
        <Path d="M 0 -6 L 0 -17" stroke={color} strokeWidth={1.2} />
        <Path d="M 6 -2 L 15 -7" stroke={color} strokeWidth={1.2} />
        <Path d="M 4 5 L 12 12" stroke={color} strokeWidth={1.2} />
        <Path d="M -4 5 L -12 12" stroke={color} strokeWidth={1.2} />
        <Path d="M -6 -2 L -15 -7" stroke={color} strokeWidth={1.2} />
      </G>
    </Svg>
  );
}

