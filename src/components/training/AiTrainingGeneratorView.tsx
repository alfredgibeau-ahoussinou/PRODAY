import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { ProDayText } from '../ui/ProDayText';
import { ProDayGradient } from '../ui/ProDayGradient';
import { ProDaySurface } from '../ui/ProDaySurface';
import { Icon, type IconName } from '../ui/Icon';
import { PressableSpring, StaggerReveal } from '../motion';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius } from '../../theme/designTokens';
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

const OBJECTIVE_ICONS: Record<TrainingObjective, IconName> = {
  technique: 'football',
  physique: 'star',
  tactique: 'trophy',
  recuperation: 'heart',
  vitesse: 'star',
  endurance: 'walk',
  frappe: 'star',
  dribble: 'football',
  passes: 'football',
  heading: 'shield',
  pied_faible: 'football',
};

const LEVEL_COLORS: Record<TrainingLevel, string> = {
  beginner: '#10B981',
  intermediate: '#F59E0B',
  advanced: '#EF4444',
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
  onStartSession,
}) => {
  const { colors } = useAppTheme();
  const [activeTab, setActiveTab] = useState<number>(0);

  if (result && result.length > 0) {
    const totalExercises = result.reduce((acc, phase) => acc + phase.exercises.length, 0);

    return (
      <ScrollView contentContainerStyle={styles.resultContainer} showsVerticalScrollIndicator={false}>
        {/* Header Carte Cyber Fut */}
        <ProDaySurface variant="card" style={[styles.summaryCard, { borderColor: `${colors.accent}66` }]}>
          <View style={styles.summaryTop}>
            <View style={[styles.aiBadge, { backgroundColor: colors.accentSoft }]}>
              <Icon name="star-four-points" size={14} color={colors.accent} />
              <ProDayText variant="caption" accent style={styles.aiBadgeText}>
                PROGRAMME IA SUR-MESURE
              </ProDayText>
            </View>
            <View style={[styles.levelTag, { backgroundColor: `${LEVEL_COLORS[level]}22`, borderColor: LEVEL_COLORS[level] }]}>
              <ProDayText variant="caption" style={{ color: LEVEL_COLORS[level], fontWeight: '800' }}>
                {TRAINING_LEVEL_LABELS[level]}
              </ProDayText>
            </View>
          </View>

          <ProDayText variant="title" style={styles.resultTitle}>
            {TRAINING_OBJECTIVE_LABELS[objective]}
          </ProDayText>

          <View style={styles.kpiRow}>
            <View style={styles.kpiCol}>
              <ProDayText variant="title" accent style={styles.kpiVal}>
                {duration}
              </ProDayText>
              <ProDayText variant="caption" muted style={styles.kpiLbl}>
                Minutes
              </ProDayText>
            </View>
            <View style={[styles.kpiDivider, { backgroundColor: colors.border }]} />
            <View style={styles.kpiCol}>
              <ProDayText variant="title" style={[styles.kpiVal, { color: colors.text }]}>
                {result.length}
              </ProDayText>
              <ProDayText variant="caption" muted style={styles.kpiLbl}>
                Phases
              </ProDayText>
            </View>
            <View style={[styles.kpiDivider, { backgroundColor: colors.border }]} />
            <View style={styles.kpiCol}>
              <ProDayText variant="title" style={[styles.kpiVal, { color: colors.text }]}>
                {totalExercises}
              </ProDayText>
              <ProDayText variant="caption" muted style={styles.kpiLbl}>
                Exercices
              </ProDayText>
            </View>
          </View>
        </ProDaySurface>

        {/* Phase Timeline Cards */}
        {result.map((phase, idx) => (
          <StaggerReveal key={`${phase.name}-${idx}`} index={idx} delayStep={50}>
            <ProDaySurface variant="module" style={[styles.phaseCard, { borderColor: colors.border }]}>
              <View style={styles.phaseHeader}>
                <View style={[styles.phaseNumber, { backgroundColor: colors.accentSoft }]}>
                  <ProDayText variant="caption" accent style={{ fontWeight: '900' }}>
                    0{idx + 1}
                  </ProDayText>
                </View>
                <View style={{ flex: 1 }}>
                  <ProDayText variant="section" style={{ fontWeight: '800' }}>
                    {phase.label || phaseLabel(phase.name)}
                  </ProDayText>
                  <ProDayText variant="caption" muted>
                    {phase.duration_min} minutes d’entraînement
                  </ProDayText>
                </View>
              </View>

              <View style={styles.exercisesList}>
                {phase.exercises.map((ex, exIdx) => (
                  <View key={`ex-${idx}-${exIdx}`} style={[styles.exerciseItem, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
                    <View style={styles.exTop}>
                      <ProDayText variant="body" style={styles.exName}>
                        {ex.name}
                      </ProDayText>
                      {(ex.sets || ex.reps) ? (
                        <View style={[styles.repsPill, { backgroundColor: colors.accentSoft }]}>
                          <ProDayText variant="caption" accent style={{ fontWeight: '800' }}>
                            {ex.sets ? `${ex.sets} séries` : ''} {ex.reps ? `× ${ex.reps} reps` : ''}
                          </ProDayText>
                        </View>
                      ) : null}
                    </View>

                    <ProDayText variant="caption" muted style={styles.exDesc}>
                      {ex.description}
                    </ProDayText>

                    {ex.rest_sec ? (
                      <View style={styles.restRow}>
                        <Icon name="time" size={12} color={colors.textMuted} />
                        <ProDayText variant="caption" muted>
                          Repos conseillé : {ex.rest_sec} secondes
                        </ProDayText>
                      </View>
                    ) : null}

                    {ex.tips && ex.tips.length > 0 ? (
                      <View style={[styles.tipsBox, { borderLeftColor: colors.accent }]}>
                        {ex.tips.map((tip, tIdx) => (
                          <ProDayText key={`tip-${tIdx}`} variant="caption" accent style={styles.tipText}>
                            💡 {tip}
                          </ProDayText>
                        ))}
                      </View>
                    ) : null}
                  </View>
                ))}
              </View>
            </ProDaySurface>
          </StaggerReveal>
        ))}

        {/* Action Bottom Controls */}
        <View style={styles.resultActions}>
          <PressableSpring onPress={onReset} scaleTo={0.97} haptic style={styles.halfBtn}>
            <View style={[styles.ghostBtn, { borderColor: colors.border }]}>
              <Icon name="tune" size={16} color={colors.text} />
              <ProDayText variant="caption" style={{ fontWeight: '800' }}>
                Paramètres
              </ProDayText>
            </View>
          </PressableSpring>

          <PressableSpring onPress={onReset} scaleTo={0.97} haptic style={styles.halfBtn}>
            <ProDayGradient kind="cta" style={styles.primaryBtn}>
              <Icon name="football" size={16} color="#0B1220" />
              <ProDayText variant="caption" inverse style={{ fontWeight: '900' }}>
                Terminer la séance
              </ProDayText>
            </ProDayGradient>
          </PressableSpring>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.formContainer} showsVerticalScrollIndicator={false}>
      {/* Intro Bannière High-Tech */}
      <View style={[styles.banner, { backgroundColor: colors.accentSoft, borderColor: `${colors.accent}44` }]}>
        <Icon name="star-four-points" size={24} color={colors.accent} />
        <View style={{ flex: 1 }}>
          <ProDayText variant="section" accent style={{ fontWeight: '900' }}>
            Coach IA ProDay
          </ProDayText>
          <ProDayText variant="caption" muted>
            Sélectionne tes critères et obtiens une séance individualisée en 2 secondes.
          </ProDayText>
        </View>
      </View>

      {/* 1. Objectif Athlétique & Tactique */}
      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeader}>
          <Icon name="trophy" size={16} color={colors.accent} />
          <ProDayText variant="section" style={styles.sectionTitle}>
            1. Objectif d’entraînement
          </ProDayText>
        </View>
        <View style={styles.gridGrid}>
          {INDIVIDUAL_OBJECTIVES.map((obj) => {
            const isSelected = objective === obj;
            return (
              <PressableSpring
                key={obj}
                style={[
                  styles.objectiveCard,
                  {
                    borderColor: isSelected ? colors.accent : colors.border,
                    backgroundColor: isSelected ? colors.accentSoft : colors.surface,
                  },
                ]}
                onPress={() => onObjectiveChange(obj)}
                scaleTo={0.96}
                haptic
              >
                <Icon
                  name={OBJECTIVE_ICONS[obj] || 'football'}
                  size={20}
                  color={isSelected ? colors.accent : colors.textMuted}
                />
                <ProDayText
                  variant="caption"
                  style={[
                    styles.cardText,
                    { color: isSelected ? colors.accent : colors.text, fontWeight: isSelected ? '800' : '600' },
                  ]}
                >
                  {TRAINING_OBJECTIVE_LABELS[obj]}
                </ProDayText>
              </PressableSpring>
            );
          })}
        </View>
      </View>

      {/* 2. Durée de Séance */}
      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeader}>
          <Icon name="time" size={16} color={colors.accent} />
          <ProDayText variant="section" style={styles.sectionTitle}>
            2. Temps disponible
          </ProDayText>
        </View>
        <View style={styles.durationRow}>
          {INDIVIDUAL_DURATIONS.map((d) => {
            const isSelected = duration === d;
            return (
              <PressableSpring
                key={d}
                style={[
                  styles.durationChip,
                  {
                    borderColor: isSelected ? colors.accent : colors.border,
                    backgroundColor: isSelected ? colors.accent : colors.surface,
                  },
                ]}
                onPress={() => onDurationChange(d)}
                scaleTo={0.96}
                haptic
              >
                <ProDayText
                  variant="caption"
                  inverse={isSelected}
                  style={[styles.durationText, !isSelected && { color: colors.text }]}
                >
                  {d} min
                </ProDayText>
              </PressableSpring>
            );
          })}
        </View>
      </View>

      {/* 3. Niveau d'Exigence */}
      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeader}>
          <Icon name="stats-chart" size={16} color={colors.accent} />
          <ProDayText variant="section" style={styles.sectionTitle}>
            3. Intensité / Niveau
          </ProDayText>
        </View>
        <View style={styles.levelRow}>
          {(['beginner', 'intermediate', 'advanced'] as TrainingLevel[]).map((lvl) => {
            const isSelected = level === lvl;
            const lvlColor = LEVEL_COLORS[lvl];
            return (
              <PressableSpring
                key={lvl}
                style={[
                  styles.levelCard,
                  {
                    borderColor: isSelected ? lvlColor : colors.border,
                    backgroundColor: isSelected ? `${lvlColor}22` : colors.surface,
                  },
                ]}
                onPress={() => onLevelChange(lvl)}
                scaleTo={0.96}
                haptic
              >
                <ProDayText
                  variant="caption"
                  style={{
                    color: isSelected ? lvlColor : colors.textSecondary,
                    fontWeight: isSelected ? '800' : '600',
                  }}
                >
                  {TRAINING_LEVEL_LABELS[lvl]}
                </ProDayText>
              </PressableSpring>
            );
          })}
        </View>
      </View>

      {/* 4. Matériel Disponible */}
      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeader}>
          <Icon name="bag" size={16} color={colors.accent} />
          <ProDayText variant="section" style={styles.sectionTitle}>
            4. Équipement disponible
          </ProDayText>
        </View>
        <View style={styles.equipmentRow}>
          {EQUIPMENT_OPTIONS.map((eq) => {
            const isSelected = equipment.includes(eq);
            return (
              <PressableSpring
                key={eq}
                style={[
                  styles.eqChip,
                  {
                    borderColor: isSelected ? colors.accent : colors.border,
                    backgroundColor: isSelected ? colors.accentSoft : colors.surface,
                  },
                ]}
                onPress={() => onToggleEquipment(eq)}
                scaleTo={0.96}
                haptic
              >
                <Icon name={isSelected ? 'checkmark-circle' : 'add'} size={14} color={isSelected ? colors.accent : colors.textMuted} />
                <ProDayText
                  variant="caption"
                  style={{
                    color: isSelected ? colors.accent : colors.textSecondary,
                    fontWeight: isSelected ? '800' : '500',
                  }}
                >
                  {eq}
                </ProDayText>
              </PressableSpring>
            );
          })}
        </View>
      </View>

      {/* 5. Partenaire */}
      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeader}>
          <Icon name="people" size={16} color={colors.accent} />
          <ProDayText variant="section" style={styles.sectionTitle}>
            5. Modalité
          </ProDayText>
        </View>
        <View style={styles.partnerRow}>
          {[
            { val: false, label: 'Solo (Seul)', icon: 'person' as const },
            { val: true, label: 'Duo (Avec partenaire)', icon: 'people' as const },
          ].map((opt) => {
            const isSelected = partner === opt.val;
            return (
              <PressableSpring
                key={String(opt.val)}
                style={[
                  styles.partnerCard,
                  {
                    borderColor: isSelected ? colors.accent : colors.border,
                    backgroundColor: isSelected ? colors.accentSoft : colors.surface,
                  },
                ]}
                onPress={() => onPartnerChange(opt.val)}
                scaleTo={0.96}
                haptic
              >
                <Icon name={opt.icon} size={18} color={isSelected ? colors.accent : colors.textMuted} />
                <ProDayText
                  variant="caption"
                  style={{
                    color: isSelected ? colors.accent : colors.text,
                    fontWeight: isSelected ? '800' : '600',
                  }}
                >
                  {opt.label}
                </ProDayText>
              </PressableSpring>
            );
          })}
        </View>
      </View>

      {/* Bouton de Lancement IA */}
      <PressableSpring
        onPress={() => void onGenerate()}
        disabled={generating}
        scaleTo={0.97}
        haptic
        style={{ marginTop: spacing.md }}
      >
        <ProDayGradient kind="cta" style={styles.generateCta}>
          {generating ? (
            <ActivityIndicator color="#0B1220" />
          ) : (
            <>
              <Icon name="star-four-points" size={20} color="#0B1220" />
              <ProDayText variant="section" inverse style={styles.ctaLabel}>
                Générer mon programme IA
              </ProDayText>
            </>
          )}
        </ProDayGradient>
      </PressableSpring>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  formContainer: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  resultContainer: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  sectionBlock: {
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  gridGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  objectiveCard: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  cardText: {
    fontSize: 12,
    flexShrink: 1,
  },
  durationRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  durationChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationText: {
    fontWeight: '800',
    fontSize: 13,
  },
  levelRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  levelCard: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  equipmentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  eqChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  partnerRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  partnerCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  generateCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 16,
    borderRadius: radius.pill,
  },
  ctaLabel: {
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  summaryCard: {
    borderWidth: 1.5,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  levelTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: '900',
  },
  kpiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: spacing.xs,
  },
  kpiCol: {
    alignItems: 'center',
    gap: 2,
  },
  kpiVal: {
    fontSize: 20,
    fontWeight: '900',
  },
  kpiLbl: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  kpiDivider: {
    width: 1,
    height: 28,
  },
  phaseCard: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: spacing.md,
  },
  phaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  phaseNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exercisesList: {
    gap: spacing.sm,
  },
  exerciseItem: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 6,
  },
  exTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  exName: {
    fontWeight: '800',
    fontSize: 14,
    flexShrink: 1,
  },
  repsPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  exDesc: {
    lineHeight: 18,
  },
  restRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  tipsBox: {
    borderLeftWidth: 2.5,
    paddingLeft: spacing.sm,
    marginTop: 4,
    gap: 2,
  },
  tipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  resultActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  halfBtn: {
    flex: 1,
  },
  ghostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: radius.pill,
  },
});
