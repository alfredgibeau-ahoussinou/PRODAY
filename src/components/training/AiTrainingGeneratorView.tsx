import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ProDayText } from '../ui/ProDayText';
import { PressableSpring, StaggerReveal } from '../motion';
import { usePlayerTheme } from '../../context/PlayerThemeContext';
import { joueurGamePress, joueurGameReward } from '../../features/joueur/joueurSfx';
import type {
  TrainingPhase,
  TrainingObjective,
  TrainingLevel,
} from '../../models/TrainingSession';
import { phaseLabel } from '../../models/TrainingSession';

// 6 objectifs essentiels épurés pour éviter la surcharge
const MAIN_OBJECTIVES: {
  id: TrainingObjective;
  label: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    id: 'pied_faible',
    label: 'Pied faible',
    subtitle: 'Symétrie & Précision',
    icon: 'repeat-outline',
  },
  {
    id: 'frappe',
    label: 'Finition & Tirs',
    subtitle: 'Face au but & Puissance',
    icon: 'football-outline',
  },
  {
    id: 'vitesse',
    label: 'Vitesse & Explosivité',
    subtitle: 'Accélération & VMA',
    icon: 'flash-outline',
  },
  {
    id: 'dribble',
    label: 'Dribbles & 1v1',
    subtitle: 'Élimination & Agilité',
    icon: 'shuffle-outline',
  },
  {
    id: 'passes',
    label: 'Passes & Vision',
    subtitle: 'Jeu court, long & tempo',
    icon: 'arrow-redo-outline',
  },
  {
    id: 'physique',
    label: 'Physique & Cardio',
    subtitle: 'Gainage, caisse & appuis',
    icon: 'pulse-outline',
  },
];

const DURATIONS = [15, 30, 45] as const;

export interface AiTrainingGeneratorViewProps {
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
  onBack?: () => void;
}

export const AiTrainingGeneratorView: React.FC<AiTrainingGeneratorViewProps> = ({
  objective,
  onObjectiveChange,
  duration,
  onDurationChange,
  partner,
  onPartnerChange,
  generating,
  onGenerate,
  result,
  onReset,
  onBack,
}) => {
  const insets = useSafeAreaInsets();
  const { colors: playerTheme, clubColors } = usePlayerTheme();
  const teamColor = clubColors?.primary || playerTheme.accent || '#00E676';
  const [completed, setCompleted] = useState(false);

  // ==========================================
  // VUE 1 : RÉSULTATS DE LA SÉANCE IA (ÉPURÉE)
  // ==========================================
  if (result && result.length > 0) {
    const totalExercises = result.reduce((acc, phase) => acc + phase.exercises.length, 0);

    return (
      <View style={styles.root}>
        {/* Hood Ambient Glow */}
        <View
          style={[styles.ambientGlow, { backgroundColor: teamColor }]}
          pointerEvents="none"
        />

        {/* Navigation Header */}
        <View style={[styles.navHeader, { paddingTop: 6 }]}>
          <TouchableOpacity
            onPress={() => {
              joueurGamePress();
              onReset();
            }}
            style={styles.iconNavBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.modelPill}>
            <Ionicons name="sparkles" size={13} color={teamColor} />
            <ProDayText style={styles.modelPillText}>Séance Générée</ProDayText>
          </View>

          <TouchableOpacity
            onPress={() => {
              joueurGamePress();
              onReset();
            }}
            style={styles.iconNavBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh-outline" size={20} color="#A1A1AA" />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Résumé */}
          <View style={[styles.heroSummaryCard, { borderColor: `${teamColor}40` }]}>
            <ProDayText style={styles.heroSummaryTitle}>
              {MAIN_OBJECTIVES.find((o) => o.id === objective)?.label || 'Séance Personnalisée'}
            </ProDayText>
            <ProDayText style={styles.heroSummarySub}>
              {duration} minutes · {result.length} phases · {totalExercises} exercices
            </ProDayText>
          </View>

          {/* Déroulé des phases */}
          <View style={{ gap: 12 }}>
            {result.map((phase, pIdx) => (
              <StaggerReveal key={`${phase.name}-${pIdx}`} index={pIdx} delayStep={50}>
                <View style={styles.phaseCard}>
                  <View style={styles.phaseHeader}>
                    <View style={[styles.phaseDot, { backgroundColor: teamColor }]}>
                      <ProDayText style={styles.phaseDotText}>{pIdx + 1}</ProDayText>
                    </View>
                    <ProDayText style={styles.phaseTitle}>
                      {phase.label || phaseLabel(phase.name)} ({phase.duration_min} min)
                    </ProDayText>
                  </View>

                  <View style={{ gap: 8 }}>
                    {phase.exercises.map((ex, exIdx) => (
                      <View key={`ex-${pIdx}-${exIdx}`} style={styles.exerciseItem}>
                        <View style={styles.exerciseTopRow}>
                          <ProDayText style={styles.exerciseName}>{ex.name}</ProDayText>
                          {ex.sets || ex.reps ? (
                            <ProDayText style={[styles.exerciseReps, { color: teamColor }]}>
                              {ex.sets ? `${ex.sets} séries` : ''} {ex.reps ? `× ${ex.reps}` : ''}
                            </ProDayText>
                          ) : null}
                        </View>
                        <ProDayText style={styles.exerciseDesc}>{ex.description}</ProDayText>
                        {ex.tips && ex.tips.length > 0 ? (
                          <View style={styles.tipBox}>
                            <ProDayText style={styles.tipText}>💡 {ex.tips[0]}</ProDayText>
                          </View>
                        ) : null}
                      </View>
                    ))}
                  </View>
                </View>
              </StaggerReveal>
            ))}
          </View>

          {/* Bouton Terminer */}
          <TouchableOpacity
            onPress={() => {
              joueurGameReward('xp');
              setCompleted(true);
            }}
            style={[
              styles.primaryActionBtn,
              {
                backgroundColor: completed ? '#10B981' : teamColor,
                shadowColor: completed ? '#10B981' : teamColor,
              },
            ]}
            activeOpacity={0.85}
          >
            <Ionicons
              name={completed ? 'checkmark-circle' : 'play'}
              size={18}
              color="#000000"
            />
            <ProDayText style={styles.primaryActionText}>
              {completed ? 'Séance Validée (+30 XP)' : 'Démarrer la séance (+30 XP)'}
            </ProDayText>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ==========================================
  // VUE 2 : GÉNÉRATEUR ÉPURÉ STYLE CHATGPT / GEMINI
  // ==========================================
  return (
    <View style={styles.root}>
      {/* Hood Ambient Glow Top */}
      <View
        style={[styles.ambientGlow, { backgroundColor: teamColor }]}
        pointerEvents="none"
      />

      {/* En-tête Minimaliste */}
      <View style={[styles.navHeader, { paddingTop: 6 }]}>
        <TouchableOpacity
          onPress={() => {
            joueurGamePress();
            if (onBack) onBack();
          }}
          style={styles.iconNavBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.modelPill}>
          <Ionicons name="sparkles" size={14} color={teamColor} />
          <ProDayText style={styles.modelPillText}>Gemini Coach</ProDayText>
        </View>

        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Titre Principal Simplifié */}
        <View style={styles.titleBlock}>
          <ProDayText style={styles.mainTitle}>Que veux-tu bosser ?</ProDayText>
          <ProDayText style={styles.subtitle}>
            Sélectionne ton focus, l'IA génère ta routine sur-mesure.
          </ProDayText>
        </View>

        {/* 6 Cartes Focus Essentielles */}
        <View style={styles.cardsGrid}>
          {MAIN_OBJECTIVES.map((item) => {
            const isSelected = objective === item.id;
            return (
              <PressableSpring
                key={item.id}
                style={[
                  styles.focusCard,
                  isSelected && {
                    borderColor: teamColor,
                    backgroundColor: `${teamColor}14`,
                  },
                ]}
                onPress={() => {
                  joueurGamePress();
                  onObjectiveChange(item.id);
                }}
                scaleTo={0.97}
                haptic
              >
                <View
                  style={[
                    styles.cardIconWrap,
                    isSelected && { backgroundColor: `${teamColor}25` },
                  ]}
                >
                  <Ionicons
                    name={item.icon}
                    size={22}
                    color={isSelected ? teamColor : '#9CA3AF'}
                  />
                </View>

                <View style={{ flex: 1, gap: 2 }}>
                  <ProDayText
                    style={[
                      styles.cardTitle,
                      isSelected && { color: '#FFFFFF', fontWeight: '800' },
                    ]}
                  >
                    {item.label}
                  </ProDayText>
                  <ProDayText
                    style={[
                      styles.cardSub,
                      isSelected && { color: teamColor },
                    ]}
                    numberOfLines={1}
                  >
                    {item.subtitle}
                  </ProDayText>
                </View>

                {isSelected ? (
                  <View style={[styles.activeDot, { backgroundColor: teamColor }]} />
                ) : null}
              </PressableSpring>
            );
          })}
        </View>

        {/* Barre Durée & Format Simplifiée */}
        <View style={styles.settingsRow}>
          {/* Durée */}
          <View style={styles.durationSelector}>
            {DURATIONS.map((d) => {
              const isSelected = duration === d;
              return (
                <TouchableOpacity
                  key={d}
                  onPress={() => {
                    joueurGamePress();
                    onDurationChange(d);
                  }}
                  style={[
                    styles.durationBtn,
                    isSelected && {
                      backgroundColor: teamColor,
                      borderColor: teamColor,
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <ProDayText
                    style={[
                      styles.durationText,
                      isSelected && { color: '#000000', fontWeight: '900' },
                    ]}
                  >
                    {d} min
                  </ProDayText>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Solo / Duo Toggle */}
          <TouchableOpacity
            onPress={() => {
              joueurGamePress();
              onPartnerChange(!partner);
            }}
            style={[
              styles.formatBtn,
              partner && { borderColor: teamColor, backgroundColor: `${teamColor}12` },
            ]}
            activeOpacity={0.8}
          >
            <Ionicons
              name={partner ? 'people' : 'person'}
              size={15}
              color={partner ? teamColor : '#9CA3AF'}
            />
            <ProDayText
              style={[
                styles.formatText,
                partner && { color: '#FFFFFF', fontWeight: '700' },
              ]}
            >
              {partner ? 'Duo' : 'Solo'}
            </ProDayText>
          </TouchableOpacity>
        </View>

        {/* Bouton Unique : Générer avec l'IA */}
        <TouchableOpacity
          onPress={() => {
            joueurGamePress();
            void onGenerate();
          }}
          disabled={generating}
          style={[
            styles.generateBtn,
            {
              backgroundColor: teamColor,
              shadowColor: teamColor,
            },
          ]}
          activeOpacity={0.88}
        >
          {generating ? (
            <View style={styles.generatingRow}>
              <ActivityIndicator color="#000000" size="small" />
              <ProDayText style={styles.generateBtnText}>
                Calibrage Gemini...
              </ProDayText>
            </View>
          ) : (
            <View style={styles.ctaRow}>
              <Ionicons name="sparkles" size={18} color="#000000" />
              <ProDayText style={styles.generateBtnText}>
                Générer ma séance IA
              </ProDayText>
              <View style={styles.xpBadge}>
                <ProDayText style={styles.xpBadgeText}>+30 XP</ProDayText>
              </View>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  ambientGlow: {
    position: 'absolute',
    top: -100,
    left: '15%',
    width: '70%',
    height: 200,
    borderRadius: 100,
    opacity: 0.12,
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    zIndex: 10,
  },
  iconNavBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  modelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#14141B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  modelPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
    gap: 20,
  },
  titleBlock: {
    gap: 4,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 18,
  },
  cardsGrid: {
    gap: 10,
  },
  focusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#111116',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 16,
    padding: 14,
    position: 'relative',
  },
  cardIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E5E7EB',
  },
  cardSub: {
    fontSize: 11,
    color: '#6B7280',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    position: 'absolute',
    top: 14,
    right: 14,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  durationSelector: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#111116',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 4,
  },
  durationBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  durationText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  formatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#111116',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
  },
  formatText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  generateBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  generatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  generateBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#000000',
  },
  xpBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  xpBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#000000',
  },
  // Résultats
  heroSummaryCard: {
    backgroundColor: '#111116',
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    gap: 4,
  },
  heroSummaryTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  heroSummarySub: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  phaseCard: {
    backgroundColor: '#111116',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  phaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  phaseDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseDotText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000000',
  },
  phaseTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  exerciseItem: {
    backgroundColor: '#171720',
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  exerciseTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  exerciseName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    flexShrink: 1,
  },
  exerciseReps: {
    fontSize: 11,
    fontWeight: '800',
  },
  exerciseDesc: {
    fontSize: 12,
    color: '#9CA3AF',
    lineHeight: 16,
  },
  tipBox: {
    marginTop: 2,
    padding: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  tipText: {
    fontSize: 11,
    color: '#FAFAFA',
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 15,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    marginTop: 8,
  },
  primaryActionText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#000000',
  },
});
