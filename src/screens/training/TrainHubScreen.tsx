import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { ProDayText } from '../../components/ui/ProDayText';
import { ProDaySurface } from '../../components/ui/ProDaySurface';
import { PressableSpring } from '../../components/motion';
import { Icon, type IconName } from '../../components/ui/Icon';
import { useThemedScreen } from '../../hooks/useThemedScreen';
import { useAuth } from '../../context/AuthContext';
import { homeTrainingService, coachingSessionsService } from '../../services/homeTraining.service';
import { startCoachSessionPayment } from '../../services/coachSessionPayment.service';
import {
  HOME_EXERCISE_DIFFICULTY_LABELS,
  HOME_EXERCISE_MODE_LABELS,
  type CoachHourlyProfile,
  type CoachSessionBooking,
  type CoachSessionDurationMin,
  type HomeExercise,
  type HomeExerciseMode,
} from '../../models/HomeTraining';
import { parseFrenchDate } from '../../utils/parseFrenchDate';
import { ImmersivePoleHero, ImmersiveStepStrip } from '../../components/poles';
import { useJoueurSession } from '../../context/JoueurSessionContext';
import {
  JoueurPageFrame,
  JoueurSectionCard,
  JoueurActionRow,
  JoueurKpiRow,
} from '../../components/player/joueurPortalUi';
import { JoueurUniverseWorld } from '../../components/player/JoueurUniverseWorld';
import { JOUEUR_SITE } from '../../content/joueurPageIdentity';
import { PLAYER_DARK } from '../../theme/playerDarkPremium';
import { spacing, radius } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';
import { isFunctionsUnavailable } from '../../lib/firebaseFunctions';
import { aiTrainingService } from '../../services/aiTraining.service';
import type { TrainingPhase, TrainingObjective, TrainingLevel } from '../../models/TrainingSession';
import {
  INDIVIDUAL_OBJECTIVES,
  INDIVIDUAL_DURATIONS,
  EQUIPMENT_OPTIONS,
  TRAINING_OBJECTIVE_LABELS,
  TRAINING_LEVEL_LABELS,
  phaseLabel,
} from '../../models/TrainingSession';

type TrainHubView = 'hub' | 'home' | 'family' | 'coach' | 'book' | 'exercise' | 'ai';

interface TrainHubScreenProps {
  onBack: () => void;
  /** Vue initiale — ex. `ai` depuis le Coach IA joueur. */
  initialView?: TrainHubView;
}

const DEMO_COACHES: CoachHourlyProfile[] = [
  {
    coach_uid: 'demo-coach-1',
    display_name: 'Camille R. (démo)',
    bio: 'UEFA B · travail technique & mental. Créneaux semaine et week-end.',
    specialties: ['Technique', 'Jeunes'],
    age_categories: ['U13', 'U15', 'U17'],
    positions_coached: [],
    city: 'Paris',
    hourly_rate_eur: 30,
    club_name: 'ProDay Démo',
    sessions_completed: 12,
    available: true,
  },
  {
    coach_uid: 'demo-coach-2',
    display_name: 'Karim B. (démo)',
    bio: 'Préparation physique & finition. Séances à l’heure, sans abo.',
    specialties: ['Physique', 'Finition'],
    age_categories: ['U17', 'U19', 'Seniors'],
    positions_coached: [],
    city: 'Lyon',
    hourly_rate_eur: 35,
    sessions_completed: 8,
    available: true,
  },
];

const HUB_ACTIONS: {
  id: 'home' | 'family' | 'coach' | 'book' | 'ai';
  title: string;
  body: string;
  icon: IconName;
}[] = [
  {
    id: 'ai',
    title: 'Programme IA',
    body: 'L\u2019IA crée ton programme perso en 10 secondes.',
    icon: 'star-four-points',
  },
  {
    id: 'home',
    title: 'À la maison',
    body: 'Exercices solo : jardin, city-stade, salon.',
    icon: 'home',
  },
  {
    id: 'family',
    title: 'Avec ma famille',
    body: 'Séances avec un parent, frère, sœur ou ami.',
    icon: 'person',
  },
  {
    id: 'coach',
    title: 'Avec un coach',
    body: 'Trouve un coach humain près de chez toi.',
    icon: 'football',
  },
  {
    id: 'book',
    title: 'Réserver une séance',
    body: 'Créneau · durée · paiement à l’heure.',
    icon: 'calendar',
  },
];

export const TrainHubScreen: React.FC<TrainHubScreenProps> = ({ onBack, initialView = 'hub' }) => {
  const { profile } = useAuth();
  const { colors: c, rootStyle } = useThemedScreen();
  const styles = useMemo(() => createStyles(c), [c]);
  const joueurSession = useJoueurSession();
  const joueurLive =
    Boolean(joueurSession?.isJoueurPlayer && joueurSession.ready && !joueurSession.needsGate);

  const jc = useMemo(() => {
    if (!joueurLive || !joueurSession) return null;
    const accent = joueurSession.identity.accent;
    return {
      background: PLAYER_DARK.bg,
      surface: PLAYER_DARK.surface,
      border: PLAYER_DARK.border,
      text: PLAYER_DARK.text,
      textSecondary: PLAYER_DARK.textMuted,
      textMuted: PLAYER_DARK.textDim,
      brand: accent,
      brandInverse: PLAYER_DARK.bg,
      accentSoft: PLAYER_DARK.accentSoft,
    };
  }, [joueurLive, joueurSession]);

  const ui = jc ?? c;
  const screenRootStyle = joueurLive ? { backgroundColor: PLAYER_DARK.bg } : rootStyle;

  const [view, setView] = useState<TrainHubView>(initialView);
  const [modeFilter, setModeFilter] = useState<HomeExerciseMode | undefined>();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<HomeExercise | null>(null);
  const [coaches, setCoaches] = useState<CoachHourlyProfile[]>([]);
  const [loadingCoaches, setLoadingCoaches] = useState(false);
  const [bookingCoach, setBookingCoach] = useState<CoachHourlyProfile | null>(null);
  const [dateStr, setDateStr] = useState('');
  const [duration, setDuration] = useState<CoachSessionDurationMin>(60);
  const [submitting, setSubmitting] = useState(false);
  const [myBookings, setMyBookings] = useState<CoachSessionBooking[]>([]);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [aiObjective, setAiObjective] = useState<TrainingObjective>('pied_faible');
  const [aiLevel, setAiLevel] = useState<TrainingLevel>('intermediate');
  const [aiDuration, setAiDuration] = useState(30);
  const [aiEquipment, setAiEquipment] = useState<string[]>(['ballon']);
  const [aiPartner, setAiPartner] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiResult, setAiResult] = useState<TrainingPhase[] | null>(null);

  const exercises = useMemo(
    () =>
      homeTrainingService.listExercises({
        mode: modeFilter,
        query: query || undefined,
        position: profile?.profile.position,
        age: profile?.profile.age,
      }),
    [modeFilter, query, profile?.profile.position, profile?.profile.age],
  );

  const refreshBookings = () => {
    if (!profile) return;
    void coachingSessionsService.listForPlayer(profile.uid).then(setMyBookings);
  };

  useEffect(() => {
    refreshBookings();
  }, [profile?.uid]);

  useEffect(() => {
    if (view !== 'coach' && view !== 'book') return;
    setLoadingCoaches(true);
    void coachingSessionsService
      .listAvailableCoaches()
      .then((rows: CoachHourlyProfile[]) => setCoaches(rows.length ? rows : DEMO_COACHES))
      .finally(() => setLoadingCoaches(false));
  }, [view]);

  const payBooking = async (bookingId: string) => {
    setPayingId(bookingId);
    try {
      const result = await startCoachSessionPayment(bookingId);
      if (result.status === 'success') {
        Alert.alert('Paiement', 'Séance payée. Le coach est notifié.');
      } else if (result.status === 'cancel') {
        Alert.alert('Paiement', 'Paiement annulé.');
      }
      refreshBookings();
    } catch (e) {
      const msg = isFunctionsUnavailable(e)
        ? 'Paiement indisponible (Stripe / Functions). Réessaie plus tard ou contacte le support.'
        : e instanceof Error
          ? e.message
          : 'Paiement impossible.';
      Alert.alert('Paiement', msg);
    } finally {
      setPayingId(null);
    }
  };

  const generateAiTraining = async () => {
    setAiGenerating(true);
    try {
      const result = await aiTrainingService.generateIndividual({
        objective: aiObjective,
        position: profile?.profile.position,
        level: aiLevel,
        duration_min: aiDuration,
        equipment: aiEquipment.filter((e) => e !== 'rien'),
        partner: aiPartner,
      });
      setAiResult(result.phases);
    } catch (e) {
      const msg = isFunctionsUnavailable(e)
        ? 'IA indisponible. Réessaie plus tard.'
        : e instanceof Error
          ? e.message
          : 'Génération impossible.';
      Alert.alert('Erreur', msg);
    } finally {
      setAiGenerating(false);
    }
  };

  const toggleEquipment = (item: string) => {
    if (item === 'rien') {
      setAiEquipment(['rien']);
      return;
    }
    setAiEquipment((prev) => {
      const filtered = prev.filter((e) => e !== 'rien');
      return filtered.includes(item)
        ? filtered.filter((e) => e !== item)
        : [...filtered, item];
    });
  };

  const openLibrary = (mode?: HomeExerciseMode) => {
    setModeFilter(mode);
    setView(mode === 'family' || mode === 'partner' ? 'family' : 'home');
  };

  const requestBooking = async () => {
    if (!profile || !bookingCoach) return;
    if (bookingCoach.coach_uid.startsWith('demo-')) {
      Alert.alert(
        'Demande démo',
        `Séance ${duration} min avec ${bookingCoach.display_name} à ~${Math.round(
          bookingCoach.hourly_rate_eur * (duration / 60),
        )} €.\nLes vrais coachs apparaissent dès qu’ils ouvrent leurs créneaux. En attendant, la bibliothèque d’exercices est disponible.`,
      );
      setBookingCoach(null);
      setView('hub');
      return;
    }
    const parsed = parseFrenchDate(dateStr);
    if (!parsed) {
      Alert.alert('Date', 'Indique une date jj/mm/aaaa.');
      return;
    }
    setSubmitting(true);
    try {
      await coachingSessionsService.requestSession({
        coach: bookingCoach,
        player_uid: profile.uid,
        player_name: profile.display_name,
        starts_at: parsed,
        duration_min: duration,
        location_label: bookingCoach.city,
      });
      const hours = duration / 60;
      const price = Math.round(bookingCoach.hourly_rate_eur * hours * 100) / 100;
      Alert.alert(
        'Demande envoyée',
        `Séance ${duration} min avec ${bookingCoach.display_name} · ${price} €.\nLe coach doit accepter. Tu pourras ensuite payer par carte (Stripe).`,
      );
      setBookingCoach(null);
      setView('hub');
      refreshBookings();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Réservation impossible.');
    } finally {
      setSubmitting(false);
    }
  };

  if (view === 'ai') {
    return (
      <View style={[styles.root, screenRootStyle]}>
        <ScreenHeader
          title={aiResult ? 'Programme IA' : 'Entraînement IA'}
          onBack={() => {
            if (aiResult) {
              setAiResult(null);
            } else {
              setView('hub');
            }
          }}
        />
        <ScrollView contentContainerStyle={styles.pad}>
          {!aiResult ? (
            <>
              <ProDayText variant="caption" muted>
                L'IA génère un programme personnalisé selon tes paramètres.
              </ProDayText>

              <ProDayText variant="section" style={styles.mt}>Objectif</ProDayText>
              <View style={styles.row}>
                {INDIVIDUAL_OBJECTIVES.map((obj) => (
                  <PressableSpring
                    key={obj}
                    style={[
                      styles.chip,
                      { borderColor: ui.border },
                      aiObjective === obj && { backgroundColor: ui.brand },
                    ]}
                    onPress={() => setAiObjective(obj)}
                    scaleTo={0.96}
                  >
                    <ProDayText
                      variant="caption"
                      inverse={aiObjective === obj}
                      style={aiObjective !== obj ? { color: ui.textSecondary } : undefined}
                    >
                      {TRAINING_OBJECTIVE_LABELS[obj]}
                    </ProDayText>
                  </PressableSpring>
                ))}
              </View>

              <ProDayText variant="section" style={styles.mt}>Durée</ProDayText>
              <View style={styles.row}>
                {INDIVIDUAL_DURATIONS.map((d) => (
                  <PressableSpring
                    key={d}
                    style={[
                      styles.chip,
                      { borderColor: ui.border },
                      aiDuration === d && { backgroundColor: ui.brand },
                    ]}
                    onPress={() => setAiDuration(d)}
                    scaleTo={0.96}
                  >
                    <ProDayText
                      variant="caption"
                      inverse={aiDuration === d}
                      style={aiDuration !== d ? { color: ui.textSecondary } : undefined}
                    >
                      {d} min
                    </ProDayText>
                  </PressableSpring>
                ))}
              </View>

              <ProDayText variant="section" style={styles.mt}>Niveau</ProDayText>
              <View style={styles.row}>
                {(['beginner', 'intermediate', 'advanced'] as TrainingLevel[]).map((lvl) => (
                  <PressableSpring
                    key={lvl}
                    style={[
                      styles.chip,
                      { borderColor: ui.border },
                      aiLevel === lvl && { backgroundColor: ui.brand },
                    ]}
                    onPress={() => setAiLevel(lvl)}
                    scaleTo={0.96}
                  >
                    <ProDayText
                      variant="caption"
                      inverse={aiLevel === lvl}
                      style={aiLevel !== lvl ? { color: ui.textSecondary } : undefined}
                    >
                      {TRAINING_LEVEL_LABELS[lvl]}
                    </ProDayText>
                  </PressableSpring>
                ))}
              </View>

              <ProDayText variant="section" style={styles.mt}>Matériel disponible</ProDayText>
              <View style={styles.row}>
                {EQUIPMENT_OPTIONS.map((eq) => (
                  <PressableSpring
                    key={eq}
                    style={[
                      styles.chip,
                      { borderColor: ui.border },
                      aiEquipment.includes(eq) && { backgroundColor: ui.brand },
                    ]}
                    onPress={() => toggleEquipment(eq)}
                    scaleTo={0.96}
                  >
                    <ProDayText
                      variant="caption"
                      inverse={aiEquipment.includes(eq)}
                      style={!aiEquipment.includes(eq) ? { color: ui.textSecondary } : undefined}
                    >
                      {eq}
                    </ProDayText>
                  </PressableSpring>
                ))}
              </View>

              <ProDayText variant="section" style={styles.mt}>Partenaire</ProDayText>
              <View style={styles.row}>
                {[false, true].map((val) => (
                  <PressableSpring
                    key={String(val)}
                    style={[
                      styles.chip,
                      { borderColor: ui.border },
                      aiPartner === val && { backgroundColor: ui.brand },
                    ]}
                    onPress={() => setAiPartner(val)}
                    scaleTo={0.96}
                  >
                    <ProDayText
                      variant="caption"
                      inverse={aiPartner === val}
                      style={aiPartner !== val ? { color: ui.textSecondary } : undefined}
                    >
                      {val ? 'Avec quelqu\u2019un' : 'Seul'}
                    </ProDayText>
                  </PressableSpring>
                ))}
              </View>

              <PressableSpring
                style={[styles.cta, { backgroundColor: ui.brand, marginTop: spacing.lg }]}
                onPress={() => void generateAiTraining()}
                disabled={aiGenerating}
                scaleTo={0.97}
                haptic
              >
                {aiGenerating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <ProDayText variant="caption" inverse>
                    Générer mon programme
                  </ProDayText>
                )}
              </PressableSpring>
            </>
          ) : (
            <>
              <ProDayText variant="caption" accent>
                {TRAINING_OBJECTIVE_LABELS[aiObjective]} · {aiDuration} min · {TRAINING_LEVEL_LABELS[aiLevel]}
              </ProDayText>
              {aiResult.map((phase, i) => (
                <ProDaySurface
                  key={`${phase.name}-${i}`}
                  variant="module"
                  style={[styles.card, { borderColor: ui.border }]}
                >
                  <ProDayText variant="section">
                    {phase.label || phaseLabel(phase.name)} · {phase.duration_min} min
                  </ProDayText>
                  {phase.exercises.map((ex, j) => (
                    <View key={`ex-${i}-${j}`} style={{ marginTop: spacing.xs }}>
                      <ProDayText variant="caption" style={{ fontWeight: '700' }}>
                        {ex.name}
                      </ProDayText>
                      <ProDayText variant="caption" muted>{ex.description}</ProDayText>
                      {(ex.reps || ex.sets || ex.duration_min) ? (
                        <ProDayText variant="caption" muted>
                          {ex.duration_min ? `${ex.duration_min} min` : ''}
                          {ex.reps ? ` · ${ex.reps} reps` : ''}
                          {ex.sets ? ` × ${ex.sets} séries` : ''}
                          {ex.rest_sec ? ` · ${ex.rest_sec}s repos` : ''}
                        </ProDayText>
                      ) : null}
                      {ex.equipment?.length ? (
                        <ProDayText variant="caption" muted>
                          Matériel : {ex.equipment.join(', ')}
                        </ProDayText>
                      ) : null}
                      {ex.tips?.map((tip, k) => (
                        <ProDayText key={`tip-${k}`} variant="caption" accent>
                          {tip}
                        </ProDayText>
                      ))}
                    </View>
                  ))}
                </ProDaySurface>
              ))}
              <PressableSpring
                style={[styles.cta, { backgroundColor: ui.brand }]}
                onPress={() => {
                  setAiResult(null);
                }}
                scaleTo={0.97}
                haptic
              >
                <ProDayText variant="caption" inverse>
                  Regénérer
                </ProDayText>
              </PressableSpring>
            </>
          )}
        </ScrollView>
      </View>
    );
  }

  if (view === 'exercise' && selected) {
    return (
      <View style={[styles.root, screenRootStyle]}>
        <ScreenHeader title={selected.title} onBack={() => setView(modeFilter === 'family' ? 'family' : 'home')} />
        <ScrollView contentContainerStyle={styles.pad}>
          <ProDayText variant="caption" accent>
            {HOME_EXERCISE_DIFFICULTY_LABELS[selected.difficulty]} · {selected.duration_min} min ·{' '}
            {selected.reps_label}
          </ProDayText>
          <ProDayText variant="body" style={styles.mt}>
            {selected.summary}
          </ProDayText>
          {selected.modes.map((m) => (
            <ProDaySurface key={m} variant="module" style={[styles.modeBanner, { borderColor: ui.border }]}>
              <ProDayText variant="caption" accent>
                {HOME_EXERCISE_MODE_LABELS[m]}
              </ProDayText>
            </ProDaySurface>
          ))}
          <ProDayText variant="section" style={styles.mt}>
            Matériel nécessaire
          </ProDayText>
          {selected.equipment.map((eq) => (
            <ProDayText key={eq} variant="caption" muted>
              · {eq}
            </ProDayText>
          ))}
          <ProDayText variant="section" style={styles.mt}>
            Consignes
          </ProDayText>
          {selected.instructions.map((step, i) => (
            <ProDayText key={step} variant="caption" style={styles.step}>
              {i + 1}. {step}
            </ProDayText>
          ))}
          {selected.tips.length > 0 ? (
            <>
              <ProDayText variant="section" style={styles.mt}>
                Important
              </ProDayText>
              {selected.tips.map((tip) => (
                <ProDayText key={tip} variant="caption" muted>
                  {tip}
                </ProDayText>
              ))}
            </>
          ) : null}
        </ScrollView>
      </View>
    );
  }

  if (view === 'home' || view === 'family') {
    return (
      <View style={[styles.root, screenRootStyle]}>
        <ScreenHeader
          title={view === 'family' ? 'Avec ma famille' : 'À la maison'}
          onBack={() => setView('hub')}
        />
        <ScrollView contentContainerStyle={styles.pad}>
          <TextInput
            style={[styles.input, { borderColor: ui.border, color: ui.text }]}
            placeholder="Chercher un exercice…"
            placeholderTextColor={ui.textMuted}
            value={query}
            onChangeText={setQuery}
          />
          {exercises.map((ex) => (
            <PressableSpring
              key={ex.id}
              style={[styles.card, { borderColor: ui.border, backgroundColor: ui.surface }]}
              onPress={() => {
                setSelected(ex);
                setView('exercise');
              }}
              scaleTo={0.98}
              haptic
            >
              <ProDayText variant="section">{ex.title}</ProDayText>
              <ProDayText variant="caption" muted>
                {ex.duration_min} min · {HOME_EXERCISE_DIFFICULTY_LABELS[ex.difficulty]} ·{' '}
                {ex.equipment.slice(0, 2).join(' · ')}
              </ProDayText>
              <ProDayText variant="caption" accent style={styles.mtXs}>
                {ex.modes.map((m) => HOME_EXERCISE_MODE_LABELS[m]).join(' · ')}
              </ProDayText>
            </PressableSpring>
          ))}
          {exercises.length === 0 ? (
            <ProDayText variant="caption" muted>
              Aucun exercice pour ces filtres.
            </ProDayText>
          ) : null}
        </ScrollView>
      </View>
    );
  }

  if (view === 'coach' || view === 'book' || bookingCoach) {
    return (
      <View style={[styles.root, screenRootStyle]}>
        <ScreenHeader
          title={bookingCoach ? 'Réserver' : 'Coach humain'}
          onBack={() => {
            if (bookingCoach) setBookingCoach(null);
            else setView('hub');
          }}
        />
        <ScrollView contentContainerStyle={styles.pad}>
          <ProDayText variant="caption" muted>
            Paiement à l’heure. Pas d’abonnement obligatoire. Tarif fixé par le coach.
          </ProDayText>

          {bookingCoach ? (
            <ProDaySurface variant="module" style={[styles.card, { borderColor: ui.brand }]}>
              <ProDayText variant="section">{bookingCoach.display_name}</ProDayText>
              <ProDayText variant="caption" muted>
                {bookingCoach.hourly_rate_eur} €/h · {bookingCoach.city}
                {bookingCoach.club_name ? ` · ${bookingCoach.club_name}` : ' · Indépendant'}
              </ProDayText>
              <ProDayText variant="caption" style={styles.mt}>
                Date (jj/mm/aaaa)
              </ProDayText>
              <TextInput
                style={[styles.input, { borderColor: ui.border, color: ui.text }]}
                value={dateStr}
                onChangeText={setDateStr}
                placeholder="12/09/2026"
                placeholderTextColor={ui.textMuted}
              />
              <ProDayText variant="caption" style={styles.mt}>
                Durée
              </ProDayText>
              <View style={styles.row}>
                {([30, 60, 90] as CoachSessionDurationMin[]).map((d) => (
                  <PressableSpring
                    key={d}
                    style={[
                      styles.chip,
                      duration === d && { backgroundColor: ui.brand },
                      { borderColor: ui.border },
                    ]}
                    onPress={() => setDuration(d)}
                    scaleTo={0.96}
                  >
                    <ProDayText
                      variant="caption"
                      inverse={duration === d}
                      style={duration !== d ? { color: ui.textSecondary } : undefined}
                    >
                      {d} min
                    </ProDayText>
                  </PressableSpring>
                ))}
              </View>
              <PressableSpring
                style={[styles.cta, { backgroundColor: ui.brand }]}
                onPress={() => void requestBooking()}
                disabled={submitting}
                scaleTo={0.97}
                haptic
              >
                {submitting ? (
                  <ActivityIndicator color={ui.brandInverse} />
                ) : (
                  <ProDayText variant="caption" inverse>
                    Demander la séance
                  </ProDayText>
                )}
              </PressableSpring>
            </ProDaySurface>
          ) : loadingCoaches ? (
            <ActivityIndicator color={ui.brand} style={styles.mt} />
          ) : (
            coaches.map((coach) => (
              <PressableSpring
                key={coach.coach_uid}
                style={[styles.card, { borderColor: ui.border, backgroundColor: ui.surface }]}
                onPress={() => setBookingCoach(coach)}
                scaleTo={0.98}
                haptic
              >
                <ProDayText variant="section">{coach.display_name}</ProDayText>
                <ProDayText variant="caption" muted>
                  {coach.hourly_rate_eur} €/h · {coach.city}
                  {coach.specialties.length ? ` · ${coach.specialties.slice(0, 2).join(', ')}` : ''}
                </ProDayText>
                {coach.bio ? (
                  <ProDayText variant="caption" numberOfLines={2} style={styles.mtXs}>
                    {coach.bio}
                  </ProDayText>
                ) : null}
              </PressableSpring>
            ))
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.root,
        joueurLive && joueurSession
          ? { backgroundColor: JOUEUR_SITE.bg }
          : screenRootStyle,
      ]}
    >
      <ScreenHeader
        title={
          joueurLive
            ? joueurSession!.ageGroup === 'youth'
              ? 'Entraîne-toi'
              : joueurSession!.ageGroup === 'teen'
                ? 'Train Hub'
                : 'Préparation'
            : 'Je veux m’entraîner'
        }
        onBack={onBack}
      />
      <ScrollView contentContainerStyle={styles.pad}>
        {joueurLive && joueurSession ? (
          <>
            <JoueurPageFrame identity={joueurSession.identity} showHero={false}>
              <JoueurUniverseWorld identity={joueurSession.identity} compact />
              <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
                <JoueurKpiRow
                  items={[
                    {
                      label:
                        joueurSession.ageGroup === 'youth'
                          ? 'Maison'
                          : joueurSession.ageGroup === 'teen'
                            ? 'XP'
                            : 'Forme',
                      value:
                        joueurSession.ageGroup === 'adult' ? 'Pro' : 'Go',
                      tone: joueurSession.identity.accent,
                    },
                    { label: 'IA', value: '3,99€' },
                    { label: 'Coach', value: `${JOUEUR_SITE.coachPriceEur}€` },
                  ]}
                />
                <JoueurSectionCard
                  kicker={
                    joueurSession.ageGroup === 'youth'
                      ? 'Mission'
                      : joueurSession.ageGroup === 'teen'
                        ? 'Session'
                        : 'Performance'
                  }
                  title={
                    joueurSession.ageGroup === 'youth'
                      ? 'Chez toi ou avec un coach'
                      : joueurSession.ageGroup === 'teen'
                        ? 'Maison · IA · Coach'
                        : 'Préparation match'
                  }
                  body={
                    joueurSession.ageGroup === 'youth'
                      ? 'Défis courts, famille, puis coach si tu veux.'
                      : 'ProDay accompagne le coach — pas le remplace.'
                  }
                >
                  <JoueurActionRow
                    primary={
                      joueurSession.ageGroup === 'youth'
                        ? 'Exercices maison'
                        : 'À la maison'
                    }
                    onPrimary={() => openLibrary('solo')}
                    secondary="Coach humain"
                    onSecondary={() => setView('coach')}
                  />
                </JoueurSectionCard>
                <JoueurSectionCard
                  kicker="Pass IA"
                  title="Assistant IA · 3,99 €/mois"
                  body="Programmes perso — pas un coach humain."
                >
                  <JoueurActionRow
                    primary="Programme IA"
                    onPrimary={() => setView('ai')}
                  />
                </JoueurSectionCard>
                <JoueurSectionCard
                  kicker="Coach"
                  title={`Séance · ~${JOUEUR_SITE.coachPriceEur} €/h`}
                  body="Demande → acceptation → paiement carte."
                >
                  <JoueurActionRow
                    primary="Réserver"
                    onPrimary={() => setView('book')}
                  />
                </JoueurSectionCard>
              </View>
            </JoueurPageFrame>
          </>
        ) : (
          <>
            <ImmersivePoleHero
              kicker="Entraînement"
              title="Chez toi ou avec un vrai coach."
              support="ProDay ne remplace pas le coach : il l’accompagne partout, même hors du stade."
              primaryLabel="Exercices à la maison"
              onPrimaryPress={() => openLibrary('solo')}
              secondaryLabel="Coach humain"
              onSecondaryPress={() => setView('coach')}
              mood="dynamic_competitive"
            />
            <ImmersiveStepStrip
              steps={['Maison / famille', 'Pass IA 3,99 €', 'Coach ~30 €/h', 'Match']}
            />
            <ProDaySurface variant="module" style={[styles.card, { borderColor: ui.border }]}>
              <ProDayText variant="section">Pass / assistant IA · 3,99 €/mois</ProDayText>
              <ProDayText variant="caption" muted>
                Programmes perso générés par l’IA. Pas un coach humain.
              </ProDayText>
            </ProDaySurface>
            <ProDaySurface variant="module" style={[styles.card, { borderColor: ui.border }]}>
              <ProDayText variant="section">Coach humain · ~30 €/h</ProDayText>
              <ProDayText variant="caption" muted>
                Séance à l’heure, tarif du coach. Demande → acceptation → paiement carte.
              </ProDayText>
              <PressableSpring
                style={[styles.cta, { backgroundColor: ui.brand, marginTop: spacing.sm }]}
                onPress={() => setView('book')}
                scaleTo={0.97}
                haptic
              >
                <ProDayText variant="caption" inverse>
                  Réserver une séance
                </ProDayText>
              </PressableSpring>
            </ProDaySurface>
          </>
        )}
        {myBookings.length > 0 ? (
          <ProDaySurface
            variant="module"
            style={[
              styles.card,
              {
                borderColor: joueurLive ? JOUEUR_SITE.border : ui.border,
                backgroundColor: joueurLive ? JOUEUR_SITE.surface : undefined,
              },
            ]}
          >
            <ProDayText
              variant="section"
              style={joueurLive ? { color: JOUEUR_SITE.foreground } : undefined}
            >
              Mes séances
            </ProDayText>
            {myBookings.slice(0, 6).map((b) => (
              <View key={b.id} style={{ gap: 4, marginTop: spacing.xs }}>
                <ProDayText
                  variant="caption"
                  style={{
                    fontWeight: '700',
                    color: joueurLive ? JOUEUR_SITE.foreground : undefined,
                  }}
                >
                  {b.coach_name} · {b.duration_min} min · {b.price_eur} €
                </ProDayText>
                <ProDayText
                  variant="caption"
                  muted={!joueurLive}
                  style={joueurLive ? { color: JOUEUR_SITE.muted } : undefined}
                >
                  {b.starts_at.toLocaleDateString('fr-FR')} · {b.status}
                </ProDayText>
                {b.status === 'accepted' ? (
                  <PressableSpring
                    style={[
                      styles.cta,
                      {
                        backgroundColor: joueurLive
                          ? joueurSession!.identity.accent
                          : ui.brand,
                      },
                    ]}
                    onPress={() => void payBooking(b.id)}
                    disabled={payingId === b.id}
                    scaleTo={0.97}
                    haptic
                  >
                    {payingId === b.id ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <ProDayText variant="caption" inverse>
                        Payer {b.price_eur} €
                      </ProDayText>
                    )}
                  </PressableSpring>
                ) : null}
              </View>
            ))}
          </ProDaySurface>
        ) : null}
        {HUB_ACTIONS.map((action) => (
          <PressableSpring
            key={action.id}
            style={[
              styles.hubCard,
              joueurLive
                ? {
                    borderColor: JOUEUR_SITE.border,
                    backgroundColor: JOUEUR_SITE.surface,
                    borderLeftWidth: 3,
                    borderLeftColor: joueurSession!.identity.accent,
                    borderRadius: joueurSession!.identity.radius,
                  }
                : { borderColor: ui.border, backgroundColor: ui.surface },
            ]}
            onPress={() => {
              if (action.id === 'home') openLibrary('solo');
              else if (action.id === 'family') openLibrary('family');
              else setView(action.id);
            }}
            scaleTo={0.98}
            haptic
          >
            <View
              style={[
                styles.iconWrap,
                {
                  backgroundColor: joueurLive
                    ? joueurSession!.identity.soft
                    : ui.accentSoft,
                },
              ]}
            >
              <Icon
                name={action.icon}
                size={22}
                color={joueurLive ? joueurSession!.identity.accent : ui.brand}
              />
            </View>
            <View style={styles.hubText}>
              <ProDayText
                variant="section"
                style={joueurLive ? { color: JOUEUR_SITE.foreground } : undefined}
              >
                {action.title}
              </ProDayText>
              <ProDayText
                variant="caption"
                muted={!joueurLive}
                style={joueurLive ? { color: JOUEUR_SITE.muted } : undefined}
              >
                {action.body}
              </ProDayText>
            </View>
          </PressableSpring>
        ))}
      </ScrollView>
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    pad: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxl },
    hubCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginTop: spacing.sm,
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    hubText: { flex: 1, gap: 2 },
    card: {
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginTop: spacing.sm,
      gap: 4,
    },
    input: {
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginBottom: spacing.sm,
    },
    modeBanner: {
      marginTop: spacing.sm,
      padding: spacing.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: radius.md,
    },
    mt: { marginTop: spacing.md },
    mtXs: { marginTop: spacing.xs },
    step: { marginTop: spacing.xs },
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
    chip: {
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    cta: {
      marginTop: spacing.lg,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    ctaGhost: {
      marginTop: spacing.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: radius.md,
      paddingVertical: spacing.sm,
      alignItems: 'center',
    },
  });
}
