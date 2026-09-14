import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  CoachTrainingDrillDiagram,
  type DrillType,
} from '../../components/coach/CoachTrainingDrillDiagram';

export interface SessionExercise {
  id: string;
  name: string;
  durationMin: number;
  drillType: DrillType;
  intensity: 'low' | 'medium' | 'high';
  playerCount: number;
  objective: string;
  instructions: string;
  thematic?: string;
}

export interface ThematicDrillTemplate {
  id: string;
  theme: 'all' | 'activation' | 'rondo' | 'circuit' | 'finishing' | 'pressing' | 'set_pieces';
  themeLabel: string;
  name: string;
  durationMin: number;
  drillType: DrillType;
  intensity: 'low' | 'medium' | 'high';
  playerCount: number;
  objective: string;
  instructions: string;
}

export const THEMATIC_DRILLS_LIBRARY: ThematicDrillTemplate[] = [
  // 1. Échauffement & Activation
  {
    id: 'th-act-1',
    theme: 'activation',
    themeLabel: 'Échauffement',
    name: 'Activation Neuro-Musculaire & Appuis Dynamiques',
    durationMin: 15,
    drillType: 'generic',
    intensity: 'low',
    playerCount: 18,
    objective: 'Mise en route cardiovasculaire et gammes athlétiques progressives',
    instructions: 'Courses progressives, déverrouillage articulaire, appuis dynamiques et étirements actifs.',
  },
  {
    id: 'th-act-2',
    theme: 'activation',
    themeLabel: 'Échauffement',
    name: 'Passe & Suit Vivacité Décisionnelle',
    durationMin: 12,
    drillType: 'circuit',
    intensity: 'medium',
    playerCount: 14,
    objective: 'Vitesse de transmission et orientation corporelle avant contrôle',
    instructions: 'Circuit carré 12x12m. Passes courtes appuyées, changements de rythme et appels dans les intervalles.',
  },
  // 2. Rondos & Conservation
  {
    id: 'th-ron-1',
    theme: 'rondo',
    themeLabel: 'Rondos',
    name: 'Rondo 4v2 Espaces Réduits à 2 Touches',
    durationMin: 20,
    drillType: 'rondo',
    intensity: 'medium',
    playerCount: 6,
    objective: 'Conservation sous pressing et orientation du corps',
    instructions: 'Zone 15x15m. 4 joueurs en périphérie à 2 touches max. 2 chasseurs au centre. Si interception, permutation.',
  },
  {
    id: 'th-ron-2',
    theme: 'rondo',
    themeLabel: 'Rondos',
    name: 'Rondo 5v2 avec Appui Central & Transition',
    durationMin: 18,
    drillType: 'rondo',
    intensity: 'medium',
    playerCount: 7,
    objective: 'Fixer à l’intérieur pour libérer la périphérie',
    instructions: 'Zone 18x18m. Recherche prioritaire de la passe cassant la ligne des 2 récupérateurs.',
  },
  // 3. Sortie de Balle & Circuits
  {
    id: 'th-cir-1',
    theme: 'circuit',
    themeLabel: 'Circuits',
    name: 'Sortie de Balle depuis le 6m & Dézonage Piston',
    durationMin: 25,
    drillType: 'circuit',
    intensity: 'high',
    playerCount: 11,
    objective: 'Décrochage du milieu sentinelle et projection du latéral',
    instructions: 'Relance gardien au pied, appel du 6 dans la boîte, relais vers le latéral lancé.',
  },
  {
    id: 'th-cir-2',
    theme: 'circuit',
    themeLabel: 'Circuits',
    name: 'Circuit Déviation Axiale & Troisième Homme',
    durationMin: 20,
    drillType: 'circuit',
    intensity: 'medium',
    playerCount: 12,
    objective: 'Combinaisons rapides en une touche sur appui-soutien',
    instructions: 'Passe verticale vers le 9 dos au but, remise en une touche vers le milieu qui lance l’ailier opposé.',
  },
  // 4. Finition & Couloirs
  {
    id: 'th-fin-1',
    theme: 'finishing',
    themeLabel: 'Finition',
    name: 'Centres au Cordeau & Coordination 1er / 2nd Poteau',
    durationMin: 25,
    drillType: 'finishing',
    intensity: 'high',
    playerCount: 10,
    objective: 'Attaque synchronisée des zones de finition dans la surface',
    instructions: 'Passe axiale vers l’ailier lancé. Centre fort à ras de terre ou au 2nd poteau. Attaque conjointe du BU et du MO.',
  },
  {
    id: 'th-fin-2',
    theme: 'finishing',
    themeLabel: 'Finition',
    name: 'Frappes Sous Pression en Entrée de Surface 2v1',
    durationMin: 20,
    drillType: 'finishing',
    intensity: 'high',
    playerCount: 8,
    objective: 'Spontanéité de frappe et élimination en vitesse',
    instructions: 'Duel offensif à 20 mètres. Prise de risque rapide sous la pression d’un défenseur en retard.',
  },
  // 5. Pressing & Bloc équipe
  {
    id: 'th-pre-1',
    theme: 'pressing',
    themeLabel: 'Pressing',
    name: 'Pressing Haut Coordonné sur Passe Latérale',
    durationMin: 22,
    drillType: 'pressing',
    intensity: 'high',
    playerCount: 14,
    objective: 'Déclenchement synchronisé du pressing sur temps de passe',
    instructions: 'Dès que le défenseur adverse joue vers son latéral, l’ailier bloque l’extérieur et le milieu cadre l’axe.',
  },
  {
    id: 'th-pre-2',
    theme: 'pressing',
    themeLabel: 'Pressing',
    name: 'Coulissement Défensif en Bloc Médian 4-4-2',
    durationMin: 20,
    drillType: 'possession',
    intensity: 'medium',
    playerCount: 16,
    objective: 'Compacité axiale et gestion de la profondeur',
    instructions: 'Terrain réduit. L’équipe en bloc doit coulisser sans se faire traverser entre les lignes.',
  },
  // 6. Coups de Pied Arrêtés
  {
    id: 'th-set-1',
    theme: 'set_pieces',
    themeLabel: 'Coups Arrêtés',
    name: 'Corners Offensifs : Blocage Premier Poteau & Déviation',
    durationMin: 15,
    drillType: 'finishing',
    intensity: 'medium',
    playerCount: 18,
    objective: 'Création d’espace pour l’attaquant lancé au second poteau',
    instructions: 'Tireur rentrant. Deux joueurs créent le blocage au premier poteau pour libérer le point de penalty.',
  },
];

const DEFAULT_SESSION: SessionExercise[] = [
  THEMATIC_DRILLS_LIBRARY[0],
  THEMATIC_DRILLS_LIBRARY[2],
  THEMATIC_DRILLS_LIBRARY[6],
  {
    id: 'ex4',
    name: 'Opposition Dirigée 8v8 + 2 Jokers Flottants',
    durationMin: 20,
    drillType: 'possession',
    intensity: 'high',
    playerCount: 18,
    objective: 'Animation offensive et recherche du surnombre',
    instructions: 'Terrain réduit (surface à surface). Obligation de passer par un couloir avant de finaliser dans l’axe.',
    thematic: 'opposition',
  },
  {
    id: 'ex5',
    name: 'Retour au Calme & Débriefing Collectif',
    durationMin: 10,
    drillType: 'generic',
    intensity: 'low',
    playerCount: 18,
    objective: 'Récupération active et fixation des objectifs match',
    instructions: 'Trottinage souple, travail de respiration guidée et rappel des consignes pour dimanche.',
    thematic: 'recup',
  },
];

const THEME_FILTERS = [
  { id: 'all', label: 'Toutes' },
  { id: 'activation', label: 'Échauffement' },
  { id: 'rondo', label: 'Rondos' },
  { id: 'circuit', label: 'Circuits' },
  { id: 'finishing', label: 'Finition' },
  { id: 'pressing', label: 'Pressing' },
  { id: 'set_pieces', label: 'Coups Arrêtés' },
] as const;

export const CoachTrainingPlannerScreen: React.FC = () => {
  const [exercises, setExercises] = useState<SessionExercise[]>(DEFAULT_SESSION);
  const [selectedTheme, setSelectedTheme] = useState<string>('all');
  const [showAiGen, setShowAiGen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>('th-ron-1');
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [libraryFilter, setLibraryFilter] = useState<string>('all');

  const triggerHaptic = () => {
    try {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // ignore
    }
  };

  const totalDuration = exercises.reduce((acc, curr) => acc + curr.durationMin, 0);

  const updateExerciseIntensity = (id: string, intensity: 'low' | 'medium' | 'high') => {
    triggerHaptic();
    setExercises((prev) =>
      prev.map((e) => (e.id === id ? { ...e, intensity } : e))
    );
  };

  const updateExerciseDuration = (id: string, delta: number) => {
    triggerHaptic();
    setExercises((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, durationMin: Math.max(5, e.durationMin + delta) } : e
      )
    );
  };

  const updateExercisePlayerCount = (id: string, delta: number) => {
    triggerHaptic();
    setExercises((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, playerCount: Math.max(2, (e.playerCount || 14) + delta) } : e
      )
    );
  };

  const updateExerciseDrillType = (id: string, drillType: DrillType) => {
    triggerHaptic();
    setExercises((prev) =>
      prev.map((e) => (e.id === id ? { ...e, drillType } : e))
    );
  };

  const addManualExercise = () => {
    triggerHaptic();
    const newEx: SessionExercise = {
      id: `manual-${Date.now()}`,
      name: 'Nouvel Atelier Personnalisé',
      durationMin: 15,
      drillType: 'rondo',
      intensity: 'medium',
      playerCount: 12,
      objective: 'Atelier configuré manuellement par le coach',
      instructions: 'Définissez vos règles de touches, dimensions et rotations.',
    };
    setExercises((prev) => [...prev, newEx]);
    setExpandedId(newEx.id);
  };

  const addDrillFromLibrary = (template: ThematicDrillTemplate) => {
    triggerHaptic();
    const newEx: SessionExercise = {
      ...template,
      id: `drill-${Date.now()}-${template.id}`,
    };
    setExercises((prev) => [...prev, newEx]);
    setExpandedId(newEx.id);
    setShowLibraryModal(false);
    Alert.alert('Atelier Ajouté', `« ${template.name} » a été ajouté à votre séance.`);
  };

  const deleteExercise = (id: string) => {
    triggerHaptic();
    setExercises((prev) => prev.filter((e) => e.id !== id));
  };

  const generateCustomDrill = () => {
    if (!aiPrompt.trim()) return;
    triggerHaptic();
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      const newEx: SessionExercise = {
        id: `ai-${Date.now()}`,
        name: `Atelier IA : ${aiPrompt}`,
        durationMin: 20,
        drillType: 'pressing',
        intensity: 'high',
        playerCount: 14,
        objective: 'Fermeture immédiate des lignes de passe axiales',
        instructions: 'Bloc médian compact. Cadrage du porteur à la passe latérale et coulissement coordonné vers le ballon.',
      };
      setExercises((prev) => [newEx, ...prev]);
      setExpandedId(newEx.id);
      setAiPrompt('');
      setShowAiGen(false);
    }, 600);
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Header: Session Overview & Periodization (Design v4) */}
      <View style={styles.sessionHeaderCard}>
        <View style={styles.sessionBadgeRow}>
          <View style={styles.themeBadge}>
            <Text style={styles.themeBadgeText}>SÉANCE N°48 · TRANSITION & FINITION</Text>
          </View>
          <View style={styles.rpeBadge}>
            <Text style={styles.rpeBadgeText}>Intensité : RPE 7.5/10</Text>
          </View>
        </View>

        <Text style={styles.sessionTitle}>Sortie de Balle Rapide & Attaque des Couloirs</Text>
        <Text style={styles.sessionSubtitle}>Mardi 19:30 · Terrain Synthétique 1 · Seniors 1</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Feather name="clock" size={14} color="#D97706" />
            <Text style={styles.metaText}>{totalDuration} min au total</Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="layers-outline" size={14} color="#0284C7" />
            <Text style={styles.metaText}>{exercises.length} ateliers planifiés</Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="account-group-outline" size={14} color="#16A34A" />
            <Text style={styles.metaText}>18 Joueurs attendus</Text>
          </View>
        </View>

        {/* Action button to open Thematic Library Modal */}
        <TouchableOpacity
          style={styles.openLibraryBtn}
          activeOpacity={0.85}
          onPress={() => {
            triggerHaptic();
            setShowLibraryModal(true);
          }}
        >
          <MaterialCommunityIcons name="book-open-page-variant-outline" size={18} color="#0F172A" />
          <Text style={styles.openLibraryBtnText}>Bibliothèque par Thématique (11 ateliers)</Text>
          <Feather name="arrow-right" size={16} color="#0F172A" />
        </TouchableOpacity>
      </View>

      {/* 2. Page 7 Specification: Création Assistée par IA (Optionnelle & Rétractable) */}
      <View style={styles.aiGeneratorCard}>
        <TouchableOpacity
          style={styles.aiGenHeaderRow}
          activeOpacity={0.8}
          onPress={() => {
            triggerHaptic();
            setShowAiGen(!showAiGen);
          }}
        >
          <View style={styles.aiGenTitleRow}>
            <MaterialCommunityIcons name="star-four-points" size={16} color="#D97706" />
            <Text style={styles.aiGenTitle}>Création Assistée par IA (Optionnel)</Text>
          </View>
          <Feather name={showAiGen ? 'chevron-up' : 'chevron-down'} size={16} color="#64748B" />
        </TouchableOpacity>

        {showAiGen && (
          <View style={styles.aiGenBody}>
            <Text style={styles.aiGenDesc}>
              Décrivez votre intention tactique pour générer un atelier sur-mesure 100% modifiable :
            </Text>

            {/* Quick Suggestions Chips */}
            <View style={styles.aiSuggestionsRow}>
              {['Pressing haut 4v3', 'Transition rapide axiale', 'Finition 2v1 couloirs'].map((sug) => (
                <TouchableOpacity
                  key={sug}
                  style={styles.aiSugChip}
                  onPress={() => setAiPrompt(sug)}
                >
                  <Text style={styles.aiSugChipText}>+ {sug}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.inputRow}>
              <TextInput
                style={styles.promptInput}
                placeholder="Ex : Sortie de balle sous pressing 4v3..."
                placeholderTextColor="#94A3B8"
                value={aiPrompt}
                onChangeText={setAiPrompt}
              />
              <TouchableOpacity
                style={[styles.generateBtn, isGenerating && styles.generateBtnLoading]}
                activeOpacity={0.8}
                onPress={generateCustomDrill}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="lightning-bolt" size={16} color="#FFFFFF" />
                    <Text style={styles.generateBtnText}>Générer</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* 3. Filter Bar by Theme */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {THEME_FILTERS.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.filterPill, selectedTheme === item.id && styles.filterPillActive]}
            onPress={() => {
              triggerHaptic();
              setSelectedTheme(item.id);
            }}
          >
            <Text style={[styles.filterPillText, selectedTheme === item.id && styles.filterPillTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 4. Timeline Header with + Atelier Manuel Button */}
      <View style={styles.timelineHeaderRow}>
        <Text style={styles.timelineHeader}>Déroulé de la Séance ({exercises.length})</Text>
        <TouchableOpacity style={styles.addManualBtn} onPress={addManualExercise} activeOpacity={0.8}>
          <Feather name="plus" size={14} color="#0F172A" />
          <Text style={styles.addManualText}>Atelier Manuel</Text>
        </TouchableOpacity>
      </View>

      {/* 5. Timeline List of Exercises with Interactive Vector Diagram & Steppers */}
      {exercises
        .filter((ex) => {
          if (selectedTheme === 'all') return true;
          return ex.drillType === selectedTheme || (ex as any).theme === selectedTheme;
        })
        .map((ex, idx) => {
          const isExpanded = expandedId === ex.id;

          return (
            <View key={ex.id} style={styles.exerciseCard}>
              <TouchableOpacity
                style={styles.exerciseTopRow}
                activeOpacity={0.8}
                onPress={() => {
                  triggerHaptic();
                  setExpandedId(isExpanded ? null : ex.id);
                }}
              >
                <View style={styles.exerciseIndexBadge}>
                  <Text style={styles.exerciseIndexText}>0{idx + 1}</Text>
                </View>
                <View style={styles.exerciseMainInfo}>
                  <Text style={styles.exerciseName}>{ex.name}</Text>
                  <View style={styles.exerciseTags}>
                    <Text style={styles.exerciseDuration}>{ex.durationMin} min</Text>
                    <Text style={styles.tagDot}>•</Text>
                    <Text style={styles.exercisePlayers}>{ex.playerCount || 14} joueurs</Text>
                    <Text style={styles.tagDot}>•</Text>
                    <Text
                      style={[
                        styles.exerciseIntensity,
                        ex.intensity === 'high'
                          ? { color: '#EF4444' }
                          : ex.intensity === 'medium'
                          ? { color: '#D97706' }
                          : { color: '#16A34A' },
                      ]}
                    >
                      RPE {ex.intensity === 'high' ? 'Élevé' : ex.intensity === 'medium' ? 'Moyen' : 'Faible'}
                    </Text>
                  </View>
                </View>
                <Feather
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color="#64748B"
                />
              </TouchableOpacity>

              {/* Collapsible Detail Section with Interactive Graphical Diagram & Controls */}
              {isExpanded && (
                <View style={styles.expandedSection}>
                  <View style={styles.objectiveBox}>
                    <Text style={styles.objectiveLabel}>Objectif pédagogique :</Text>
                    <Text style={styles.objectiveText}>{ex.objective}</Text>
                  </View>

                  {/* Vector Tactical Board Diagram */}
                  <View style={styles.diagramContainer}>
                    <CoachTrainingDrillDiagram
                      drillType={ex.drillType}
                      title={ex.name}
                      intensity={ex.intensity}
                      width={310}
                      height={180}
                    />
                  </View>

                  {/* 1-Tap Steppers & Controls */}
                  <View style={styles.controlsPanel}>
                    <Text style={styles.panelTitle}>PARAMÈTRES DE L'ATELIER (1 TAP)</Text>

                    {/* Steppers Row: Duration & Player Count */}
                    <View style={styles.steppersRow}>
                      <View style={styles.stepperBlock}>
                        <Text style={styles.stepperLabel}>Durée (min)</Text>
                        <View style={styles.stepperControl}>
                          <TouchableOpacity
                            style={styles.stepperBtn}
                            onPress={() => updateExerciseDuration(ex.id, -5)}
                          >
                            <Feather name="minus" size={13} color="#0F172A" />
                          </TouchableOpacity>
                          <Text style={styles.stepperVal}>{ex.durationMin}m</Text>
                          <TouchableOpacity
                            style={styles.stepperBtn}
                            onPress={() => updateExerciseDuration(ex.id, 5)}
                          >
                            <Feather name="plus" size={13} color="#0F172A" />
                          </TouchableOpacity>
                        </View>
                      </View>

                      <View style={styles.stepperBlock}>
                        <Text style={styles.stepperLabel}>Joueurs</Text>
                        <View style={styles.stepperControl}>
                          <TouchableOpacity
                            style={styles.stepperBtn}
                            onPress={() => updateExercisePlayerCount(ex.id, -1)}
                          >
                            <Feather name="minus" size={13} color="#0F172A" />
                          </TouchableOpacity>
                          <Text style={styles.stepperVal}>{ex.playerCount || 14}</Text>
                          <TouchableOpacity
                            style={styles.stepperBtn}
                            onPress={() => updateExercisePlayerCount(ex.id, 1)}
                          >
                            <Feather name="plus" size={13} color="#0F172A" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>

                    {/* Intensity Segmented Bar */}
                    <View style={styles.controlRow}>
                      <Text style={styles.controlLabel}>Intensité / Charge</Text>
                      <View style={styles.segmentedRow}>
                        {(['low', 'medium', 'high'] as const).map((lvl) => {
                          const active = ex.intensity === lvl;
                          return (
                            <TouchableOpacity
                              key={lvl}
                              style={[
                                styles.segmentBtn,
                                active && styles.segmentBtnActive,
                                active && lvl === 'high' && { borderColor: '#EF4444' },
                                active && lvl === 'medium' && { borderColor: '#F59E0B' },
                                active && lvl === 'low' && { borderColor: '#16A34A' },
                              ]}
                              onPress={() => updateExerciseIntensity(ex.id, lvl)}
                            >
                              <Text
                                style={[
                                  styles.segmentText,
                                  active && { color: lvl === 'high' ? '#EF4444' : lvl === 'medium' ? '#D97706' : '#16A34A', fontWeight: '700' },
                                ]}
                              >
                                {lvl === 'low' ? 'Basse' : lvl === 'medium' ? 'Moyenne' : 'Haute'}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>

                    {/* Drill Type Visual Schema Selector */}
                    <View style={styles.controlRow}>
                      <Text style={styles.controlLabel}>Schéma Vectoriel Terrain</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.schemaScroll}>
                        {(['rondo', 'finishing', 'circuit', 'possession', 'pressing', 'generic'] as const).map((dType) => {
                          const active = ex.drillType === dType;
                          return (
                            <TouchableOpacity
                              key={dType}
                              style={[styles.schemaChip, active && styles.schemaChipActive]}
                              onPress={() => updateExerciseDrillType(ex.id, dType)}
                            >
                              <Text style={[styles.schemaChipText, active && styles.schemaChipTextActive]}>
                                {dType.toUpperCase()}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>

                    {/* Delete Action */}
                    <View style={styles.actionRow}>
                      <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteExercise(ex.id)}>
                        <Feather name="trash-2" size={13} color="#EF4444" />
                        <Text style={styles.deleteBtnText}>Supprimer cet atelier</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Consignes Text */}
                  <View style={styles.instructionsBox}>
                    <Text style={styles.instructionsLabel}>Consignes & Règles du Jeu :</Text>
                    <Text style={styles.instructionsText}>{ex.instructions}</Text>
                  </View>
                </View>
              )}
            </View>
          );
        })}

      {/* 6. Page 7 Modal: Bibliothèque par Thématique */}
      <Modal
        visible={showLibraryModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowLibraryModal(false)}
      >
        <View style={styles.modalRoot}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Bibliothèque d’Ateliers</Text>
              <Text style={styles.modalSubtitle}>Sélectionnez et injectez un atelier thématique</Text>
            </View>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShowLibraryModal(false)}
            >
              <Feather name="x" size={20} color="#0F172A" />
            </TouchableOpacity>
          </View>

          {/* Modal Theme Filter Pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modalFilterRow}>
            {THEME_FILTERS.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.filterPill, libraryFilter === item.id && styles.filterPillActive]}
                onPress={() => {
                  triggerHaptic();
                  setLibraryFilter(item.id);
                }}
              >
                <Text style={[styles.filterPillText, libraryFilter === item.id && styles.filterPillTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Drills List from Library */}
          <ScrollView contentContainerStyle={styles.modalListContent}>
            {THEMATIC_DRILLS_LIBRARY
              .filter((tpl) => libraryFilter === 'all' || tpl.theme === libraryFilter)
              .map((template) => (
                <View key={template.id} style={styles.libraryCard}>
                  <View style={styles.libraryCardTop}>
                    <View style={styles.libraryThemeBadge}>
                      <Text style={styles.libraryThemeBadgeText}>{template.themeLabel.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.libraryDuration}>{template.durationMin} min · {template.playerCount} joueurs</Text>
                  </View>

                  <Text style={styles.libraryCardName}>{template.name}</Text>
                  <Text style={styles.libraryCardObjective}>{template.objective}</Text>

                  <View style={styles.libraryDiagramWrapper}>
                    <CoachTrainingDrillDiagram
                      drillType={template.drillType}
                      title={template.name}
                      intensity={template.intensity}
                      width={280}
                      height={140}
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.addFromLibraryBtn}
                    activeOpacity={0.85}
                    onPress={() => addDrillFromLibrary(template)}
                  >
                    <Feather name="plus" size={16} color="#FFFFFF" />
                    <Text style={styles.addFromLibraryBtnText}>Ajouter à la Séance (1 tap)</Text>
                  </TouchableOpacity>
                </View>
              ))}
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 16,
    paddingBottom: 48,
  },

  /* Header Card */
  sessionHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 14,
  },
  sessionBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  themeBadge: {
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  themeBadgeText: {
    color: '#B45309',
    fontSize: 9.5,
    fontWeight: '800',
    fontFamily: '-apple-system',
    letterSpacing: 0.4,
  },
  rpeBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  rpeBadgeText: {
    color: '#D97706',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  sessionTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
    fontFamily: '-apple-system',
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  sessionSubtitle: {
    color: '#64748B',
    fontSize: 11,
    fontFamily: '-apple-system',
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    color: '#475569',
    fontSize: 10.5,
    fontWeight: '600',
    fontFamily: '-apple-system',
  },
  metaDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#E2E8F0',
  },
  openLibraryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 11,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  openLibraryBtnText: {
    color: '#0F172A',
    fontSize: 12.5,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },

  /* AI Generator Card */
  aiGeneratorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 14,
  },
  aiGenHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  aiGenTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiGenTitle: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  aiGenBody: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  aiGenDesc: {
    color: '#64748B',
    fontSize: 11,
    fontFamily: '-apple-system',
    marginBottom: 8,
  },
  aiSuggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  aiSugChip: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  aiSugChipText: {
    color: '#0284C7',
    fontSize: 10.5,
    fontWeight: '600',
    fontFamily: '-apple-system',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  promptInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#0F172A',
    fontSize: 12,
    fontFamily: '-apple-system',
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0F172A',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  generateBtnLoading: {
    opacity: 0.7,
  },
  generateBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },

  /* Filter Row */
  filterRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 6,
  },
  filterPillActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  filterPillText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: '-apple-system',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  /* Timeline */
  timelineHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  timelineHeader: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  addManualBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  addManualText: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },

  /* Exercise Card */
  exerciseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    overflow: 'hidden',
  },
  exerciseTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  exerciseIndexBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  exerciseIndexText: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
  exerciseMainInfo: {
    flex: 1,
  },
  exerciseName: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: '-apple-system',
    marginBottom: 2,
  },
  exerciseTags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  exerciseDuration: {
    color: '#64748B',
    fontSize: 10.5,
    fontWeight: '600',
    fontFamily: '-apple-system',
  },
  tagDot: {
    color: '#CBD5E1',
    fontSize: 9,
  },
  exercisePlayers: {
    color: '#64748B',
    fontSize: 10.5,
    fontFamily: '-apple-system',
  },
  exerciseIntensity: {
    fontSize: 10.5,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  expandedSection: {
    padding: 14,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  objectiveBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  objectiveLabel: {
    color: '#64748B',
    fontSize: 10.5,
    fontWeight: '700',
    fontFamily: '-apple-system',
    marginBottom: 2,
  },
  objectiveText: {
    color: '#0F172A',
    fontSize: 11.5,
    lineHeight: 16,
    fontFamily: '-apple-system',
  },
  diagramContainer: {
    alignItems: 'center',
    backgroundColor: '#0a3d1a',
    borderRadius: 12,
    padding: 8,
    marginBottom: 10,
  },

  /* Controls Panel */
  controlsPanel: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  panelTitle: {
    color: '#0F172A',
    fontSize: 10,
    fontWeight: '800',
    fontFamily: '-apple-system',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  steppersRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  stepperBlock: {
    flex: 1,
  },
  stepperLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '600',
    fontFamily: '-apple-system',
    marginBottom: 3,
  },
  stepperControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stepperBtn: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperVal: {
    color: '#0F172A',
    fontSize: 11.5,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  controlRow: {
    marginBottom: 8,
  },
  controlLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '600',
    fontFamily: '-apple-system',
    marginBottom: 3,
  },
  segmentedRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 2,
    gap: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  segmentBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 5,
    borderRadius: 6,
  },
  segmentBtnActive: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
  },
  segmentText: {
    color: '#64748B',
    fontSize: 10.5,
    fontWeight: '600',
    fontFamily: '-apple-system',
  },
  schemaScroll: {
    flexDirection: 'row',
  },
  schemaChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  schemaChipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  schemaChipText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '600',
    fontFamily: '-apple-system',
  },
  schemaChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  deleteBtnText: {
    color: '#EF4444',
    fontSize: 10.5,
    fontWeight: '600',
    fontFamily: '-apple-system',
  },
  instructionsBox: {
    marginTop: 6,
  },
  instructionsLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: '-apple-system',
    marginBottom: 2,
  },
  instructionsText: {
    color: '#334155',
    fontSize: 11,
    lineHeight: 16,
    fontFamily: '-apple-system',
  },

  /* Modal Library */
  modalRoot: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
  modalSubtitle: {
    color: '#64748B',
    fontSize: 11.5,
    fontFamily: '-apple-system',
    marginTop: 1,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalFilterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  modalListContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  libraryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
  },
  libraryCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  libraryThemeBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  libraryThemeBadgeText: {
    color: '#0284C7',
    fontSize: 9.5,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
  libraryDuration: {
    color: '#64748B',
    fontSize: 10.5,
    fontWeight: '600',
    fontFamily: '-apple-system',
  },
  libraryCardName: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: '-apple-system',
    marginBottom: 4,
  },
  libraryCardObjective: {
    color: '#475569',
    fontSize: 11.5,
    lineHeight: 16,
    fontFamily: '-apple-system',
    marginBottom: 10,
  },
  libraryDiagramWrapper: {
    alignItems: 'center',
    backgroundColor: '#0a3d1a',
    borderRadius: 10,
    padding: 6,
    marginBottom: 12,
  },
  addFromLibraryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 10,
    paddingVertical: 10,
    gap: 6,
  },
  addFromLibraryBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
});
