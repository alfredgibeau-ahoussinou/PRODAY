import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DEFENSE_4_SYSTEMS, type PitchSlot } from '../../constants/tacticalMatrix';

export type TacticStep = 1 | 2 | 3 | 4 | 5 | 6;

interface AssignedPlayer {
  id: string;
  name: string;
  number: number;
  position: string;
  slotIndex: number;
  isSub?: boolean;
}

interface CoachDynamicTacticsProps {
  onBack?: () => void;
  matchTitle?: string;
  initialFormation?: string;
}

const STEP_LABELS: Record<TacticStep, { title: string; subtitle: string }> = {
  1: { title: '1. Attaquants', subtitle: 'Affectez vos joueurs offensifs aux postes' },
  2: { title: '2. Milieux', subtitle: 'Configurez la récupération et l’animation au milieu' },
  3: { title: '3. Défenseurs', subtitle: 'Placez la ligne défensive' },
  4: { title: '4. Gardien', subtitle: 'Sélectionnez le gardien de but titulaire' },
  5: { title: '5. Remplaçants', subtitle: 'Constituez votre banc des remplaçants' },
  6: { title: '6. Vue Complète du Stade', subtitle: 'Vérifiez l’ensemble de la composition avant publication' },
};

const DEMO_SQUAD = [
  { id: 'p1', name: 'Hugo Lloris', number: 1, position: 'GK' },
  { id: 'p2', name: 'Benjamin Pavard', number: 2, position: 'RB' },
  { id: 'p3', name: 'Raphaël Varane', number: 4, position: 'CB' },
  { id: 'p4', name: 'Dayot Upamecano', number: 5, position: 'CB' },
  { id: 'p5', name: 'Théo Hernandez', number: 3, position: 'LB' },
  { id: 'p6', name: 'Aurélien Tchouaméni', number: 6, position: 'CDM' },
  { id: 'p7', name: 'Adrien Rabiot', number: 8, position: 'CM' },
  { id: 'p8', name: 'Antoine Griezmann', number: 7, position: 'CAM' },
  { id: 'p9', name: 'Ousmane Dembélé', number: 11, position: 'RW' },
  { id: 'p10', name: 'Kylian Mbappé', number: 10, position: 'LW' },
  { id: 'p11', name: 'Olivier Giroud', number: 9, position: 'ST' },
  { id: 'p12', name: 'Mike Maignan', number: 16, position: 'GK' },
  { id: 'p13', name: 'Jules Koundé', number: 23, position: 'CB' },
  { id: 'p14', name: 'Eduardo Camavinga', number: 12, position: 'CM' },
  { id: 'p15', name: 'Kingsley Coman', number: 20, position: 'RW' },
  { id: 'p16', name: 'Marcus Thuram', number: 19, position: 'ST' },
];

export const CoachDynamicTacticsScreenV4: React.FC<CoachDynamicTacticsProps> = ({
  onBack,
  matchTitle = 'Prochain Match — J18',
  initialFormation = '4-3-3',
}) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [currentStep, setCurrentStep] = useState<TacticStep>(1);
  const [formationId, setFormationId] = useState(initialFormation);
  const [assigned, setAssigned] = useState<Record<number, AssignedPlayer>>({});
  const [substitutes, setSubstitutes] = useState<AssignedPlayer[]>([]);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [isDraftSaved, setIsDraftSaved] = useState(false);
  const [isPublished, setIsPublished] = useState(false);

  const currentSystem = useMemo(() => {
    return DEFENSE_4_SYSTEMS.find((s) => s.id === formationId) || DEFENSE_4_SYSTEMS[0];
  }, [formationId]);

  // Classification des slots par ligne tactique
  const slotsByCategory = useMemo(() => {
    const attack: { slot: PitchSlot; index: number }[] = [];
    const mid: { slot: PitchSlot; index: number }[] = [];
    const def: { slot: PitchSlot; index: number }[] = [];
    const gk: { slot: PitchSlot; index: number }[] = [];

    currentSystem.slots.forEach((slot, index) => {
      if (slot.y <= 0.35) attack.push({ slot, index });
      else if (slot.y > 0.35 && slot.y <= 0.6) mid.push({ slot, index });
      else if (slot.y > 0.6 && slot.y <= 0.78) def.push({ slot, index });
      else gk.push({ slot, index });
    });

    return { attack, mid, def, gk };
  }, [currentSystem]);

  // Liste des joueurs déjà assignés (titulaires ou remplaçants)
  const assignedPlayerIds = useMemo(() => {
    const ids = new Set<string>();
    Object.values(assigned).forEach((p) => ids.add(p.id));
    substitutes.forEach((p) => ids.add(p.id));
    return ids;
  }, [assigned, substitutes]);

  const activeStepSlots = useMemo(() => {
    if (currentStep === 1) return slotsByCategory.attack;
    if (currentStep === 2) return slotsByCategory.mid;
    if (currentStep === 3) return slotsByCategory.def;
    if (currentStep === 4) return slotsByCategory.gk;
    return [];
  }, [currentStep, slotsByCategory]);

  const handleAssignPlayer = (player: typeof DEMO_SQUAD[0], slotIndex: number) => {
    if (assignedPlayerIds.has(player.id)) {
      Alert.alert('Joueur déjà affecté', `${player.name} est déjà sur la feuille de match.`);
      return;
    }

    setAssigned((prev) => ({
      ...prev,
      [slotIndex]: {
        id: player.id,
        name: player.name,
        number: player.number,
        position: player.position,
        slotIndex,
      },
    }));
    setSelectedSlotIndex(null);
  };

  const handleAddSubstitute = (player: typeof DEMO_SQUAD[0]) => {
    if (assignedPlayerIds.has(player.id)) {
      Alert.alert('Joueur déjà affecté', `${player.name} est déjà sélectionné.`);
      return;
    }
    if (substitutes.length >= 7) {
      Alert.alert('Banc complet', 'Le banc est limité à 7 remplaçants.');
      return;
    }
    setSubstitutes((prev) => [
      ...prev,
      {
        id: player.id,
        name: player.name,
        number: player.number,
        position: player.position,
        slotIndex: -1,
        isSub: true,
      },
    ]);
  };

  const handleRemoveSubstitute = (playerId: string) => {
    setSubstitutes((prev) => prev.filter((p) => p.id !== playerId));
  };

  const handleNextStep = () => {
    if (currentStep < 6) {
      setCurrentStep((prev) => (prev + 1) as TacticStep);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as TacticStep);
    }
  };

  const handleSaveDraft = () => {
    setIsDraftSaved(true);
    Alert.alert('Brouillon sauvegardé', 'La composition tactique a été enregistrée avec succès.');
  };

  const handlePublish = () => {
    const starterCount = Object.keys(assigned).length;
    if (starterCount < 11) {
      Alert.alert(
        'Composition incomplète',
        `Vous devez affecter 11 titulaires avant de publier (${starterCount}/11 affectés).`,
      );
      return;
    }
    setIsPublished(true);
    Alert.alert(
      'Composition publiée !',
      'Le schéma tactique et les affectations de postes sont désormais visibles par le club et les joueurs convoqués.',
    );
  };

  return (
    <View style={[styles.root, { paddingTop: Math.max(insets.top, 10) }]}>
      {/* En-tête avec progression des 6 étapes */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          {onBack ? (
            <TouchableOpacity onPress={onBack} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={20} color="#0F172A" />
            </TouchableOpacity>
          ) : null}
          <View style={{ flex: 1 }}>
            <Text style={styles.matchTitle}>{matchTitle}</Text>
            <Text style={styles.stepTitle}>{STEP_LABELS[currentStep].title}</Text>
          </View>
          <View style={styles.formationBadge}>
            <Text style={styles.formationBadgeText}>{formationId}</Text>
          </View>
        </View>

        {/* Stepper bar (1 to 6) */}
        <View style={styles.stepperBar}>
          {[1, 2, 3, 4, 5, 6].map((step) => {
            const isActive = currentStep === step;
            const isDone = currentStep > step;
            return (
              <TouchableOpacity
                key={step}
                onPress={() => setCurrentStep(step as TacticStep)}
                style={[
                  styles.stepDot,
                  isActive && styles.stepDotActive,
                  isDone && styles.stepDotDone,
                ]}
              >
                <Text
                  style={[
                    styles.stepDotText,
                    (isActive || isDone) && styles.stepDotTextActive,
                  ]}
                >
                  {step}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={styles.stepSubtitle}>{STEP_LABELS[currentStep].subtitle}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Terrain Dynamique 2D avec mise au point selon l’étape */}
        <View style={styles.pitchContainer}>
          <View style={styles.pitchField}>
            {/* Lignes du terrain de football */}
            <View style={styles.pitchCenterCircle} />
            <View style={styles.pitchCenterLine} />
            <View style={styles.pitchPenaltyBoxTop} />
            <View style={styles.pitchPenaltyBoxBottom} />

            {/* Zone active mise en évidence selon l'étape */}
            {currentStep === 1 ? (
              <View style={[styles.focusZoneHighlight, { top: 0, height: '35%' }]} />
            ) : currentStep === 2 ? (
              <View style={[styles.focusZoneHighlight, { top: '35%', height: '28%' }]} />
            ) : currentStep === 3 ? (
              <View style={[styles.focusZoneHighlight, { top: '63%', height: '20%' }]} />
            ) : currentStep === 4 ? (
              <View style={[styles.focusZoneHighlight, { top: '80%', height: '20%' }]} />
            ) : null}

            {/* Slots de titulaires sur le terrain */}
            {currentSystem.slots.map((slot, idx) => {
              const player = assigned[idx];
              const isRelevantInStep =
                (currentStep === 1 && slot.y <= 0.35) ||
                (currentStep === 2 && slot.y > 0.35 && slot.y <= 0.6) ||
                (currentStep === 3 && slot.y > 0.6 && slot.y <= 0.78) ||
                (currentStep === 4 && slot.y > 0.78) ||
                currentStep === 6;

              const isSelected = selectedSlotIndex === idx;

              return (
                <TouchableOpacity
                  key={`slot-${idx}`}
                  style={[
                    styles.playerToken,
                    {
                      left: `${slot.x * 86}%`,
                      top: `${slot.y * 85}%`,
                    },
                    isRelevantInStep && styles.tokenActiveStep,
                    isSelected && styles.tokenSelected,
                  ]}
                  onPress={() => setSelectedSlotIndex(idx)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.tokenCircle, player && styles.tokenCircleAssigned]}>
                    <Text style={styles.tokenNumber}>
                      {player ? player.number : slot.defaultPos}
                    </Text>
                  </View>
                  <Text style={styles.tokenName} numberOfLines={1}>
                    {player ? player.name.split(' ')[0] : slot.defaultPos}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Banc des Remplaçants (Étape 5 et 6) */}
          {(currentStep === 5 || currentStep === 6) && (
            <View style={styles.benchContainer}>
              <View style={styles.benchHeader}>
                <Ionicons name="file-tray-full" size={14} color="#0F172A" />
                <Text style={styles.benchTitle}>Banc des Remplaçants ({substitutes.length}/7)</Text>
              </View>
              <View style={styles.benchRow}>
                {substitutes.length === 0 ? (
                  <Text style={styles.emptyBenchText}>Aucun remplaçant sélectionné</Text>
                ) : (
                  substitutes.map((sub) => (
                    <View key={sub.id} style={styles.benchToken}>
                      <View style={styles.benchTokenCircle}>
                        <Text style={styles.benchTokenNumber}>{sub.number}</Text>
                      </View>
                      <Text style={styles.benchTokenName} numberOfLines={1}>
                        {sub.name.split(' ')[0]}
                      </Text>
                      {currentStep === 5 ? (
                        <TouchableOpacity
                          onPress={() => handleRemoveSubstitute(sub.id)}
                          style={styles.removeSubBtn}
                        >
                          <Ionicons name="close" size={10} color="#EF4444" />
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  ))
                )}
              </View>
            </View>
          )}
        </View>

        {/* Panneau de sélection des joueurs (étapes 1 à 5) */}
        {currentStep <= 5 && (
          <View style={styles.rosterCard}>
            <Text style={styles.rosterTitle}>
              {currentStep === 5
                ? 'Sélectionnez un remplaçant à ajouter'
                : selectedSlotIndex !== null
                  ? `Assigner au poste ${currentSystem.slots[selectedSlotIndex]?.defaultPos}`
                  : 'Touchez un poste sur le terrain pour lui assigner un joueur :'}
            </Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rosterScroll}>
              {DEMO_SQUAD.map((player) => {
                const isAssigned = assignedPlayerIds.has(player.id);
                return (
                  <TouchableOpacity
                    key={player.id}
                    disabled={isAssigned}
                    onPress={() => {
                      if (currentStep === 5) {
                        handleAddSubstitute(player);
                      } else if (selectedSlotIndex !== null) {
                        handleAssignPlayer(player, selectedSlotIndex);
                      } else {
                        Alert.alert('Sélectionnez d’abord un poste sur le terrain');
                      }
                    }}
                    style={[styles.playerChip, isAssigned && styles.playerChipDisabled]}
                  >
                    <View style={styles.playerChipNum}>
                      <Text style={styles.playerChipNumText}>{player.number}</Text>
                    </View>
                    <View>
                      <Text style={styles.playerChipName}>{player.name}</Text>
                      <Text style={styles.playerChipPos}>{player.position}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Récapitulatif et validation en étape 6 */}
        {currentStep === 6 && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.statBox}>
                <Text style={styles.statNum}>{Object.keys(assigned).length}/11</Text>
                <Text style={styles.statLabel}>Titulaires</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNum}>{substitutes.length}/7</Text>
                <Text style={styles.statLabel}>Remplaçants</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNum}>{formationId}</Text>
                <Text style={styles.statLabel}>Schéma</Text>
              </View>
            </View>

            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={styles.btnSecondary}
                onPress={handleSaveDraft}
                activeOpacity={0.8}
              >
                <Ionicons name="save-outline" size={16} color="#0F172A" />
                <Text style={styles.btnSecondaryText}>
                  {isDraftSaved ? 'Brouillon sauvegardé ✓' : 'Sauvegarder brouillon'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnPrimary}
                onPress={handlePublish}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark-circle" size={18} color="#000000" />
                <Text style={styles.btnPrimaryText}>
                  {isPublished ? 'Composition Publiée ✓' : 'Publier la composition'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Barre de navigation inférieure du stepper */}
      <View style={styles.footerBar}>
        <TouchableOpacity
          onPress={handlePrevStep}
          disabled={currentStep === 1}
          style={[styles.stepNavBtn, currentStep === 1 && styles.stepNavBtnDisabled]}
        >
          <Ionicons name="chevron-back" size={18} color={currentStep === 1 ? '#94A3B8' : '#0F172A'} />
          <Text style={[styles.stepNavText, currentStep === 1 && styles.stepNavTextDisabled]}>
            Précédent
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleNextStep}
          disabled={currentStep === 6}
          style={[styles.stepNavBtn, styles.stepNavBtnNext, currentStep === 6 && styles.stepNavBtnDisabled]}
        >
          <Text style={[styles.stepNavText, { color: currentStep === 6 ? '#94A3B8' : '#000000', fontWeight: '800' }]}>
            {currentStep === 5 ? 'Vue d’ensemble' : 'Suivant'}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={currentStep === 6 ? '#94A3B8' : '#000000'} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchTitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  formationBadge: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  formationBadgeText: {
    color: '#00F59B',
    fontSize: 12,
    fontWeight: '800',
  },
  stepperBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 6,
  },
  stepDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  stepDotDone: {
    backgroundColor: '#00F59B',
    borderColor: '#00F59B',
  },
  stepDotText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  stepDotTextActive: {
    color: '#FFFFFF',
  },
  stepSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  pitchContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  pitchField: {
    width: '100%',
    height: 340,
    backgroundColor: '#15803D',
    borderRadius: 12,
    position: 'relative',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    overflow: 'hidden',
  },
  pitchCenterLine: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  pitchCenterCircle: {
    position: 'absolute',
    top: '38%',
    left: '35%',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  pitchPenaltyBoxTop: {
    position: 'absolute',
    top: 0,
    left: '25%',
    width: '50%',
    height: 50,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  pitchPenaltyBoxBottom: {
    position: 'absolute',
    bottom: 0,
    left: '25%',
    width: '50%',
    height: 50,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  focusZoneHighlight: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: '#00F59B',
  },
  playerToken: {
    position: 'absolute',
    alignItems: 'center',
    width: 44,
  },
  tokenActiveStep: {
    transform: [{ scale: 1.15 }],
  },
  tokenSelected: {
    borderColor: '#00F59B',
    borderWidth: 2,
    borderRadius: 20,
  },
  tokenCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0F172A',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tokenCircleAssigned: {
    backgroundColor: '#00F59B',
    borderColor: '#000000',
  },
  tokenNumber: {
    fontSize: 10,
    fontWeight: '800',
    color: '#000000',
  },
  tokenName: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowRadius: 2,
  },
  benchContainer: {
    marginTop: 12,
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 10,
  },
  benchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  benchTitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  benchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emptyBenchText: {
    color: '#64748B',
    fontSize: 11,
    fontStyle: 'italic',
  },
  benchToken: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 6,
  },
  benchTokenCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#00F59B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  benchTokenNumber: {
    fontSize: 9,
    fontWeight: '800',
    color: '#000000',
  },
  benchTokenName: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  removeSubBtn: {
    marginLeft: 4,
  },
  rosterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  rosterTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },
  rosterScroll: {
    flexDirection: 'row',
  },
  playerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginRight: 8,
    gap: 8,
  },
  playerChipDisabled: {
    opacity: 0.4,
  },
  playerChipNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerChipNumText: {
    color: '#00F59B',
    fontSize: 10,
    fontWeight: '800',
  },
  playerChipName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  playerChipPos: {
    fontSize: 10,
    color: '#64748B',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 14,
  },
  statBox: {
    alignItems: 'center',
  },
  statNum: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  btnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  btnSecondaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  btnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00F59B',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  btnPrimaryText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000000',
  },
  footerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  stepNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    gap: 4,
  },
  stepNavBtnNext: {
    backgroundColor: '#00F59B',
  },
  stepNavBtnDisabled: {
    opacity: 0.4,
  },
  stepNavText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  stepNavTextDisabled: {
    color: '#94A3B8',
  },
});
