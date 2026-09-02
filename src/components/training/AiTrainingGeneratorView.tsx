import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { ProDayText } from '../ui/ProDayText';
import { Icon, type IconName } from '../ui/Icon';
import { PressableSpring, StaggerReveal } from '../motion';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius } from '../../theme/designTokens';
import { PLAYER_DARK, PLAYER_DARK_RADIUS } from '../../theme/playerDarkPremium';
import type {
  TrainingPhase,
  TrainingObjective,
  TrainingLevel,
} from '../../models/TrainingSession';
import {
  INDIVIDUAL_OBJECTIVES,
  INDIVIDUAL_DURATIONS,
  EQUIPMENT_OPTIONS,
  TRAINING_OBJECTIVE_LABELS,
  TRAINING_LEVEL_LABELS,
  phaseLabel,
} from '../../models/TrainingSession';

const OBJECTIVE_CONFIG: Record<
  TrainingObjective,
  { icon: IconName; subtitle: string; gradient: [string, string] }
> = {
  technique: { icon: 'football', subtitle: 'Précision & Toucher', gradient: ['#10B981', '#047857'] },
  vitesse: { icon: 'star', subtitle: 'Explosivité & VMA', gradient: ['#F59E0B', '#D97706'] },
  frappe: { icon: 'star', subtitle: 'Finition & Puissance', gradient: ['#EF4444', '#B91C1C'] },
  dribble: { icon: 'football', subtitle: '1v1 & Dextérité', gradient: ['#8B5CF6', '#6D28D9'] },
  passes: { icon: 'football', subtitle: 'Vision & Jeu court/long', gradient: ['#06B6D4', '#0891B2'] },
  tactique: { icon: 'trophy', subtitle: 'Placement & Anticipation', gradient: ['#3B82F6', '#1D4ED8'] },
  physique: { icon: 'star', subtitle: 'Gainage & Puissance', gradient: ['#F97316', '#C2410C'] },
  endurance: { icon: 'walk', subtitle: 'Cardio & Résistance', gradient: ['#EC4899', '#BE185D'] },
  recuperation: { icon: 'heart', subtitle: 'Mobilité & Décrassage', gradient: ['#14B8A6', '#0F766E'] },
  heading: { icon: 'shield', subtitle: 'Jeu de tête & Timing', gradient: ['#64748B', '#334155'] },
  pied_faible: { icon: 'football', subtitle: 'Symétrie & Confort', gradient: ['#A855F7', '#7E22CE'] },
};

const LEVEL_THEMES: Record<
  TrainingLevel,
  { label: string; color: string; bg: string; border: string }
> = {
  beginner: { label: 'Accessible', color: '#34D399', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.35)' },
  intermediate: { label: 'Rythmé', color: '#FBBF24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.35)' },
  advanced: { label: 'Intense Pro', color: '#F87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.35)' },
};

interface AiTrainingGeneratorViewProps {
  objective: TrainingObjective;
  onObjectiveChange: (obj: TrainingObjective) => void;
  duration: number;
  onDurationChange: (d: number) => void;
  level: TrainingLevel;
  onLevelChange: (lvl: TrainingLevel) => void;
  equipment: string[];
  onToggleEquipment: (eq: string) => void;
  partner: boolean;
  onPartnerChange: (p: boolean) => void;
  generating: boolean;
  onGenerate: () => Promise<void>;
  result: TrainingPhase[] | null;
  onReset: () => void;
  onStartSession?: () => void;
}

export const AiTrainingGeneratorView: React.FC<AiTrainingGeneratorViewProps> = ({
  objective,
  onObjectiveChange,
  duration,
  onDurationChange,
  level,
  onLevelChange,
  equipment,
  onToggleEquipment,
  partner,
  onPartnerChange,
  generating,
  onGenerate,
  result,
  onReset,
}) => {
  const { colors } = useAppTheme();

  // Mode Résultats de Séance
  if (result && result.length > 0) {
    const totalExercises = result.reduce((acc, phase) => acc + phase.exercises.length, 0);

    return (
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* En-tête Carte Gold / Cyber */}
        <View style={styles.heroSummary}>
          <View style={styles.heroTopRow}>
            <View style={styles.aiTag}>
              <Icon name="star-four-points" size={13} color={PLAYER_DARK.accent} />
              <ProDayText variant="caption" style={styles.aiTagText}>
                PROGRAMME INTELLIGENT
              </ProDayText>
            </View>
            <View style={[styles.badgePill, { backgroundColor: LEVEL_THEMES[level].bg, borderColor: LEVEL_THEMES[level].border }]}>
              <ProDayText variant="caption" style={{ color: LEVEL_THEMES[level].color, fontWeight: '800', fontSize: 11 }}>
                {LEVEL_THEMES[level].label}
              </ProDayText>
            </View>
          </View>

          <ProDayText variant="title" style={styles.heroTitle}>
            {TRAINING_OBJECTIVE_LABELS[objective]}
          </ProDayText>

          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <ProDayText variant="title" style={styles.metricNumber}>
                {duration}
              </ProDayText>
              <ProDayText variant="caption" style={styles.metricLabel}>
                MINUTES
              </ProDayText>
            </View>
            <View style={styles.metricSep} />
            <View style={styles.metricItem}>
              <ProDayText variant="title" style={[styles.metricNumber, { color: PLAYER_DARK.text }]}>
                {result.length}
              </ProDayText>
              <ProDayText variant="caption" style={styles.metricLabel}>
                PHASES
              </ProDayText>
            </View>
            <View style={styles.metricSep} />
            <View style={styles.metricItem}>
              <ProDayText variant="title" style={[styles.metricNumber, { color: PLAYER_DARK.accentAlt }]}>
                {totalExercises}
              </ProDayText>
              <ProDayText variant="caption" style={styles.metricLabel}>
                EXERCICES
              </ProDayText>
            </View>
          </View>
        </View>

        {/* Déroulé des Phases */}
        {result.map((phase, idx) => (
          <StaggerReveal key={`${phase.name}-${idx}`} index={idx} delayStep={50}>
            <View style={styles.phaseBlock}>
              <View style={styles.phaseHead}>
                <View style={styles.phaseIdxWrap}>
                  <ProDayText variant="caption" style={styles.phaseIdx}>
                    0{idx + 1}
                  </ProDayText>
                </View>
                <View style={styles.phaseHeadCopy}>
                  <ProDayText variant="section" style={styles.phaseName}>
                    {phase.label || phaseLabel(phase.name)}
                  </ProDayText>
                  <ProDayText variant="caption" style={styles.phaseDur}>
                    {phase.duration_min} minutes
                  </ProDayText>
                </View>
              </View>

              <View style={styles.exStack}>
                {phase.exercises.map((ex, exIdx) => (
                  <View key={`ex-${idx}-${exIdx}`} style={styles.exCard}>
                    <View style={styles.exHeaderRow}>
                      <ProDayText variant="body" style={styles.exTitle}>
                        {ex.name}
                      </ProDayText>
                      {(ex.sets || ex.reps) ? (
                        <View style={styles.setsTag}>
                          <ProDayText variant="caption" style={styles.setsTagText}>
                            {ex.sets ? `${ex.sets} séries` : ''} {ex.reps ? `× ${ex.reps} reps` : ''}
                          </ProDayText>
                        </View>
                      ) : null}
                    </View>

                    <ProDayText variant="caption" style={styles.exDesc}>
                      {ex.description}
                    </ProDayText>

                    {ex.rest_sec ? (
                      <View style={styles.restBar}>
                        <Icon name="time" size={12} color={PLAYER_DARK.textMuted} />
                        <ProDayText variant="caption" style={styles.restText}>
                          Repos : {ex.rest_sec}s
                        </ProDayText>
                      </View>
                    ) : null}

                    {ex.tips && ex.tips.length > 0 ? (
                      <View style={styles.tipCard}>
                        {ex.tips.map((tip, tIdx) => (
                          <ProDayText key={`tip-${tIdx}`} variant="caption" style={styles.tipBody}>
                            💡 {tip}
                          </ProDayText>
                        ))}
                      </View>
                    ) : null}
                  </View>
                ))}
              </View>
            </View>
          </StaggerReveal>
        ))}

        {/* Actions Réglages & Fin */}
        <View style={styles.actionBottomRow}>
          <PressableSpring onPress={onReset} scaleTo={0.97} haptic style={styles.flexBtn}>
            <View style={styles.secondaryBtn}>
              <Icon name="tune" size={16} color={PLAYER_DARK.text} />
              <ProDayText variant="caption" style={styles.secondaryBtnText}>
                Modifier
              </ProDayText>
            </View>
          </PressableSpring>

          <PressableSpring onPress={onReset} scaleTo={0.97} haptic style={styles.flexBtn}>
            <View style={styles.primaryFinishBtn}>
              <Icon name="football" size={16} color={PLAYER_DARK.bg} />
              <ProDayText variant="caption" style={styles.primaryFinishText}>
                Terminer (+30 XP)
              </ProDayText>
            </View>
          </PressableSpring>
        </View>
      </ScrollView>
    );
  }

  // Mode Configuration Formulaire
  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Glassmorphism Pro */}
      <View style={styles.headerGlass}>
        <View style={styles.headerGlowCircle}>
          <Icon name="star-four-points" size={26} color={PLAYER_DARK.accent} />
        </View>
        <View style={styles.headerCopy}>
          <ProDayText variant="section" style={styles.headerMainTitle}>
            Générateur ProDay IA
          </ProDayText>
          <ProDayText variant="caption" style={styles.headerSubtitle}>
            Séance sur-mesure calibrée selon ta forme et tes objectifs.
          </ProDayText>
        </View>
      </View>

      {/* 1. Objectif Athlétique */}
      <View style={styles.sectionGroup}>
        <View style={styles.labelRow}>
          <Icon name="trophy" size={15} color={PLAYER_DARK.accent} />
          <ProDayText variant="section" style={styles.sectionHeading}>
            1. Thématique de travail
          </ProDayText>
        </View>
        <View style={styles.objectiveGrid}>
          {INDIVIDUAL_OBJECTIVES.map((obj) => {
            const isSelected = objective === obj;
            const cfg = OBJECTIVE_CONFIG[obj] || { icon: 'football', subtitle: 'Entraînement' };
            return (
              <PressableSpring
                key={obj}
                style={[
                  styles.objCell,
                  isSelected && styles.objCellActive,
                ]}
                onPress={() => onObjectiveChange(obj)}
                scaleTo={0.96}
                haptic
              >
                <View style={[styles.objIconWrap, isSelected && styles.objIconWrapActive]}>
                  <Icon
                    name={cfg.icon}
                    size={18}
                    color={isSelected ? PLAYER_DARK.accent : PLAYER_DARK.textMuted}
                  />
                </View>
                <View style={styles.objCellText}>
                  <ProDayText
                    variant="caption"
                    style={[styles.objName, isSelected && { color: PLAYER_DARK.accent, fontWeight: '800' }]}
                  >
                    {TRAINING_OBJECTIVE_LABELS[obj]}
                  </ProDayText>
                  <ProDayText variant="caption" style={styles.objSub} numberOfLines={1}>
                    {cfg.subtitle}
                  </ProDayText>
                </View>
              </PressableSpring>
            );
          })}
        </View>
      </View>

      {/* 2. Durée de Séance */}
      <View style={styles.sectionGroup}>
        <View style={styles.labelRow}>
          <Icon name="time" size={15} color={PLAYER_DARK.accent} />
          <ProDayText variant="section" style={styles.sectionHeading}>
            2. Durée
          </ProDayText>
        </View>
        <View style={styles.pillRow}>
          {INDIVIDUAL_DURATIONS.map((d) => {
            const isSelected = duration === d;
            return (
              <PressableSpring
                key={d}
                style={[styles.timeChip, isSelected && styles.timeChipActive]}
                onPress={() => onDurationChange(d)}
                scaleTo={0.96}
                haptic
              >
                <ProDayText
                  variant="caption"
                  style={[styles.timeChipText, isSelected && styles.timeChipTextActive]}
                >
                  {d} min
                </ProDayText>
              </PressableSpring>
            );
          })}
        </View>
      </View>

      {/* 3. Niveau d'Intensité */}
      <View style={styles.sectionGroup}>
        <View style={styles.labelRow}>
          <Icon name="stats-chart" size={15} color={PLAYER_DARK.accent} />
          <ProDayText variant="section" style={styles.sectionHeading}>
            3. Intensité
          </ProDayText>
        </View>
        <View style={styles.levelRow}>
          {(['beginner', 'intermediate', 'advanced'] as TrainingLevel[]).map((lvl) => {
            const isSelected = level === lvl;
            const theme = LEVEL_THEMES[lvl];
            return (
              <PressableSpring
                key={lvl}
                style={[
                  styles.lvlBtn,
                  isSelected && { backgroundColor: theme.bg, borderColor: theme.color },
                ]}
                onPress={() => onLevelChange(lvl)}
                scaleTo={0.96}
                haptic
              >
                <ProDayText
                  variant="caption"
                  style={[styles.lvlText, isSelected && { color: theme.color, fontWeight: '900' }]}
                >
                  {theme.label}
                </ProDayText>
              </PressableSpring>
            );
          })}
        </View>
      </View>

      {/* 4. Matériel */}
      <View style={styles.sectionGroup}>
        <View style={styles.labelRow}>
          <Icon name="bag" size={15} color={PLAYER_DARK.accent} />
          <ProDayText variant="section" style={styles.sectionHeading}>
            4. Matériel sur place
          </ProDayText>
        </View>
        <View style={styles.equipRow}>
          {EQUIPMENT_OPTIONS.map((eq) => {
            const isSelected = equipment.includes(eq);
            return (
              <PressableSpring
                key={eq}
                style={[styles.equipTag, isSelected && styles.equipTagActive]}
                onPress={() => onToggleEquipment(eq)}
                scaleTo={0.96}
                haptic
              >
                <Icon
                  name={isSelected ? 'checkmark-circle' : 'add'}
                  size={14}
                  color={isSelected ? PLAYER_DARK.accent : PLAYER_DARK.textMuted}
                />
                <ProDayText
                  variant="caption"
                  style={[styles.equipText, isSelected && styles.equipTextActive]}
                >
                  {eq}
                </ProDayText>
              </PressableSpring>
            );
          })}
        </View>
      </View>

      {/* 5. Mode Solo / Duo */}
      <View style={styles.sectionGroup}>
        <View style={styles.labelRow}>
          <Icon name="people" size={15} color={PLAYER_DARK.accent} />
          <ProDayText variant="section" style={styles.sectionHeading}>
            5. Joueurs
          </ProDayText>
        </View>
        <View style={styles.modalRow}>
          {[
            { val: false, label: 'Solo (Seul)', icon: 'person' as const },
            { val: true, label: 'Avec un coéquipier', icon: 'people' as const },
          ].map((opt) => {
            const isSelected = partner === opt.val;
            return (
              <PressableSpring
                key={String(opt.val)}
                style={[styles.modalCard, isSelected && styles.modalCardActive]}
                onPress={() => onPartnerChange(opt.val)}
                scaleTo={0.96}
                haptic
              >
                <Icon
                  name={opt.icon}
                  size={16}
                  color={isSelected ? PLAYER_DARK.accent : PLAYER_DARK.textMuted}
                />
                <ProDayText
                  variant="caption"
                  style={[styles.modalLabel, isSelected && { color: PLAYER_DARK.accent, fontWeight: '800' }]}
                >
                  {opt.label}
                </ProDayText>
              </PressableSpring>
            );
          })}
        </View>
      </View>

      {/* CTA de Génération Ultra-Glow */}
      <PressableSpring
        onPress={() => void onGenerate()}
        disabled={generating}
        scaleTo={0.97}
        haptic
        style={{ marginTop: spacing.md }}
      >
        <View style={styles.glowCta}>
          {generating ? (
            <ActivityIndicator color={PLAYER_DARK.bg} />
          ) : (
            <>
              <Icon name="star-four-points" size={18} color={PLAYER_DARK.bg} />
              <ProDayText variant="section" style={styles.glowCtaLabel}>
                Générer mon programme IA
              </ProDayText>
            </>
          )}
        </View>
      </PressableSpring>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  headerGlass: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: PLAYER_DARK.surface,
    borderWidth: 1,
    borderColor: PLAYER_DARK.borderStrong,
    borderRadius: PLAYER_DARK_RADIUS.card,
    padding: spacing.md,
  },
  headerGlowCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: PLAYER_DARK.accentSoft,
    borderWidth: 1,
    borderColor: PLAYER_DARK.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  headerMainTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: PLAYER_DARK.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: PLAYER_DARK.textMuted,
    lineHeight: 16,
  },
  sectionGroup: {
    gap: spacing.xs,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: PLAYER_DARK.text,
    letterSpacing: 0.2,
  },
  objectiveGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  objCell: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: PLAYER_DARK.surface,
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
    borderRadius: 14,
    padding: spacing.sm,
  },
  objCellActive: {
    borderColor: PLAYER_DARK.accent,
    backgroundColor: PLAYER_DARK.accentSoft,
  },
  objIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  objIconWrapActive: {
    backgroundColor: 'rgba(0,230,118,0.2)',
  },
  objCellText: {
    flex: 1,
  },
  objName: {
    fontSize: 12,
    color: PLAYER_DARK.text,
    fontWeight: '600',
  },
  objSub: {
    fontSize: 10,
    color: PLAYER_DARK.textMuted,
    marginTop: 1,
  },
  pillRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  timeChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: PLAYER_DARK_RADIUS.pill,
    backgroundColor: PLAYER_DARK.surface,
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeChipActive: {
    backgroundColor: PLAYER_DARK.accent,
    borderColor: PLAYER_DARK.accent,
  },
  timeChipText: {
    fontWeight: '800',
    fontSize: 13,
    color: PLAYER_DARK.text,
  },
  timeChipTextActive: {
    color: PLAYER_DARK.bg,
  },
  levelRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  lvlBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: PLAYER_DARK.surface,
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lvlText: {
    fontWeight: '700',
    fontSize: 12,
    color: PLAYER_DARK.textMuted,
  },
  equipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  equipTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: PLAYER_DARK_RADIUS.pill,
    backgroundColor: PLAYER_DARK.surface,
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
  },
  equipTagActive: {
    backgroundColor: PLAYER_DARK.accentSoft,
    borderColor: PLAYER_DARK.accent,
  },
  equipText: {
    fontSize: 12,
    color: PLAYER_DARK.textMuted,
    fontWeight: '600',
  },
  equipTextActive: {
    color: PLAYER_DARK.accent,
    fontWeight: '800',
  },
  modalRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  modalCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: PLAYER_DARK.surface,
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
  },
  modalCardActive: {
    backgroundColor: PLAYER_DARK.accentSoft,
    borderColor: PLAYER_DARK.accent,
  },
  modalLabel: {
    fontSize: 12,
    color: PLAYER_DARK.textMuted,
    fontWeight: '600',
  },
  glowCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 16,
    borderRadius: PLAYER_DARK_RADIUS.pill,
    backgroundColor: PLAYER_DARK.accent,
    shadowColor: PLAYER_DARK.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 4,
  },
  glowCtaLabel: {
    fontSize: 14,
    fontWeight: '900',
    color: PLAYER_DARK.bg,
    letterSpacing: 0.4,
  },
  heroSummary: {
    backgroundColor: PLAYER_DARK.surface,
    borderWidth: 1,
    borderColor: `${PLAYER_DARK.accent}55`,
    borderRadius: PLAYER_DARK_RADIUS.card,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  aiTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: PLAYER_DARK_RADIUS.pill,
    backgroundColor: PLAYER_DARK.accentSoft,
  },
  aiTagText: {
    fontSize: 9,
    fontWeight: '900',
    color: PLAYER_DARK.accent,
    letterSpacing: 0.6,
  },
  badgePill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: PLAYER_DARK_RADIUS.pill,
    borderWidth: 1,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: PLAYER_DARK.text,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: PLAYER_DARK.border,
  },
  metricItem: {
    alignItems: 'center',
    gap: 2,
  },
  metricNumber: {
    fontSize: 22,
    fontWeight: '900',
    color: PLAYER_DARK.accent,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: PLAYER_DARK.textMuted,
    letterSpacing: 0.6,
  },
  metricSep: {
    width: 1,
    height: 24,
    backgroundColor: PLAYER_DARK.border,
  },
  phaseBlock: {
    backgroundColor: PLAYER_DARK.surface,
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
    borderRadius: PLAYER_DARK_RADIUS.card,
    padding: spacing.md,
    gap: spacing.md,
  },
  phaseHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  phaseIdxWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: PLAYER_DARK.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseIdx: {
    fontWeight: '900',
    color: PLAYER_DARK.accent,
  },
  phaseHeadCopy: {
    flex: 1,
  },
  phaseName: {
    fontSize: 14,
    fontWeight: '800',
    color: PLAYER_DARK.text,
  },
  phaseDur: {
    fontSize: 11,
    color: PLAYER_DARK.textMuted,
  },
  exStack: {
    gap: spacing.xs,
  },
  exCard: {
    backgroundColor: PLAYER_DARK.bgElevated,
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
    borderRadius: 12,
    padding: spacing.md,
    gap: 4,
  },
  exHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  exTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: PLAYER_DARK.text,
    flexShrink: 1,
  },
  setsTag: {
    backgroundColor: PLAYER_DARK.accentSoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: PLAYER_DARK_RADIUS.pill,
  },
  setsTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: PLAYER_DARK.accent,
  },
  exDesc: {
    fontSize: 12,
    color: PLAYER_DARK.textMuted,
    lineHeight: 16,
  },
  restBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  restText: {
    fontSize: 10,
    color: PLAYER_DARK.textMuted,
  },
  tipCard: {
    borderLeftWidth: 2,
    borderLeftColor: PLAYER_DARK.accentAlt,
    paddingLeft: spacing.sm,
    marginTop: 4,
    gap: 2,
  },
  tipBody: {
    fontSize: 11,
    color: PLAYER_DARK.accentAlt,
  },
  actionBottomRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  flexBtn: {
    flex: 1,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: PLAYER_DARK_RADIUS.pill,
    backgroundColor: PLAYER_DARK.surface,
    borderWidth: 1,
    borderColor: PLAYER_DARK.borderStrong,
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: PLAYER_DARK.text,
  },
  primaryFinishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: PLAYER_DARK_RADIUS.pill,
    backgroundColor: PLAYER_DARK.accent,
  },
  primaryFinishText: {
    fontSize: 13,
    fontWeight: '900',
    color: PLAYER_DARK.bg,
  },
});
