import React, { useState } from 'react';
import { PRO_DATA_VIOLET, proSemantic } from '../../theme/professionalDesign';
import { withAlpha } from '../../utils/coachTeamTheme';
import { COACH_SITE } from '../../content/coachPageIdentity';

const tokens = COACH_SITE;
import { COACH_CLEAR_SURFACES as CLEAR } from '../../utils/coachTeamTheme';
import {
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  ActivityIndicator,
} from 'react-native';
import { CoachText } from './coachPortalUi';
import { Icon } from '../ui/Icon';
import type { IconName } from '../ui/iconNames';
import { PressableSpring } from '../motion';
import { radius, spacing } from '../../theme/designTokens';
import { useCoachTheme } from '../../features/coach/shell/CoachThemeContext';
import {
  generateAiLineup,
  type AiLineupRequestType,
  type CoachTacticalPreset,
} from '../../utils/coachPitchLineup';
import type { User } from '../../models/User';

type Props = {
  visible: boolean;
  onClose: () => void;
  members: User[];
  onApplyPreset: (preset: CoachTacticalPreset) => void;
};

const STRATEGIES: Array<{
  id: AiLineupRequestType;
  title: string;
  subtitle: string;
  icon: IconName;
  color: string;
}> = [
  {
    id: 'ideal',
    title: '11 Idéal & Forme Max',
    subtitle: 'Aligne les joueurs les plus en forme à leurs postes naturels.',
    icon: 'star-four-points',
    color: PRO_DATA_VIOLET,
  },
  {
    id: 'offensive',
    title: 'Pressing Haut & Transition (4-2-3-1)',
    subtitle: 'Récupération agressive et percussion immédiate sur les ailes.',
    icon: 'trophy',
    color: proSemantic.warning,
  },
  {
    id: 'counter',
    title: 'Bloc Compact & Contre (3-5-2)',
    subtitle: 'Fermeture de l’axe et projection rapide dans le dos adverse.',
    icon: 'shield',
    color: proSemantic.info,
  },
  {
    id: 'rotation',
    title: 'Rotation & Temps de Jeu (4-4-2)',
    subtitle: 'Donne des minutes aux remplaçants tout en maintenant l’équilibre.',
    icon: 'people',
    color: proSemantic.success,
  },
];

const FORMATION_CATEGORIES = [
  {
    category: '4 Défenseurs',
    items: [
      { code: '4-3-3', name: '4-3-3 Classique', desc: 'Largeur & Dédoublements' },
      { code: '4-2-3-1', name: '4-2-3-1 Pivot', desc: 'Pressing haut & Meneur axial' },
      { code: '4-4-2', name: '4-4-2 À Plat', desc: 'Équilibre & Deux attaquants' },
      { code: '4-1-2-1-2', name: '4-1-2-1-2 Losange', desc: 'Domination axiale' },
      { code: '4-3-2-1', name: '4-3-2-1 Sapin', desc: 'Deux numéros 10 en soutien' },
      { code: '4-1-4-1', name: '4-1-4-1 Sentinelle', desc: 'Contrôle & Récupération' },
      { code: '4-2-4', name: '4-2-4 Ultra Offensif', desc: '4 attaquants en pression' },
      { code: '4-5-1', name: '4-5-1 Bloc Médian', desc: 'Densité dans l’entrejeu' },
      { code: '4-2-2-2', name: '4-2-2-2 Carré Magique', desc: 'Double pivot & 2 meneurs' },
      { code: '4-4-1-1', name: '4-4-1-1 Neuf et Demi', desc: 'Attaquant de soutien libre' },
    ],
  },
  {
    category: '3 & 5 Défenseurs',
    items: [
      { code: '3-5-2', name: '3-5-2 Pistons', desc: 'Axe hermétique & Contres' },
      { code: '3-4-3', name: '3-4-3 Attaque Totale', desc: 'Surnombre offensif' },
      { code: '3-4-2-1', name: '3-4-2-1 Moderne', desc: 'Pistons et 2 ailiers intérieurs' },
      { code: '3-4-1-2', name: '3-4-1-2 Meneur', desc: 'Numéro 10 et duo d’attaque' },
      { code: '3-1-4-2', name: '3-1-4-2 Possession', desc: 'Sentinelle et 4 milieux' },
      { code: '5-3-2', name: '5-3-2 Verrou', desc: 'Défense à 5 impénétrable' },
      { code: '5-4-1', name: '5-4-1 Muraille', desc: 'Double rideau défensif' },
      { code: '5-2-3', name: '5-2-3 Contre-Éclair', desc: 'Solidité et 3 flèches devant' },
    ],
  },
  {
    category: 'Foot Réduit (8, 7, 5)',
    items: [
      { code: '3-3-1', name: '3-3-1 (Foot à 8)', desc: 'Schéma formateur U12/U13' },
      { code: '3-2-2', name: '3-2-2 (Foot à 8)', desc: 'Assise défensive et 2 pointes' },
      { code: '2-4-1', name: '2-4-1 (Foot à 8)', desc: 'Maîtrise totale du milieu' },
      { code: '2-3-1', name: '2-3-1 (Foot à 7)', desc: 'Schéma référence U10/U11' },
      { code: '3-2-1', name: '3-2-1 (Foot à 7)', desc: 'Sécurité et contre-attaque' },
      { code: '1-2-1', name: '1-2-1 (Five / Futsal)', desc: 'Losange dynamique Futsal' },
      { code: '2-2', name: '2-2 (Five / Carré)', desc: 'Structure équilibrée en carré' },
    ],
  },
];

export const CoachAiTacticsSheet: React.FC<Props> = ({
  visible,
  onClose,
  members,
  onApplyPreset,
}) => {
  const { tokens } = useCoachTheme();
  const [selectedStrategy, setSelectedStrategy] = useState<AiLineupRequestType>('ideal');
  const [selectedCat, setSelectedCat] = useState<string>('4 Défenseurs');
  const [customPrompt, setCustomPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof generateAiLineup> | null>(null);

  const rosterSimple = members.map((m) => ({
    uid: m.uid,
    name: m.display_name,
    position: m.profile?.position,
  }));

  const handleGenerate = (strategy = selectedStrategy, prompt = customPrompt) => {
    setLoading(true);
    setTimeout(() => {
      const generated = generateAiLineup(rosterSimple, strategy, prompt);
      setResult(generated);
      setLoading(false);
    }, 380);
  };

  const handlePickFormation = (code: string) => {
    setLoading(true);
    setTimeout(() => {
      const generated = generateAiLineup(rosterSimple, 'custom', code);
      setResult(generated);
      setLoading(false);
    }, 320);
  };

  const handleApply = () => {
    if (!result) return;
    const preset: CoachTacticalPreset = {
      id: `ai_${Date.now()}`,
      name: result.name,
      badge: 'IA',
      formation: result.formation,
      starterUids: result.starterUids,
      directive: result.directive,
      description: result.aiRationale,
      aiRationale: result.aiRationale,
      keyInstructions: result.keyInstructions,
    };
    onApplyPreset(preset);
    onClose();
  };

  const activeCategoryData = FORMATION_CATEGORIES.find((c) => c.category === selectedCat) || FORMATION_CATEGORIES[0];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleRow}>
              <View style={[styles.aiIconBadge, { backgroundColor: '#8B5CF622' }]}>
                <Icon name="star-four-points" size={18} color={PRO_DATA_VIOLET} />
              </View>
              <View>
                <CoachText style={[styles.title, { color: tokens.foreground }]}>
                  Catalogue Tactique IA
                </CoachText>
                <CoachText style={[styles.sub, { color: tokens.muted }]}>
                  Choisis un schéma ou demande à l’IA
                </CoachText>
              </View>
            </View>

            <PressableSpring onPress={onClose} style={[styles.closeBtn, { backgroundColor: tokens.elevated }]}>
              <Icon name="close" size={18} color={tokens.foreground} />
            </PressableSpring>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Quick Strategy Pills */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Icon name="flash" size={16} color={tokens.accent} />
              <CoachText style={[styles.sectionHeading, { color: tokens.foreground, marginBottom: 0 }]}>
                Stratégies IA Recommandées
              </CoachText>
            </View>

            <View style={styles.strategyList}>
              {STRATEGIES.map((s) => {
                const isSelected = selectedStrategy === s.id && !result?.formation;
                return (
                  <PressableSpring
                    key={s.id}
                    style={[
                      styles.strategyCard,
                      {
                        backgroundColor: isSelected ? s.color + '15' : tokens.elevated,
                        borderColor: isSelected ? s.color : tokens.border,
                      },
                    ]}
                    onPress={() => {
                      setSelectedStrategy(s.id);
                      handleGenerate(s.id, customPrompt);
                    }}
                  >
                    <View style={[styles.strategyIconBg, { backgroundColor: s.color + '25' }]}>
                      <Icon name={s.icon} size={20} color={s.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <CoachText style={[styles.strategyTitle, { color: tokens.foreground }]}>
                        {s.title}
                      </CoachText>
                      <CoachText style={[styles.strategySub, { color: tokens.muted }]}>
                        {s.subtitle}
                      </CoachText>
                    </View>
                    <Icon
                      name={isSelected ? 'checkmark-circle' : 'chevron-forward'}
                      size={18}
                      color={isSelected ? s.color : tokens.muted}
                    />
                  </PressableSpring>
                );
              })}
            </View>

            {/* Formations Catalog with Category Filter */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.md, marginBottom: 8 }}>
              <Icon name="grid" size={16} color={tokens.accent} />
              <CoachText style={[styles.sectionHeading, { color: tokens.foreground, marginBottom: 0, marginTop: 0 }]}>
                Catalogue des Formations ({FORMATION_CATEGORIES.reduce((acc, c) => acc + c.items.length, 0)} schémas)
              </CoachText>
            </View>

            {/* Category tabs */}
            <View style={styles.catTabsRow}>
              {FORMATION_CATEGORIES.map((c) => {
                const on = selectedCat === c.category;
                return (
                  <PressableSpring
                    key={c.category}
                    onPress={() => setSelectedCat(c.category)}
                    scaleTo={0.96}
                    haptic
                    style={[
                      styles.catTab,
                      on && { backgroundColor: tokens.accent, borderColor: tokens.accent },
                    ]}
                  >
                    <CoachText
                      style={[
                        styles.catTabText,
                        on ? { color: tokens.onAccent, fontWeight: '800' } : { color: tokens.muted },
                      ]}
                    >
                      {c.category}
                    </CoachText>
                  </PressableSpring>
                );
              })}
            </View>

            {/* Formations Grid */}
            <View style={styles.formationGrid}>
              {activeCategoryData.items.map((item) => {
                const isSelected = result?.formation === item.code;
                return (
                  <PressableSpring
                    key={item.code}
                    onPress={() => handlePickFormation(item.code)}
                    scaleTo={0.96}
                    haptic
                    style={[
                      styles.formationCard,
                      {
                        backgroundColor: isSelected ? withAlpha(PRO_DATA_VIOLET, 0.2) : tokens.elevated,
                        borderColor: isSelected ? PRO_DATA_VIOLET : tokens.border,
                      },
                    ]}
                  >
                    <View style={styles.formationCardTop}>
                      <View style={[styles.formationBadge, { backgroundColor: isSelected ? PRO_DATA_VIOLET : tokens.border }]}>
                        <CoachText style={styles.formationBadgeText}>{item.code}</CoachText>
                      </View>
                      {isSelected && <Icon name="checkmark-circle" size={14} color={proSemantic.success} />}
                    </View>
                    <CoachText numberOfLines={1} style={[styles.formationName, { color: tokens.foreground }]}>
                      {item.name}
                    </CoachText>
                    <CoachText numberOfLines={2} style={[styles.formationDesc, { color: tokens.muted }]}>
                      {item.desc}
                    </CoachText>
                  </PressableSpring>
                );
              })}
            </View>

            {/* Custom AI Prompt Input */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.md, marginBottom: 8 }}>
              <Icon name="chatbubbles" size={16} color={tokens.accent} />
              <CoachText style={[styles.sectionHeading, { color: tokens.foreground, marginBottom: 0, marginTop: 0 }]}>
                Ou consigne sur-mesure à l’IA
              </CoachText>
            </View>

            <View style={[styles.promptInputBox, { backgroundColor: tokens.elevated, borderColor: tokens.border }]}>
              <TextInput
                style={[styles.promptInput, { color: tokens.foreground }]}
                placeholder="Ex: Aligne un 4-1-2-1-2 avec pressing haut et Diallo en pointe"
                placeholderTextColor={tokens.muted}
                value={customPrompt}
                onChangeText={setCustomPrompt}
                multiline
              />
              <PressableSpring
                style={[
                  styles.sendBtn,
                  { backgroundColor: customPrompt.trim() ? PRO_DATA_VIOLET : tokens.border },
                ]}
                onPress={() => handleGenerate('custom', customPrompt)}
                disabled={!customPrompt.trim()}
              >
                <Icon name="star-four-points" size={16} color="#FFF" />
                <CoachText style={styles.sendBtnText}>Générer avec l'IA</CoachText>
              </PressableSpring>
            </View>

            {/* Loading Indicator */}
            {loading && (
              <View style={styles.loadingBox}>
                <ActivityIndicator color={PRO_DATA_VIOLET} size="large" />
                <CoachText style={{ color: tokens.muted, marginTop: spacing.sm, fontSize: 13 }}>
                  L’IA configure le schéma et optimise l’alignement des postes...
                </CoachText>
              </View>
            )}

            {/* AI Generated Result Preview */}
            {!loading && result && (
              <View style={[styles.resultCard, { borderColor: '#8B5CF666' }]}>
                <View style={styles.resultTopRow}>
                  <View style={styles.resultBadgeRow}>
                    <View style={[styles.formationChip, { backgroundColor: PRO_DATA_VIOLET }]}>
                      <CoachText style={styles.formationChipText}>{result.formation}</CoachText>
                    </View>
                    <View style={styles.directiveChip}>
                      <Icon name="trophy" size={12} color={withAlpha(PRO_DATA_VIOLET, 0.25)} />
                      <CoachText style={styles.directiveChipText}>Aligné par l'IA</CoachText>
                    </View>
                  </View>
                  <CoachText style={styles.resultTitle}>{result.name}</CoachText>
                </View>

                {/* AI Rationale */}
                <View style={styles.rationaleBox}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <Icon name="sparkles" size={14} color={PRO_DATA_VIOLET} />
                    <CoachText style={[styles.rationaleHeading, { marginBottom: 0 }]}>Analyse du Coach IA</CoachText>
                  </View>
                  <CoachText style={styles.rationaleBody}>{result.aiRationale}</CoachText>
                </View>

                {/* Key instructions */}
                <View style={styles.instructionsBox}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <Icon name="list" size={14} color={withAlpha(PRO_DATA_VIOLET, 0.25)} />
                    <CoachText style={[styles.instructionsHeading, { marginBottom: 0 }]}>Consignes Clés</CoachText>
                  </View>
                  {result.keyInstructions.map((inst, i) => (
                    <View key={i} style={styles.instructionItem}>
                      <Icon name="checkmark-circle" size={14} color={proSemantic.success} />
                      <CoachText style={styles.instructionText}>{inst}</CoachText>
                    </View>
                  ))}
                </View>

                {/* Apply Button */}
                <PressableSpring
                  style={[styles.applyBtn, { backgroundColor: proSemantic.success }]}
                  onPress={handleApply}
                >
                  <Icon name="checkmark-circle" size={18} color="#000" />
                  <CoachText style={[styles.applyBtnText, { color: '#000' }]}>
                    Appliquer ce schéma ({result.formation}) sur le terrain
                  </CoachText>
                </PressableSpring>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'withAlpha(tokens.bg, 0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '92%',
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingTop: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  aiIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 18, fontWeight: '900', letterSpacing: -0.3 },
  sub: { fontSize: 12, marginTop: 2 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: 40 },
  sectionHeading: { fontSize: 13.5, fontWeight: '800', marginBottom: spacing.sm },

  strategyList: { gap: spacing.xs },
  strategyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
  strategyIconBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  strategyTitle: { fontSize: 14, fontWeight: '800' },
  strategySub: { fontSize: 11, marginTop: 2, lineHeight: 15 },

  catTabsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  catTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: withAlpha('FFFFFF', 0.12),
  },
  catTabText: {
    fontSize: 11.5,
    fontWeight: '700',
  },

  formationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  formationCard: {
    width: '48.5%',
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 4,
  },
  formationCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  formationBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  formationBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFF',
  },
  formationName: {
    fontSize: 12,
    fontWeight: '800',
  },
  formationDesc: {
    fontSize: 10,
    lineHeight: 14,
  },

  promptInputBox: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  promptInput: { fontSize: 13, minHeight: 48, textAlignVertical: 'top' },
  sendBtn: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    alignItems: 'center',
    gap: 6,
  },
  sendBtnText: { color: '#FFF', fontSize: 12, fontWeight: '800' },

  loadingBox: { padding: spacing.xl, alignItems: 'center', justifyContent: 'center' },

  resultCard: {
    backgroundColor: tokens.elevated,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  resultTopRow: { marginBottom: spacing.md },
  resultBadgeRow: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.xs },
  formationChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  formationChipText: { color: '#FFF', fontSize: 11, fontWeight: '900' },
  directiveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: withAlpha(PRO_DATA_VIOLET, 0.3),
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    gap: 4,
  },
  directiveChipText: { color: withAlpha(PRO_DATA_VIOLET, 0.18), fontSize: 11, fontWeight: '700' },
  resultTitle: { color: '#FFF', fontSize: 17, fontWeight: '900', marginTop: 4 },

  rationaleBox: {
    backgroundColor: withAlpha('FFFFFF', 0.06),
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  rationaleHeading: { color: withAlpha(PRO_DATA_VIOLET, 0.25), fontSize: 12, fontWeight: '800', marginBottom: 4 },
  rationaleBody: { color: CLEAR.surface, fontSize: 12, lineHeight: 17 },

  instructionsBox: { marginBottom: spacing.md },
  instructionsHeading: { color: withAlpha(PRO_DATA_VIOLET, 0.25), fontSize: 12, fontWeight: '800', marginBottom: 6 },
  instructionItem: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  instructionText: { color: tokens.foreground, fontSize: 12, flex: 1 },

  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: radius.lg,
    gap: 6,
    marginTop: spacing.xs,
  },
  applyBtnText: { fontSize: 13, fontWeight: '900' },
});

