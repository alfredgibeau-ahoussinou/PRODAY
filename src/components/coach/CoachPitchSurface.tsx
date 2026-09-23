import React from 'react';
import {
  Circle,
  Defs,
  G,
  LinearGradient,
  Line,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';
import { COACH_PITCH } from '../../features/coach/theme/coachPitchTokens';

/**
 * Géométrie du terrain Coach — **une seule définition pour tout le pôle**.
 *
 * Sans ce module, la composition guidée et le tableau tactique dessinaient
 * chacun leur pelouse : deux jeux de proportions, deux épaisseurs de trait,
 * deux décors. Ici, les proportions sont exprimées en **fractions** de la
 * surface de dessin, donc le même tracé sert un `viewBox` normalisé
 * (`0 0 100 135`, tableau tactique) comme un repère en points (terrain de
 * composition) sans divergence possible.
 *
 * Aucun décor de stade : ni tribune, ni projecteur, ni damier à fort
 * contraste. Le tracé doit rester un fond lisible pour les noms de joueurs.
 */
export const COACH_PITCH_GEOMETRY = {
  /** Marge du tracé par rapport au bord du module (jamais collé au bord). */
  insetX: 0.047,
  insetY: 0.037,
  /** Surface de réparation : rectangle et porte. */
  penaltyBox: { x: 0.26, width: 0.48, height: 0.15 },
  goalBox: { x: 0.38, width: 0.24, height: 0.06 },
  /** Rond central : rayon et point d'engagement. */
  centerCircle: 0.105,
  centerSpot: 0.008,
  /** Bandes de ton : une bande remplie sur deux, contraste volontairement infime. */
  stripes: 10,
  /** Demi-cercle des 6 m (futsal) — rayon exprimé en largeur. */
  futsalArcRadius: 0.2,
} as const;

/** Bornes du tracé, dans l'unité de la surface de dessin. */
export function coachPitchInsets(width: number, height: number): { x: number; y: number } {
  return {
    x: width * COACH_PITCH_GEOMETRY.insetX,
    y: height * COACH_PITCH_GEOMETRY.insetY,
  };
}

export type CoachPitchSurfaceProps = {
  /** Largeur de l'espace de dessin (unités du `viewBox` ou points). */
  width: number;
  height: number;
  /** Terrain de salle (futsal) plutôt que pelouse. */
  isFutsal?: boolean;
  /** Épaisseur du trait, dans l'unité de la surface de dessin. */
  strokeWidth?: number;
  /** Identifiant du dégradé de pelouse — unique par racine SVG. */
  gradientId?: string;
};

/**
 * Pelouse (ou parquet futsal) + tracé réglementaire, sans aucune commande :
 * les contrôles de chaque écran restent **hors pelouse**.
 */
export function CoachPitchSurface({
  width,
  height,
  isFutsal = false,
  strokeWidth = 1.25,
  gradientId = 'coachPitchTurf',
}: CoachPitchSurfaceProps) {
  const inset = coachPitchInsets(width, height);
  const box = COACH_PITCH_GEOMETRY.penaltyBox;
  const goal = COACH_PITCH_GEOMETRY.goalBox;
  const stripeHeight = height / COACH_PITCH_GEOMETRY.stripes;
  const arcRadius = width * COACH_PITCH_GEOMETRY.futsalArcRadius;

  return (
    <>
      <Defs>
        <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={isFutsal ? COACH_PITCH.turf[2] : COACH_PITCH.turf[0]} />
          <Stop offset="52%" stopColor={COACH_PITCH.turf[1]} />
          <Stop offset="100%" stopColor={COACH_PITCH.turf[2]} />
        </LinearGradient>
      </Defs>

      <Rect x="0" y="0" width={width} height={height} fill={`url(#${gradientId})`} />

      {/* Tontes : une bande sur deux, perceptible sans jamais gêner la lecture. */}
      {Array.from({ length: COACH_PITCH_GEOMETRY.stripes }, (_, index) => index)
        .filter((index) => index % 2 === 0)
        .map((index) => (
          <Rect
            key={`stripe-${index}`}
            x="0"
            y={stripeHeight * index}
            width={width}
            height={stripeHeight}
            fill={COACH_PITCH.stripe}
          />
        ))}

      {/* Pourtour, ligne médiane, rond central. */}
      <G stroke={COACH_PITCH.line} strokeWidth={strokeWidth} fill="none">
        <Rect
          x={inset.x}
          y={inset.y}
          width={width - inset.x * 2}
          height={height - inset.y * 2}
          stroke={COACH_PITCH.lineStrong}
        />
        <Line x1={inset.x} y1={height / 2} x2={width - inset.x} y2={height / 2} />
        <Circle cx={width / 2} cy={height / 2} r={width * COACH_PITCH_GEOMETRY.centerCircle} />
        <Circle
          cx={width / 2}
          cy={height / 2}
          r={width * COACH_PITCH_GEOMETRY.centerSpot}
          fill={COACH_PITCH.line}
        />
      </G>

      {/* Surfaces hautes et basses. */}
      <G stroke={COACH_PITCH.line} strokeWidth={strokeWidth} fill="none">
        <Rect
          x={width * box.x}
          y={inset.y}
          width={width * box.width}
          height={height * box.height}
        />
        <Rect
          x={width * goal.x}
          y={inset.y}
          width={width * goal.width}
          height={height * goal.height}
        />
        <Rect
          x={width * box.x}
          y={height - inset.y - height * box.height}
          width={width * box.width}
          height={height * box.height}
        />
        <Rect
          x={width * goal.x}
          y={height - inset.y - height * goal.height}
          width={width * goal.width}
          height={height * goal.height}
        />
      </G>

      {isFutsal ? (
        <G stroke={COACH_PITCH.line} strokeWidth={strokeWidth} fill="none">
          <Path
            d={`M ${width * 0.3} ${inset.y} A ${arcRadius} ${arcRadius} 0 0 0 ${
              width * 0.7
            } ${inset.y}`}
          />
          <Path
            d={`M ${width * 0.3} ${height - inset.y} A ${arcRadius} ${arcRadius} 0 0 1 ${
              width * 0.7
            } ${height - inset.y}`}
          />
        </G>
      ) : null}
    </>
  );
}
