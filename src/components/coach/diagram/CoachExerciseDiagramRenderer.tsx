import { COACH_REF_PALETTE } from '../../../features/coach/theme/coachDesignSystem';
import React from 'react';
import { DimensionValue, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Line,
  Marker,
  Path,
  Polygon,
  Rect,
  Text as SvgText,
  Image as SvgImage,
} from 'react-native-svg';
import {
  DEFAULT_ARROW_COLORS,
  DEFAULT_EQUIPMENT_COLORS,
  DEFAULT_TEAM_COLORS,
  type DiagramArrowElement,
  type DiagramElement,
  type DiagramEquipmentElement,
  type DiagramPlayerElement,
  type DiagramTextElement,
  type DiagramZoneElement,
  type ExerciseDiagramData,
} from '../../../models/ExerciseDiagram';
import type { ElementMovementAction } from '../../../models/ExerciseDiagramAnimation';
import { COACH_SITE } from '../../../content/coachPageIdentity';
import { proSemantic } from '../../../theme/professionalDesign';
import { withAlpha } from '../../../utils/coachTeamTheme';

export interface CoachExerciseDiagramRendererProps {
  diagram: ExerciseDiagramData;
  activeElements?: DiagramElement[];
  activeMovements?: ElementMovementAction[];
  showTrajectories?: boolean;
  width?: DimensionValue;
  height?: DimensionValue;
  selectedElementId?: string | null;
  onSelectElement?: (element: DiagramElement | null) => void;
  isInteractive?: boolean;
}

export const CoachExerciseDiagramRenderer: React.FC<CoachExerciseDiagramRendererProps> = ({
  diagram,
  activeElements,
  activeMovements,
  showTrajectories = true,
  width = '100%',
  height = '100%',
  selectedElementId,
  onSelectElement,
  isInteractive = false,
}) => {
  const vbW = diagram.width || 100;
  const vbH = diagram.height || 64;
  const elements = activeElements || diagram.elements || [];

  const renderPitchLines = () => {
    switch (diagram.pitchTemplate) {
      case 'full':
        return (
          <G>
            {/* Lignes de touche & de but extérieures */}
            <Rect
              x={3}
              y={3}
              width={vbW - 6}
              height={vbH - 6}
              rx={1.5}
              fill="none"
              stroke="#FFFFFF"
              strokeWidth={0.8}
              strokeOpacity={0.85}
            />

            {/* Ligne médiane & cercle central */}
            <Line
              x1={vbW / 2}
              y1={3}
              x2={vbW / 2}
              y2={vbH - 3}
              stroke="#FFFFFF"
              strokeWidth={0.8}
              strokeOpacity={0.85}
            />
            <Circle
              cx={vbW / 2}
              cy={vbH / 2}
              r={9.15}
              fill="none"
              stroke="#FFFFFF"
              strokeWidth={0.8}
              strokeOpacity={0.85}
            />
            <Circle cx={vbW / 2} cy={vbH / 2} r={0.8} fill="#FFFFFF" />

            {/* Surface de réparation gauche (16.5m) */}
            <Rect
              x={3}
              y={vbH / 2 - 18}
              width={16.5}
              height={36}
              fill="none"
              stroke="#FFFFFF"
              strokeWidth={0.8}
              strokeOpacity={0.85}
            />
            {/* Surface de but gauche (5.5m / 6 yards) */}
            <Rect
              x={3}
              y={vbH / 2 - 9}
              width={5.5}
              height={18}
              fill="none"
              stroke="#FFFFFF"
              strokeWidth={0.7}
              strokeOpacity={0.8}
            />
            {/* Point de penalty gauche (11m) & arc de cercle (D) */}
            <Circle cx={14} cy={vbH / 2} r={0.7} fill="#FFFFFF" />
            <Path
              d={`M 19.5 ${vbH / 2 - 7.5} A 9.15 9.15 0 0 1 19.5 ${vbH / 2 + 7.5}`}
              fill="none"
              stroke="#FFFFFF"
              strokeWidth={0.7}
              strokeOpacity={0.85}
            />
            {/* But gauche & filet */}
            <Rect
              x={0.8}
              y={vbH / 2 - 5}
              width={2.2}
              height={10}
              fill="rgba(255,255,255,0.15)"
              stroke="#FFFFFF"
              strokeWidth={1}
            />

            {/* Surface de réparation droite (16.5m) */}
            <Rect
              x={vbW - 19.5}
              y={vbH / 2 - 18}
              width={16.5}
              height={36}
              fill="none"
              stroke="#FFFFFF"
              strokeWidth={0.8}
              strokeOpacity={0.85}
            />
            {/* Surface de but droite (5.5m) */}
            <Rect
              x={vbW - 8.5}
              y={vbH / 2 - 9}
              width={5.5}
              height={18}
              fill="none"
              stroke="#FFFFFF"
              strokeWidth={0.7}
              strokeOpacity={0.8}
            />
            {/* Point de penalty droit & arc de cercle (D) */}
            <Circle cx={vbW - 14} cy={vbH / 2} r={0.7} fill="#FFFFFF" />
            <Path
              d={`M ${vbW - 19.5} ${vbH / 2 - 7.5} A 9.15 9.15 0 0 0 ${vbW - 19.5} ${vbH / 2 + 7.5}`}
              fill="none"
              stroke="#FFFFFF"
              strokeWidth={0.7}
              strokeOpacity={0.85}
            />
            {/* But droit & filet */}
            <Rect
              x={vbW - 3}
              y={vbH / 2 - 5}
              width={2.2}
              height={10}
              fill="rgba(255,255,255,0.15)"
              stroke="#FFFFFF"
              strokeWidth={1}
            />

            {/* Arcs de cercle de corner aux 4 angles */}
            <Path d="M 3 5 A 2 2 0 0 0 5 3" fill="none" stroke="#FFFFFF" strokeWidth={0.7} strokeOpacity={0.85} />
            <Path d={`M 3 ${vbH - 5} A 2 2 0 0 1 5 ${vbH - 3}`} fill="none" stroke="#FFFFFF" strokeWidth={0.7} strokeOpacity={0.85} />
            <Path d={`M ${vbW - 3} 5 A 2 2 0 0 1 ${vbW - 5} 3`} fill="none" stroke="#FFFFFF" strokeWidth={0.7} strokeOpacity={0.85} />
            <Path d={`M ${vbW - 3} ${vbH - 5} A 2 2 0 0 0 ${vbW - 5} ${vbH - 3}`} fill="none" stroke="#FFFFFF" strokeWidth={0.7} strokeOpacity={0.85} />
          </G>
        );

      case 'box':
        return (
          <G>
            {/* Terrain d'atelier délimité / Box Rondo Tacticslot */}
            <Rect
              x={6}
              y={5}
              width={vbW - 12}
              height={vbH - 10}
              rx={2}
              fill="none"
              stroke="#FFFFFF"
              strokeWidth={0.8}
              strokeOpacity={0.85}
            />
            {/* Ligne médiane de l'atelier */}
            <Line
              x1={vbW / 2}
              y1={5}
              x2={vbW / 2}
              y2={vbH - 5}
              stroke="#FFFFFF"
              strokeWidth={0.6}
              strokeOpacity={0.5}
              strokeDasharray="2,2"
            />
            <Line
              x1={6}
              y1={vbH / 2}
              x2={vbW - 6}
              y2={vbH / 2}
              stroke="#FFFFFF"
              strokeWidth={0.6}
              strokeOpacity={0.5}
              strokeDasharray="2,2"
            />
            <Circle cx={vbW / 2} cy={vbH / 2} r={6} fill="none" stroke="#FFFFFF" strokeWidth={0.6} strokeOpacity={0.5} />
            <Circle cx={vbW / 2} cy={vbH / 2} r={0.7} fill="#FFFFFF" strokeOpacity={0.8} />
          </G>
        );

      case 'blank':
        return null;

      case 'half':
      default:
        return (
          <G>
            {/* Demi-terrain grand format type Tacticslot */}
            <Rect
              x={3}
              y={3}
              width={vbW - 6}
              height={vbH - 6}
              rx={2}
              fill="none"
              stroke="#FFFFFF"
              strokeWidth={0.8}
              strokeOpacity={0.85}
            />

            {/* Surface de réparation 16.5m */}
            <Rect
              x={22}
              y={3}
              width={56}
              height={25}
              fill="none"
              stroke="#FFFFFF"
              strokeWidth={0.8}
              strokeOpacity={0.85}
            />

            {/* Surface de but 5.5m */}
            <Rect
              x={36}
              y={3}
              width={28}
              height={9}
              fill="none"
              stroke="#FFFFFF"
              strokeWidth={0.7}
              strokeOpacity={0.8}
            />

            {/* Point de penalty & arc de cercle (D) */}
            <Circle cx={50} cy={18} r={0.8} fill="#FFFFFF" />
            <Path
              d="M 38 28 A 9.15 9.15 0 0 0 62 28"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth={0.7}
              strokeOpacity={0.85}
            />

            {/* But haut & filet */}
            <Rect
              x={38}
              y={0.8}
              width={24}
              height={2.2}
              fill="rgba(255,255,255,0.15)"
              stroke="#FFFFFF"
              strokeWidth={1}
            />

            {/* Ligne médiane et arc du cercle central au bas du demi-terrain */}
            <Path
              d={`M 40.85 ${vbH - 3} A 9.15 9.15 0 0 1 59.15 ${vbH - 3}`}
              fill="none"
              stroke="#FFFFFF"
              strokeWidth={0.8}
              strokeOpacity={0.85}
            />
            <Circle cx={50} cy={vbH - 3} r={0.8} fill="#FFFFFF" />

            {/* Arcs de corner hauts */}
            <Path d="M 3 6 A 3 3 0 0 0 6 3" fill="none" stroke="#FFFFFF" strokeWidth={0.7} strokeOpacity={0.85} />
            <Path d={`M ${vbW - 3} 6 A 3 3 0 0 1 ${vbW - 6} 3`} fill="none" stroke="#FFFFFF" strokeWidth={0.7} strokeOpacity={0.85} />
          </G>
        );
    }
  };

  const renderZone = (el: DiagramZoneElement) => {
    const isSelected = selectedElementId === el.id;
    return (
      <G
        key={el.id}
        onPress={() => isInteractive && onSelectElement && onSelectElement(el)}
      >
        <Rect
          x={el.x}
          y={el.y}
          width={el.width}
          height={el.height}
          rx={2}
          fill={el.color || proSemantic.success}
          fillOpacity={el.fillOpacity ?? 0.12}
          stroke={isSelected ? COACH_REF_PALETTE.white : el.color || proSemantic.success}
          strokeWidth={isSelected ? 1.4 : 0.8}
          strokeDasharray={el.style === 'dashed' ? '2,2' : undefined}
        />
        {el.label ? (
          <SvgText
            x={el.x + 2}
            y={el.y + 4.5}
            fontSize={2.5}
            fontWeight="700"
            fill={el.color || COACH_REF_PALETTE.white}
            opacity={0.9}
          >
            {el.label}
          </SvgText>
        ) : null}
      </G>
    );
  };

  const renderArrow = (el: DiagramArrowElement) => {
    const isSelected = selectedElementId === el.id;
    const color = el.color || DEFAULT_ARROW_COLORS[el.kind] || proSemantic.success;
    const isDashed = el.kind === 'pass';
    const isDribble = el.kind === 'dribble';
    const dash = isDashed ? '2,1.5' : isDribble ? '1,1' : undefined;
    const marker =
      el.kind === 'pass'
        ? 'url(#diagArrowCyan)'
        : el.kind === 'shot'
          ? 'url(#diagArrowRed)'
          : el.kind === 'dribble'
            ? 'url(#diagArrowOrange)'
            : 'url(#diagArrowGreen)';

    const hasCurve = el.controlX != null && el.controlY != null;

    return (
      <G
        key={el.id}
        onPress={() => isInteractive && onSelectElement && onSelectElement(el)}
      >
        {/* Invisible larger stroke for touch target */}
        {hasCurve ? (
          <Path
            d={`M ${el.fromX} ${el.fromY} Q ${el.controlX} ${el.controlY} ${el.toX} ${el.toY}`}
            fill="none"
            stroke="transparent"
            strokeWidth={6}
          />
        ) : (
          <Line
            x1={el.fromX}
            y1={el.fromY}
            x2={el.toX}
            y2={el.toY}
            stroke="transparent"
            strokeWidth={6}
          />
        )}

        {/* Visible arrow line/path */}
        {hasCurve ? (
          <Path
            d={`M ${el.fromX} ${el.fromY} Q ${el.controlX} ${el.controlY} ${el.toX} ${el.toY}`}
            fill="none"
            stroke={isSelected ? COACH_REF_PALETTE.white : color}
            strokeWidth={isSelected ? 1.4 : 0.9}
            strokeDasharray={dash}
            markerEnd={marker}
          />
        ) : (
          <Line
            x1={el.fromX}
            y1={el.fromY}
            x2={el.toX}
            y2={el.toY}
            stroke={isSelected ? COACH_REF_PALETTE.white : color}
            strokeWidth={isSelected ? 1.4 : 0.9}
            strokeDasharray={dash}
            markerEnd={marker}
          />
        )}
      </G>
    );
  };

  const renderEquipment = (el: DiagramEquipmentElement) => {
    const isSelected = selectedElementId === el.id;
    const rot = el.rotation ? `rotate(${el.rotation} ${el.x} ${el.y})` : undefined;

    return (
      <G
        key={el.id}
        transform={rot}
        onPress={() => isInteractive && onSelectElement && onSelectElement(el)}
      >
        {/* Selection ring */}
        {isSelected ? (
          <Circle
            cx={el.x}
            cy={el.y}
            r={4.2}
            fill="none"
            stroke={COACH_REF_PALETTE.white}
            strokeWidth={0.7}
            strokeDasharray="1,1"
          />
        ) : null}

        {/* Touch target hit area */}
        <Circle cx={el.x} cy={el.y} r={5} fill="transparent" />

        {el.equipmentType === 'cone' && (
          <G>
            {/* Ombre portée sur le gazon */}
            <Ellipse cx={el.x} cy={el.y + 2.3} rx={2.4} ry={1.1} fill="rgba(0,0,0,0.32)" />
            {/* Socle carré / base plate du plot */}
            <Rect
              x={el.x - 2.2}
              y={el.y + 1.6}
              width={4.4}
              height={0.8}
              rx={0.3}
              fill={el.color || DEFAULT_EQUIPMENT_COLORS.cone || '#FF6B00'}
            />
            {/* Corps du plot avec angle conique */}
            <Polygon
              points={`${el.x},${el.y - 3} ${el.x - 1.9},${el.y + 1.8} ${el.x + 1.9},${el.y + 1.8}`}
              fill={el.color || DEFAULT_EQUIPMENT_COLORS.cone || '#FF6B00'}
              stroke="#FFFFFF"
              strokeWidth={0.2}
            />
            {/* Bande blanche réfléchissante centrale */}
            <Polygon
              points={`${el.x - 0.7},${el.y - 0.4} ${el.x + 0.7},${el.y - 0.4} ${el.x + 1.2},${el.y + 0.8} ${el.x - 1.2},${el.y + 0.8}`}
              fill="#FFFFFF"
              opacity={0.95}
            />
            {/* Apex sommital */}
            <Circle cx={el.x} cy={el.y - 2.9} r={0.4} fill="#FFFFFF" />
          </G>
        )}

        {el.equipmentType === 'disc_cone' && (
          <G>
            <Ellipse cx={el.x} cy={el.y + 0.6} rx={2.2} ry={1} fill="rgba(0,0,0,0.28)" />
            <Ellipse
              cx={el.x}
              cy={el.y}
              rx={2.2}
              ry={1.3}
              fill={el.color || DEFAULT_EQUIPMENT_COLORS.disc_cone || '#FACC15'}
              stroke="#FFFFFF"
              strokeWidth={0.3}
            />
            <Ellipse
              cx={el.x}
              cy={el.y - 0.2}
              rx={1.5}
              ry={0.8}
              fill={withAlpha(el.color || '#FACC15', 0.8)}
            />
            <Ellipse cx={el.x} cy={el.y} rx={0.6} ry={0.4} fill="#14532D" />
          </G>
        )}

        {el.equipmentType === 'ball' && (
          <G>
            <Ellipse cx={el.x + 0.5} cy={el.y + 1.3} rx={1.6} ry={0.8} fill="rgba(0,0,0,0.38)" />
            <Circle cx={el.x} cy={el.y} r={1.6} fill="#FFFFFF" stroke="#0F172A" strokeWidth={0.35} />
            {/* Pentagone central du ballon */}
            <Polygon
              points={`${el.x},${el.y - 0.6} ${el.x + 0.6},${el.y - 0.2} ${el.x + 0.4},${el.y + 0.5} ${el.x - 0.4},${el.y + 0.5} ${el.x - 0.6},${el.y - 0.2}`}
              fill="#0F172A"
            />
            <Line x1={el.x} y1={el.y - 0.6} x2={el.x} y2={el.y - 1.5} stroke="#0F172A" strokeWidth={0.25} />
            <Line x1={el.x + 0.6} y1={el.y - 0.2} x2={el.x + 1.4} y2={el.y - 0.5} stroke="#0F172A" strokeWidth={0.25} />
            <Line x1={el.x + 0.4} y1={el.y + 0.5} x2={el.x + 1.1} y2={el.y + 1.2} stroke="#0F172A" strokeWidth={0.25} />
            <Line x1={el.x - 0.4} y1={el.y + 0.5} x2={el.x - 1.1} y2={el.y + 1.2} stroke="#0F172A" strokeWidth={0.25} />
            <Line x1={el.x - 0.6} y1={el.y - 0.2} x2={el.x - 1.4} y2={el.y - 0.5} stroke="#0F172A" strokeWidth={0.25} />
          </G>
        )}

        {el.equipmentType === 'goal' && (
          <G>
            <Rect
              x={el.x - (el.width ? el.width / 2 : 12)}
              y={el.y - (el.height ? el.height / 2 : 2)}
              width={el.width || 24}
              height={el.height || 4}
              fill="rgba(255,255,255,0.15)"
              stroke={COACH_REF_PALETTE.white}
              strokeWidth={1.2}
            />
            <Line
              x1={el.x - (el.width ? el.width / 2 : 12)}
              y1={el.y - (el.height ? el.height / 2 : 2)}
              x2={el.x - (el.width ? el.width / 2 : 12)}
              y2={el.y + (el.height ? el.height / 2 : 2)}
              stroke={COACH_REF_PALETTE.white}
              strokeWidth={1}
            />
            <Line
              x1={el.x + (el.width ? el.width / 2 : 12)}
              y1={el.y - (el.height ? el.height / 2 : 2)}
              x2={el.x + (el.width ? el.width / 2 : 12)}
              y2={el.y + (el.height ? el.height / 2 : 2)}
              stroke={COACH_REF_PALETTE.white}
              strokeWidth={1}
            />
          </G>
        )}

        {el.equipmentType === 'mini_goal' && (
          <G>
            <Rect
              x={el.x - (el.width ? el.width / 2 : 3)}
              y={el.y - (el.height ? el.height / 2 : 4)}
              width={el.width || 6}
              height={el.height || 8}
              fill="rgba(255,255,255,0.18)"
              stroke={COACH_REF_PALETTE.white}
              strokeWidth={1}
            />
            <Line
              x1={el.x - (el.width ? el.width / 2 : 3)}
              y1={el.y}
              x2={el.x + (el.width ? el.width / 2 : 3)}
              y2={el.y}
              stroke={COACH_REF_PALETTE.white}
              strokeWidth={0.4}
              strokeDasharray="1,1"
            />
          </G>
        )}

        {el.equipmentType === 'mannequin' && (
          <G>
            <Circle
              cx={el.x}
              cy={el.y - 1.8}
              r={1.2}
              fill="#E2E8F0"
              stroke="#000000"
              strokeWidth={0.3}
            />
            <Rect
              x={el.x - 1.8}
              y={el.y}
              width={3.6}
              height={4.5}
              rx={0.8}
              fill="#E2E8F0"
              stroke="#000000"
              strokeWidth={0.3}
            />
            <Line x1={el.x - 1.8} y1={el.y + 1.5} x2={el.x + 1.8} y2={el.y + 1.5} stroke="#64748B" strokeWidth={0.4} />
            <Line x1={el.x - 1.8} y1={el.y + 3} x2={el.x + 1.8} y2={el.y + 3} stroke="#64748B" strokeWidth={0.4} />
          </G>
        )}

        {el.equipmentType === 'hurdle' && (
          <G>
            <Rect x={el.x - 3} y={el.y - 1.5} width={6} height={3} rx={0.6} fill="none" stroke="#F59E0B" strokeWidth={0.8} />
            <Line x1={el.x - 3} y1={el.y + 1.5} x2={el.x - 3} y2={el.y + 3} stroke="#F59E0B" strokeWidth={0.9} />
            <Line x1={el.x + 3} y1={el.y + 1.5} x2={el.x + 3} y2={el.y + 3} stroke="#F59E0B" strokeWidth={0.9} />
          </G>
        )}

        {el.equipmentType === 'ladder' && (
          <G>
            <Rect
              x={el.x - 2}
              y={el.y - 8}
              width={4}
              height={16}
              fill="none"
              stroke="#F59E0B"
              strokeWidth={0.6}
            />
            {[-6, -3, 0, 3, 6].map((offset) => (
              <Line
                key={offset}
                x1={el.x - 2}
                y1={el.y + offset}
                x2={el.x + 2}
                y2={el.y + offset}
                stroke="#F59E0B"
                strokeWidth={0.6}
              />
            ))}
          </G>
        )}
      </G>
    );
  };

  const renderPlayer = (el: DiagramPlayerElement) => {
    const isSelected = selectedElementId === el.id;
    const color = el.color || DEFAULT_TEAM_COLORS[el.team] || proSemantic.info;

    return (
      <G
        key={el.id}
        onPress={() => isInteractive && onSelectElement && onSelectElement(el)}
      >
        {/* Generous touch target hit area */}
        <Circle cx={el.x} cy={el.y} r={7} fill="transparent" />

        {/* Selection ring */}
        {isSelected ? (
          <Circle
            cx={el.x}
            cy={el.y}
            r={4.6}
            fill="none"
            stroke={COACH_REF_PALETTE.white}
            strokeWidth={0.8}
          />
        ) : null}

        {/* Player Token Circle */}
        <Circle
          cx={el.x}
          cy={el.y}
          r={2.9}
          fill={color}
          stroke={COACH_REF_PALETTE.white}
          strokeWidth={0.7}
        />

        {/* Jersey Number */}
        {el.num != null ? (
          <SvgText
            x={el.x}
            y={el.y + 1.1}
            fontSize={2.7}
            fontWeight="800"
            fill={COACH_REF_PALETTE.white}
            textAnchor="middle"
          >
            {el.num}
          </SvgText>
        ) : null}

        {/* Player Name / Label */}
        {el.label ? (
          <SvgText
            x={el.x}
            y={el.y + 5.5}
            fontSize={2.2}
            fontWeight="700"
            fill={COACH_REF_PALETTE.white}
            textAnchor="middle"
          >
            {el.label}
          </SvgText>
        ) : null}

        {/* Ball carrier icon indicator */}
        {el.hasBall ? (
          <Circle
            cx={el.x + 2.5}
            cy={el.y - 2.5}
            r={1.2}
            fill={COACH_REF_PALETTE.white}
            stroke="#000000"
            strokeWidth={0.4}
          />
        ) : null}
      </G>
    );
  };

  const renderText = (el: DiagramTextElement) => {
    const isSelected = selectedElementId === el.id;
    return (
      <G
        key={el.id}
        onPress={() => isInteractive && onSelectElement && onSelectElement(el)}
      >
        {isSelected ? (
          <Rect
            x={el.x - 1}
            y={el.y - (el.fontSize || 2.8)}
            width={(el.text.length * (el.fontSize || 2.8) * 0.6) + 2}
            height={(el.fontSize || 2.8) + 2}
            fill="none"
            stroke={COACH_REF_PALETTE.white}
            strokeWidth={0.5}
            strokeDasharray="1,1"
          />
        ) : null}
        <SvgText
          x={el.x}
          y={el.y}
          fontSize={el.fontSize || 2.8}
          fontWeight="700"
          fill={el.color || COACH_REF_PALETTE.white}
        >
          {el.text}
        </SvgText>
      </G>
    );
  };

  const renderActiveMovementTrails = () => {
    if (!showTrajectories || !activeMovements || activeMovements.length === 0) return null;

    return (
      <G opacity={0.88}>
        {activeMovements.map((mv) => {
          const color =
            mv.actionType === 'pass'
              ? '#38BDF8'
              : mv.actionType === 'shot'
                ? proSemantic.danger
                : mv.actionType === 'dribble'
                  ? '#F59E0B'
                  : proSemantic.success;

          const marker =
            mv.actionType === 'pass'
              ? 'url(#diagArrowCyan)'
              : mv.actionType === 'shot'
                ? 'url(#diagArrowRed)'
                : mv.actionType === 'dribble'
                  ? 'url(#diagArrowOrange)'
                  : 'url(#diagArrowGreen)';

          const hasCurve = mv.controlPoint != null;
          const dash = mv.actionType === 'pass' ? '2,1.5' : mv.actionType === 'dribble' ? '1,1' : '2,1';

          return (
            <G key={`anim-trail-${mv.id}`}>
              {hasCurve ? (
                <Path
                  d={`M ${mv.from.x} ${mv.from.y} Q ${mv.controlPoint!.x} ${mv.controlPoint!.y} ${mv.to.x} ${mv.to.y}`}
                  fill="none"
                  stroke={color}
                  strokeWidth={1.1}
                  strokeDasharray={dash}
                  markerEnd={marker}
                />
              ) : (
                <Line
                  x1={mv.from.x}
                  y1={mv.from.y}
                  x2={mv.to.x}
                  y2={mv.to.y}
                  stroke={color}
                  strokeWidth={1.1}
                  strokeDasharray={dash}
                  markerEnd={marker}
                />
              )}
              {/* Point de départ */}
              <Circle cx={mv.from.x} cy={mv.from.y} r={0.9} fill={color} opacity={0.6} />
            </G>
          );
        })}
      </G>
    );
  };

  return (
    <View style={{ width, height, overflow: 'hidden', borderRadius: 8 }}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${vbW} ${vbH}`}>
        <Defs>
          {/* Reusable crisp arrow markers */}
          <Marker
            id="diagArrowGreen"
            viewBox="0 0 10 10"
            refX={6}
            refY={5}
            markerWidth={4}
            markerHeight={4}
            orient="auto-start-reverse"
          >
            <Path d="M 0 1 L 10 5 L 0 9 z" fill={proSemantic.success} />
          </Marker>
          <Marker
            id="diagArrowCyan"
            viewBox="0 0 10 10"
            refX={6}
            refY={5}
            markerWidth={4}
            markerHeight={4}
            orient="auto-start-reverse"
          >
            <Path d="M 0 1 L 10 5 L 0 9 z" fill="#38BDF8" />
          </Marker>
          <Marker
            id="diagArrowRed"
            viewBox="0 0 10 10"
            refX={6}
            refY={5}
            markerWidth={4}
            markerHeight={4}
            orient="auto-start-reverse"
          >
            <Path d="M 0 1 L 10 5 L 0 9 z" fill={proSemantic.danger} />
          </Marker>
          <Marker
            id="diagArrowOrange"
            viewBox="0 0 10 10"
            refX={6}
            refY={5}
            markerWidth={4}
            markerHeight={4}
            orient="auto-start-reverse"
          >
            <Path d="M 0 1 L 10 5 L 0 9 z" fill="#F59E0B" />
          </Marker>
        </Defs>

        {/* Pelouse tactique haute définition Tacticslot avec 10 bandes alternées */}
        <Rect x={0} y={0} width={vbW} height={vbH} rx={4} fill="#14532D" />
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
          <Rect
            key={i}
            x={i * (vbW / 10)}
            y={0}
            width={vbW / 20}
            height={vbH}
            fill="#166534"
            opacity={0.42}
          />
        ))}

        {/* Optional imported flat background (image or converted PDF diagram) */}
        {diagram.backgroundImageUri ? (
          <SvgImage
            href={{ uri: diagram.backgroundImageUri }}
            x={0}
            y={0}
            width={vbW}
            height={vbH}
            preserveAspectRatio="xMidYMid slice"
            opacity={diagram.backgroundImageOpacity ?? 0.85}
          />
        ) : null}

        {/* Pitch boundary and lines */}
        {renderPitchLines()}

        {/* Active animated motion trails (during playback) */}
        {renderActiveMovementTrails()}

        {/* Render order: 1. Zones, 2. Arrows, 3. Equipment, 4. Players, 5. Text */}
        {elements.filter((el): el is DiagramZoneElement => el.type === 'zone').map(renderZone)}
        {elements.filter((el): el is DiagramArrowElement => el.type === 'arrow').map(renderArrow)}
        {elements.filter((el): el is DiagramEquipmentElement => el.type === 'equipment').map(renderEquipment)}
        {elements.filter((el): el is DiagramPlayerElement => el.type === 'player').map(renderPlayer)}
        {elements.filter((el): el is DiagramTextElement => el.type === 'text').map(renderText)}
      </Svg>
    </View>
  );
};
