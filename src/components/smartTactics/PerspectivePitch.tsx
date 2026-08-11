import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path, Polygon } from 'react-native-svg';

const LINE = 'rgba(255,255,255,0.92)';
const GRASS_A = '#41C462';
const GRASS_B = '#2FA04C';
const SCENE = '#0A1610';

export type PitchPt = { x: number; y: number };

/**
 * Projection plongeante : ATT haut (loin), GB bas (proche).
 * nx, ny ∈ [0,1]
 */
export function projectPitch(
  nx: number,
  ny: number,
  width: number,
  height: number,
): { x: number; y: number; scale: number } {
  const top = height * 0.05;
  const bot = height * 0.96;
  const y = top + (bot - top) * ny;
  const topHalf = width * 0.28;
  const botHalf = width * 0.47;
  const halfW = topHalf + (botHalf - topHalf) * ny;
  const x = width / 2 - halfW + nx * 2 * halfW;
  const scale = 0.72 + 0.28 * ny;
  return { x, y, scale };
}

function pt(nx: number, ny: number, w: number, h: number): PitchPt {
  const r = projectPitch(nx, ny, w, h);
  return { x: r.x, y: r.y };
}

function polyPoints(pts: PitchPt[]): string {
  return pts.map((p) => `${p.x},${p.y}`).join(' ');
}

function polyPath(pts: PitchPt[]): string {
  if (!pts.length) return '';
  return `M ${pts.map((p) => `${p.x} ${p.y}`).join(' L ')} Z`;
}

function linePath(a: PitchPt, b: PitchPt): string {
  return `M ${a.x} ${a.y} L ${b.x} ${b.y}`;
}

function openPath(pts: PitchPt[]): string {
  if (!pts.length) return '';
  return `M ${pts.map((p) => `${p.x} ${p.y}`).join(' L ')}`;
}

function projectedRing(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  w: number,
  h: number,
  fromDeg = 0,
  toDeg = 360,
  steps = 40,
): PitchPt[] {
  const pts: PitchPt[] = [];
  const span = toDeg - fromDeg;
  const n = Math.max(8, Math.round((Math.abs(span) / 360) * steps));
  for (let i = 0; i <= n; i++) {
    const rad = ((fromDeg + (span * i) / n) * Math.PI) / 180;
    pts.push(pt(cx + Math.cos(rad) * rx, cy + Math.sin(rad) * ry, w, h));
  }
  return pts;
}

/** Terrain SVG en perspective (trapèze) — propre, sans rotateX RN. */
export function PerspectivePitch({
  width,
  height,
  highlightNy0,
  highlightNy1,
}: {
  width: number;
  height: number;
  highlightNy0?: number;
  highlightNy1?: number;
}) {
  const stroke = Math.max(1.6, width * 0.007);
  const thin = Math.max(1.2, width * 0.005);

  const penD = 0.157;
  const penW = 0.593;
  const goalD = 0.052;
  const goalW = 0.269;
  const spotD = 0.105;
  const circRx = 0.13;
  const circRy = 0.085;
  const penX0 = (1 - penW) / 2;
  const penX1 = 1 - penX0;
  const goalX0 = (1 - goalW) / 2;
  const goalX1 = 1 - goalX0;

  const outline = [
    pt(0, 0, width, height),
    pt(1, 0, width, height),
    pt(1, 1, width, height),
    pt(0, 1, width, height),
  ];

  const stripes = Array.from({ length: 14 }, (_, i) => {
    const ny0 = i / 14;
    const ny1 = (i + 1) / 14;
    return {
      key: `s-${i}`,
      points: polyPoints([
        pt(0, ny0, width, height),
        pt(1, ny0, width, height),
        pt(1, ny1, width, height),
        pt(0, ny1, width, height),
      ]),
      fill: i % 2 === 0 ? GRASS_A : GRASS_B,
    };
  });

  const box = (x0: number, y0: number, x1: number, y1: number) =>
    polyPath([
      pt(x0, y0, width, height),
      pt(x1, y0, width, height),
      pt(x1, y1, width, height),
      pt(x0, y1, width, height),
    ]);

  const center = pt(0.5, 0.5, width, height);
  const topSpot = pt(0.5, spotD, width, height);
  const botSpot = pt(0.5, 1 - spotD, width, height);

  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Polygon points={`0,0 ${width},0 ${width},${height} 0,${height}`} fill={SCENE} />
      {stripes.map((s) => (
        <Polygon key={s.key} points={s.points} fill={s.fill} />
      ))}
      <Polygon
        points={polyPoints([
          pt(0, 0.72, width, height),
          pt(1, 0.72, width, height),
          pt(1, 1, width, height),
          pt(0, 1, width, height),
        ])}
        fill="rgba(0,0,0,0.08)"
      />
      {highlightNy0 != null && highlightNy1 != null ? (
        <Polygon
          points={polyPoints([
            pt(0.03, highlightNy0, width, height),
            pt(0.97, highlightNy0, width, height),
            pt(0.97, highlightNy1, width, height),
            pt(0.03, highlightNy1, width, height),
          ])}
          fill="rgba(245,165,36,0.18)"
          stroke="rgba(245,165,36,0.5)"
          strokeWidth={1.2}
        />
      ) : null}
      <Path d={polyPath(outline)} stroke={LINE} strokeWidth={stroke} fill="none" />
      <Path
        d={linePath(pt(0, 0.5, width, height), pt(1, 0.5, width, height))}
        stroke={LINE}
        strokeWidth={thin}
        fill="none"
      />
      <Path
        d={openPath(projectedRing(0.5, 0.5, circRx, circRy, width, height))}
        stroke={LINE}
        strokeWidth={thin}
        fill="none"
      />
      <Circle cx={center.x} cy={center.y} r={Math.max(2.2, width * 0.008)} fill={LINE} />
      <Path d={box(penX0, 0, penX1, penD)} stroke={LINE} strokeWidth={thin} fill="none" />
      <Path d={box(goalX0, 0, goalX1, goalD)} stroke={LINE} strokeWidth={thin} fill="none" />
      <Path d={box(penX0, 1 - penD, penX1, 1)} stroke={LINE} strokeWidth={thin} fill="none" />
      <Path d={box(goalX0, 1 - goalD, goalX1, 1)} stroke={LINE} strokeWidth={thin} fill="none" />
      <Circle cx={topSpot.x} cy={topSpot.y} r={Math.max(2, width * 0.007)} fill={LINE} />
      <Circle cx={botSpot.x} cy={botSpot.y} r={Math.max(2, width * 0.007)} fill={LINE} />
      <Path
        d={openPath(
          projectedRing(0.5, spotD, circRx * 0.8, circRy * 0.9, width, height, 16, 164),
        )}
        stroke={LINE}
        strokeWidth={thin}
        fill="none"
      />
      <Path
        d={openPath(
          projectedRing(0.5, 1 - spotD, circRx * 0.8, circRy * 0.9, width, height, 196, 344),
        )}
        stroke={LINE}
        strokeWidth={thin}
        fill="none"
      />
    </Svg>
  );
}

export function PitchFrame({
  width,
  height,
  children,
  highlightNy0,
  highlightNy1,
}: {
  width: number;
  height: number;
  children?: React.ReactNode;
  highlightNy0?: number;
  highlightNy1?: number;
}) {
  return (
    <View style={[styles.frame, { width, height }]}>
      <PerspectivePitch
        width={width}
        height={height}
        highlightNy0={highlightNy0}
        highlightNy1={highlightNy1}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: SCENE,
    borderWidth: 1,
    borderColor: 'rgba(245,165,36,0.22)',
  },
});
