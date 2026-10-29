import { tStatic } from '../../../i18n/tStatic';
/**
 * WAVE 4 — P-005 Entraînements (+ orchestration SP-004…007).
 * Aligné proto `training` / `builder` + layouts desktop `desktop-formsplit`.
 * GAP-PROPOSAL : pas de CTA / vue « proposal » factice — sélection locale → review.
 */
import { useTranslation } from '../../../context/LocaleContext';
import { tr } from '../../../i18n/translate';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { CoachLiquidSheet } from '../ui/CoachLiquidSheet';
import { Icon } from '../../../components/ui/Icon';
import { CoachBackRow } from '../../../components/coach/CoachScreenHeader';
import { TrainingText as CoachText, useCoachTrainingTheme } from './coachTrainingTheme';
import { spacing } from '../../../theme/designTokens';
import {
  CoachCard,
  CoachListGroup,
  CoachListRow,
  CoachPageHeader,
  CoachPrimaryButton,
  CoachSectionTitle,
} from '../ui/coachCommonUi';
import { COACH_PROTO_RADII, coachProtoCategoryColor } from '../theme/coachProtoTokens';
import { CoachTrainingFreeEditor } from './CoachTrainingFreeEditor';
import { CoachTrainingComposerScreen } from './CoachTrainingComposerScreen';
import {
  TRAINING_PHASE_LABELS,
  emptyTrainingDraft,
  todayIsoDate,
  type TrainingDraft,
} from './trainingDraft';
import {
  PRELOADED_CATEGORY_LABELS,
  PRELOADED_THEME_LABELS,
  findBestPreloadedSession,
  preloadedSessionCardTitle,
  preloadedSessionToDraftExercises,
  type PreloadedCategory,
  type PreloadedTheme,
  type PreloadedTrainingSession,
} from './prodayPreloadedSessions';
import { CoachExerciseFullscreenModal } from './CoachExerciseFullscreenModal';
import { CoachExerciseLibraryModal } from './CoachExerciseLibraryModal';
import { shareTrainingOnWhatsApp } from './coachTrainingWhatsApp';
import { CoachFieldModeOverlay } from './CoachFieldModeOverlay';
import { CoachSessionDebriefModal } from './CoachSessionDebriefModal';
import type { TrainingEventExerciseLine } from './trainingEventSummary';
import { useCoachWorkspace } from '../shell/CoachWorkspaceContext';
import { coachPaneBottomPad } from '../theme/coachDesignSystem';
import { useSessionProfile } from '../../../hooks/useSessionProfile';
import { teamEventsService } from '../../../services/teamEvents.service';
import type { TeamEvent } from '../../../models/TeamEvent';
import { countRsvpYes } from '../../../models/TeamEvent';
import {
  TACTICAL_STARTER_SCHEMAS,
  tacticalSceneForLibraryExercise,
} from '../../tactics/engine/tacticalStarterSchemas';
import { CoachTrainingStudioScreen } from './workspace/CoachTrainingStudioScreen';
import { TacticalSchemaPreview } from './TacticalSchemaPreview';
import type { CoachNavItemId } from '../navigation/coachNavConfig';

const DURATION_CHOICES = [60, 75, 90] as const;

/** Foyers proto builder — mappés sur le catalogue local (pas de page proposal). */
const BUILDER_FOCUSES: { id: PreloadedTheme; label: string }[] = [
  { id: 'transition', label: 'Conservation & transitions' },
  { id: 'finition', label: 'Finition' },
  { id: 'pressing', label: 'Pressing' },
];

const BUILDER_CATEGORIES: { id: PreloadedCategory; label: string }[] = [
  { id: 'u17_seniors', label: 'Seniors' },
  { id: 'u17_seniors', label: 'U17' },
  { id: 'u13_u15', label: 'U15' },
];

const PLAYER_COUNT_MAX = 40;
const GENERATION_DURATION_MS = 800;
const GENERATION_STEPS = [
  tStatic('hc.coach.coachtraininghome.analyse.de.l.effectif.5ba73b'),
  tStatic('hc.coach.coachtraininghome.calibration.des.ateliers.ad8291'),
  tStatic('hc.coach.coachtraininghome.seance.prete.cbcef7'),
];

type HomeView = 'home' | 'builder' | 'free' | 'review' | 'session' | 'studio';

type UpcomingRow = {
  id: string;
  title: string;
  subtitle: string;
  event?: TeamEvent;
  preloaded?: PreloadedTrainingSession;
};

type Props = {
  onDone?: (eventId: string) => void;
  initialPreloadedTheme?: PreloadedTheme;
  /** Navigation shell (Présences → effectif, Vidéothèque → mes_videos). */
  onNavigate?: (id: CoachNavItemId) => void;
};


function formatUpcomingWhen(date: Date): string {
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (sameDay) {
    return `Aujourd’hui · ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  }
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function CoachTrainingHome({ onDone, initialPreloadedTheme, onNavigate }: Props) {
  const { t } = useTranslation();
  const { tokens } = useCoachTrainingTheme();
  const workspace = useCoachWorkspace();
  const sessionProfile = useSessionProfile();
  const teamName = sessionProfile?.display_name || 'Équipe';
  const catColor = coachProtoCategoryColor('entrainements', tokens.isLight);
  const desktop = workspace.desktop;
  const twoCol = workspace.columns === 2;
  const styles = useMemo(
    () => createStyles({ ...tokens, accent: catColor, soft: `${catColor}26` }, twoCol, desktop),
    [tokens, catColor, twoCol, desktop],
  );

  const initialDraftFromTheme = useMemo(() => {
    if (!initialPreloadedTheme) return null;
    const session = findBestPreloadedSession(initialPreloadedTheme, 90, 'u17_seniors', 16);
    if (!session) return null;
    return {
      ...emptyTrainingDraft(todayIsoDate()),
      title: session.title,
      focus: session.focus,
      notes: `Séance FFF officielle · Thème : ${PRELOADED_THEME_LABELS[session.theme]}`,
      durationMin: session.durationMin,
      exercises: preloadedSessionToDraftExercises(session),
    };
  }, [initialPreloadedTheme]);

  const [view, setView] = useState<HomeView>(() => (initialDraftFromTheme ? 'review' : 'home'));
  const [focusTheme, setFocusTheme] = useState<PreloadedTheme>('transition');
  const [duration, setDuration] = useState<(typeof DURATION_CHOICES)[number]>(75);
  const [category, setCategory] = useState<PreloadedCategory>('u17_seniors');
  const [categoryLabel, setCategoryLabel] = useState('Seniors');
  const [playerCount, setPlayerCount] = useState('16');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState<TrainingDraft | null>(() => initialDraftFromTheme);
  const [sessionDraft, setSessionDraft] = useState<TrainingDraft | null>(null);
  const [sessionEventId, setSessionEventId] = useState<string | undefined>();

  const [fullscreenModal, setFullscreenModal] = useState<{
    visible: boolean;
    title: string;
    instructions?: string;
    objective?: string;
    youtubeId?: string;
    schemaId?: string;
  }>({ visible: false, title: '' });

  const [fieldModeVisible, setFieldModeVisible] = useState(false);
  const [libraryVisible, setLibraryVisible] = useState(false);
  const [debriefVisible, setDebriefVisible] = useState(false);
  const [upcoming, setUpcoming] = useState<UpcomingRow[]>([]);

  const featuredSessions = useMemo(() => {
    return [
      findBestPreloadedSession('finition', 90, 'u13_u15', 14),
      findBestPreloadedSession('sortie_balle', 75, 'u17_seniors', 16),
      findBestPreloadedSession('pressing', 90, 'u13_u15', 14),
      findBestPreloadedSession('vitesse', 60, 'u9_u11', 12),
    ].filter(Boolean) as PreloadedTrainingSession[];
  }, []);

  const loadUpcoming = useCallback(async () => {
    const uid = sessionProfile?.uid;
    const clubId = sessionProfile?.profile?.club_id;
    if (!uid) {
      setUpcoming(
        featuredSessions.slice(0, 2).map((session) => ({
          id: session.id,
          // DEF-W7-006 — titre = focus proto (pas durée/âge dans le titre)
          title: session.focus || preloadedSessionCardTitle(session),
          subtitle: `${session.durationMin} min · ${PRELOADED_CATEGORY_LABELS[session.category]}`,
          preloaded: session,
        })),
      );
      return;
    }
    try {
      const events = await teamEventsService.listForUser(uid, clubId);
      const trainings = events
        .filter((e) => e.event_type === 'training')
        .slice(0, 6)
        .map((event) => {
          const present = countRsvpYes(event);
          const invited = event.invitee_uids?.length ?? 0;
          return {
            id: event.id,
            title: event.title || t('hc.coach.coachtraininghome.seance.d.entrainement.2b9674'),
            subtitle: `${formatUpcomingWhen(event.starts_at)} · ${present}${invited ? ` / ${invited}` : ''} présents`,
            event,
          } satisfies UpcomingRow;
        });
      if (trainings.length > 0) {
        setUpcoming(trainings);
        return;
      }
      setUpcoming([]);
      return;
    } catch {
      setUpcoming([]);
    }
  }, [sessionProfile?.uid, sessionProfile?.profile?.club_id]);

  useEffect(() => {
    void loadUpcoming();
  }, [loadUpcoming]);

  const openPreloadedAsSession = (session: PreloadedTrainingSession) => {
    const draft: TrainingDraft = {
      ...emptyTrainingDraft(todayIsoDate()),
      title: session.title,
      focus: session.focus,
      notes: `Séance FFF · ${PRELOADED_THEME_LABELS[session.theme]}`,
      durationMin: session.durationMin,
      exercises: preloadedSessionToDraftExercises(session),
    };
    setSessionDraft(draft);
    setSessionEventId(undefined);
    setGenerated(draft);
    setView('session');
  };

  const openUpcoming = (row: UpcomingRow) => {
    if (row.preloaded) {
      openPreloadedAsSession(row.preloaded);
      return;
    }
    if (row.event) {
      const plan = row.event.session_plan;
      const exercises = (plan?.exercises ?? []).map((ex, index) => ({
        id: ex.id || `ex_${index}`,
        name: ex.name,
        minutes: ex.durationMin || 10,
        phase: (plan?.exercise_phases?.[index] as TrainingDraft['exercises'][number]['phase']) || 'main',
        objective: ex.objective || '',
        instructions: ex.instructions || '',
        youtubeId: ex.youtubeId,
        tacticalScene: ex.tacticalScene,
      }));
      const draft: TrainingDraft = {
        ...emptyTrainingDraft(todayIsoDate()),
        title: row.event.title || t('hc.coach.coachtraininghome.seance.3bb8fd'),
        focus: row.event.title || '',
        durationMin: Math.max(
          60,
          exercises.reduce((sum, ex) => sum + ex.minutes, 0) || 75,
        ),
        locationLabel: row.event.city || '',
        exercises,
        inviteeUids: row.event.invitee_uids ?? [],
      };
      setSessionDraft(draft);
      setSessionEventId(row.event.id);
      setGenerated(draft);
      setView('session');
    }
  };

  const fieldModeData = useMemo<{ title: string; exercises: TrainingEventExerciseLine[] }>(() => {
    const source = sessionDraft ?? generated;
    if (source) {
      return {
        title: source.title || t('hc.coach.coachtraininghome.seance.terrain.091f0e'),
        exercises: source.exercises.map((ex) => ({
          name: ex.name,
          minutes: ex.minutes,
          phase: ex.phase,
          phaseLabel: TRAINING_PHASE_LABELS[ex.phase],
          ...(ex.tacticalScene ? { tacticalScene: ex.tacticalScene } : {}),
        })),
      };
    }
    const fallback = featuredSessions[0];
    const draftExercises = fallback ? preloadedSessionToDraftExercises(fallback) : [];
    return {
      title: fallback?.title ?? t('hc.coach.coachtraininghome.seance.terrain.091f0e'),
      exercises: draftExercises.map((ex) => ({
        name: ex.name,
        minutes: ex.minutes,
        phase: ex.phase,
        phaseLabel: TRAINING_PHASE_LABELS[ex.phase],
        ...(ex.tacticalScene ? { tacticalScene: ex.tacticalScene } : {}),
      })),
    };
  }, [sessionDraft, generated, featuredSessions]);

  const findAdaptedSession = async () => {
    const players = Number(playerCount);
    if (!Number.isInteger(players) || players < 4 || players > PLAYER_COUNT_MAX) {
      setError(`Indiquez le nombre de joueurs présents (de 4 à ${PLAYER_COUNT_MAX}).`);
      return;
    }
    setBusy(true);
    setError(null);
    setGenerationStep(0);
    const stepDelay = GENERATION_DURATION_MS / GENERATION_STEPS.length;
    for (let step = 1; step < GENERATION_STEPS.length; step++) {
      await new Promise((resolve) => setTimeout(resolve, stepDelay));
      setGenerationStep(step);
    }
    await new Promise((resolve) => setTimeout(resolve, stepDelay));

    try {
      const session = findBestPreloadedSession(focusTheme, duration, category, players);
      setGenerated({
        ...emptyTrainingDraft(todayIsoDate()),
        title: session.title,
        focus: session.focus,
        notes: notes.trim(),
        durationMin: session.durationMin,
        exercises: preloadedSessionToDraftExercises(session),
      });
      setView('review');
    } catch (generationError) {
      setError(
        generationError instanceof Error && generationError.message.trim()
          ? generationError.message
          : t('hc.coach.coachtraininghome.la.generation.d.entrainement.a.rencontre.un.prob.1464b7'),
      );
    } finally {
      setBusy(false);
    }
  };

  const activeSessionExercise = sessionDraft?.exercises[0];
  const activeSessionScene = activeSessionExercise
    ? activeSessionExercise.tacticalScene ??
      tacticalSceneForLibraryExercise(activeSessionExercise.id) ??
      TACTICAL_STARTER_SCHEMAS.find((s) => s.id === activeSessionExercise.id)?.scene
    : undefined;

  if (view === 'studio') {
    return (
      <CoachTrainingStudioScreen
        onBack={() => setView('home')}
        onSave={() => setView('home')}
      />
    );
  }

  if (view === 'free') {
    return (
      <View style={styles.root}>
        <CoachBackRow nestedLocal onBack={() => setView('home')} themeTokens={tokens} />
        <CoachTrainingFreeEditor onDone={onDone} />
      </View>
    );
  }

  if (view === 'review' && generated) {
    const aiPlayerLimit = Number(playerCount);
    return (
      <View style={styles.root}>
        <CoachBackRow nestedLocal onBack={() => setView('builder')} themeTokens={tokens} />
        <CoachTrainingComposerScreen
          initialDraft={generated}
          initialStep="organisation"
          maxPlayers={Number.isInteger(aiPlayerLimit) && aiPlayerLimit > 0 ? aiPlayerLimit : undefined}
          source="ai"
          onDone={onDone}
          onCancel={() => setView('builder')}
        />
      </View>
    );
  }

  if (view === 'session' && sessionDraft) {
    const sessionBody = (
      <View style={styles.sessionMain}>
        <CoachCard style={styles.sessionHeroCard}>
          <CoachText variant="caption" style={{ color: catColor, fontWeight: '700' }}>
            Séance prête à adapter
          </CoachText>
          <CoachText style={styles.sessionHeroTitle}>{sessionDraft.focus || sessionDraft.title}</CoachText>
          <CoachText muted>
            {sessionDraft.durationMin} minutes
            {sessionDraft.locationLabel ? ` · ${sessionDraft.locationLabel}` : ''}
          </CoachText>
        </CoachCard>

        <CoachSectionTitle category="entrainements" title={t('hc.coach.coachtrainingeventdetail.deroule.bed9ba')} />
        <CoachListGroup>
          {sessionDraft.exercises.map((ex, index) => (
            <CoachListRow
              key={ex.id}
              title={ex.name}
              subtitle={`${TRAINING_PHASE_LABELS[ex.phase]} · ${ex.minutes} min`}
              leading={
                <View style={styles.orderBadge}>
                  <CoachText style={styles.orderBadgeText}>{index + 1}</CoachText>
                </View>
              }
            />
          ))}
        </CoachListGroup>

        <CoachListGroup>
          <CoachListRow
            title={t('hc.coach.coachtraininghome.ajouter.un.exercice.e82f79')}
            subtitle={t('hc.coach.coachtraininghome.bibliotheque.et.variantes.823fef')}
            onPress={() => setLibraryVisible(true)}
            trailing={<Icon name="chevron-forward" size={17} color={tokens.muted} />}
          />
          <CoachListRow
            title="Présences et invitations"
            subtitle={
              sessionEventId
                ? (() => {
                    const row = upcoming.find((u) => u.id === sessionEventId);
                    return row?.subtitle?.includes('présent')
                      ? row.subtitle.replace(/^[^·]*·\s*/, '')
                      : 'Convocations de l’équipe';
                  })()
                : 'Convocations de l’équipe'
            }
            onPress={() => onNavigate?.('equipe')}
            trailing={<Icon name="chevron-forward" size={17} color={tokens.muted} />}
          />
        </CoachListGroup>

        <CoachPrimaryButton
          category="entrainements"
          label={t('hc.coach.coachtraininghome.lancer.le.mode.terrain.01b92c')}
          onPress={() => setFieldModeVisible(true)}
        />
        <CoachPrimaryButton
          category="entrainements"
          variant="pill"
          label={t('hc.coach.coachtraininghome.adapter.et.enregistrer.ac2a6f')}
          onPress={() => {
            setGenerated(sessionDraft);
            setView('review');
          }}
        />
        <CoachPrimaryButton
          category="entrainements"
          variant="pill"
          label="Partager la séance sur WhatsApp"
          onPress={() => {
            void shareTrainingOnWhatsApp({
              title: sessionDraft.title,
              focus: sessionDraft.focus,
              durationMin: sessionDraft.durationMin,
              locationLabel: sessionDraft.locationLabel,
              teamName,
              exercises: sessionDraft.exercises.map((ex) => ({
                name: ex.name,
                minutes: ex.minutes,
                instructions: ex.instructions || ex.objective || '',
                youtubeId: ex.youtubeId,
                phase: ex.phase,
              })),
            });
          }}
          style={styles.whatsappTrainingBtn}
        />
      </View>
    );

    return (
      <View style={styles.root}>
        <CoachBackRow nestedLocal onBack={() => setView('home')} themeTokens={tokens} />
        <ScrollView contentContainerStyle={styles.content}>
          {desktop ? (
            <View style={styles.desktopTrainingLayout} testID="coach-training-session-desktop">
              {sessionBody}
              <View style={styles.previewColumn}>
                <CoachText variant="section">Prévisualisation de l’atelier</CoachText>
                <CoachText muted style={styles.headerSub}>
                  Animation · consignes du premier atelier
                </CoachText>
                {activeSessionScene ? (
                  <TacticalSchemaPreview scene={activeSessionScene} />
                ) : (
                  <CoachText muted>Aucun schéma pour cet atelier.</CoachText>
                )}
                {activeSessionExercise?.instructions ? (
                  <>
                    <CoachSectionTitle category="entrainements" title={t('hc.coach.coachtraininghome.consignes.du.coach.7c4379')} />
                    <CoachText>{activeSessionExercise.instructions}</CoachText>
                  </>
                ) : null}
              </View>
            </View>
          ) : (
            sessionBody
          )}
        </ScrollView>

        <CoachFieldModeModal
          visible={fieldModeVisible}
          title={fieldModeData.title}
          exercises={fieldModeData.exercises}
          eventId={sessionEventId}
          onClose={() => setFieldModeVisible(false)}
        />
        <CoachExerciseLibraryModal
          visible={libraryVisible}
          onClose={() => setLibraryVisible(false)}
        />
      </View>
    );
  }

  if (view === 'builder') {
    const builderForm = (
      <View style={styles.builderColumn}>
        <CoachPageHeader
          category="entrainements"
          title={t('hc.coach.coachtraininghome.creer.une.seance.7ea071')}
          subtitle={t('hc.coach.coachtraininghome.vos.parametres.votre.terrain.82a08c')}
        />

        <CoachCard style={styles.builderCard}>
          <CoachText variant="section">Objectif</CoachText>
          <View style={styles.chips}>
            {BUILDER_FOCUSES.map((item) => (
              <Chip
                key={item.id + item.label}
                label={item.label}
                selected={focusTheme === item.id}
                onPress={() => setFocusTheme(item.id)}
                styles={styles}
              />
            ))}
          </View>

          <CoachText variant="section">Durée</CoachText>
          <View style={styles.durationTrack} accessibilityRole="radiogroup" accessibilityLabel="Durée de la séance">
            {DURATION_CHOICES.map((minutes) => (
              <Pressable
                key={minutes}
                onPress={() => setDuration(minutes)}
                accessibilityRole="radio"
                accessibilityState={{ selected: duration === minutes }}
                accessibilityLabel={`${minutes} minutes`}
                style={[
                  styles.durationChip,
                  duration === minutes && styles.durationChipSelected,
                ]}
              >
                <CoachText
                  style={
                    duration === minutes ? styles.durationChipTextSelected : styles.durationChipText
                  }
                >
                  {minutes} min
                </CoachText>
              </Pressable>
            ))}
          </View>

          <CoachText variant="section">Joueurs présents</CoachText>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={playerCount}
            onChangeText={setPlayerCount}
            placeholder="16"
            placeholderTextColor={tokens.muted}
            accessibilityLabel={t('hc.coach.coachtraininghome.nombre.de.joueurs.presents.cb0026')}
          />

          <CoachText variant="section">Catégorie</CoachText>
          <View style={styles.chips}>
            {BUILDER_CATEGORIES.map((item) => (
              <Chip
                key={item.label}
                label={item.label}
                selected={categoryLabel === item.label}
                onPress={() => {
                  setCategory(item.id);
                  setCategoryLabel(item.label);
                }}
                styles={styles}
              />
            ))}
          </View>

          <CoachText variant="section">Notes du coach</CoachText>
          <TextInput
            style={[styles.input, styles.multiline]}
            multiline
            value={notes}
            onChangeText={setNotes}
            placeholder={t('hc.coach.coachtraininghome.contraintes.materiel.intention.937e70')}
            placeholderTextColor={tokens.muted}
            accessibilityLabel={t('hc.coach.coachtraininghome.notes.du.coach.37ba8a')}
          />

          {error ? <CoachText style={styles.error}>{error}</CoachText> : null}

          <Pressable
            onPress={() => void findAdaptedSession()}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel="Trouver une séance adaptée"
            style={[styles.primary, busy && styles.disabled]}
          >
            <CoachText style={styles.primaryText}>
              {busy ? GENERATION_STEPS[generationStep] : 'Trouver une séance adaptée'}
            </CoachText>
          </Pressable>
          <CoachText muted style={styles.captionHint}>
            Proposition illustrative locale, sans page proposal distante (GAP-PROPOSAL).
          </CoachText>
        </CoachCard>

        <CoachPrimaryButton
          category="entrainements"
          variant="pill"
          label="Composer librement avec la bibliothèque"
          onPress={() => setView('free')}
          accessibilityLabel="Création libre"
        />
      </View>
    );

    const builderAside = (
      <View style={styles.detailPanel} testID="coach-training-builder-aside">
        <CoachText variant="section">Votre cadre de séance</CoachText>
        <View style={styles.asideList}>
          {[
            t('hc.coach.coachtraininghome.un.objectif.collectif.clair.59e9e3'),
            t('hc.coach.coachtraininghome.une.duree.compatible.avec.le.creneau.0e817d'),
            t('hc.coach.coachtraininghome.un.effectif.adapte.aux.ateliers.1e98a0'),
            t('hc.coach.coachtraininghome.les.animations.et.variantes.conservees.a90df9'),
          ].map((line) => (
            <CoachText key={line} muted style={styles.asideBullet}>
              · {line}
            </CoachText>
          ))}
        </View>
        <CoachText muted style={styles.captionHint}>
          La sélection reste locale au catalogue FFF embarqué ; aucune génération distante.
        </CoachText>
        <CoachPrimaryButton
          category="entrainements"
          variant="pill"
          label={t('hc.coach.coachtraininghome.parcourir.les.exercices.b55c4b')}
          onPress={() => setLibraryVisible(true)}
        />
      </View>
    );

    return (
      <View style={styles.root} testID="coach-training-builder">
        <CoachBackRow nestedLocal onBack={() => setView('home')} themeTokens={tokens} />
        <ScrollView contentContainerStyle={styles.content}>
          {desktop ? (
            <View style={styles.desktopFormSplit}>
              {builderForm}
              {builderAside}
            </View>
          ) : (
            builderForm
          )}
        </ScrollView>
        <CoachExerciseLibraryModal
          visible={libraryVisible}
          onClose={() => setLibraryVisible(false)}
        />
      </View>
    );
  }

  const homeMain = (
    <View style={styles.homeMain} testID="coach-training-home-main">
      <CoachPageHeader
        category="entrainements"
        title={tr(t, 'coach.training.header.title', 'Entraînements')}
        subtitle={tr(t, 'coach.training.header.subtitle', 'Préparer, animer, progresser')}
      />

      {/* Proto `action('Préparer une séance','builder')` */}
      <CoachPrimaryButton
        category="entrainements"
        label={tr(t, 'coach.training.cta.prepareSession', 'Préparer une séance')}
        onPress={() => setView('builder')}
        accessibilityLabel={tr(t, 'coach.training.cta.prepareSession', 'Préparer une séance')}
      />

      <View style={{ marginTop: 8 }}>
        <CoachPrimaryButton
          category="entrainements"
          variant="pill"
          label="Studio Tactique & Animation (TacticSlate)"
          onPress={() => setView('studio')}
          accessibilityLabel="Studio Tactique & Animation"
        />
      </View>

      <CoachSectionTitle
        category="entrainements"
        title={tr(t, 'coach.training.section.upcoming', 'À venir')}
      />
      <CoachListGroup style={styles.groupReset}>
        {upcoming.length === 0 ? (
          <CoachListRow
            title="Aucun entraînement à venir"
            subtitle="Préparez votre prochaine séance d’entraînement ci-dessous."
          />
        ) : (
          upcoming.map((row) => (
            <CoachListRow
              key={row.id}
              title={row.title}
              subtitle={row.subtitle}
              onPress={() => openUpcoming(row)}
              trailing={<Icon name="chevron-forward" size={17} color={tokens.muted} />}
            />
          ))
        )}
      </CoachListGroup>

      {/* Proto bibliothèque = 2 rows only (Composer / Mode terrain live in builder + session). */}
      <CoachSectionTitle
        category="entrainements"
        title={tr(t, 'coach.training.section.library', 'Votre bibliothèque')}
      />
      <CoachListGroup style={styles.groupReset}>
        <CoachListRow
          title={tr(t, 'coach.training.row.browseExercises', 'Parcourir les exercices')}
          subtitle={tr(
            t,
            'coach.training.row.browseExercisesHint',
            'Consignes, schémas et variantes',
          )}
          onPress={() => setLibraryVisible(true)}
          trailing={<Icon name="chevron-forward" size={17} color={tokens.muted} />}
        />
        <CoachListRow
          title={tr(t, 'coach.training.row.history', 'Historique des séances')}
          subtitle={tr(t, 'coach.training.row.historyHint', 'Bilan et présences')}
          onPress={() => setDebriefVisible(true)}
          trailing={<Icon name="chevron-forward" size={17} color={tokens.muted} />}
        />
      </CoachListGroup>
    </View>
  );

  const homeAside = (
    <View style={styles.detailPanel} testID="coach-training-home-aside">
      <CoachText variant="section">Préparer sans perdre le contexte</CoachText>
      <CoachText style={styles.headerSub}>
        Sélectionnez une séance à gauche pour ouvrir son déroulé et son aperçu animé côte à côte.
      </CoachText>
      <CoachSectionTitle
        category="entrainements"
        title={tr(t, 'coach.training.section.nextAppointment', 'Votre prochain rendez-vous')}
      />
      <CoachListGroup style={styles.groupReset}>
        {upcoming[0] ? (
          <CoachListRow
            title={upcoming[0].title}
            subtitle={upcoming[0].subtitle}
            onPress={() => openUpcoming(upcoming[0])}
            trailing={<Icon name="chevron-forward" size={17} color={tokens.muted} />}
          />
        ) : (
          <CoachListRow
            title="Aucun entraînement planifié"
            subtitle="Planifiez votre prochaine séance pour voir son contexte ici."
          />
        )}
      </CoachListGroup>
      <CoachSectionTitle
        category="entrainements"
        title={tr(t, 'coach.training.section.resources', 'Ressources')}
      />
      <CoachListGroup style={styles.groupReset}>
        <CoachListRow
          title={tr(t, 'coach.training.row.animatedExercises', 'Exercices animés')}
          subtitle={tr(
            t,
            'coach.training.row.animatedExercisesHint',
            'Phases, consignes et variantes',
          )}
          onPress={() => setLibraryVisible(true)}
          trailing={<Icon name="chevron-forward" size={17} color={tokens.muted} />}
        />
        {/* Proto desktop aside: Vidéothèque (not Mode terrain). */}
        <CoachListRow
          title={tr(t, 'coach.training.row.videotheque', 'Vidéothèque')}
          subtitle={tr(
            t,
            'coach.training.row.videothequeHint',
            'Séquences et observations',
          )}
          onPress={() => onNavigate?.('mes_videos')}
          trailing={<Icon name="chevron-forward" size={17} color={tokens.muted} />}
        />
      </CoachListGroup>
    </View>
  );

  return (
    <View style={styles.root} testID="coach-training-home">
      <ScrollView contentContainerStyle={styles.content}>
        {desktop ? (
          <View style={styles.desktopFormSplit}>
            {homeMain}
            {homeAside}
          </View>
        ) : (
          homeMain
        )}
      </ScrollView>

      <CoachFieldModeModal
        visible={fieldModeVisible}
        title={fieldModeData.title}
        exercises={fieldModeData.exercises}
        eventId={sessionEventId}
        onClose={() => setFieldModeVisible(false)}
      />

      <CoachExerciseLibraryModal
        visible={libraryVisible}
        onClose={() => setLibraryVisible(false)}
      />

      <CoachSessionDebriefModal
        visible={debriefVisible}
        onClose={() => setDebriefVisible(false)}
        sessionTitle={generated?.title || upcoming[0]?.title || t('hc.coach.coachtraininghome.bilan.de.seance.0a1577')}
        durationMin={generated?.durationMin || 75}
      />

      <CoachExerciseFullscreenModal
        visible={fullscreenModal.visible}
        onClose={() => setFullscreenModal((prev) => ({ ...prev, visible: false }))}
        title={fullscreenModal.title}
        instructions={fullscreenModal.instructions}
        objective={fullscreenModal.objective}
        youtubeId={fullscreenModal.youtubeId}
        tacticalScene={
          fullscreenModal.schemaId
            ? TACTICAL_STARTER_SCHEMAS.find((s) => s.id === fullscreenModal.schemaId)?.scene ??
              tacticalSceneForLibraryExercise(fullscreenModal.schemaId)
            : undefined
        }
      />
    </View>
  );
}

function CoachFieldModeModal({
  visible,
  title,
  exercises,
  eventId,
  onClose,
}: {
  visible: boolean;
  title: string;
  exercises: TrainingEventExerciseLine[];
  eventId?: string;
  onClose: () => void;
}) {
  return (
    <CoachLiquidSheet
      visible={visible}
      onClose={onClose}
      variant="fullscreen"
      dismissOnBackdrop={false}
      testID="coach-field-mode-sheet"
    >
      <CoachFieldModeOverlay title={title} exercises={exercises} eventId={eventId} onClose={onClose} />
    </CoachLiquidSheet>
  );
}

function Chip({
  label,
  selected,
  onPress,
  styles,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <CoachText style={selected ? styles.chipTextSelected : styles.chipText}>{label}</CoachText>
    </Pressable>
  );
}

function createStyles(
  tokens: ReturnType<typeof useCoachTrainingTheme>['tokens'] & { soft: string },
  _wide: boolean,
  desktop: boolean,
) {
  return StyleSheet.create({
    root: { flex: 1, minHeight: 0, backgroundColor: tokens.bg },
    content: {
      width: '100%',
      maxWidth: desktop ? 1440 : 1120,
      alignSelf: 'center',
      padding: desktop ? 32 : spacing.lg,
      gap: spacing.md,
      paddingBottom: coachPaneBottomPad({ desktop, extra: spacing.xl }),
    },
    headerSub: { marginBottom: spacing.xs },
    groupReset: { marginVertical: 0 },
    homeMain: { flex: 1, minWidth: 0, gap: spacing.xs },
    builderColumn: { flex: 1, minWidth: 0, gap: spacing.sm },
    builderCard: { gap: spacing.sm },
    desktopFormSplit: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 24,
    },
    desktopTrainingLayout: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 24,
    },
    sessionMain: { flex: 0.85, minWidth: 280, gap: spacing.sm },
    detailPanel: {
      flex: 1,
      minWidth: 270,
      maxWidth: desktop ? 420 : undefined,
      /** Proto `.desktop-detailpanel` — radius 20 / padding 22. */
      borderRadius: COACH_PROTO_RADII.cardDesktop,
      padding: 22,
      backgroundColor: tokens.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
      gap: spacing.sm,
    },
    previewColumn: {
      flex: 1.4,
      minWidth: 0,
      /** Proto `.desktop-training-layout > .preview-column` — radius 22. */
      borderRadius: COACH_PROTO_RADII.videoStage,
      padding: 22,
      backgroundColor: tokens.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
      gap: spacing.sm,
    },
    asideList: { gap: 6, marginVertical: spacing.sm },
    asideBullet: { fontSize: 12, lineHeight: 20 },
    captionHint: { fontSize: 12, marginTop: spacing.xs },
    sessionHeroCard: { gap: spacing.xs },
    sessionHeroTitle: { fontSize: 22, fontWeight: '800', color: tokens.foreground },
    orderBadge: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tokens.soft,
    },
    orderBadgeText: { fontWeight: '800', color: tokens.accent, fontSize: 12 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    chip: {
      minHeight: 40,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: COACH_PROTO_RADII.chipControl,
      borderWidth: 1,
      borderColor: tokens.border,
      backgroundColor: tokens.elevated,
      overflow: 'hidden',
    },
    chipSelected: { backgroundColor: tokens.soft, borderColor: tokens.accent },
    chipText: { color: tokens.foreground, textAlign: 'center' },
    chipTextSelected: { color: tokens.accent, fontWeight: '700', textAlign: 'center' },
    /** Rangée durée — piste segmentée égale, sans wrap / décalage. */
    durationTrack: {
      flexDirection: 'row',
      alignItems: 'stretch',
      gap: 6,
      padding: 4,
      borderRadius: COACH_PROTO_RADII.chipControl,
      backgroundColor: tokens.elevated,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
    },
    durationChip: {
      flex: 1,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 8,
      paddingVertical: 10,
      borderRadius: COACH_PROTO_RADII.chipControl - 4,
      overflow: 'hidden',
    },
    durationChipSelected: {
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.accent,
    },
    durationChipText: { color: tokens.muted, fontWeight: '600', fontSize: 14, textAlign: 'center' },
    durationChipTextSelected: {
      color: tokens.accent,
      fontWeight: '800',
      fontSize: 14,
      textAlign: 'center',
    },
    input: {
      minHeight: 47,
      borderWidth: 1,
      borderColor: tokens.border,
      borderRadius: COACH_PROTO_RADII.input,
      paddingHorizontal: spacing.md,
      color: tokens.foreground,
      backgroundColor: tokens.surface,
    },
    multiline: { minHeight: 96, paddingVertical: spacing.sm, textAlignVertical: 'top' },
    error: { color: tokens.foreground, fontWeight: '700' },
    whatsappTrainingBtn: {
      backgroundColor: '#25D366',
      borderColor: '#25D366',
      marginTop: 8,
    },
    primary: {
      minHeight: 47,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: COACH_PROTO_RADII.button,
      backgroundColor: tokens.accent,
      marginTop: spacing.sm,
    },
    primaryText: { color: tokens.onAccent, fontWeight: '800' },
    disabled: { opacity: 0.5 },
  });
}
