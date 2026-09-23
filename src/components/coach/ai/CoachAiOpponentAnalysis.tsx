import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { CoachText } from '../coachPortalUi';
import { Icon } from '../../ui/Icon';
import { PressableSpring } from '../../motion';
import { useCoachTheme } from '../../../features/coach/shell/CoachThemeContext';
import { radius, spacing } from '../../../theme/designTokens';
import { CoachPane } from '../CoachScreenHeader';
import type { CoachChapterCommonProps } from '../coachPortalUi';
import { listRecentPostMatchAnalyses } from '../../../utils/coachPostMatchAnalysis';
import { useCoachShellNav } from '../../../features/coach/shell/CoachShellNavContext';

interface Props extends CoachChapterCommonProps {
  onBack: () => void;
}

type TacticalScenario = {
  label: string;
  prompt: string;
  title: string;
  defensivePlan: string[];
  offensivePlan: string[];
  keyInstructions: string[];
  planB: string;
};

const TACTICAL_PRESETS: TacticalScenario[] = [
  {
    label: 'Face à un Bloc Bas (5-3-2 / 5-4-1)',
    prompt: 'Comment battre une équipe qui joue en bloc bas compact ?',
    title: 'Plan d’Attaque contre Bloc Bas Hermétique',
    defensivePlan: [
      'Garder la ligne défensive haute (médiane) pour étouffer toute relance.',
      'Contre-pressing immédiat à la perte (3 secondes) pour empêcher les longues passes.',
      'Sécurité axiale : laisser un joueur en couverture systématique sur leur attaquant de pointe.',
    ],
    offensivePlan: [
      'Utiliser la largeur maximale : forcer leurs 3 défenseurs centraux à coulisser latéralement.',
      'Dédoublements rapides latéraux-ailiers pour centrer en retrait aux 16 mètres.',
      'Tirs lointains cadrés pour créer des seconds ballons ou des corners.',
    ],
    keyInstructions: [
      'Patience dans la circulation : ne pas forcer la passe dans l’axe bouché.',
      'Attaquer le premier poteau et couper la trajectoire sur les centres.',
    ],
    planB: 'Si score nul à la 60e, basculer en 4-2-4 avec 2 attaquants de surface pour peser physiquement sur leurs centraux.',
  },
  {
    label: 'Contre Pressing Haut (4-3-3 / 4-2-3-1)',
    prompt: 'Comment sortir proprement face à un pressing agressif ?',
    title: 'Plan de Sortie de Balle & Déséquilibre sous Pression',
    defensivePlan: [
      'Bloc médian compact pour ne pas se laisser aspirer vers l’avant.',
      'Fermer les passes intérieures vers leur numéro 10 ou leurs ailiers intérieurs.',
      'Gagner les premiers duels aériens sur les dégagements adverses.',
    ],
    offensivePlan: [
      'Jouer avec le gardien comme 11e joueur de champ pour créer le surnombre à la relance.',
      'Attirer leur premier rideau pour trouver la sentinelle libre d’un appui-remise.',
      'Exploiter directement la profondeur dans le dos de leurs latéraux très hauts.',
    ],
    keyInstructions: [
      'Limiter les touches de balle au milieu (maximum 2 touches).',
      'Le numéro 9 doit décrocher pour aspirer un central et libérer l’espace pour les ailiers.',
    ],
    planB: 'En cas d’étouffement, utiliser le jeu direct long sur l’ailier le plus rapide en 1v1.',
  },
  {
    label: 'Face à des Ailiers Très Rapides',
    prompt: 'Comment neutraliser une équipe rapide en contre-attaque ?',
    title: 'Verrouillage des Couloirs & Gestion de la Profondeur',
    defensivePlan: [
      'Freiner le recul de la ligne : ne pas se faire aspirer en 1v1 sans couverture.',
      'Défense en entonnoir : forcer leurs ailiers vers la touche plutôt que vers l’intérieur.',
      'Nos latéraux doivent temporiser et attendre le repli des milieux excentrés.',
    ],
    offensivePlan: [
      'Sécuriser nos possessions : zéro perte de balle dans l’axe médian.',
      'Maintenir au moins 3 joueurs en couverture permanente (2 centraux + 1 milieu défensif).',
      'Attaquer côté opposé pour éviter les transitions directes sur leur côté fort.',
    ],
    keyInstructions: [
      'Communication verbale continue entre les centraux et les latéraux.',
      'Faute tactique intelligente si la ligne est battue en transition.',
    ],
    planB: 'Passer à 5 défenseurs (5-3-2 ou 5-2-3) en fin de match pour doubler les ailes.',
  },
  {
    label: 'Bascule 3-5-2 / Pression Pistons',
    prompt: 'Comment maximiser un système à 3 axiaux et 2 pistons ?',
    title: 'Maîtrise Axiale & Surnombre par les Pistons',
    defensivePlan: [
      'Les 2 pistons se replient pour former une ligne de 5 hermétique sans le ballon.',
      'Les 3 centraux couvrent toute la largeur de la surface sans se faire isoler.',
      'Milieu à 3 agressif sur le porteur pour orienter vers l’extérieur.',
    ],
    offensivePlan: [
      'Pistons très hauts collés à la ligne de touche pour étirer le bloc adverse.',
      'Fixer dans l’axe avec le duo d’attaque pour renverser en une touche sur le piston opposé.',
      'Le milieu relayeur plonge dans le demi-espace libéré par le piston.',
    ],
    keyInstructions: [
      'Condition physique irréprochable des pistons (gestion des efforts aller-retour).',
      'Le duo d’attaque doit combiner vite et ne jamais rester sur la même ligne.',
    ],
    planB: 'Si les pistons sont fatigués, repasser à 4 défenseurs traditionnels (4-3-3).',
  },
];

export function CoachAiOpponentAnalysis({ onBack, events, members }: Props) {
  const { tokens } = useCoachTheme();
  const shellNav = useCoachShellNav();
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedScenario, setSelectedScenario] = useState<TacticalScenario>(TACTICAL_PRESETS[0]);
  const [loading, setLoading] = useState(false);

  const pastAnalyses = useMemo(() => listRecentPostMatchAnalyses(events, members, 2), [events, members]);

  const handleSelectPreset = (scenario: TacticalScenario) => {
    setLoading(true);
    setSelectedScenario(scenario);
    setTimeout(() => {
      setLoading(false);
    }, 280);
  };

  const handleCustomSearch = () => {
    if (!customPrompt.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setSelectedScenario({
        label: 'Analyse Sur-Mesure',
        prompt: customPrompt,
        title: `Plan Tactique Spécifique : « ${customPrompt.slice(0, 45)} »`,
        defensivePlan: [
          'Bloc médian structuré avec marquage individuel sur les zones à risque.',
          'Récupération agressive dans les couloirs avec prise à deux.',
          'Alignement défensif strict pour piéger le hors-jeu.',
        ],
        offensivePlan: [
          'Jeu rapide à une ou deux touches pour casser la pression adverse.',
          'Appuis-remises axiaux pour décaler les ailiers lancés.',
          'Occupation des demi-espaces entre les défenseurs et les milieux.',
        ],
        keyInstructions: [
          'Rester compacts et solidaires sur chaque perte de balle.',
          'Prendre des initiatives individuelles dans le dernier tiers.',
        ],
        planB: 'Ajuster la hauteur de la ligne défensive selon l’évolution du score.',
      });
      setLoading(false);
    }, 320);
  };

  return (
    <CoachPane
      title="Analyse Tactique IA"
      onBack={onBack}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header Card */}
          <View style={[styles.card, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
            <View style={styles.headerRow}>
              <View style={[styles.iconCircle, { backgroundColor: '#3B82F622' }]}>
                <Icon name="stats-chart" size={20} color="#3B82F6" />
              </View>
              <View style={{ flex: 1 }}>
                <CoachText style={[styles.title, { color: tokens.foreground }]}>
                  Stratégie & Analyse Tactique IA
                </CoachText>
                <CoachText style={[styles.subtitle, { color: tokens.muted }]}>
                  Anticipez les dispositifs adverses et générez des solutions de jeu.
                </CoachText>
              </View>
            </View>

            {/* Presets Grid */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Icon name="shield" size={16} color={tokens.accent} />
              <CoachText style={[styles.chipsTitle, { color: tokens.foreground, marginBottom: 0 }]}>
                Scénarios Tactiques & Clés de Match :
              </CoachText>
            </View>
            <View style={styles.presetsList}>
              {TACTICAL_PRESETS.map((preset) => {
                const isSelected = selectedScenario.label === preset.label;
                return (
                  <PressableSpring
                    key={preset.label}
                    onPress={() => handleSelectPreset(preset)}
                    style={[
                      styles.presetCard,
                      {
                        backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.15)' : tokens.elevated,
                        borderColor: isSelected ? '#3B82F6' : tokens.border,
                      },
                    ]}
                    scaleTo={0.97}
                    haptic
                  >
                    <CoachText
                      style={[
                        styles.presetLabel,
                        { color: isSelected ? '#60A5FA' : tokens.foreground },
                      ]}
                    >
                      {preset.label}
                    </CoachText>
                  </PressableSpring>
                );
              })}
            </View>

            {/* Custom Scenario Input */}
            <View style={[styles.customInputBox, { backgroundColor: tokens.bg, borderColor: tokens.border }]}>
              <TextInput
                style={[styles.input, { color: tokens.foreground }]}
                placeholder="Ou décrivez l'adversaire (ex: 4-4-2 avec meneur lent et ailiers rapides)..."
                placeholderTextColor={tokens.muted}
                value={customPrompt}
                onChangeText={setCustomPrompt}
                onSubmitEditing={handleCustomSearch}
              />
              <PressableSpring
                style={[
                  styles.searchBtn,
                  { backgroundColor: customPrompt.trim() ? '#3B82F6' : tokens.border },
                ]}
                onPress={handleCustomSearch}
                disabled={!customPrompt.trim()}
                haptic
              >
                <Icon name="star-four-points" size={16} color="#FFF" />
              </PressableSpring>
            </View>
          </View>

          {/* Loading state */}
          {loading && (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <CoachText style={{ color: tokens.muted, marginTop: 8, fontSize: 13 }}>
                Génération de l'analyse tactique et des clés de match...
              </CoachText>
            </View>
          )}

          {/* Tactical Plan Results */}
          {!loading && selectedScenario && (
            <View style={[styles.card, styles.planCard, { backgroundColor: tokens.surface, borderColor: '#3B82F655' }]}>
              <View style={styles.planHeader}>
                <View style={styles.planBadge}>
                  <Icon name="shield" size={12} color="#60A5FA" />
                  <CoachText style={styles.planBadgeText}>PLAN TACTIQUE IA</CoachText>
                </View>
                <CoachText style={[styles.planTitle, { color: tokens.foreground }]}>
                  {selectedScenario.title}
                </CoachText>
              </View>

              {/* 1. Defensive Organization */}
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeaderRow}>
                  <Icon name="shield" size={16} color="#EF4444" />
                  <CoachText style={[styles.sectionHeading, { color: '#EF4444' }]}>
                    Organisation Défensive & Pressing
                  </CoachText>
                </View>
                {selectedScenario.defensivePlan.map((p, i) => (
                  <View key={i} style={styles.bulletRow}>
                    <CoachText style={{ color: '#EF4444', fontWeight: '900' }}>•</CoachText>
                    <CoachText style={[styles.bulletText, { color: tokens.foreground }]}>{p}</CoachText>
                  </View>
                ))}
              </View>

              {/* 2. Offensive Animation */}
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeaderRow}>
                  <Icon name="football" size={16} color="#10B981" />
                  <CoachText style={[styles.sectionHeading, { color: '#10B981' }]}>
                    Animation Offensive & Sorties de Balle
                  </CoachText>
                </View>
                {selectedScenario.offensivePlan.map((p, i) => (
                  <View key={i} style={styles.bulletRow}>
                    <CoachText style={{ color: '#10B981', fontWeight: '900' }}>•</CoachText>
                    <CoachText style={[styles.bulletText, { color: tokens.foreground }]}>{p}</CoachText>
                  </View>
                ))}
              </View>

              {/* 3. Key Instructions */}
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeaderRow}>
                  <Icon name="star-four-points" size={16} color="#F59E0B" />
                  <CoachText style={[styles.sectionHeading, { color: '#F59E0B' }]}>
                    Consignes Clés Collectives
                  </CoachText>
                </View>
                {selectedScenario.keyInstructions.map((p, i) => (
                  <View key={i} style={styles.bulletRow}>
                    <CoachText style={{ color: '#F59E0B', fontWeight: '900' }}>•</CoachText>
                    <CoachText style={[styles.bulletText, { color: tokens.foreground }]}>{p}</CoachText>
                  </View>
                ))}
              </View>

              {/* 4. Plan B / Adaptation */}
              <View style={[styles.planBBox, { backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: '#3B82F644' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Icon name="refresh" size={14} color="#60A5FA" />
                  <CoachText style={[styles.planBHeading, { marginBottom: 0 }]}>Plan B & Ajustement en Match</CoachText>
                </View>
                <CoachText style={[styles.planBText, { color: tokens.foreground }]}>
                  {selectedScenario.planB}
                </CoachText>
              </View>

              {/* Action: Open Pitch */}
              {shellNav ? (
                <PressableSpring
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    backgroundColor: tokens.accent,
                    borderRadius: radius.md,
                    paddingVertical: 12,
                    marginTop: spacing.md,
                  }}
                  onPress={() => {
                    onBack();
                    shellNav.requestNav('equipe');
                  }}
                  scaleTo={0.97}
                  haptic
                >
                  <Icon name="football" size={16} color={tokens.onAccent} />
                  <CoachText style={{ color: tokens.onAccent, fontWeight: '800', fontSize: 13 }}>
                    Appliquer le dispositif sur le terrain de l'Équipe
                  </CoachText>
                </PressableSpring>
              ) : null}
            </View>
          )}

          {/* Past Match Debriefs */}
          {pastAnalyses.length > 0 && (
            <View style={{ marginTop: spacing.sm, gap: spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Icon name="document-text" size={16} color={tokens.accent} />
                <CoachText style={[styles.chipsTitle, { color: tokens.foreground, marginBottom: 0 }]}>
                  Débriefs des Derniers Matchs :
                </CoachText>
              </View>
              {pastAnalyses.map((analysis) => (
                <View
                  key={analysis.eventId}
                  style={[styles.card, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
                >
                  <CoachText style={[styles.title, { color: tokens.foreground, fontSize: 16 }]}>
                    {analysis.title}
                  </CoachText>
                  <CoachText style={{ color: tokens.muted, fontSize: 12, marginTop: 2, marginBottom: spacing.sm }}>
                    {analysis.date.toLocaleDateString('fr-FR')} {analysis.scoreLabel ? `• Score : ${analysis.scoreLabel}` : ''}
                  </CoachText>
                  {analysis.positives.length > 0 && (
                    <View style={{ marginBottom: 4 }}>
                      <CoachText style={{ color: '#10B981', fontSize: 12, fontWeight: '800' }}>
                        Points forts : {analysis.positives.join(', ')}
                      </CoachText>
                    </View>
                  )}
                  {analysis.improvements.length > 0 && (
                    <View>
                      <CoachText style={{ color: '#EF4444', fontSize: 12, fontWeight: '800' }}>
                        À corriger : {analysis.improvements.join(', ')}
                      </CoachText>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </CoachPane>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, paddingBottom: 80, gap: spacing.md },
  card: { padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  iconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '900', letterSpacing: -0.2 },
  subtitle: { fontSize: 12.5, lineHeight: 17 },
  chipsTitle: { fontSize: 12, fontWeight: '800', marginTop: spacing.sm, marginBottom: spacing.xs },

  presetsList: { gap: spacing.xs, marginBottom: spacing.md },
  presetCard: { padding: spacing.md, borderRadius: radius.md, borderWidth: 1 },
  presetLabel: { fontSize: 13, fontWeight: '800' },

  customInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
  },
  input: { flex: 1, paddingVertical: 10, fontSize: 12.5 },
  searchBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },

  loadingBox: { alignItems: 'center', padding: spacing.xl },

  planCard: { marginTop: spacing.xs },
  planHeader: { marginBottom: spacing.md },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    marginBottom: 6,
  },
  planBadgeText: { color: '#60A5FA', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  planTitle: { fontSize: 18, fontWeight: '900' },

  sectionBlock: { marginBottom: spacing.md },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  sectionHeading: { fontSize: 13.5, fontWeight: '900' },
  bulletRow: { flexDirection: 'row', gap: 6, marginBottom: 4 },
  bulletText: { fontSize: 12.5, lineHeight: 17, flex: 1 },

  planBBox: { padding: spacing.md, borderRadius: radius.md, borderWidth: 1, marginTop: spacing.xs },
  planBHeading: { color: '#60A5FA', fontSize: 12.5, fontWeight: '900', marginBottom: 4 },
  planBText: { fontSize: 12, lineHeight: 16 },
});

