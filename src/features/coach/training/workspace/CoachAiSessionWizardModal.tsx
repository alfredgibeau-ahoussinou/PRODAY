import React, { useState, useMemo } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useCoachTheme } from '../../shell/CoachThemeContext';
import { PRELOADED_DRILLS, getDrillsByCategory } from './trainingLibraryData';
import { CoachPitchEngine } from './CoachPitchEngine';
import type {
  Drill,
  PitchConfiguration,
  TrainingSession,
  DrillCategory,
} from './trainingWorkspaceModel';

interface CoachAiSessionWizardModalProps {
  visible: boolean;
  onClose: () => void;
  onApplySession: (session: TrainingSession) => void;
  onOpenInStudio?: (drill: Drill) => void;
}

const TACTICAL_THEMES = [
  { id: 'build_up', label: 'Relance propre & sortie de balle', icon: 'shield-outline', pitch: 'half' as PitchConfiguration, cat: 'build_up' as DrillCategory },
  { id: 'pressing', label: 'Pressing haut & récupération rapide', icon: 'flash-outline', pitch: 'attacking_third' as PitchConfiguration, cat: 'pressing' as DrillCategory },
  { id: 'possession', label: 'Conservation & jeu en appui/soutien', icon: 'repeat-outline', pitch: 'box' as PitchConfiguration, cat: 'possession' as DrillCategory },
  { id: 'finishing', label: 'Attaque rapide & finition au but', icon: 'football-outline', pitch: 'half' as PitchConfiguration, cat: 'finishing' as DrillCategory },
  { id: 'transition', label: 'Transition offensive & contre-attaque', icon: 'swap-horizontal-outline', pitch: 'full' as PitchConfiguration, cat: 'transition' as DrillCategory },
  { id: 'set_pieces', label: 'Coups de pied arrêtés & corners', icon: 'flag-outline', pitch: 'box' as PitchConfiguration, cat: 'set_pieces' as DrillCategory },
];

const AGE_CATEGORIES = ['U9-U11', 'U12-U13', 'U14-U15', 'U16-U18', 'Séniors'];
const DURATIONS = [60, 75, 90, 105, 120];

export const CoachAiSessionWizardModal: React.FC<CoachAiSessionWizardModalProps> = ({
  visible,
  onClose,
  onApplySession,
  onOpenInStudio,
}) => {
  const { tokens } = useCoachTheme();
  const { width: winWidth } = useWindowDimensions();
  const isDesktop = winWidth >= 768;

  // Wizard state: 1 = Context, 2 = Theme & Constraints, 3 = Generation, 4 = Review
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form parameters
  const [ageCategory, setAgeCategory] = useState<string>('U14-U15');
  const [playerCount, setPlayerCount] = useState<string>('16');
  const [durationMin, setDurationMin] = useState<number>(90);
  const [selectedThemeId, setSelectedThemeId] = useState<string>('build_up');
  const [additionalNotes, setAdditionalNotes] = useState<string>('');

  // Generation status
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedSession, setGeneratedSession] = useState<TrainingSession | null>(null);
  const [activePreviewDrillIndex, setActivePreviewDrillIndex] = useState<number>(0);

  const selectedTheme = useMemo(
    () => TACTICAL_THEMES.find((t) => t.id === selectedThemeId) || TACTICAL_THEMES[0],
    [selectedThemeId],
  );

  const handleGenerate = () => {
    setStep(3);
    setIsGenerating(true);

    setTimeout(() => {
      const candidateDrills = PRELOADED_DRILLS;
      const themeDrills = candidateDrills.slice(0, 3);
      const parsedPlayers = parseInt(playerCount, 10) || 16;

      const warmUpMin = Math.round(durationMin * 0.2);
      const drill1Min = Math.round(durationMin * 0.3);
      const drill2Min = Math.round(durationMin * 0.35);

      const finalDrills: Drill[] = [
        {
          ...themeDrills[0],
          id: `drill-gen-1-${Date.now()}`,
          name: `Échauffement · ${selectedTheme.label}`,
          category: selectedTheme.cat,
          objective: 'Mise en route neuromusculaire et orientation du corps',
          pitchConfig: selectedTheme.pitch,
          durationMin: warmUpMin,
          playerCount: parsedPlayers,
          coachingPoints: [
            'Mise en route neuromusculaire avec ballon',
            'Orientation du corps avant la réception',
          ],
        },
        {
          ...themeDrills[1],
          id: `drill-gen-2-${Date.now()}`,
          name: `Atelier spécifique · ${selectedTheme.label}`,
          category: selectedTheme.cat,
          objective: 'Fixer l’adversaire pour libérer le 3e homme',
          pitchConfig: selectedTheme.pitch,
          durationMin: drill1Min,
          playerCount: parsedPlayers,
          coachingPoints: [
            'Fixer l’adversaire pour libérer le 3e homme',
            'Rythme de passe appuyée au sol',
          ],
        },
        {
          ...themeDrills[2],
          id: `drill-gen-3-${Date.now()}`,
          name: `Situation globale · ${selectedTheme.label}`,
          category: selectedTheme.cat,
          objective: 'Transfert en situation de match à effectif réduit',
          pitchConfig: selectedTheme.pitch,
          durationMin: drill2Min,
          playerCount: parsedPlayers,
          coachingPoints: [
            'Transfert en situation de match à effectif réduit',
            'Validation des repères collectifs sous pression',
          ],
        },
      ];

      const newSession: TrainingSession = {
        id: `session-gen-${Date.now()}`,
        title: `Séance FFF · ${selectedTheme.label}`,
        date: new Date().toISOString(),
        totalDurationMin: durationMin,
        focus: selectedTheme.label,
        drills: finalDrills,
        notes: `Assistant Tactique ProDay · Effectif : ${parsedPlayers} joueurs (${ageCategory}) · ${additionalNotes}`.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setGeneratedSession(newSession);
      setIsGenerating(false);
      setStep(4);
    }, 850);
  };

  const currentPreviewDrill = generatedSession?.drills[activePreviewDrillIndex] || PRELOADED_DRILLS[0];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.modalCard, isDesktop && styles.modalCardDesktop]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.badgeAi}>
                <Ionicons name="sparkles" size={14} color="#00E676" />
                <Text style={styles.badgeAiText}>Assistant Tactique ProDay</Text>
              </View>
              <Text style={styles.title}>Générateur de Séance Tactique</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel="Fermer">
              <Ionicons name="close" size={20} color={tokens.muted} />
            </TouchableOpacity>
          </View>

          {/* Stepper Progress */}
          <View style={styles.stepper}>
            {[
              { num: 1, label: 'Contexte' },
              { num: 2, label: 'Thématique' },
              { num: 3, label: 'Génération' },
              { num: 4, label: 'Validation' },
            ].map((s) => {
              const active = step === s.num;
              const completed = step > s.num;
              return (
                <View key={s.num} style={styles.stepItem}>
                  <View
                    style={[
                      styles.stepCircle,
                      active && styles.stepCircleActive,
                      completed && styles.stepCircleCompleted,
                    ]}
                  >
                    {completed ? (
                      <Ionicons name="checkmark" size={14} color="#000" />
                    ) : (
                      <Text style={[styles.stepNumText, active && styles.stepNumTextActive]}>
                        {s.num}
                      </Text>
                    )}
                  </View>
                  <Text style={[styles.stepLabelText, active && styles.stepLabelTextActive]}>
                    {s.label}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Body Content */}
          <ScrollView contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
            {step === 1 && (
              <View style={styles.stepSection}>
                <Text style={styles.sectionHeading}>1. Définissez le cadre de votre séance</Text>
                <Text style={styles.sectionSubtitle}>
                  L’assistant adaptera les dimensions du terrain, la densité des joueurs et les temps de travail.
                </Text>

                {/* Age Category */}
                <Text style={styles.fieldLabel}>Catégorie d’âge</Text>
                <View style={styles.chipsRow}>
                  {AGE_CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setAgeCategory(cat)}
                      style={[styles.chip, ageCategory === cat && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, ageCategory === cat && styles.chipTextActive]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Players Count */}
                <Text style={styles.fieldLabel}>Joueurs attendus sur le terrain</Text>
                <TextInput
                  value={playerCount}
                  onChangeText={setPlayerCount}
                  keyboardType="numeric"
                  placeholder="16"
                  placeholderTextColor={tokens.muted}
                  style={styles.input}
                />

                {/* Duration */}
                <Text style={styles.fieldLabel}>Durée totale de la séance</Text>
                <View style={styles.chipsRow}>
                  {DURATIONS.map((dur) => (
                    <TouchableOpacity
                      key={dur}
                      onPress={() => setDurationMin(dur)}
                      style={[styles.chip, durationMin === dur && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, durationMin === dur && styles.chipTextActive]}>
                        {dur} min
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {step === 2 && (
              <View style={styles.stepSection}>
                <Text style={styles.sectionHeading}>2. Choisissez la thématique tactique FFF</Text>
                <Text style={styles.sectionSubtitle}>
                  Chaque atelier sera construit avec une progression pédagogique complète et schémas animés.
                </Text>

                <View style={styles.themesGrid}>
                  {TACTICAL_THEMES.map((th) => {
                    const isSelected = selectedThemeId === th.id;
                    return (
                      <TouchableOpacity
                        key={th.id}
                        onPress={() => setSelectedThemeId(th.id)}
                        style={[styles.themeCard, isSelected && styles.themeCardActive]}
                      >
                        <View style={[styles.themeIconWrap, isSelected && styles.themeIconWrapActive]}>
                          <Ionicons
                            name={th.icon as any}
                            size={20}
                            color={isSelected ? '#00E676' : tokens.muted}
                          />
                        </View>
                        <Text style={[styles.themeLabel, isSelected && styles.themeLabelActive]}>
                          {th.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.fieldLabel}>Consignes & contraintes optionnelles</Text>
                <TextInput
                  value={additionalNotes}
                  onChangeText={setAdditionalNotes}
                  multiline
                  numberOfLines={3}
                  placeholder="Ex : Insister sur le jeu en 1 touche et le rôle des latéraux hauts..."
                  placeholderTextColor={tokens.muted}
                  style={[styles.input, styles.textarea]}
                />
              </View>
            )}

            {step === 3 && (
              <View style={styles.generationLoadingBox}>
                <ActivityIndicator size="large" color="#00E676" />
                <Text style={styles.generationTitle}>Génération tactique en cours...</Text>
                <Text style={styles.generationSub}>
                  Construction des schémas de terrain, placement des coupelles et calcul des phases animées.
                </Text>
              </View>
            )}

            {step === 4 && generatedSession && (
              <View style={styles.stepSection}>
                <View style={styles.summaryBanner}>
                  <View>
                    <Text style={styles.summaryTitle}>{generatedSession.title}</Text>
                    <Text style={styles.summaryMeta}>
                      {generatedSession.focus} · {generatedSession.totalDurationMin} min ·{' '}
                      {playerCount} joueurs ({ageCategory})
                    </Text>
                  </View>
                  <View style={styles.readyBadge}>
                    <Ionicons name="checkmark-done" size={14} color="#00E676" />
                    <Text style={styles.readyBadgeText}>Prête</Text>
                  </View>
                </View>

                {/* Drills Switcher */}
                <View style={styles.drillsTabs}>
                  {generatedSession.drills.map((dItem, idx) => {
                    const isAct = idx === activePreviewDrillIndex;
                    return (
                      <TouchableOpacity
                        key={dItem.id}
                        onPress={() => setActivePreviewDrillIndex(idx)}
                        style={[styles.drillTab, isAct && styles.drillTabActive]}
                      >
                        <Text style={[styles.drillTabOrder, isAct && styles.drillTabOrderActive]}>
                          {idx + 1}
                        </Text>
                        <Text
                          style={[styles.drillTabText, isAct && styles.drillTabTextActive]}
                          numberOfLines={1}
                        >
                          {dItem.name} ({dItem.durationMin} min)
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Pitch Preview */}
                <View style={styles.previewContainer}>
                  <View style={styles.previewPitchWrap}>
                    <CoachPitchEngine
                      pitchConfig={currentPreviewDrill.pitchConfig}
                      viewMode="2d"
                      cameraPreset="top"
                      players={currentPreviewDrill.frames[0]?.players || []}
                      equipment={currentPreviewDrill.frames[0]?.equipment || []}
                      drawings={currentPreviewDrill.frames[0]?.drawings || []}
                      width={isDesktop ? 480 : 320}
                      height={isDesktop ? 320 : 220}
                    />
                  </View>

                  <View style={styles.pedagogicalCard}>
                    <Text style={styles.pedagogicalHeading}>Objectifs & Consignes</Text>
                    {(currentPreviewDrill.coachingPoints || []).map((goal: string, i: number) => (
                      <View key={i} style={styles.goalRow}>
                        <Ionicons name="disc-outline" size={14} color="#00E676" />
                        <Text style={styles.goalText}>{goal}</Text>
                      </View>
                    ))}

                    {onOpenInStudio && (
                      <TouchableOpacity
                        onPress={() => {
                          onClose();
                          onOpenInStudio(currentPreviewDrill);
                        }}
                        style={styles.openStudioPill}
                      >
                        <MaterialCommunityIcons name="vector-polyline" size={16} color="#00E676" />
                        <Text style={styles.openStudioPillText}>Ouvrir cet atelier dans le Studio</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer Controls */}
          <View style={styles.footer}>
            {step > 1 && step !== 3 && (
              <TouchableOpacity
                onPress={() => setStep((s) => (s === 4 ? 2 : ((s - 1) as any)))}
                style={styles.backBtn}
              >
                <Ionicons name="arrow-back" size={16} color={tokens.foreground} />
                <Text style={styles.backBtnText}>Précédent</Text>
              </TouchableOpacity>
            )}

            <View style={{ flex: 1 }} />

            {step === 1 && (
              <TouchableOpacity onPress={() => setStep(2)} style={styles.nextBtn}>
                <Text style={styles.nextBtnText}>Suivant : Thématique</Text>
                <Ionicons name="arrow-forward" size={16} color="#000" />
              </TouchableOpacity>
            )}

            {step === 2 && (
              <TouchableOpacity onPress={handleGenerate} style={styles.nextBtn}>
                <Ionicons name="sparkles" size={16} color="#000" />
                <Text style={styles.nextBtnText}>Générer la séance</Text>
              </TouchableOpacity>
            )}

            {step === 4 && generatedSession && (
              <TouchableOpacity
                onPress={() => {
                  onApplySession(generatedSession);
                  onClose();
                }}
                style={styles.saveBtn}
              >
                <Ionicons name="checkmark-circle" size={18} color="#000" />
                <Text style={styles.saveBtnText}>Valider et enregistrer la séance</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxHeight: '92%',
    backgroundColor: '#141416',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  modalCardDesktop: {
    maxWidth: 820,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTitleRow: {
    gap: 4,
  },
  badgeAi: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
  },
  badgeAiText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00E676',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#0D0E10',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: '#00E676',
  },
  stepCircleCompleted: {
    backgroundColor: '#00E676',
  },
  stepNumText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A0A0A0',
  },
  stepNumTextActive: {
    color: '#000000',
  },
  stepLabelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#777777',
  },
  stepLabelTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  bodyContent: {
    padding: 20,
  },
  stepSection: {
    gap: 16,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#9E9E9E',
    lineHeight: 18,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#D0D0D0',
    marginTop: 6,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  chipActive: {
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    borderColor: '#00E676',
  },
  chipText: {
    fontSize: 13,
    color: '#BBBBBB',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#00E676',
    fontWeight: '700',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
  },
  textarea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  themesGrid: {
    gap: 8,
  },
  themeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  themeCardActive: {
    backgroundColor: 'rgba(0, 230, 118, 0.08)',
    borderColor: '#00E676',
  },
  themeIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeIconWrapActive: {
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
  },
  themeLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#CCCCCC',
  },
  themeLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  generationLoadingBox: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  generationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
  },
  generationSub: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    maxWidth: 420,
    lineHeight: 18,
  },
  summaryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  summaryMeta: {
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 2,
  },
  readyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
  },
  readyBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00E676',
  },
  drillsTabs: {
    flexDirection: 'row',
    gap: 8,
  },
  drillTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  drillTabActive: {
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
    borderColor: '#00E676',
  },
  drillTabOrder: {
    fontSize: 11,
    fontWeight: '800',
    color: '#777777',
  },
  drillTabOrderActive: {
    color: '#00E676',
  },
  drillTabText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: '#AAAAAA',
  },
  drillTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  previewContainer: {
    flexDirection: 'column',
    gap: 12,
    alignItems: 'center',
  },
  previewPitchWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  pedagogicalCard: {
    width: '100%',
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 8,
  },
  pedagogicalHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  goalText: {
    fontSize: 12,
    color: '#C0C0C0',
    flex: 1,
  },
  openStudioPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 230, 118, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.25)',
  },
  openStudioPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00E676',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#101113',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#00E676',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  nextBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000000',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#00E676',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000000',
  },
});
