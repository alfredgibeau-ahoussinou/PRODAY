/**
 * VideoAnnotationCanvas — overlay SVG pour dessiner sur un frame vidéo.
 * Flèches, cercles, lignes, zones, texte libre.
 * Coordonnées normalisées 0–1 (relative au container).
 */

import React, { useCallback, useMemo, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  Marker,
  Path,
  Polygon,
  Rect,
  Text as SvgText,
} from 'react-native-svg';
import { PressableSpring } from '../motion';
import { ProDayText } from '../ui/ProDayText';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius } from '../../theme/designTokens';
import {
  DEFAULT_ANNOTATION_COLORS,
  VIDEO_ANNOTATION_TYPE_LABELS,
  type AnnotationPoint,
  type VideoAnnotation,
  type VideoAnnotationType,
} from '../../models/VideoAnnotation';

const TOOLS: VideoAnnotationType[] = ['arrow', 'circle', 'line', 'zone', 'text'];

interface VideoAnnotationCanvasProps {
  width: number;
  height: number;
  annotations: VideoAnnotation[];
  activeTool: VideoAnnotationType;
  activeColor: string;
  onToolChange: (tool: VideoAnnotationType) => void;
  onColorChange: (color: string) => void;
  onAddAnnotation: (type: VideoAnnotationType, points: AnnotationPoint[], text?: string) => void;
  editable?: boolean;
}

export const VideoAnnotationCanvas: React.FC<VideoAnnotationCanvasProps> = ({
  width,
  height,
  annotations,
  activeTool,
  activeColor,
  onToolChange,
  onColorChange,
  onAddAnnotation,
  editable = true,
}) => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const [startPoint, setStartPoint] = useState<AnnotationPoint | null>(null);

  const toNorm = useCallback(
    (px: number, py: number): AnnotationPoint => ({
      x: Math.max(0, Math.min(1, px / width)),
      y: Math.max(0, Math.min(1, py / height)),
    }),
    [width, height],
  );

  const handlePress = useCallback(
    (e: { nativeEvent: { locationX: number; locationY: number } }) => {
      if (!editable) return;
      const pt = toNorm(e.nativeEvent.locationX, e.nativeEvent.locationY);

      if (activeTool === 'text') {
        onAddAnnotation('text', [pt], 'Texte');
        return;
      }

      if (!startPoint) {
        setStartPoint(pt);
        return;
      }

      onAddAnnotation(activeTool, [startPoint, pt]);
      setStartPoint(null);
    },
    [activeTool, editable, onAddAnnotation, startPoint, toNorm],
  );

  const renderAnnotation = (ann: VideoAnnotation, idx: number) => {
    const pts = ann.data.points;
    const color = ann.data.color;
    const sw = ann.data.strokeWidth ?? 3;

    if (ann.type === 'arrow' && pts.length >= 2) {
      const x1 = pts[0].x * width;
      const y1 = pts[0].y * height;
      const x2 = pts[1].x * width;
      const y2 = pts[1].y * height;
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const headLen = 12;
      const ax = x2 - headLen * Math.cos(angle - Math.PI / 6);
      const ay = y2 - headLen * Math.sin(angle - Math.PI / 6);
      const bx = x2 - headLen * Math.cos(angle + Math.PI / 6);
      const by = y2 - headLen * Math.sin(angle + Math.PI / 6);
      return (
        <G key={`ann-${idx}`}>
          <Line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={sw} />
          <Polygon points={`${x2},${y2} ${ax},${ay} ${bx},${by}`} fill={color} />
        </G>
      );
    }

    if (ann.type === 'circle' && pts.length >= 2) {
      const cx = pts[0].x * width;
      const cy = pts[0].y * height;
      const r =
        ann.data.radius != null
          ? ann.data.radius * width
          : Math.hypot((pts[1].x - pts[0].x) * width, (pts[1].y - pts[0].y) * height);
      return (
        <Circle
          key={`ann-${idx}`}
          cx={cx}
          cy={cy}
          r={r}
          stroke={color}
          strokeWidth={sw}
          fill="transparent"
        />
      );
    }

    if (ann.type === 'line' && pts.length >= 2) {
      return (
        <Line
          key={`ann-${idx}`}
          x1={pts[0].x * width}
          y1={pts[0].y * height}
          x2={pts[1].x * width}
          y2={pts[1].y * height}
          stroke={color}
          strokeWidth={sw}
        />
      );
    }

    if (ann.type === 'zone' && pts.length >= 2) {
      const rx = Math.min(pts[0].x, pts[1].x) * width;
      const ry = Math.min(pts[0].y, pts[1].y) * height;
      const rw = Math.abs(pts[1].x - pts[0].x) * width;
      const rh = Math.abs(pts[1].y - pts[0].y) * height;
      return (
        <Rect
          key={`ann-${idx}`}
          x={rx}
          y={ry}
          width={rw}
          height={rh}
          stroke={color}
          strokeWidth={sw}
          fill={`${color}22`}
          rx={4}
        />
      );
    }

    if (ann.type === 'text' && pts.length >= 1) {
      return (
        <SvgText
          key={`ann-${idx}`}
          x={pts[0].x * width}
          y={pts[0].y * height}
          fill={color}
          fontSize={16}
          fontWeight="bold"
        >
          {ann.data.text ?? ''}
        </SvgText>
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={handlePress}>
        <Svg width={width} height={height} style={styles.svg}>
          {annotations.map(renderAnnotation)}
          {startPoint && (
            <Circle
              cx={startPoint.x * width}
              cy={startPoint.y * height}
              r={6}
              fill={activeColor}
              opacity={0.7}
            />
          )}
        </Svg>
      </Pressable>

      {editable && (
        <View style={styles.toolbar}>
          <View style={styles.toolRow}>
            {TOOLS.map((t) => (
              <PressableSpring
                key={t}
                onPress={() => { onToolChange(t); setStartPoint(null); }}
                scaleTo={0.96}
                style={[
                  styles.toolBtn,
                  {
                    borderColor: activeTool === t ? c.brand : c.border,
                    backgroundColor: activeTool === t ? c.accentSoft : c.surface,
                  },
                ]}
              >
                <ProDayText
                  variant="caption"
                  style={{ fontWeight: '700', fontSize: 10, color: activeTool === t ? c.brand : c.textSecondary }}
                >
                  {VIDEO_ANNOTATION_TYPE_LABELS[t]}
                </ProDayText>
              </PressableSpring>
            ))}
          </View>
          <View style={styles.colorRow}>
            {DEFAULT_ANNOTATION_COLORS.map((col) => (
              <Pressable
                key={col}
                onPress={() => onColorChange(col)}
                style={[
                  styles.colorDot,
                  {
                    backgroundColor: col,
                    borderColor: activeColor === col ? c.brand : 'transparent',
                    borderWidth: activeColor === col ? 2 : 0,
                  },
                ]}
              />
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

function createStyles(_c: { border: string }) {
  return StyleSheet.create({
    container: { overflow: 'hidden' },
    svg: { backgroundColor: 'transparent' },
    toolbar: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      gap: spacing.xs,
    },
    toolRow: { flexDirection: 'row', gap: 4, flexWrap: 'wrap' },
    toolBtn: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radius.pill,
      borderWidth: 1,
    },
    colorRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
    colorDot: {
      width: 22,
      height: 22,
      borderRadius: 11,
    },
  });
}
