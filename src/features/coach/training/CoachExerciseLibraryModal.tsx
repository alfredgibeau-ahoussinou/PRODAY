import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { Icon } from '../../../components/ui/Icon';
import { ExerciseYouTubePlayer } from '../../../components/video/ExerciseYouTubePlayer';
import { useCoachWorkspace } from '../shell/CoachWorkspaceContext';
import { useModalTopInset } from '../../../hooks/useModalTopInset';
import {
  TrainingText as CoachText,
  useCoachTrainingTheme,
  type CoachTrainingPalette,
} from './coachTrainingTheme';
import { CoachExerciseFullscreenModal } from './CoachExerciseFullscreenModal';
import {
  CORE_LIBRARY_EXERCISES,
  type LibraryCategoryId,
  type LibraryExercise,
} from './trainingLibrary';
import { tacticalSceneForLibraryExercise } from '../../tactics/engine/tacticalStarterSchemas';

export type ExerciseFilterCategory =
  | 'Tous'
  | 'Échauffement'
  | 'Conservation'
  | 'Transitions'
  | 'Finition'
  | 'Tactique';

export const EXERCISE_FILTER_CATEGORIES: ExerciseFilterCategory[] = [
  'Tous',
  'Échauffement',
  'Conservation',
  'Transitions',
  'Finition',
  'Tactique',
];

export type CustomCanvasElement = {
  id: string;
  kind: 'player' | 'defender' | 'cone' | 'ball' | 'arrow';
  x: number;
  y: number;
  toX?: number;
  toY?: number;
  label?: string;
};

export interface EnrichedExerciseItem {
  id: string;
  name: string;
  categoryLabel: Exclude<ExerciseFilterCategory, 'Tous'>;
  categoryId: LibraryCategoryId;
  durationMin: number;
  playersLabel: string;
  dimensionsLabel: string;
  objective: string;
  installation: string;
  instructions: string;
  variant: string;
  youtubeId?: string;
  schemaId?: string;
  phases: Array<{
    title: string;
    instruction: string;
    tokens: Array<{ x: number; y: number; defender?: boolean; label: string }>;
    ball: { fromX: number; fromY: number; toX: number; toY: number };
  }>;
}

const REFERENCE_EXERCISES: EnrichedExerciseItem[] = [
  {
    id: 'ref-rondo-evolutif',
    name: 'Rondo évolutif',
    categoryLabel: 'Conservation',
    categoryId: 'conservation',
    durationMin: 15,
    playersLabel: '12 à 16 joueurs',
    dimensionsLabel: '20 × 20 m',
    objective: 'Conserver le ballon sous pression et trouver le joueur libre.',
    installation:
      'Deux groupes de 6 à 8 joueurs. Deux défenseurs au centre. Changer les défenseurs toutes les 90 secondes. Prévoir des ballons autour de la zone.',
    instructions:
      'Prendre l’information avant de recevoir. Se rendre disponible après la passe. Adapter le nombre de touches au niveau du groupe.',
    variant:
      'Réduire la zone ou limiter à deux touches. Pour simplifier, ajouter un appui extérieur.',
    youtubeId: '9HNcccx39D8',
    schemaId: 'rondo-4v2',
    phases: [
      {
        title: 'Phase 1 · Se rendre disponible',
        instruction: 'Écarter sur les côtés du carré pour ouvrir les lignes de passe.',
        tokens: [
          { x: 75, y: 65, label: '1' },
          { x: 285, y: 65, label: '2' },
          { x: 180, y: 185, label: '3' },
          { x: 165, y: 118, defender: true, label: '4' },
        ],
        ball: { fromX: 75, fromY: 65, toX: 285, toY: 65 },
      },
      {
        title: 'Phase 2 · Passer et se déplacer',
        instruction: 'Après la passe, proposer immédiatement un angle de soutien.',
        tokens: [
          { x: 88, y: 78, label: '1' },
          { x: 285, y: 65, label: '2' },
          { x: 195, y: 175, label: '3' },
          { x: 210, y: 110, defender: true, label: '4' },
        ],
        ball: { fromX: 285, fromY: 65, toX: 195, toY: 175 },
      },
      {
        title: 'Phase 3 · Trouver le troisième homme',
        instruction: 'Fixer la pression axiale et trouver le troisième homme libre.',
        tokens: [
          { x: 70, y: 62, label: '1' },
          { x: 270, y: 80, label: '2' },
          { x: 180, y: 185, label: '3' },
          { x: 175, y: 138, defender: true, label: '4' },
        ],
        ball: { fromX: 180, fromY: 185, toX: 70, toY: 62 },
      },
    ],
  },
  {
    id: 'ref-activation-ballon',
    name: 'Activation avec ballon',
    categoryLabel: 'Échauffement',
    categoryId: 'echauffement',
    durationMin: 12,
    playersLabel: '14 à 18 joueurs',
    dimensionsLabel: '25 × 20 m',
    objective: 'Mise en route neuromusculaire et qualité technique des premières passes.',
    installation:
      'Quatre plots en losange. Deux colonnes de départ avec ballons. Rotation fluide après chaque passe.',
    instructions:
      'Passes appuyées au sol, contrôle orienté dans le sens de la course et communication parlée.',
    variant: 'Ajouter un une-deux sur le plot central ou imposer le pied faible.',
    youtubeId: 'mWZaDDx1ShA',
    schemaId: 'jeu-passes-mouvement',
    phases: [
      {
        title: 'Phase 1 · Se rendre disponible',
        instruction: 'Appel décroché à distance de passe du porteur.',
        tokens: [
          { x: 70, y: 120, label: '1' },
          { x: 180, y: 60, label: '2' },
          { x: 290, y: 120, label: '3' },
          { x: 180, y: 180, label: '4' },
        ],
        ball: { fromX: 70, fromY: 120, toX: 180, toY: 60 },
      },
      {
        title: 'Phase 2 · Passer et se déplacer',
        instruction: 'Contrôle orienté et passe dans la course du partenaire suivant.',
        tokens: [
          { x: 110, y: 95, label: '1' },
          { x: 180, y: 60, label: '2' },
          { x: 290, y: 120, label: '3' },
          { x: 180, y: 180, label: '4' },
        ],
        ball: { fromX: 180, fromY: 60, toX: 290, toY: 120 },
      },
      {
        title: 'Phase 3 · Trouver le troisième homme',
        instruction: 'Remise en une touche et accélération vers l’atelier suivant.',
        tokens: [
          { x: 140, y: 80, label: '1' },
          { x: 220, y: 85, label: '2' },
          { x: 290, y: 120, label: '3' },
          { x: 180, y: 180, label: '4' },
        ],
        ball: { fromX: 290, fromY: 120, toX: 180, toY: 180 },
      },
    ],
  },
  {
    id: 'ref-transition-recuperation',
    name: 'Transition à la récupération',
    categoryLabel: 'Transitions',
    categoryId: 'transitions',
    durationMin: 18,
    playersLabel: '12 à 16 joueurs',
    dimensionsLabel: '35 × 25 m',
    objective: 'Exploiter la récupération en moins de 6 secondes vers l’avant.',
    installation:
      'Zone centrale de conservation 4 contre 4 et deux mini-buts profonds pour attaquer dès la récupération.',
    instructions:
      'Première passe vers l’avant dès la récupération. Chasser collectivement à la perte.',
    variant: 'Accorder 2 points si le but est inscrit en moins de 5 secondes après récupération.',
    youtubeId: 'W6SfoCfAX5g',
    schemaId: 'transition-rapide',
    phases: [
      {
        title: 'Phase 1 · Se rendre disponible',
        instruction: 'Cadrer le porteur et fermer l’axe central en bloc compact.',
        tokens: [
          { x: 120, y: 95, label: '1' },
          { x: 145, y: 145, label: '2' },
          { x: 220, y: 115, label: '3' },
          { x: 115, y: 120, defender: true, label: '4' },
        ],
        ball: { fromX: 120, fromY: 95, toX: 145, toY: 145 },
      },
      {
        title: 'Phase 2 · Passer et se déplacer',
        instruction: 'Projection immédiate dans le couloir libre dès l’interception.',
        tokens: [
          { x: 150, y: 85, label: '1' },
          { x: 145, y: 145, label: '2' },
          { x: 265, y: 95, label: '3' },
          { x: 125, y: 130, defender: true, label: '4' },
        ],
        ball: { fromX: 145, fromY: 145, toX: 265, toY: 95 },
      },
      {
        title: 'Phase 3 · Trouver le troisième homme',
        instruction: 'Finition rapide avant le replis défensif adverse.',
        tokens: [
          { x: 195, y: 80, label: '1' },
          { x: 210, y: 140, label: '2' },
          { x: 295, y: 110, label: '3' },
          { x: 170, y: 125, defender: true, label: '4' },
        ],
        ball: { fromX: 265, fromY: 95, toX: 330, toY: 120 },
      },
    ],
  },
  {
    id: 'ref-finition-une-touche',
    name: 'Finition en une touche',
    categoryLabel: 'Finition',
    categoryId: 'finition',
    durationMin: 15,
    playersLabel: '10 à 14 joueurs',
    dimensionsLabel: 'Surface + 25 m',
    objective: 'Enchaîner appel, prise d’appui et frappe cadrée en une touche.',
    installation:
      'Deux serveurs sur les côtés, deux attaquants à l’entrée de surface et un gardien dans le but.',
    instructions:
      'Attaquer le ballon, orienter les épaules face au but et privilégier le cadre avant la puissance.',
    variant: 'Ajouter un défenseur en poursuite au départ de la passe.',
    youtubeId: '-49Pr1xlUpA',
    schemaId: 'finition-devant-but',
    phases: [
      {
        title: 'Phase 1 · Se rendre disponible',
        instruction: 'Contre-appel de l’attaquant hors de la zone du défenseur.',
        tokens: [
          { x: 90, y: 70, label: '1' },
          { x: 190, y: 125, label: '9' },
          { x: 225, y: 165, label: '11' },
          { x: 255, y: 120, defender: true, label: '4' },
        ],
        ball: { fromX: 90, fromY: 70, toX: 190, toY: 125 },
      },
      {
        title: 'Phase 2 · Passer et se déplacer',
        instruction: 'Décalage dans la course et appel au premier poteau.',
        tokens: [
          { x: 120, y: 75, label: '1' },
          { x: 235, y: 115, label: '9' },
          { x: 270, y: 155, label: '11' },
          { x: 270, y: 120, defender: true, label: '4' },
        ],
        ball: { fromX: 190, fromY: 125, toX: 270, toY: 155 },
      },
      {
        title: 'Phase 3 · Trouver le troisième homme',
        instruction: 'Centre en retrait et finition instantanée en une touche.',
        tokens: [
          { x: 140, y: 80, label: '1' },
          { x: 280, y: 118, label: '9' },
          { x: 295, y: 160, label: '11' },
          { x: 295, y: 132, defender: true, label: '4' },
        ],
        ball: { fromX: 280, fromY: 118, toX: 340, toY: 120 },
      },
    ],
  },
  {
    id: 'ref-opposition-theme',
    name: 'Opposition à thème',
    categoryLabel: 'Tactique',
    categoryId: 'tactique',
    durationMin: 20,
    playersLabel: '14 à 18 joueurs',
    dimensionsLabel: 'Demi-terrain',
    objective: 'Transférer les principes de conservation et de transition en situation de match.',
    installation:
      'Deux équipes équilibrées en 7 contre 7 + 2 jokers sur les couloirs extérieurs.',
    instructions:
      'Obligation de passer par un couloir ou par le troisième homme avant de finir l’action.',
    variant: 'Limiter à 2 touches dans son propre camp et libre dans le camp adverse.',
    youtubeId: 'YgZ_wi_7PnA',
    schemaId: 'positionnement-4v4-2',
    phases: [
      {
        title: 'Phase 1 · Se rendre disponible',
        instruction: 'Occupation de la largeur par les deux pistons excentrés.',
        tokens: [
          { x: 80, y: 120, label: '6' },
          { x: 175, y: 55, label: '7' },
          { x: 185, y: 185, label: '10' },
          { x: 220, y: 120, defender: true, label: '8' },
        ],
        ball: { fromX: 80, fromY: 120, toX: 175, toY: 55 },
      },
      {
        title: 'Phase 2 · Passer et se déplacer',
        instruction: 'Renversement rapide vers le côté opposé après fixation.',
        tokens: [
          { x: 115, y: 115, label: '6' },
          { x: 215, y: 60, label: '7' },
          { x: 235, y: 175, label: '10' },
          { x: 230, y: 95, defender: true, label: '8' },
        ],
        ball: { fromX: 215, fromY: 60, toX: 235, toY: 175 },
      },
      {
        title: 'Phase 3 · Trouver le troisième homme',
        instruction: 'Attaque de la profondeur et finition dans la zone de vérité.',
        tokens: [
          { x: 150, y: 115, label: '6' },
          { x: 275, y: 85, label: '7' },
          { x: 280, y: 155, label: '10' },
          { x: 265, y: 120, defender: true, label: '8' },
        ],
        ball: { fromX: 280, fromY: 155, toX: 338, toY: 120 },
      },
    ],
  },
];

function mapCategoryToFilter(cat: LibraryCategoryId): Exclude<ExerciseFilterCategory, 'Tous'> {
  switch (cat) {
    case 'echauffement':
      return 'Échauffement';
    case 'conservation':
    case 'technique':
      return 'Conservation';
    case 'transitions':
    case 'vitesse':
    case 'intensite':
      return 'Transitions';
    case 'finition':
      return 'Finition';
    case 'tactique':
    case 'pressing':
    case 'endurance':
    case 'recuperation':
    default:
      return 'Tactique';
  }
}

export function buildEnrichedLibraryExercises(): EnrichedExerciseItem[] {
  const seenNames = new Set(REFERENCE_EXERCISES.map((ex) => ex.name.toLowerCase()));
  const extras: EnrichedExerciseItem[] = CORE_LIBRARY_EXERCISES.filter(
    (item) => !seenNames.has(item.name.toLowerCase()),
  ).map((item) => ({
    id: item.id,
    name: item.name,
    categoryLabel: mapCategoryToFilter(item.category),
    categoryId: item.category,
    durationMin: item.defaultMinutes,
    playersLabel: '10 à 16 joueurs',
    dimensionsLabel: '25 × 20 m',
    objective: item.objective,
    installation:
      'Délimiter l’espace avec des coupelles de couleur. Répartir deux groupes équilibrés avec ballons autour de la zone.',
    instructions: item.instructions,
    variant:
      'Réduire l’espace ou limiter à deux touches de balle pour accélérer la prise d’information.',
    youtubeId: item.youtubeId,
    schemaId: item.schemaId ?? item.id,
    phases: REFERENCE_EXERCISES[0].phases,
  }));
  return [...REFERENCE_EXERCISES, ...extras];
}

export interface CoachExerciseLibraryModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectExercise?: (exercise: EnrichedExerciseItem) => void;
  initialExercise?: EnrichedExerciseItem | null;
  inline?: boolean;
}

const SPEED_OPTIONS = [0.5, 1, 1.5] as const;

export function CoachExerciseLibraryModal({
  visible,
  onClose,
  onSelectExercise,
  initialExercise = null,
  inline = false,
}: CoachExerciseLibraryModalProps) {
  const { pal, tokens: trainingTokens } = useCoachTrainingTheme();
  const workspace = useCoachWorkspace();
  const styles = useMemo(() => createStyles(pal, workspace.desktop), [pal, workspace.desktop]);
  /** Modal plein écran = hors SafeAreaView App ; `inline` = déjà inseté par le shell. */
  const modalTopInset = useModalTopInset({ embedded: inline });
  const headerPadTop = workspace.desktop ? 24 : modalTopInset;

  const [customExercises, setCustomExercises] = useState<EnrichedExerciseItem[]>([]);
  const allExercises = useMemo(
    () => [...customExercises, ...buildEnrichedLibraryExercises()],
    [customExercises],
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ExerciseFilterCategory>('Tous');
  const [selectedExercise, setSelectedExercise] = useState<EnrichedExerciseItem | null>(
    initialExercise,
  );
  const [creatingNew, setCreatingNew] = useState(false);

  // États du formulaire "+ Nouvel exercice"
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] =
    useState<Exclude<ExerciseFilterCategory, 'Tous'>>('Conservation');
  const [newDuration, setNewDuration] = useState('15');
  const [newObjective, setNewObjective] = useState('');
  const [newInstructions, setNewInstructions] = useState('');
  const [newVariant, setNewVariant] = useState('');

  // États de la fiche exercice détaillée
  const [mediaSegment, setMediaSegment] = useState<'Schéma animé' | 'Vidéo'>('Schéma animé');
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<number>(1);
  const [loop, setLoop] = useState(true);
  const [motionTimeSec, setMotionTimeSec] = useState(0);

  // Personnalisation de l'exercice
  const [editMinutes, setEditMinutes] = useState('15');
  const [editInstructions, setEditInstructions] = useState('');
  const [editYoutube, setEditYoutube] = useState('');
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [canvasTool, setCanvasTool] = useState<
    'none' | 'player' | 'defender' | 'cone' | 'ball' | 'arrow'
  >('none');
  const [customElements, setCustomElements] = useState<CustomCanvasElement[]>([]);
  const [vestiaireOpen, setVestiaireOpen] = useState(false);

  useEffect(() => {
    if (initialExercise) {
      setSelectedExercise(initialExercise);
      setEditMinutes(String(initialExercise.durationMin));
      setEditInstructions(initialExercise.instructions);
      setEditYoutube(initialExercise.youtubeId ?? '');
      setMotionTimeSec(0);
      setIsPlaying(false);
    }
  }, [initialExercise]);

  useEffect(() => {
    if (!isPlaying) return undefined;
    const interval = setInterval(() => {
      setMotionTimeSec((prev) => {
        const next = prev + 0.1 * speed;
        if (next >= 9) {
          if (loop) return 0;
          setIsPlaying(false);
          return 9;
        }
        return next;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [isPlaying, speed, loop]);

  const filteredExercises = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allExercises.filter((ex) => {
      const catMatch = selectedCategory === 'Tous' || ex.categoryLabel === selectedCategory;
      if (!catMatch) return false;
      if (!q) return true;
      return (
        ex.name.toLowerCase().includes(q) ||
        ex.objective.toLowerCase().includes(q) ||
        ex.categoryLabel.toLowerCase().includes(q)
      );
    });
  }, [allExercises, searchQuery, selectedCategory]);

  const openExerciseDetail = (ex: EnrichedExerciseItem) => {
    setSelectedExercise(ex);
    setEditMinutes(String(ex.durationMin));
    setEditInstructions(ex.instructions);
    setEditYoutube(ex.youtubeId ?? '');
    setSavedNotice(null);
    setMotionTimeSec(0);
    setIsPlaying(false);
  };

  const handleAddCustomElement = (kind: CustomCanvasElement['kind']) => {
    const count = customElements.filter((el) => el.kind === kind).length + 1;
    const baseOffset = (customElements.length * 29) % 160;
    const nextEl: CustomCanvasElement =
      kind === 'arrow'
        ? {
            id: `cel-${Date.now()}-${customElements.length}`,
            kind: 'arrow',
            x: 110 + (baseOffset % 80),
            y: 95 + (baseOffset % 50),
            toX: 230,
            toY: 135,
          }
        : {
            id: `cel-${Date.now()}-${customElements.length}`,
            kind,
            x: 100 + baseOffset,
            y: 80 + ((customElements.length * 23) % 90),
            label: kind === 'player' ? `J${count}` : kind === 'defender' ? `D${count}` : undefined,
          };
    setCustomElements((prev) => [...prev, nextEl]);
    setCanvasTool(kind);
  };

  const handleSaveAdaptations = () => {
    if (!selectedExercise) return;
    const parsedMin = Math.max(1, Math.min(120, Number.parseInt(editMinutes, 10) || 15));
    const updated: EnrichedExerciseItem = {
      ...selectedExercise,
      durationMin: parsedMin,
      instructions: editInstructions.trim() || selectedExercise.instructions,
      youtubeId: editYoutube.trim() || selectedExercise.youtubeId,
    };
    setSelectedExercise(updated);
    setSavedNotice('Adaptations conservées pour cet exercice.');
  };

  const handleCreateNewExercise = () => {
    if (!newName.trim()) return;
    const parsedMin = Math.max(1, Math.min(120, Number.parseInt(newDuration, 10) || 15));
    const created: EnrichedExerciseItem = {
      id: `custom-ex-${Date.now()}`,
      name: newName.trim(),
      categoryLabel: newCategory,
      categoryId:
        newCategory === 'Échauffement'
          ? 'echauffement'
          : newCategory === 'Conservation'
            ? 'conservation'
            : newCategory === 'Transitions'
              ? 'transitions'
              : newCategory === 'Finition'
                ? 'finition'
                : 'tactique',
      durationMin: parsedMin,
      playersLabel: '12 à 16 joueurs',
      dimensionsLabel: '25 × 20 m',
      objective: newObjective.trim() || 'Travailler la justesse technique et la prise d’information.',
      installation: 'Espace délimité par 4 plots avec ballons de réserve autour de la zone.',
      instructions:
        newInstructions.trim() || 'Prendre l’information avant de recevoir et jouer en mouvement.',
      variant: newVariant.trim() || 'Limiter à 2 touches de balle pour augmenter le rythme.',
      phases: REFERENCE_EXERCISES[0].phases,
    };
    setCustomExercises((prev) => [created, ...prev]);
    setCreatingNew(false);
    setNewName('');
    setNewObjective('');
    setNewInstructions('');
    setNewVariant('');
    openExerciseDetail(created);
  };

  if (!visible && !inline) return null;

  const activePhaseIndex = Math.min(2, Math.floor(motionTimeSec / 3));
  const phaseProgress = (motionTimeSec % 3) / 3;
  const activePhase =
    selectedExercise?.phases[activePhaseIndex] ?? REFERENCE_EXERCISES[0].phases[0];
  const ballX =
    activePhase.ball.fromX + (activePhase.ball.toX - activePhase.ball.fromX) * phaseProgress;
  const ballY =
    activePhase.ball.fromY + (activePhase.ball.toY - activePhase.ball.fromY) * phaseProgress;

  const bodyContent = (
    <View style={styles.root} testID="coach-exercise-library-modal">
      {!inline ? <StatusBar style={trainingTokens.isLight ? 'dark' : 'light'} /> : null}
      {/* Barre supérieure — inset haut obligatoire en Modal (hors SafeAreaView App). */}
      <View style={[styles.topHeader, { paddingTop: headerPadTop }]}>
        <View style={styles.topHeaderLeft}>
          {selectedExercise || creatingNew ? (
            <Pressable
              onPress={() => {
                if (creatingNew) setCreatingNew(false);
                else setSelectedExercise(null);
              }}
              accessibilityRole="button"
              accessibilityLabel="Retour à la bibliothèque"
              style={styles.backPill}
            >
              <CoachText style={styles.backPillText}>‹ Bibliothèque</CoachText>
            </Pressable>
          ) : (
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Retour"
              style={styles.backPill}
            >
              <CoachText style={styles.backPillText}>‹ Retour</CoachText>
            </Pressable>
          )}
          <CoachText style={styles.eyebrow}>PRODAY · BIBLIOTHÈQUE</CoachText>
          <CoachText style={styles.pageTitle}>
            {creatingNew
              ? 'Nouvel exercice'
              : selectedExercise
                ? selectedExercise.name
                : 'Bibliothèque'}
          </CoachText>
          <CoachText style={styles.pageSubtitle}>
            {creatingNew
              ? 'Créez un atelier sur mesure pour votre groupe'
              : selectedExercise
                ? `Exercice · ${selectedExercise.categoryLabel}`
                : 'Des idées pour votre prochaine séance'}
          </CoachText>
        </View>

        {!selectedExercise && !creatingNew ? (
          <Pressable
            onPress={() => setCreatingNew(true)}
            accessibilityRole="button"
            accessibilityLabel="+ Nouvel exercice"
            style={styles.createBtn}
          >
            <CoachText style={styles.createBtnText}>+ Nouvel exercice</CoachText>
          </Pressable>
        ) : null}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {creatingNew ? (
          <View style={styles.card}>
            <CoachText style={styles.cardHeadOrange}>Créer un exercice personnalisé</CoachText>

            <View style={styles.formField}>
              <CoachText style={styles.formLabel}>Nom de l’exercice</CoachText>
              <TextInput
                value={newName}
                onChangeText={setNewName}
                placeholder="Ex. Rondo 5 contre 2 à 2 touches"
                placeholderTextColor={pal.muted}
                style={styles.input}
                accessibilityLabel="Nom de l'exercice"
              />
            </View>

            <View style={styles.formField}>
              <CoachText style={styles.formLabel}>Catégorie</CoachText>
              <View style={styles.chipsRow}>
                {EXERCISE_FILTER_CATEGORIES.filter((c) => c !== 'Tous').map((cat) => {
                  const chosen = newCategory === cat;
                  return (
                    <Pressable
                      key={cat}
                      onPress={() => setNewCategory(cat as Exclude<ExerciseFilterCategory, 'Tous'>)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: chosen }}
                      style={[styles.filterChip, chosen && styles.filterChipActive]}
                    >
                      <CoachText
                        style={[styles.filterChipText, chosen && styles.filterChipTextActive]}
                      >
                        {cat}
                      </CoachText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.formField}>
              <CoachText style={styles.formLabel}>Durée (minutes)</CoachText>
              <TextInput
                value={newDuration}
                onChangeText={setNewDuration}
                keyboardType="number-pad"
                placeholder="15"
                placeholderTextColor={pal.muted}
                style={styles.input}
                accessibilityLabel="Durée en minutes"
              />
            </View>

            <View style={styles.formField}>
              <CoachText style={styles.formLabel}>Objectif pédagogique</CoachText>
              <TextInput
                value={newObjective}
                onChangeText={setNewObjective}
                placeholder="Ex. Conserver sous pression et orienter le jeu"
                placeholderTextColor={pal.muted}
                style={styles.input}
              />
            </View>

            <View style={styles.formField}>
              <CoachText style={styles.formLabel}>Consignes du coach</CoachText>
              <TextInput
                value={newInstructions}
                onChangeText={setNewInstructions}
                multiline
                placeholder="Prendre l’information avant de recevoir…"
                placeholderTextColor={pal.muted}
                style={[styles.input, styles.textarea]}
              />
            </View>

            <View style={styles.formField}>
              <CoachText style={styles.formLabel}>Variante</CoachText>
              <TextInput
                value={newVariant}
                onChangeText={setNewVariant}
                placeholder="Ex. Limiter à 2 touches ou ajouter un joker"
                placeholderTextColor={pal.muted}
                style={styles.input}
              />
            </View>

            <Pressable
              onPress={handleCreateNewExercise}
              accessibilityRole="button"
              accessibilityLabel="Enregistrer le nouvel exercice"
              style={styles.primaryAction}
            >
              <CoachText style={styles.primaryActionText}>Enregistrer l’exercice</CoachText>
            </Pressable>
          </View>
        ) : selectedExercise ? (
          /* Vue Fiche Exercice Détaillée (alignée sur pages.exercise de coach-rich-pages.js) */
          <View style={styles.detailStack}>
            {/* Bascule segmentée Schéma animé | Vidéo */}
            <View style={styles.segmentedControl} testID="exercise-view-segmented">
              {(['Schéma animé', 'Vidéo'] as const).map((tab) => {
                const chosen = mediaSegment === tab;
                return (
                  <Pressable
                    key={tab}
                    onPress={() => setMediaSegment(tab)}
                    accessibilityRole="button"
                    accessibilityLabel={tab}
                    accessibilityState={{ selected: chosen }}
                    style={[styles.segmentBtn, chosen && styles.segmentBtnChosen]}
                  >
                    <CoachText style={[styles.segmentBtnText, chosen && styles.segmentBtnTextChosen]}>
                      {tab}
                    </CoachText>
                  </Pressable>
                );
              })}
            </View>

            {mediaSegment === 'Schéma animé' ? (
              /* Carte Animation tactique (motionPanel de la maquette) */
              <View style={styles.motionCard}>
                <View style={styles.motionCardHead}>
                  <CoachText style={styles.cardHeadOrange}>Animation tactique</CoachText>
                  <CoachText style={styles.cardHeadEnd}>
                    {selectedExercise.playersLabel} · {selectedExercise.durationMin} min ·{' '}
                    {selectedExercise.dimensionsLabel}
                  </CoachText>
                </View>

                <View style={styles.svgPitchWrap}>
                  <Svg
                    width="100%"
                    height="100%"
                    viewBox="0 0 360 240"
                    accessibilityLabel={`Animation tactique ${selectedExercise.name}`}
                  >
                    <Defs>
                      <LinearGradient id="libPitchGrad" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0%" stopColor={pal.pitchTurfTop} />
                        <Stop offset="50%" stopColor={pal.pitchTurfMid} />
                        <Stop offset="100%" stopColor={pal.pitchTurfBottom} />
                      </LinearGradient>
                    </Defs>
                    <Rect
                      x="8"
                      y="8"
                      width="344"
                      height="224"
                      rx="14"
                      fill="url(#libPitchGrad)"
                    />
                    <Path
                      d="M180 8v224M8 120h344"
                      stroke="rgba(255,255,255,0.35)"
                      strokeWidth="1.2"
                      fill="none"
                    />
                    <Circle
                      cx="180"
                      cy="120"
                      r="38"
                      fill="none"
                      stroke="rgba(255,255,255,0.35)"
                      strokeWidth="1.2"
                    />
                    <Path
                      d="M65 65 290 65 180 190Z"
                      stroke="rgba(255,255,255,0.55)"
                      strokeDasharray="5 5"
                      strokeWidth="1.2"
                      fill="none"
                    />

                    {/* Trajectoire active de la passe */}
                    <Line
                      x1={activePhase.ball.fromX}
                      y1={activePhase.ball.fromY}
                      x2={activePhase.ball.toX}
                      y2={activePhase.ball.toY}
                      stroke="rgba(255,255,255,0.75)"
                      strokeWidth="1.8"
                      strokeDasharray="4 4"
                    />

                    {/* Joueurs de la phase */}
                    <G>
                      {activePhase.tokens.map((tok, idx) => (
                        <React.Fragment key={`tok-${idx}`}>
                          <Circle
                            cx={tok.x}
                            cy={tok.y}
                            r="13"
                            fill={tok.defender ? pal.orange : pal.white}
                            stroke={tok.defender ? pal.white : pal.pitchTurfBottom}
                            strokeWidth="1.5"
                          />
                          <SvgText
                            x={tok.x}
                            y={tok.y + 4}
                            textAnchor="middle"
                            fill={tok.defender ? pal.white : pal.pitchTurfBottom}
                            fontSize="11"
                            fontWeight="700"
                          >
                            {tok.label}
                          </SvgText>
                        </React.Fragment>
                      ))}

                      {/* Éléments personnalisés ajoutés par le coach */}
                      {customElements.map((el) => {
                        if (el.kind === 'arrow') {
                          return (
                            <Line
                              key={el.id}
                              x1={el.x}
                              y1={el.y}
                              x2={el.toX ?? el.x + 50}
                              y2={el.toY ?? el.y}
                              stroke={pal.amber}
                              strokeWidth="2.4"
                              strokeDasharray="5 3"
                            />
                          );
                        }
                        if (el.kind === 'cone') {
                          return (
                            <Circle
                              key={el.id}
                              cx={el.x}
                              cy={el.y}
                              r="6"
                              fill={pal.amber}
                              stroke={pal.white}
                              strokeWidth="1"
                            />
                          );
                        }
                        if (el.kind === 'ball') {
                          return (
                            <Circle
                              key={el.id}
                              cx={el.x}
                              cy={el.y}
                              r="5.5"
                              fill={pal.white}
                              stroke={pal.ink}
                              strokeWidth="1.2"
                            />
                          );
                        }
                        return (
                          <React.Fragment key={el.id}>
                            <Circle
                              cx={el.x}
                              cy={el.y}
                              r="12"
                              fill={el.kind === 'defender' ? pal.red : pal.blue}
                              stroke={pal.white}
                              strokeWidth="1.5"
                            />
                            <SvgText
                              x={el.x}
                              y={el.y + 4}
                              textAnchor="middle"
                              fill={pal.white}
                              fontSize="10"
                              fontWeight="700"
                            >
                              {el.label}
                            </SvgText>
                          </React.Fragment>
                        );
                      })}

                      {/* Ballon animé */}
                      <Circle
                        cx={ballX}
                        cy={ballY}
                        r="5.5"
                        fill={pal.amber}
                        stroke={pal.ink}
                        strokeWidth="1.2"
                      />
                    </G>
                  </Svg>
                </View>

                {/* En-tête de phase et chronomètre */}
                <View style={styles.motionHeadRow}>
                  <CoachText style={styles.phaseTitleText}>{activePhase.title}</CoachText>
                  <CoachText style={styles.motionTimeText}>
                    {motionTimeSec.toFixed(1)} / 9 s
                  </CoachText>
                </View>
                <CoachText style={styles.phaseInstructionText}>{activePhase.instruction}</CoachText>

                {/* Barre de progression */}
                <View style={styles.scrubTrack}>
                  <View
                    style={[
                      styles.scrubFill,
                      { width: `${Math.min(100, (motionTimeSec / 9) * 100)}%` },
                    ]}
                  />
                </View>

                {/* Étapes cliquables */}
                <View style={styles.stagesRow}>
                  {selectedExercise.phases.map((ph, idx) => {
                    const isActiveStage = idx === activePhaseIndex;
                    return (
                      <Pressable
                        key={ph.title}
                        onPress={() => setMotionTimeSec(idx * 3)}
                        accessibilityRole="button"
                        accessibilityLabel={ph.title}
                        accessibilityState={{ selected: isActiveStage }}
                        style={[styles.stageChip, isActiveStage && styles.stageChipActive]}
                      >
                        <CoachText
                          style={[
                            styles.stageChipText,
                            isActiveStage && styles.stageChipTextActive,
                          ]}
                          numberOfLines={1}
                        >
                          {idx + 1}. {ph.title.replace(/^Phase \d+ · /, '')}
                        </CoachText>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Contrôles de transport : Recommencer, Précédent, Lecture/Pause, Suivant, Boucle */}
                <View style={styles.transportRow}>
                  <Pressable
                    onPress={() => {
                      setMotionTimeSec(0);
                      setIsPlaying(false);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Recommencer"
                    style={styles.transportBtn}
                  >
                    <Icon name="refresh" size={18} color={pal.ink} />
                  </Pressable>

                  <Pressable
                    onPress={() =>
                      setMotionTimeSec((prev) => Math.max(0, (Math.floor(prev / 3) - 1) * 3))
                    }
                    accessibilityRole="button"
                    accessibilityLabel="Phase précédente"
                    style={styles.transportBtn}
                  >
                    <Icon name="arrow-back" size={18} color={pal.ink} />
                  </Pressable>

                  <Pressable
                    onPress={() => setIsPlaying((p) => !p)}
                    accessibilityRole="button"
                    accessibilityLabel={isPlaying ? 'Pause' : 'Lecture'}
                    style={styles.transportMainBtn}
                  >
                    <Icon
                      name={isPlaying ? 'pause' : 'play'}
                      size={24}
                      color={pal.white}
                    />
                  </Pressable>

                  <Pressable
                    onPress={() =>
                      setMotionTimeSec((prev) => Math.min(6, (Math.floor(prev / 3) + 1) * 3))
                    }
                    accessibilityRole="button"
                    accessibilityLabel="Phase suivante"
                    style={styles.transportBtn}
                  >
                    <Icon name="chevron-forward" size={18} color={pal.ink} />
                  </Pressable>

                  <Pressable
                    onPress={() => setLoop((l) => !l)}
                    accessibilityRole="button"
                    accessibilityLabel="Boucle"
                    accessibilityState={{ selected: loop }}
                    style={[styles.transportBtn, loop && styles.transportBtnOn]}
                  >
                    <Icon
                      name="swap-horizontal"
                      size={18}
                      color={loop ? pal.orange : pal.ink}
                    />
                  </Pressable>
                </View>

                {/* Sélecteur de vitesses 0,5× / 1× / 1,5× */}
                <View style={styles.speedRow}>
                  {SPEED_OPTIONS.map((spd) => {
                    const activeSpd = speed === spd;
                    const label = `${String(spd).replace('.', ',')}×`;
                    return (
                      <Pressable
                        key={spd}
                        onPress={() => setSpeed(spd)}
                        accessibilityRole="button"
                        accessibilityLabel={`Vitesse ${label}`}
                        accessibilityState={{ selected: activeSpd }}
                        style={[styles.speedPill, activeSpd && styles.speedPillActive]}
                      >
                        <CoachText
                          style={[styles.speedPillText, activeSpd && styles.speedPillTextActive]}
                        >
                          {label}
                        </CoachText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : (
              /* Vue Vidéo complémentaire */
              <View style={styles.card}>
                <CoachText style={styles.cardHeadOrange}>Ressource vidéo complémentaire</CoachText>
                {editYoutube || selectedExercise.youtubeId ? (
                  <View style={styles.videoWrap}>
                    <ExerciseYouTubePlayer
                      videoIdOrUrl={editYoutube || selectedExercise.youtubeId || ''}
                      title={selectedExercise.name}
                    />
                  </View>
                ) : (
                  <CoachText style={styles.bodyText}>
                    Aucune vidéo externe associée pour le moment. Renseignez un lien YouTube dans
                    « Personnaliser cet exercice » ci-dessous.
                  </CoachText>
                )}
              </View>
            )}

            {/* Cartes Organisation, Consignes, Variante */}
            <CoachText style={styles.sectionTitle}>Organisation</CoachText>
            <View style={styles.card}>
              <CoachText style={styles.cardHeadOrange}>Installation</CoachText>
              <CoachText style={styles.bodyText}>{selectedExercise.installation}</CoachText>
            </View>

            <CoachText style={styles.sectionTitle}>Consignes</CoachText>
            <View style={styles.card}>
              <CoachText style={styles.cardHeadOrange}>Observer et agir</CoachText>
              <CoachText style={styles.bodyText}>{selectedExercise.instructions}</CoachText>
            </View>

            <CoachText style={styles.sectionTitle}>Variante</CoachText>
            <View style={styles.card}>
              <CoachText style={styles.cardHeadOrange}>Augmenter la difficulté</CoachText>
              <CoachText style={styles.bodyText}>{selectedExercise.variant}</CoachText>
            </View>

            {/* Personnaliser cet exercice (éditeur + outils terrain) */}
            <CoachText style={styles.sectionTitle}>Personnaliser cet exercice</CoachText>
            <View style={styles.card}>
              <CoachText style={styles.formLabel}>
                Ajouter des repères sur le schéma (joueurs, plots, ballons, flèches)
              </CoachText>
              <View style={styles.chipsRow}>
                {(
                  [
                    { id: 'player', label: '+ Joueur' },
                    { id: 'defender', label: '+ Défenseur' },
                    { id: 'cone', label: '+ Plot' },
                    { id: 'ball', label: '+ Ballon' },
                    { id: 'arrow', label: '+ Flèche' },
                  ] as const
                ).map((toolItem) => (
                  <Pressable
                    key={toolItem.id}
                    onPress={() => handleAddCustomElement(toolItem.id)}
                    accessibilityRole="button"
                    accessibilityLabel={toolItem.label}
                    style={[
                      styles.filterChip,
                      canvasTool === toolItem.id && styles.filterChipActive,
                    ]}
                  >
                    <CoachText
                      style={[
                        styles.filterChipText,
                        canvasTool === toolItem.id && styles.filterChipTextActive,
                      ]}
                    >
                      {toolItem.label}
                    </CoachText>
                  </Pressable>
                ))}
                {customElements.length > 0 ? (
                  <Pressable
                    onPress={() => {
                      setCustomElements([]);
                      setCanvasTool('none');
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Effacer les ajouts"
                    style={styles.filterChip}
                  >
                    <CoachText style={styles.filterChipText}>Réinitialiser le tracé</CoachText>
                  </Pressable>
                ) : null}
              </View>

              <View style={styles.formField}>
                <CoachText style={styles.formLabel}>Durée (minutes)</CoachText>
                <TextInput
                  value={editMinutes}
                  onChangeText={setEditMinutes}
                  keyboardType="number-pad"
                  style={styles.input}
                  accessibilityLabel="Durée (minutes)"
                />
              </View>

              <View style={styles.formField}>
                <CoachText style={styles.formLabel}>Consigne du coach</CoachText>
                <TextInput
                  value={editInstructions}
                  onChangeText={setEditInstructions}
                  multiline
                  style={[styles.input, styles.textarea]}
                  accessibilityLabel="Consigne du coach"
                />
              </View>

              <View style={styles.formField}>
                <CoachText style={styles.formLabel}>Lien YouTube complémentaire</CoachText>
                <TextInput
                  value={editYoutube}
                  onChangeText={setEditYoutube}
                  placeholder="https://www.youtube.com/watch?v=…"
                  placeholderTextColor={pal.muted}
                  style={styles.input}
                  accessibilityLabel="Lien YouTube complémentaire"
                />
              </View>

              {savedNotice ? <CoachText style={styles.savedBanner}>{savedNotice}</CoachText> : null}

              <Pressable
                onPress={handleSaveAdaptations}
                accessibilityRole="button"
                accessibilityLabel="Conserver mes adaptations"
                style={styles.primaryAction}
              >
                <CoachText style={styles.primaryActionText}>Conserver mes adaptations</CoachText>
              </Pressable>
            </View>

            {/* Actions bas de fiche : Ajouter à ma séance & Présentation vestiaire */}
            <View style={styles.bottomActionsRow}>
              {onSelectExercise ? (
                <Pressable
                  onPress={() => {
                    onSelectExercise(selectedExercise);
                    onClose();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Ajouter à ma séance"
                  style={[styles.primaryAction, { flex: 1, marginVertical: 0 }]}
                >
                  <CoachText style={styles.primaryActionText}>Ajouter à ma séance</CoachText>
                </Pressable>
              ) : null}

              <Pressable
                onPress={() => setVestiaireOpen(true)}
                accessibilityRole="button"
                accessibilityLabel="Présentation vestiaire"
                style={[styles.secondaryPillAction, { flex: 1 }]}
              >
                <Icon name="expand" size={16} color={pal.orange} />
                <CoachText style={styles.secondaryPillActionText}>
                  Présentation vestiaire
                </CoachText>
              </Pressable>
            </View>
          </View>
        ) : (
          /* Vue Liste de la Bibliothèque (pages.library de la maquette) */
          <View style={styles.libraryStack}>
            {/* Barre de recherche */}
            <View style={styles.searchBox}>
              <Icon name="search" size={18} color={pal.sub} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Rechercher un exercice"
                placeholderTextColor={pal.muted}
                accessibilityLabel="Rechercher un exercice"
                style={styles.searchInput}
              />
              {searchQuery.length > 0 ? (
                <Pressable
                  onPress={() => setSearchQuery('')}
                  accessibilityRole="button"
                  accessibilityLabel="Effacer la recherche"
                >
                  <Icon name="close" size={16} color={pal.sub} />
                </Pressable>
              ) : null}
            </View>

            {/* Filtres par catégorie : Tous, Échauffement, Conservation, Transitions, Finition, Tactique */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsRow}
            >
              {EXERCISE_FILTER_CATEGORIES.map((cat) => {
                const chosen = selectedCategory === cat;
                return (
                  <Pressable
                    key={cat}
                    onPress={() => setSelectedCategory(cat)}
                    accessibilityRole="button"
                    accessibilityLabel={`Filtrer par ${cat}`}
                    accessibilityState={{ selected: chosen }}
                    style={[styles.filterChip, chosen && styles.filterChipActive]}
                  >
                    <CoachText
                      style={[styles.filterChipText, chosen && styles.filterChipTextActive]}
                    >
                      {cat}
                    </CoachText>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Groupe de lignes d'exercices */}
            {filteredExercises.length === 0 ? (
              <View style={styles.card}>
                <CoachText style={styles.emptyText}>Aucun exercice trouvé.</CoachText>
              </View>
            ) : (
              <View style={styles.listGroup}>
                {filteredExercises.map((ex, idx) => (
                  <View
                    key={ex.id}
                    style={[styles.listRow, idx > 0 && styles.listRowBorder]}
                  >
                    <Pressable
                      onPress={() => openExerciseDetail(ex)}
                      accessibilityRole="button"
                      accessibilityLabel={`Ouvrir ${ex.name}`}
                      style={styles.listRowMain}
                    >
                      <View style={{ flex: 1, gap: 4 }}>
                        <View style={styles.rowTitleWrap}>
                          <CoachText style={styles.listRowTitle}>{ex.name}</CoachText>
                          <View style={styles.categoryBadge}>
                            <CoachText style={styles.categoryBadgeText}>
                              {ex.categoryLabel}
                            </CoachText>
                          </View>
                        </View>
                        <CoachText style={styles.listRowSub}>
                          {ex.durationMin} min · {ex.playersLabel} · Consignes et variante
                        </CoachText>
                      </View>
                      <CoachText style={styles.chevron}>›</CoachText>
                    </Pressable>

                    {onSelectExercise ? (
                      <Pressable
                        onPress={() => {
                          onSelectExercise(ex);
                          onClose();
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={`Ajouter ${ex.name}`}
                        style={styles.quickAddBtn}
                      >
                        <CoachText style={styles.quickAddBtnText}>+ Ajouter</CoachText>
                      </Pressable>
                    ) : null}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Modale Présentation Vestiaire Plein Écran */}
      <CoachExerciseFullscreenModal
        visible={vestiaireOpen}
        onClose={() => setVestiaireOpen(false)}
        title={selectedExercise?.name ?? 'Exercice'}
        objective={selectedExercise?.objective}
        instructions={editInstructions || selectedExercise?.instructions}
        youtubeId={editYoutube || selectedExercise?.youtubeId}
        tacticalScene={
          selectedExercise?.schemaId
            ? tacticalSceneForLibraryExercise(selectedExercise.schemaId)
            : tacticalSceneForLibraryExercise('rondo-4v2')
        }
      />
    </View>
  );

  if (inline) {
    return bodyContent;
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      {bodyContent}
    </Modal>
  );
}

function createStyles(pal: CoachTrainingPalette, desktop: boolean) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: desktop ? pal.bgDesktop : pal.bgMobile,
    },
    topHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      paddingHorizontal: desktop ? 32 : 20,
      paddingTop: desktop ? 24 : 18,
      paddingBottom: 12,
      maxWidth: 1120,
      width: '100%',
      alignSelf: 'center',
      gap: 12,
    },
    topHeaderLeft: {
      flex: 1,
      gap: 4,
    },
    backPill: {
      alignSelf: 'flex-start',
      backgroundColor: pal.orangeSoft,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      marginBottom: 6,
    },
    backPillText: {
      color: pal.orange,
      fontSize: 13,
      fontWeight: '700',
    },
    eyebrow: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1.2,
      color: pal.sub,
    },
    pageTitle: {
      fontSize: desktop ? 30 : 28,
      lineHeight: desktop ? 36 : 34,
      fontWeight: '800',
      color: pal.ink,
      letterSpacing: -0.8,
    },
    pageSubtitle: {
      fontSize: 14,
      color: pal.sub,
    },
    createBtn: {
      backgroundColor: pal.orange,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 999,
      marginTop: 8,
    },
    createBtnText: {
      color: pal.white,
      fontSize: 13,
      fontWeight: '700',
    },
    scrollContent: {
      width: '100%',
      maxWidth: 1120,
      alignSelf: 'center',
      paddingHorizontal: desktop ? 32 : 20,
      paddingBottom: 48,
      gap: 16,
    },
    libraryStack: {
      gap: 14,
    },
    detailStack: {
      gap: 14,
    },
    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: pal.card,
      borderWidth: 1,
      borderColor: pal.borderCard,
      borderRadius: 25,
      paddingHorizontal: 16,
      minHeight: 48,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      color: pal.ink,
      paddingVertical: 10,
    },
    chipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      paddingVertical: 2,
    },
    filterChip: {
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 20,
      backgroundColor: pal.card,
      borderWidth: 1,
      borderColor: pal.borderCard,
    },
    filterChipActive: {
      backgroundColor: pal.orange,
      borderColor: pal.orange,
    },
    filterChipText: {
      fontSize: 13,
      fontWeight: '600',
      color: pal.sub,
    },
    filterChipTextActive: {
      color: pal.white,
      fontWeight: '700',
    },
    listGroup: {
      backgroundColor: pal.card,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: pal.borderCard,
      overflow: 'hidden',
    },
    listRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 18,
      paddingVertical: 15,
      gap: 12,
    },
    listRowBorder: {
      borderTopWidth: 1,
      borderTopColor: pal.borderSoft,
    },
    listRowMain: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    rowTitleWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 8,
      paddingRight: 4,
    },
    listRowTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: pal.ink,
      flexShrink: 1,
    },
    listRowSub: {
      fontSize: 13,
      color: pal.sub,
      lineHeight: 18,
    },
    categoryBadge: {
      backgroundColor: pal.orangeSoft,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      alignSelf: 'center',
    },
    categoryBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: pal.orange,
      includeFontPadding: false,
    },
    chevron: {
      fontSize: 22,
      color: pal.muted,
    },
    quickAddBtn: {
      backgroundColor: pal.orangeSoft,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
    },
    quickAddBtnText: {
      color: pal.orange,
      fontSize: 12,
      fontWeight: '700',
    },
    segmentedControl: {
      flexDirection: 'row',
      backgroundColor: pal.cardSoft,
      borderRadius: 12,
      padding: 3,
      borderWidth: 1,
      borderColor: pal.borderCard,
    },
    segmentBtn: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 9,
      borderRadius: 9,
    },
    segmentBtnChosen: {
      backgroundColor: pal.card,
    },
    segmentBtnText: {
      fontSize: 13,
      fontWeight: '600',
      color: pal.sub,
    },
    segmentBtnTextChosen: {
      color: pal.ink,
      fontWeight: '800',
    },
    motionCard: {
      backgroundColor: pal.card,
      borderRadius: 24,
      padding: 20,
      borderWidth: 1,
      borderColor: pal.borderCard,
      gap: 12,
    },
    motionCardHead: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 8,
    },
    cardHeadOrange: {
      fontSize: 14,
      fontWeight: '700',
      color: pal.orange,
    },
    cardHeadEnd: {
      fontSize: 12,
      color: pal.sub,
    },
    svgPitchWrap: {
      width: '100%',
      aspectRatio: 360 / 240,
      maxHeight: 330,
      borderRadius: 18,
      overflow: 'hidden',
      alignSelf: 'center',
    },
    motionHeadRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: 12,
      marginTop: 4,
    },
    phaseTitleText: {
      fontSize: 16,
      fontWeight: '700',
      color: pal.ink,
      flex: 1,
    },
    motionTimeText: {
      fontSize: 13,
      fontWeight: '600',
      color: pal.sub,
      fontVariant: ['tabular-nums'],
    },
    phaseInstructionText: {
      fontSize: 13,
      color: pal.sub,
    },
    scrubTrack: {
      width: '100%',
      height: 5,
      borderRadius: 3,
      backgroundColor: pal.barTrack,
      overflow: 'hidden',
    },
    scrubFill: {
      height: '100%',
      backgroundColor: pal.orange,
      borderRadius: 3,
    },
    stagesRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    stageChip: {
      flex: 1,
      minWidth: 100,
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: 12,
      backgroundColor: pal.cardSoft,
      borderWidth: 1,
      borderColor: pal.borderCard,
    },
    stageChipActive: {
      backgroundColor: pal.orangeSoft,
      borderColor: pal.orange,
    },
    stageChipText: {
      fontSize: 12,
      fontWeight: '600',
      color: pal.sub,
    },
    stageChipTextActive: {
      color: pal.orange,
      fontWeight: '700',
    },
    transportRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      marginTop: 4,
    },
    transportBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: pal.cardSoft,
      borderWidth: 1,
      borderColor: pal.borderCard,
      alignItems: 'center',
      justifyContent: 'center',
    },
    transportBtnOn: {
      backgroundColor: pal.orangeSoft,
      borderColor: pal.orange,
    },
    transportMainBtn: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: pal.ink,
      alignItems: 'center',
      justifyContent: 'center',
    },
    speedRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    speedPill: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 999,
      backgroundColor: pal.cardSoft,
      borderWidth: 1,
      borderColor: pal.borderCard,
    },
    speedPillActive: {
      backgroundColor: pal.orange,
      borderColor: pal.orange,
    },
    speedPillText: {
      fontSize: 13,
      fontWeight: '700',
      color: pal.ink,
    },
    speedPillTextActive: {
      color: pal.white,
    },
    videoWrap: {
      width: '100%',
      aspectRatio: 16 / 9,
      borderRadius: 16,
      overflow: 'hidden',
      marginTop: 8,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: pal.orange,
      marginTop: 6,
    },
    card: {
      backgroundColor: pal.card,
      borderRadius: 22,
      padding: 20,
      borderWidth: 1,
      borderColor: pal.borderCard,
      gap: 10,
    },
    bodyText: {
      fontSize: 15,
      lineHeight: 22,
      color: pal.ink,
    },
    formField: {
      gap: 6,
      marginTop: 4,
    },
    formLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: pal.ink,
    },
    input: {
      backgroundColor: pal.cardSoft,
      borderWidth: 1,
      borderColor: pal.borderCard,
      borderRadius: 13,
      paddingHorizontal: 14,
      paddingVertical: 11,
      fontSize: 14,
      color: pal.ink,
      minHeight: 46,
    },
    textarea: {
      minHeight: 96,
      textAlignVertical: 'top',
    },
    savedBanner: {
      fontSize: 13,
      fontWeight: '700',
      color: pal.green,
    },
    primaryAction: {
      backgroundColor: pal.orange,
      borderRadius: 25,
      minHeight: 48,
      paddingHorizontal: 20,
      paddingVertical: 13,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 6,
    },
    primaryActionText: {
      color: pal.white,
      fontSize: 15,
      fontWeight: '700',
    },
    secondaryPillAction: {
      backgroundColor: pal.orangeSoft,
      borderRadius: 25,
      minHeight: 48,
      paddingHorizontal: 18,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    secondaryPillActionText: {
      color: pal.orange,
      fontSize: 14,
      fontWeight: '700',
    },
    bottomActionsRow: {
      flexDirection: rowOrCol(desktop),
      gap: 12,
      marginTop: 8,
    },
    emptyText: {
      fontSize: 14,
      color: pal.sub,
      paddingVertical: 12,
    },
  });
}

function rowOrCol(desktop: boolean): 'row' | 'column' {
  return desktop ? 'row' : 'column';
}
