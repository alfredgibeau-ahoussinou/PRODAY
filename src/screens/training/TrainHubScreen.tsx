import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { PressableSpring, PushScreenTransition } from '../../components/motion';
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
import { useJoueurTheme } from '../../hooks/useJoueurTheme';
import { useJoueurProgress } from '../../context/JoueurProgressContext';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { joueurGameReward } from '../../features/joueur/joueurSfx';
import { usePlayerThemeColors } from '../../context/PlayerThemeContext';
import {
  JoueurPageFrame,
  JoueurSectionCard,
  JoueurActionRow,
  JoueurKpiRow,
} from '../../components/player/joueurPortalUi';

import { JOUEUR_SITE } from '../../content/joueurPageIdentity';
import { PLAYER_DARK } from '../../theme/playerDarkPremium';
import { spacing, radius } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';
import { isFunctionsUnavailable } from '../../lib/firebaseFunctions';
import { aiTrainingService } from '../../services/aiTraining.service';
import { AiTrainingGeneratorView } from '../../components/training/AiTrainingGeneratorView';
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
  const joueurTheme = useJoueurTheme();
  const playerColors = usePlayerThemeColors();
  const joueurLive =
    Boolean(joueurSession?.isJoueurPlayer && joueurSession.ready && !joueurSession.needsGate);

  const jc = useMemo(() => {
    if (!joueurLive || !joueurSession) return null;
    const accent = joueurTheme.accent;
    return {
      background: PLAYER_DARK.bg,
      surface: PLAYER_DARK.surface,
      border: PLAYER_DARK.border,
      text: PLAYER_DARK.text,
      textSecondary: PLAYER_DARK.textMuted,
      textMuted: PLAYER_DARK.textDim,
      brand: accent,
      brandInverse: PLAYER_DARK.bg,
      accentSoft: playerColors.accentSoft,
    };
  }, [joueurLive, joueurSession, joueurTheme.accent, playerColors.accentSoft]);

  const ui = jc ?? c;
  const screenRootStyle = joueurLive ? { backgroundColor: PLAYER_DARK.bg } : rootStyle;

  const [view, setView] = useState<TrainHubView>(initialView);
  const enteredDirectRef = useRef(initialView !== 'hub');

  const exitSubView = () => {
    if (enteredDirectRef.current && view === initialView) {
      onBack();
      return;
    }
    setView('hub');
  };
  const [modeFilter, setModeFilter] = useState<HomeExerciseMode | undefined>();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<HomeExercise | null>(null);
  const [coaches, setCoaches] = useState<CoachHourlyProfile[]>([]);
  const [loadingCoaches, setLoadingCoaches] = useState(false);
  /** Service injoignable (ou Firebase non configuré) : aucun faux coach n'est inventé. */
  const [coachesUnavailable, setCoachesUnavailable] = useState(false);
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
  const progressApi = useJoueurProgress();
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerInitial, setTimerInitial] = useState(60);
  const [xpRewardEarned, setXpRewardEarned] = useState<number | null>(null);


  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((s) => {
          if (s <= 1) {
            setTimerRunning(false);
            prodayHaptics.confirm();
            void completeTrainingSession(selected?.duration_min ? selected.duration_min * 10 : 30);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerRunning, selected?.duration_min]);

  const startStopwatch = (durationSec = 60) => {
    setTimerInitial(durationSec);
    setTimerSeconds(durationSec);
    setTimerRunning(true);
    setXpRewardEarned(null);
    prodayHaptics.press();
  };

  const toggleStopwatch = () => {
    if (timerSeconds === 0) {
      startStopwatch(timerInitial);
    } else {
      setTimerRunning((r) => !r);
      prodayHaptics.press();
    }
  };

  const resetStopwatch = () => {
    setTimerRunning(false);
    setTimerSeconds(timerInitial);
    setXpRewardEarned(null);
  };

  const completeTrainingSession = async (xpGain = 30) => {
    setXpRewardEarned(xpGain);
    joueurGameReward('xp');
    if (progressApi) {
      await progressApi.grantXp(xpGain, 1);
    }
  };


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
      .then((rows: CoachHourlyProfile[]) => {
        setCoaches(rows);
        setCoachesUnavailable(false);
      })
      .catch(() => {
        setCoaches([]);
        setCoachesUnavailable(true);
      })
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
      const msg =
        e instanceof Error && e.message.trim()
          ? e.message
          : isFunctionsUnavailable(e)
            ? 'IA indisponible. Réessaie plus tard.'
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
      <PushScreenTransition active>
        <View style={{ flex: 1, backgroundColor: '#000000' }}>
          <AiTrainingGeneratorView
            onBack={() => {
              if (aiResult) {
                setAiResult(null);
              } else {
                exitSubView();
              }
            }}
            objective={aiObjective}
            onObjectiveChange={setAiObjective}
            duration={aiDuration}
            onDurationChange={setAiDuration}
            level={aiLevel}
            onLevelChange={setAiLevel}
            equipment={aiEquipment}
            onToggleEquipment={toggleEquipment}
            partner={aiPartner}
            onPartnerChange={setAiPartner}
            generating={aiGenerating}
            onGenerate={generateAiTraining}
            result={aiResult}
            onReset={() => setAiResult(null)}
          />
        </View>
      </PushScreenTransition>
    );
  }

  if (view === 'exercise' && selected) {
    return (
      <PushScreenTransition active>
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

          {/* Chronomètre Interactif & Feedback XP */}
          <ProDaySurface variant="module" style={[styles.timerCard, { borderColor: ui.border }]}>
            <View style={styles.timerHeader}>
              <Icon name="time" size={20} color={ui.brand} />
              <ProDayText variant="section" style={{ flex: 1 }}>
                Chronomètre d'entraînement
              </ProDayText>
              {xpRewardEarned ? (
                <View style={[styles.xpPill, { backgroundColor: ui.brand }]}>
                  <ProDayText variant="caption" inverse style={{ fontWeight: '900' }}>
                    +{xpRewardEarned} XP VALIDÉ
                  </ProDayText>
                </View>
              ) : null}
            </View>

            <View style={styles.timerDisplayWrap}>
              <ProDayText variant="hero" style={[styles.timerDigit, { color: timerRunning ? ui.brand : ui.text }]}>
                {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}
              </ProDayText>
              <ProDayText variant="caption" muted>
                {timerRunning ? 'Session en cours… donne tout !' : timerSeconds === 0 && xpRewardEarned ? 'Exercice accompli avec succès !' : 'Prêt à démarrer la séance ?'}
              </ProDayText>
            </View>

            <View style={styles.timerPresetsRow}>
              {[30, 60, 120, 300].map((sec) => (
                <PressableSpring
                  key={sec}
                  style={[
                    styles.timerPresetChip,
                    { borderColor: ui.border },
                    timerInitial === sec && { backgroundColor: `${ui.brand}22`, borderColor: ui.brand },
                  ]}
                  onPress={() => startStopwatch(sec)}
                  scaleTo={0.96}
                >
                  <ProDayText variant="caption" style={{ color: timerInitial === sec ? ui.brand : ui.textSecondary, fontWeight: '700' }}>
                    {sec < 60 ? `${sec}s` : `${sec / 60}m`}
                  </ProDayText>
                </PressableSpring>
              ))}
            </View>

            <View style={styles.timerControlsRow}>
              <PressableSpring
                style={[styles.timerMainBtn, { backgroundColor: ui.brand }]}
                onPress={toggleStopwatch}
                scaleTo={0.97}
                haptic
              >
                <Icon name={timerRunning ? 'time' : 'play'} size={18} color={ui.brandInverse} />
                <ProDayText variant="section" inverse style={styles.timerBtnText}>
                  {timerRunning ? 'Pause' : timerSeconds === 0 ? 'Démarrer' : 'Reprendre'}
                </ProDayText>
              </PressableSpring>

              <PressableSpring
                style={[styles.timerResetBtn, { borderColor: ui.border }]}
                onPress={resetStopwatch}
                scaleTo={0.97}
                haptic
              >
                <Icon name="time" size={16} color={ui.textSecondary} />
              </PressableSpring>

              <PressableSpring
                style={[styles.timerFinishBtn, { backgroundColor: `${ui.brand}22`, borderColor: ui.brand }]}
                onPress={() => void completeTrainingSession(selected.duration_min ? selected.duration_min * 10 : 30)}
                scaleTo={0.97}
                haptic
              >
                <Icon name="checkmark-circle" size={16} color={ui.brand} />
                <ProDayText variant="caption" style={{ color: ui.brand, fontWeight: '800' }}>
                  Valider XP
                </ProDayText>
              </PressableSpring>
            </View>
          </ProDaySurface>

        </ScrollView>
      </View>
      </PushScreenTransition>
    );
  }

  if (view === 'home' || view === 'family') {
    return (
      <PushScreenTransition active>
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
      </PushScreenTransition>
    );
  }

  if (view === 'coach' || view === 'book' || bookingCoach) {
    const teamColor = ui.brand || '#00E676';
    const filteredCoaches = coaches.filter((c) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        c.display_name.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.specialties.some((s) => s.toLowerCase().includes(q)) ||
        (c.bio?.toLowerCase().includes(q) ?? false)
      );
    });

    return (
      <PushScreenTransition active>
        <View style={[styles.root, { backgroundColor: '#000000' }]}>
          {/* Header Épuré OLED */}
          <View style={styles.coachHeader}>
            <PressableSpring
              onPress={() => {
                if (bookingCoach) setBookingCoach(null);
                else exitSubView();
              }}
              style={styles.backButton}
              scaleTo={0.92}
              haptic
            >
              <Icon name="arrow-back" size={22} color="#FFFFFF" />
            </PressableSpring>
            <View style={styles.coachHeaderTitleCol}>
              <ProDayText variant="title" style={styles.coachHeaderTitle}>
                {bookingCoach ? 'Réserver une séance' : 'Coachs Personnels'}
              </ProDayText>
              <ProDayText variant="caption" style={styles.coachHeaderSub}>
                {bookingCoach
                  ? bookingCoach.display_name
                  : 'Séances individuelles & perfectionnement'}
              </ProDayText>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.coachScrollPad} showsVerticalScrollIndicator={false}>
            {/* Info Banner */}
            {!bookingCoach ? (
              <View style={styles.infoBanner}>
                <View
                  style={[
                    styles.infoIconOrb,
                    { backgroundColor: `${teamColor}18`, borderColor: `${teamColor}35` },
                  ]}
                >
                  <Icon name="shield" size={18} color={teamColor} />
                </View>
                <View style={styles.infoTextCol}>
                  <ProDayText style={styles.infoTitle}>Coachs certifiés ProDay</ProDayText>
                  <ProDayText style={styles.infoDesc}>
                    Paiement à la séance sans engagement. Tarif transparent fixé par chaque coach.
                  </ProDayText>
                </View>
              </View>
            ) : null}

            {bookingCoach ? (
              <View style={styles.bookingCard}>
                <View style={styles.bookingCoachHeader}>
                  <View
                    style={[
                      styles.coachAvatar,
                      { backgroundColor: `${teamColor}18`, borderColor: `${teamColor}35` },
                    ]}
                  >
                    <ProDayText style={[styles.avatarInitials, { color: teamColor }]}>
                      {bookingCoach.display_name.charAt(0).toUpperCase()}
                    </ProDayText>
                  </View>
                  <View style={styles.bookingCoachInfo}>
                    <ProDayText style={styles.coachNameText}>
                      {bookingCoach.display_name}
                    </ProDayText>
                    <ProDayText style={styles.coachCityText}>
                      {bookingCoach.city} · {bookingCoach.club_name ?? 'Coach certifié'}
                    </ProDayText>
                  </View>
                  <View
                    style={[
                      styles.pricePill,
                      { backgroundColor: `${teamColor}18`, borderColor: `${teamColor}35` },
                    ]}
                  >
                    <ProDayText style={[styles.pricePillText, { color: teamColor }]}>
                      {bookingCoach.hourly_rate_eur} €/h
                    </ProDayText>
                  </View>
                </View>

                <View style={styles.bookingDivider} />

                <ProDayText style={styles.inputLabel}>Date souhaitée (JJ/MM/AAAA)</ProDayText>
                <TextInput
                  style={styles.darkInput}
                  value={dateStr}
                  onChangeText={setDateStr}
                  placeholder="Ex : 15/09/2026"
                  placeholderTextColor="#71717A"
                />

                <ProDayText style={[styles.inputLabel, { marginTop: 14 }]}>
                  Durée de la séance
                </ProDayText>
                <View style={styles.durationRow}>
                  {([30, 60, 90] as CoachSessionDurationMin[]).map((d) => (
                    <PressableSpring
                      key={d}
                      style={[
                        styles.durationChip,
                        duration === d && {
                          backgroundColor: teamColor,
                          borderColor: teamColor,
                        },
                      ]}
                      onPress={() => setDuration(d)}
                      scaleTo={0.96}
                      haptic
                    >
                      <ProDayText
                        style={[
                          styles.durationChipText,
                          duration === d && { color: '#000000', fontWeight: '900' },
                        ]}
                      >
                        {d} min
                      </ProDayText>
                    </PressableSpring>
                  ))}
                </View>

                <PressableSpring
                  style={[styles.confirmCta, { backgroundColor: teamColor }]}
                  onPress={() => void requestBooking()}
                  disabled={submitting}
                  scaleTo={0.97}
                  haptic
                >
                  {submitting ? (
                    <ActivityIndicator color="#000000" />
                  ) : (
                    <ProDayText style={styles.confirmCtaText}>
                      Envoyer la demande de réservation
                    </ProDayText>
                  )}
                </PressableSpring>
              </View>
            ) : (
              <>
                {/* Search Bar */}
                <View style={styles.coachSearchRow}>
                  <Icon name="search" size={16} color="#71717A" />
                  <TextInput
                    style={styles.coachSearchInput}
                    placeholder="Chercher par coach, ville ou spécialité..."
                    placeholderTextColor="#71717A"
                    value={query}
                    onChangeText={setQuery}
                  />
                  {query ? (
                    <PressableSpring onPress={() => setQuery('')} scaleTo={0.95}>
                      <Icon name="close" size={16} color="#71717A" />
                    </PressableSpring>
                  ) : null}
                </View>

                {loadingCoaches ? (
                  <ActivityIndicator color={teamColor} style={{ marginTop: 24 }} />
                ) : coachesUnavailable && filteredCoaches.length === 0 ? (
                  <View style={styles.emptyCoachesCard}>
                    <Icon name="alert-circle" size={24} color="#71717A" />
                    <ProDayText style={styles.emptyCoachesText}>
                      Annuaire des coachs indisponible. Vérifie ta connexion et réessaie.
                    </ProDayText>
                  </View>
                ) : filteredCoaches.length === 0 ? (
                  <View style={styles.emptyCoachesCard}>
                    <Icon name="search" size={24} color="#71717A" />
                    <ProDayText style={styles.emptyCoachesText}>
                      {query.trim()
                        ? 'Aucun coach disponible pour cette recherche.'
                        : 'Aucun coach n’a encore ouvert ses créneaux. Reviens bientôt.'}
                    </ProDayText>
                  </View>
                ) : (
                  filteredCoaches.map((coach) => (
                    <View key={coach.coach_uid} style={styles.coachItemCard}>
                      <View style={styles.coachCardTop}>
                        <View
                          style={[
                            styles.coachAvatar,
                            { backgroundColor: `${teamColor}18`, borderColor: `${teamColor}35` },
                          ]}
                        >
                          <ProDayText style={[styles.avatarInitials, { color: teamColor }]}>
                            {coach.display_name.charAt(0).toUpperCase()}
                          </ProDayText>
                        </View>
                        <View style={styles.coachMainMeta}>
                          <ProDayText style={styles.coachNameText}>
                            {coach.display_name}
                          </ProDayText>
                          <View style={styles.coachCityRow}>
                            <Icon name="location" size={12} color="#8B8B9A" />
                            <ProDayText style={styles.coachCityText}>
                              {coach.city}
                              {coach.club_name ? ` · ${coach.club_name}` : ''}
                            </ProDayText>
                          </View>
                        </View>
                        <View
                          style={[
                            styles.pricePill,
                            { backgroundColor: `${teamColor}18`, borderColor: `${teamColor}35` },
                          ]}
                        >
                          <ProDayText style={[styles.pricePillText, { color: teamColor }]}>
                            {coach.hourly_rate_eur} €/h
                          </ProDayText>
                        </View>
                      </View>

                      {coach.specialties.length > 0 ? (
                        <View style={styles.specialtiesRow}>
                          {coach.specialties.map((spec) => (
                            <View key={spec} style={styles.specialtyChip}>
                              <ProDayText style={styles.specialtyText}>{spec}</ProDayText>
                            </View>
                          ))}
                        </View>
                      ) : null}

                      {coach.bio ? (
                        <ProDayText style={styles.coachBioText} numberOfLines={2}>
                          {coach.bio}
                        </ProDayText>
                      ) : null}

                      <PressableSpring
                        style={[styles.bookCta, { backgroundColor: teamColor }]}
                        onPress={() => setBookingCoach(coach)}
                        scaleTo={0.97}
                        haptic
                      >
                        <Icon name="calendar" size={15} color="#000000" />
                        <ProDayText style={styles.bookCtaText}>
                          Réserver une séance
                        </ProDayText>
                      </PressableSpring>
                    </View>
                  ))
                )}
              </>
            )}
          </ScrollView>
        </View>
      </PushScreenTransition>
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
              <View style={{ gap: spacing.md }}>
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
                      tone: joueurTheme.accent,
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
                          ? joueurTheme.accent
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
                    borderLeftColor: joueurTheme.accent,
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
                color={joueurLive ? joueurTheme.accent : ui.brand}
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
    timerCard: {
      marginTop: spacing.lg,
      borderWidth: 1.5,
      borderRadius: radius.xl,
      padding: spacing.md,
      gap: spacing.md,
    },
    timerHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    xpPill: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.pill,
    },
    timerDisplayWrap: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.md,
      gap: 4,
    },
    timerDigit: {
      fontSize: 48,
      fontWeight: '900',
      letterSpacing: 2,
    },
    timerPresetsRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacing.sm,
    },
    timerPresetChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: 6,
      borderRadius: radius.pill,
      borderWidth: 1,
    },
    timerControlsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    timerMainBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      paddingVertical: 12,
      borderRadius: radius.pill,
    },
    timerBtnText: {
      fontWeight: '900',
      letterSpacing: 0.5,
    },
    timerResetBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    timerFinishBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
      borderRadius: radius.pill,
      borderWidth: 1,
    },
    // Styles pour la vue Coach Humain / Réservation (OLED Elite)
    coachHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 16,
      gap: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#1A1A22',
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.borderStrong,
      alignItems: 'center',
      justifyContent: 'center',
    },
    coachHeaderTitleCol: {
      flex: 1,
    },
    coachHeaderTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: '#FFFFFF',
      letterSpacing: -0.3,
    },
    coachHeaderSub: {
      fontSize: 12,
      color: '#8B8B9A',
      marginTop: 2,
    },
    coachScrollPad: {
      padding: 16,
      paddingBottom: 40,
    },
    infoBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.borderStrong,
      padding: 14,
      marginBottom: 16,
      gap: 12,
    },
    infoIconOrb: {
      width: 38,
      height: 38,
      borderRadius: 12,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    infoTextCol: {
      flex: 1,
    },
    infoTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    infoDesc: {
      fontSize: 11,
      color: '#8B8B9A',
      marginTop: 2,
      lineHeight: 15,
    },
    coachSearchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.borderStrong,
      paddingHorizontal: 14,
      height: 46,
      gap: 10,
      marginBottom: 16,
    },
    coachSearchInput: {
      flex: 1,
      fontSize: 13,
      color: '#FFFFFF',
    },
    emptyCoachesCard: {
      backgroundColor: c.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.borderStrong,
      padding: 24,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 12,
    },
    emptyCoachesText: {
      fontSize: 13,
      color: '#8B8B9A',
      textAlign: 'center',
    },
    coachItemCard: {
      backgroundColor: c.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: c.borderStrong,
      padding: 16,
      marginBottom: 14,
    },
    coachCardTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    coachAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 1.5,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarInitials: {
      fontSize: 18,
      fontWeight: '900',
    },
    coachMainMeta: {
      flex: 1,
    },
    coachNameText: {
      fontSize: 15,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    coachCityRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 2,
    },
    coachCityText: {
      fontSize: 12,
      color: '#8B8B9A',
    },
    pricePill: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 10,
      borderWidth: 1,
    },
    pricePillText: {
      fontSize: 12,
      fontWeight: '800',
    },
    specialtiesRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 12,
    },
    specialtyChip: {
      backgroundColor: c.surfaceMuted,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#2A2A3A',
    },
    specialtyText: {
      fontSize: 11,
      fontWeight: '600',
      color: '#D4D4D8',
    },
    coachBioText: {
      fontSize: 12,
      color: '#8B8B9A',
      marginTop: 10,
      lineHeight: 17,
    },
    bookCta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderRadius: 12,
      paddingVertical: 12,
      marginTop: 14,
    },
    bookCtaText: {
      fontSize: 13,
      fontWeight: '800',
      color: '#000000',
    },
    bookingCard: {
      backgroundColor: c.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: c.borderStrong,
      padding: 18,
    },
    bookingCoachHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    bookingCoachInfo: {
      flex: 1,
    },
    bookingDivider: {
      height: 1,
      backgroundColor: c.borderStrong,
      marginVertical: 16,
    },
    inputLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: '#D4D4D8',
      marginBottom: 8,
    },
    darkInput: {
      backgroundColor: '#0D0D12',
      borderWidth: 1,
      borderColor: c.borderStrong,
      borderRadius: 12,
      paddingHorizontal: 14,
      height: 46,
      fontSize: 13,
      color: '#FFFFFF',
    },
    durationRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 20,
    },
    durationChip: {
      flex: 1,
      backgroundColor: '#0D0D12',
      borderWidth: 1,
      borderColor: c.borderStrong,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    durationChipText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#D4D4D8',
    },
    confirmCta: {
      height: 48,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    confirmCtaText: {
      fontSize: 14,
      fontWeight: '900',
      color: '#000000',
    },
  });
}

