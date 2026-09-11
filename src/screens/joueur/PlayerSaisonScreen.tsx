import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';

import { useSessionProfile } from '../../hooks/useSessionProfile';
import { useJoueurProgress } from '../../context/JoueurProgressContext';
import { usePlayerTheme, usePlayerThemeColors } from '../../context/PlayerThemeContext';
import { usePlayerHubData } from '../../hooks/usePlayerHubData';
import { useJoueurSession } from '../../context/JoueurSessionContext';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import { clubsService } from '../../services/clubs.service';
import { playerActivityService } from '../../services/playerActivity.service';
import { sendPlayerCoachMessage } from '../../services/playerCoachAi.service';
import type { Club } from '../../models/Club';
import { PressableSpring } from '../../components/motion';
import { ProDayText } from '../../components/ui/ProDayText';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { utcDateKey } from '../../utils/joueurUniverseProgress';
import { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';
import { resolveJoueurAgeGroup } from '../../utils/joueurExperienceTheme';
import { JOUEUR_SEASON_OBJECTIVES, getJoueurDailyQuests } from '../../features/joueur/constants';
import {
  ChalkboardPitchWatermark,
  CrestWatermark,
  EnergyBatteryIcon,
  SleepMoonIcon,
  MuscleFiberIcon,
  HydrationNutritionIcon,
  MobilityStretchIcon,
  VisualizationBrainIcon,
} from './PlayerSaisonIcons';

type SaisonSegment = 'forme' | 'objectifs';

const CHECKIN_STORAGE_PREFIX = 'proday_saison_checkin_';
const ROUTINES_STORAGE_PREFIX = 'proday_saison_routines_';

export function PlayerSaisonScreen() {
  const insets = useSafeAreaInsets();
  const profile = useSessionProfile();
  const session = useJoueurSession();
  const progressApi = useJoueurProgress();
  const playerTheme = usePlayerTheme();
  const hub = usePlayerHubData(profile);
  const nav = useTabNavigationActions();

  const [segment, setSegment] = useState<SaisonSegment>('forme');
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Club et couleurs de l'équipe
  const [club, setClub] = useState<Club | null>(null);
  const clubId = profile?.profile?.club_id;

  const loadClub = useCallback(async () => {
    if (clubId) {
      try {
        const c = await clubsService.getById(clubId);
        if (c) setClub(c);
      } catch {
        // Silencieux
      }
    }
  }, [clubId]);

  useEffect(() => {
    void loadClub();
  }, [loadClub]);

  // Détermination des couleurs de l'équipe et du pôle
  const playerThemeColors = usePlayerThemeColors();
  const teamPrimary = playerThemeColors.accent;
  const teamSecondary = playerThemeColors.accentAlt || playerThemeColors.accent;
  const teamGradient: [string, string] = [teamPrimary, teamSecondary];

  // Nom et logo du club
  const teamName = club?.name?.trim() || playerTheme.clubName || 'FC ProDay Démo';
  const clubLogoUrl = club?.logo_url?.trim() || null;

  // Données joueur
  const displayName = profile?.display_name || 'Lucas Démo';
  const position = profile?.profile?.position || 'Attaquant';
  const firstName = displayName.split(' ')[0] || 'Joueur';
  const levelNumber = progressApi?.level?.level ?? 5;
  const ovrScore = progressApi?.ovr ?? 63;
  const progress01 = progressApi?.level?.progress01 ?? 0.72;
  const xpIntoLevel = progressApi?.level?.xpIntoLevel ?? 80;
  const xpForNext = progressApi?.level?.xpForNext ?? 100;
  const streak = progressApi?.progress?.streakDays ?? 0;
  const activitiesCount = hub.activities.length;

  // Forme : Énergie, Sommeil, Muscles
  // Énergie: 0 = Plein (3 crans), 1 = Bon (2 crans), 2 = Faible (1 cran)
  const [energyLevel, setEnergyLevel] = useState<number>(0);
  // Sommeil: 0 = 8h+ (3 crans), 1 = 6-7h (2 crans), 2 = <6h (1 cran)
  const [sleepLevel, setSleepLevel] = useState<number>(0);
  // Muscles: 0 = Frais (1 cran), 1 = Courbatures (2 crans), 2 = Gêne (3 crans)
  const [muscleLevel, setMuscleLevel] = useState<number>(0);
  const [isValidatedToday, setIsValidatedToday] = useState<boolean>(false);

  // Préparateur physique & État de forme
  const [aiBriefing, setAiBriefing] = useState<string | null>(null);
  const [loadingAiBriefing, setLoadingAiBriefing] = useState<boolean>(true);
  const [promptInput, setPromptInput] = useState<string>('');

  // Routines de préparation physique
  const [routines, setRoutines] = useState({
    hydration: true,
    mobility: false,
    visualization: false,
  });

  const todayKey = useMemo(() => utcDateKey(), []);

  // Calcul du score de Readiness / Fraîcheur athlétique (0 à 100%)
  const aiReadinessScore = useMemo(() => {
    let score = 100;
    if (energyLevel === 1) score -= 12;
    if (energyLevel === 2) score -= 30;
    if (sleepLevel === 1) score -= 10;
    if (sleepLevel === 2) score -= 25;
    if (muscleLevel === 1) score -= 10;
    if (muscleLevel === 2) score -= 28;
    if (routines.hydration) score += 3;
    if (routines.mobility) score += 5;
    if (routines.visualization) score += 4;
    return Math.max(35, Math.min(99, score));
  }, [energyLevel, sleepLevel, muscleLevel, routines]);

  // Briefing athlétique quotidien automatique
  useEffect(() => {
    let active = true;
    async function fetchAiBriefing() {
      try {
        setLoadingAiBriefing(true);
        const prompt = `En tant que préparateur physique de football ProDay, donne un diagnostic de forme athlétique et un conseil court (2 phrases directes max) pour ${firstName} (${position}). État : Énergie ${energyLevel === 0 ? 'Pleine' : energyLevel === 1 ? 'Moyenne' : 'Basse'}, Muscles ${muscleLevel === 0 ? 'Frais' : muscleLevel === 1 ? 'Courbatures' : 'Gêne musculaire'}. Readiness : ${aiReadinessScore}%.`;
        const res = await sendPlayerCoachMessage(
          [{ role: 'user', content: prompt }],
          { playerName: firstName, position, clubName: teamName }
        );
        if (active && res.reply) {
          setAiBriefing(res.reply.replace(/[-*•]/g, '').trim());
        }
      } catch {
        if (active) {
          if (aiReadinessScore >= 85) {
            setAiBriefing(`Forme Optimale (${aiReadinessScore}%) : Ton moteur est prêt pour un entraînement haute intensité. Travaille tes appuis et tes changements de rythme.`);
          } else if (aiReadinessScore >= 65) {
            setAiBriefing(`Forme Modérée (${aiReadinessScore}%) : Privilégie la mobilité et la précision technique pour préserver ton influx avant le prochain match.`);
          } else {
            setAiBriefing(`Alerte Récupération (${aiReadinessScore}%) : Fatigue musculaire détectée. Recommandation : 15 min d'étirements et une hydratation renforcée.`);
          }
        }
      } finally {
        if (active) setLoadingAiBriefing(false);
      }
    }
    void fetchAiBriefing();
    return () => {
      active = false;
    };
  }, [firstName, position, teamName, energyLevel, sleepLevel, muscleLevel, aiReadinessScore]);

  // Quêtes journalières adaptées
  const ageGroup = useMemo(
    () =>
      session?.ageGroup ??
      resolveJoueurAgeGroup({
        age: profile?.profile?.age,
        birthDate: profile?.profile?.birth_date,
        gender: profile?.profile?.gender,
      }),
    [session?.ageGroup, profile],
  );

  const dailyQuests = useMemo(() => {
    const band = ageGroup === 'youth' ? 'youth' : ageGroup === 'teen' ? 'teen' : 'adult';
    const baseQuests = getJoueurDailyQuests(band);

    const checkinQuest = {
      id: 'daily-checkin',
      title: 'Bilan de forme',
      body: 'Valide ton état athlétique du jour (+10 XP)',
      xp: 10,
      stars: 1,
      tabHint: 'forme' as const,
    };

    return [checkinQuest, ...baseQuests.filter((q) => q.id !== 'daily-checkin')];
  }, [ageGroup]);

  const dailyDone = useMemo(
    () => new Set(progressApi?.progress?.dailyCompletedIds ?? []),
    [progressApi?.progress?.dailyCompletedIds],
  );
  const seasonDone = useMemo(
    () => new Set(progressApi?.progress?.completedChallengeIds ?? []),
    [progressApi?.progress?.completedChallengeIds],
  );

  // Chargement état sauvegardé
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        let loadedFromLocal = false;
        const checkinRaw = await AsyncStorage.getItem(`${CHECKIN_STORAGE_PREFIX}${todayKey}`);
        if (checkinRaw && mounted) {
          const data = JSON.parse(checkinRaw);
          if (typeof data.energy === 'number') setEnergyLevel(data.energy);
          if (typeof data.sleep === 'number') setSleepLevel(data.sleep);
          if (typeof data.muscles === 'number') setMuscleLevel(data.muscles);
          setIsValidatedToday(Boolean(data.validated));
          loadedFromLocal = true;
        }

        if (!loadedFromLocal && profile?.uid) {
          const cloudCheckin = await playerActivityService.getLatestDailyCheckin(profile.uid, todayKey);
          if (cloudCheckin && mounted) {
            setEnergyLevel(cloudCheckin.energyLevel);
            setSleepLevel(cloudCheckin.sleepLevel);
            setMuscleLevel(cloudCheckin.muscleLevel);
            setIsValidatedToday(true);
            if (cloudCheckin.routines) {
              setRoutines((prev) => ({ ...prev, ...cloudCheckin.routines }));
            }
          }
        }

        const routinesRaw = await AsyncStorage.getItem(`${ROUTINES_STORAGE_PREFIX}${todayKey}`);
        if (routinesRaw && mounted) {
          const r = JSON.parse(routinesRaw);
          setRoutines((prev) => ({ ...prev, ...r }));
        }
      } catch {
        // Silencieux
      }
    })();
    return () => {
      mounted = false;
    };
  }, [todayKey, profile?.uid]);

  // Donut niveau
  const donutSize = 62;
  const donutStroke = 3.5;
  const donutRadius = (donutSize - donutStroke) / 2;
  const donutCircumference = 2 * Math.PI * donutRadius;
  const donutDashoffset = donutCircumference * (1 - Math.max(0.15, Math.min(0.95, progress01)));

  // Avatar source avec fallback
  const avatarSource = useMemo(() => {
    if (profile?.avatar_url) {
      return { uri: profile.avatar_url };
    }
    return require('../../../assets/branding/demo-player-avatar.png');
  }, [profile?.avatar_url]);

  // Pull-to-refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([hub.refresh(), progressApi?.refresh?.(), loadClub()]);
    } finally {
      setRefreshing(false);
    }
  }, [hub, progressApi, loadClub]);

  // Validation formulaire bilan de forme
  const handleValidateCheckin = useCallback(async () => {
    prodayHaptics.confirm();
    const wasAlready = isValidatedToday;
    setIsValidatedToday(true);

    try {
      await AsyncStorage.setItem(
        `${CHECKIN_STORAGE_PREFIX}${todayKey}`,
        JSON.stringify({
          energy: energyLevel,
          sleep: sleepLevel,
          muscles: muscleLevel,
          validated: true,
          validatedAt: new Date().toISOString(),
        }),
      );

      if (profile?.uid) {
        await playerActivityService.recordDailyCheckin(profile.uid, {
          dateKey: todayKey,
          energyLevel,
          sleepLevel,
          muscleLevel,
          routines,
        });
      }

      if (!wasAlready && progressApi?.grantXp) {
        await progressApi.grantXp(10);
        Alert.alert(
          'Bilan de forme validé !',
          `Ton état de fraîcheur a été enregistré (Indice de forme ${aiReadinessScore}%). +10 XP crédités à ta saison !`,
        );
      } else {
        Alert.alert(
          'Bilan actualisé',
          `Tes ressentis physiques ont été mis à jour (Indice de forme : ${aiReadinessScore}%).`,
        );
      }
    } catch {
      // Ignorer
    }
  }, [todayKey, energyLevel, sleepLevel, muscleLevel, routines, profile?.uid, progressApi, isValidatedToday, aiReadinessScore]);

  // Bascule routine de préparation
  const toggleRoutine = useCallback(
    async (key: 'mobility' | 'visualization' | 'hydration') => {
      prodayHaptics.press();
      const willBeActive = !routines[key];
      const next = { ...routines, [key]: willBeActive };
      setRoutines(next);
      try {
        await AsyncStorage.setItem(`${ROUTINES_STORAGE_PREFIX}${todayKey}`, JSON.stringify(next));
      } catch {
        // Silencieux
      }
      if (willBeActive && progressApi?.grantXp) {
        try {
          await progressApi.grantXp(5);
          prodayHaptics.confirm();
        } catch {
          // Silencieux
        }
      }
    },
    [routines, todayKey, progressApi],
  );

  // Demande directe au Préparateur
  const handleAskAiCoach = useCallback(
    (customPrompt?: string) => {
      const q = (customPrompt || promptInput).trim();
      if (!q) return;
      prodayHaptics.press();
      setPromptInput('');
      nav.setActiveTab('profil');
      Alert.alert(
        'Préparateur ProDay',
        `Question transmise à ton préparateur athlétique : "${q}"\n\nConsulte ton profil joueur pour le suivi complet.`,
      );
    },
    [promptInput, nav],
  );

  // Réclamer une quête journalière
  const handleClaimQuest = useCallback(
    async (questId: string, xp: number, stars = 1) => {
      prodayHaptics.confirm();
      if (progressApi?.claimDaily) {
        await progressApi.claimDaily(questId, xp, stars);
        Alert.alert('Quête accomplie !', `+${xp} XP et ${stars} étoile(s) ajoutés à votre saison.`);
      }
    },
    [progressApi],
  );

  // Réclamer un défi de saison
  const handleClaimChallenge = useCallback(
    async (challengeId: string, starsGain = 2, xpGain = 60) => {
      prodayHaptics.confirm();
      if (progressApi?.claimChallenge) {
        await progressApi.claimChallenge(challengeId, starsGain);
        if (progressApi.grantXp) {
          await progressApi.grantXp(xpGain);
        }
        Alert.alert('Défi Majeur Réussi !', `+${xpGain} XP et ${starsGain} étoile(s) crédités !`);
      }
    },
    [progressApi],
  );

  return (
    <View style={[styles.screen, { paddingTop: 6 }]}>
      {/* GRAND BLASON EN ARRIÈRE-PLAN */}
      <View style={styles.backgroundTeamWatermark} pointerEvents="none">
        {clubLogoUrl ? (
          <Image
            source={{ uri: clubLogoUrl }}
            style={styles.backgroundClubImage}
            resizeMode="contain"
          />
        ) : (
          <CrestWatermark
            width={280}
            height={330}
            color={teamPrimary}
            opacity={0.12}
          />
        )}
      </View>

      {/* 1. HERO HEADER IDENTITÉ JOUEUR & ÉQUIPE */}
      <View style={styles.heroWrap}>
        <View style={styles.watermarkLeft} pointerEvents="none">
          <ChalkboardPitchWatermark width={210} height={145} />
        </View>

        <PressableSpring
          onPress={() => {
            prodayHaptics.press();
            Alert.alert(teamName, 'Club officiel ProDay · Saison 2026');
          }}
          style={styles.watermarkRight}
        >
          {clubLogoUrl ? (
            <Image
              source={{ uri: clubLogoUrl }}
              style={styles.heroClubLogo}
              resizeMode="contain"
            />
          ) : (
            <CrestWatermark width={92} height={110} color={teamPrimary} opacity={0.3} />
          )}
        </PressableSpring>

        <View style={styles.heroContent}>
          {/* Avatar joueur circulaire */}
          <PressableSpring
            onPress={() => {
              prodayHaptics.press();
              nav.setActiveTab('profil');
            }}
            scaleTo={0.94}
            style={[styles.avatarHolder, { borderColor: teamPrimary }]}
          >
            <Image source={avatarSource} style={styles.avatarImage} resizeMode="cover" />
          </PressableSpring>

          {/* Nom moderne sans-serif & Métriques */}
          <View style={styles.heroMeta}>
            <ProDayText variant="title" style={styles.playerName} numberOfLines={1}>
              {displayName}
            </ProDayText>

            <View style={styles.heroStatsRow}>
              {/* Jauge donut niveau */}
              <PressableSpring
                onPress={() => {
                  prodayHaptics.press();
                  Alert.alert(
                    `Niveau ${levelNumber}`,
                    `${xpIntoLevel} / ${xpForNext} XP accumulés vers le niveau ${levelNumber + 1}.`,
                  );
                }}
                style={styles.donutContainer}
              >
                <Svg width={donutSize} height={donutSize}>
                  <Circle
                    cx={donutSize / 2}
                    cy={donutSize / 2}
                    r={donutRadius}
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth={donutStroke}
                    fill="#14141A"
                  />
                  <Circle
                    cx={donutSize / 2}
                    cy={donutSize / 2}
                    r={donutRadius}
                    stroke={teamPrimary}
                    strokeWidth={donutStroke}
                    fill="none"
                    strokeDasharray={`${donutCircumference} ${donutCircumference}`}
                    strokeDashoffset={donutDashoffset}
                    strokeLinecap="round"
                    rotation="-90"
                    origin={`${donutSize / 2}, ${donutSize / 2}`}
                  />
                </Svg>
                <View style={styles.donutTextWrap} pointerEvents="none">
                  <ProDayText style={styles.donutLevelLabel}>{`Niv. ${levelNumber}`}</ProDayText>
                </View>
              </PressableSpring>

              {/* Note globale OVR */}
              <PressableSpring
                onPress={() => {
                  prodayHaptics.press();
                  Alert.alert(
                    `Note Globale ${ovrScore}/99`,
                    'Votre OVR évolue selon vos résultats, votre assiduité et vos diagnostics IA.',
                  );
                }}
                style={styles.ovrContainer}
              >
                <ProDayText style={[styles.ovrScore, { color: teamPrimary }]}>{ovrScore}</ProDayText>
                <ProDayText style={styles.ovrMax}>/99</ProDayText>
              </PressableSpring>
            </View>
          </View>
        </View>
      </View>

      {/* 2. CAPSULE SÉLECTEUR D'ONGLETS AUX COULEURS DE L'ÉQUIPE */}
      <View style={styles.tabCapsuleShell}>
        <PressableSpring
          onPress={() => {
            prodayHaptics.tabSwitch();
            setSegment('forme');
          }}
          scaleTo={0.97}
          style={styles.tabButton}
        >
          {segment === 'forme' ? (
            <LinearGradient
              colors={teamGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.tabButtonActiveGradient}
            >
              <ProDayText style={styles.tabTextActive}>Ma forme</ProDayText>
            </LinearGradient>
          ) : (
            <View style={styles.tabButtonInactive}>
              <ProDayText style={styles.tabTextInactive}>Ma forme</ProDayText>
            </View>
          )}
        </PressableSpring>

        <PressableSpring
          onPress={() => {
            prodayHaptics.tabSwitch();
            setSegment('objectifs');
          }}
          scaleTo={0.97}
          style={styles.tabButton}
        >
          {segment === 'objectifs' ? (
            <LinearGradient
              colors={teamGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.tabButtonActiveGradient}
            >
              <ProDayText style={styles.tabTextActive}>Mes objectifs</ProDayText>
            </LinearGradient>
          ) : (
            <View style={styles.tabButtonInactive}>
              <ProDayText style={styles.tabTextInactive}>Mes objectifs</ProDayText>
            </View>
          )}
        </PressableSpring>
      </View>

      {/* 3. CONTENU PRINCIPAL */}
      {segment === 'forme' ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: TAB_BAR_CONTENT_INSET + 36 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={teamPrimary}
              colors={[teamPrimary]}
            />
          }
        >
          {/* CARTE 1 : BILAN DE FORME & DIAGNOSTIC ATHLÉTIQUE */}
          <View style={styles.cardShell}>
            <View style={styles.copilotHeaderRow}>
              <View style={[styles.copilotBadge, { backgroundColor: `${teamPrimary}18`, borderColor: `${teamPrimary}40` }]}>
                <Ionicons name="pulse" size={13} color={teamPrimary} />
                <ProDayText style={[styles.copilotBadgeText, { color: teamPrimary }]}>
                  BILAN ATHLÉTIQUE PRODAY
                </ProDayText>
              </View>

              <View style={[styles.readinessPill, { backgroundColor: `${teamPrimary}20`, borderColor: `${teamPrimary}55` }]}>
                <Ionicons name="fitness" size={13} color={teamPrimary} />
                <ProDayText style={[styles.readinessScoreText, { color: teamPrimary }]}>
                  {`Forme ${aiReadinessScore}%`}
                </ProDayText>
              </View>
            </View>

            {/* Briefing dynamique de préparation */}
            <View style={styles.aiBriefingContainer}>
              <ProDayText style={styles.aiBriefingText}>
                {loadingAiBriefing
                  ? "Analyse de ton calendrier de match et de tes indicateurs athlétiques..."
                  : aiBriefing}
              </ProDayText>
            </View>

            {/* Actions Rapides de Préparation */}
            <View style={styles.quickAiActionsRow}>
              <PressableSpring
                onPress={() => handleAskAiCoach('Comment optimiser ma récupération musculaire avant le match ?')}
                scaleTo={0.96}
                haptic
                style={[styles.quickAiActionChip, { borderColor: `${teamPrimary}33`, backgroundColor: `${teamPrimary}10` }]}
              >
                <Ionicons name="flash-outline" size={12} color={teamPrimary} />
                <ProDayText style={[styles.quickAiActionText, { color: teamPrimary }]}>
                  Récupération
                </ProDayText>
              </PressableSpring>

              <PressableSpring
                onPress={() => handleAskAiCoach('Quelle alimentation et hydratation privilégier aujourd’hui ?')}
                scaleTo={0.96}
                haptic
                style={[styles.quickAiActionChip, { borderColor: `${teamPrimary}33`, backgroundColor: `${teamPrimary}10` }]}
              >
                <Ionicons name="nutrition-outline" size={12} color={teamPrimary} />
                <ProDayText style={[styles.quickAiActionText, { color: teamPrimary }]}>
                  Nutrition
                </ProDayText>
              </PressableSpring>

              <PressableSpring
                onPress={() => handleAskAiCoach('Donne-moi 3 exercices d’appuis rapides adaptés à mon poste')}
                scaleTo={0.96}
                haptic
                style={[styles.quickAiActionChip, { borderColor: `${teamPrimary}33`, backgroundColor: `${teamPrimary}10` }]}
              >
                <Ionicons name="football-outline" size={12} color={teamPrimary} />
                <ProDayText style={[styles.quickAiActionText, { color: teamPrimary }]}>
                  Séance poste
                </ProDayText>
              </PressableSpring>
            </View>
          </View>

          {/* CARTE 2 : AUTO-ÉVALUATION QUOTIDIENNE */}
          <View style={styles.cardShell}>
            <View style={styles.cardHeaderWithKicker}>
              <ProDayText style={[styles.kicker, { color: teamPrimary }]}>BILAN PHYSIOLOGIQUE</ProDayText>
              <ProDayText style={styles.cardTitle}>Auto-Évaluation Quotidienne</ProDayText>
            </View>

            <View style={styles.metricsRow}>
              {/* COLONNE ÉNERGIE */}
              <View style={styles.metricCol}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    prodayHaptics.press();
                    setEnergyLevel((prev) => (prev + 1) % 3);
                  }}
                  style={styles.metricHeaderPressable}
                >
                  <View style={[styles.iconCircle, { borderColor: `${teamPrimary}40`, backgroundColor: `${teamPrimary}14` }]}>
                    <EnergyBatteryIcon size={32} color={teamPrimary} activeCrans={3 - energyLevel} />
                  </View>
                  <ProDayText style={styles.metricName}>Énergie</ProDayText>
                  <View style={[styles.currentValuePill, { backgroundColor: `${teamPrimary}22` }]}>
                    <ProDayText style={[styles.currentValueText, { color: teamPrimary }]}>
                      {energyLevel === 0 ? 'Plein' : energyLevel === 1 ? 'Bon' : 'Faible'}
                    </ProDayText>
                  </View>
                </TouchableOpacity>

                {/* 3 SEGMENTS PILL */}
                <View style={styles.segmentedPillTrack}>
                  {[0, 1, 2].map((idx) => {
                    const isActive = idx < 3 - energyLevel;
                    return (
                      <TouchableOpacity
                        key={`energy-${idx}`}
                        activeOpacity={0.7}
                        onPress={() => {
                          prodayHaptics.press();
                          setEnergyLevel(idx);
                        }}
                        style={[
                          styles.segmentPillItem,
                          isActive
                            ? [styles.segmentPillActive, { backgroundColor: teamPrimary }]
                            : styles.segmentPillInactive,
                        ]}
                      />
                    );
                  })}
                </View>

                <View style={styles.metricLabelsRow}>
                  {[
                    { level: 0, label: 'Plein' },
                    { level: 1, label: 'Bon' },
                    { level: 2, label: 'Faible' },
                  ].map((item) => (
                    <TouchableOpacity
                      key={`energy-lbl-${item.level}`}
                      activeOpacity={0.7}
                      onPress={() => {
                        prodayHaptics.press();
                        setEnergyLevel(item.level);
                      }}
                      style={styles.stepLabelPill}
                    >
                      <ProDayText
                        style={[
                          styles.stepLabel,
                          energyLevel === item.level && [styles.stepLabelActive, { color: teamPrimary }],
                        ]}
                      >
                        {item.label}
                      </ProDayText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* COLONNE MUSCLES */}
              <View style={styles.metricCol}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    prodayHaptics.press();
                    setMuscleLevel((prev) => (prev + 1) % 3);
                  }}
                  style={styles.metricHeaderPressable}
                >
                  <View style={[styles.iconCircle, { borderColor: `${teamPrimary}40`, backgroundColor: `${teamPrimary}14` }]}>
                    <MuscleFiberIcon size={32} color={teamPrimary} activeCrans={muscleLevel + 1} />
                  </View>
                  <ProDayText style={styles.metricName}>Muscles</ProDayText>
                  <View style={[styles.currentValuePill, { backgroundColor: `${teamPrimary}22` }]}>
                    <ProDayText style={[styles.currentValueText, { color: teamPrimary }]}>
                      {muscleLevel === 0 ? 'Frais' : muscleLevel === 1 ? 'Courbatures' : 'Gêne'}
                    </ProDayText>
                  </View>
                </TouchableOpacity>

                {/* 3 SEGMENTS PILL */}
                <View style={styles.segmentedPillTrack}>
                  {[0, 1, 2].map((idx) => {
                    const isActive = idx <= muscleLevel;
                    return (
                      <TouchableOpacity
                        key={`muscle-${idx}`}
                        activeOpacity={0.7}
                        onPress={() => {
                          prodayHaptics.press();
                          setMuscleLevel(idx);
                        }}
                        style={[
                          styles.segmentPillItem,
                          isActive
                            ? [styles.segmentPillActive, { backgroundColor: teamPrimary }]
                            : styles.segmentPillInactive,
                        ]}
                      />
                    );
                  })}
                </View>

                <View style={styles.metricLabelsRowMuscles}>
                  {[
                    { level: 0, label: 'Frais' },
                    { level: 1, label: 'Courbatures' },
                    { level: 2, label: 'Gêne' },
                  ].map((item) => (
                    <TouchableOpacity
                      key={`muscle-lbl-${item.level}`}
                      activeOpacity={0.7}
                      onPress={() => {
                        prodayHaptics.press();
                        setMuscleLevel(item.level);
                      }}
                      style={styles.stepLabelPill}
                    >
                      <ProDayText
                        style={[
                          styles.stepLabel,
                          muscleLevel === item.level && [styles.stepLabelActive, { color: teamPrimary }],
                        ]}
                      >
                        {item.label}
                      </ProDayText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* BOUTON DE VALIDATION AUX COULEURS DE L'ÉQUIPE */}
            <PressableSpring
              onPress={handleValidateCheckin}
              scaleTo={0.98}
              style={styles.validateButtonShell}
            >
              <LinearGradient
                colors={teamGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.validateButtonGradient}
              >
                <Ionicons name="checkmark-circle" size={20} color="#000000" />
                <ProDayText style={styles.validateButtonText}>
                  {isValidatedToday ? 'Bilan validé (+10 XP)' : 'Valider mon bilan (+10 XP)'}
                </ProDayText>
              </LinearGradient>
            </PressableSpring>
          </View>

          {/* CARTE 3 : PRÉPARATION & ROUTINES */}
          <View style={styles.cardShell}>
            <View style={styles.routinesHeaderRow}>
              <View>
                <ProDayText style={[styles.kicker, { color: teamPrimary }]}>PRÉPARATION DU JOUR</ProDayText>
                <ProDayText style={styles.routinesTitle}>Mes Routines d'Entraînement</ProDayText>
              </View>
              <Ionicons name="checkmark-done" size={22} color={teamPrimary} />
            </View>

            {/* CARTES DE ROUTINE EN LIGNE */}
            <View style={styles.routinesCardsRow}>
              {/* ROUTINE 1 : MOBILITÉ */}
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => toggleRoutine('mobility')}
                style={[
                  styles.routineCard,
                  routines.mobility && [
                    styles.routineCardActive,
                    { backgroundColor: `${teamPrimary}18`, borderColor: teamPrimary },
                  ],
                ]}
              >
                {routines.mobility && (
                  <View style={[styles.routineCheckPill, { backgroundColor: teamPrimary }]}>
                    <Ionicons name="checkmark" size={11} color="#000000" />
                  </View>
                )}
                <View style={styles.routineIconHolder}>
                  <MobilityStretchIcon size={36} color={routines.mobility ? teamPrimary : '#8B8B9A'} />
                </View>
                <ProDayText
                  style={[
                    styles.routineCardLabel,
                    routines.mobility && { color: '#FFFFFF', fontWeight: '800' },
                  ]}
                  numberOfLines={1}
                >
                  Mobilité
                </ProDayText>
              </TouchableOpacity>

              {/* ROUTINE 2 : VISUALISATION */}
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => toggleRoutine('visualization')}
                style={[
                  styles.routineCard,
                  routines.visualization && [
                    styles.routineCardActive,
                    { backgroundColor: `${teamPrimary}18`, borderColor: teamPrimary },
                  ],
                ]}
              >
                {routines.visualization && (
                  <View style={[styles.routineCheckPill, { backgroundColor: teamPrimary }]}>
                    <Ionicons name="checkmark" size={11} color="#000000" />
                  </View>
                )}
                <View style={styles.routineIconHolder}>
                  <VisualizationBrainIcon size={36} color={routines.visualization ? teamPrimary : '#8B8B9A'} />
                </View>
                <ProDayText
                  style={[
                    styles.routineCardLabel,
                    routines.visualization && { color: '#FFFFFF', fontWeight: '800' },
                  ]}
                  numberOfLines={1}
                >
                  Visualisation
                </ProDayText>
              </TouchableOpacity>

              {/* ROUTINE 3 : HYDRATATION */}
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => toggleRoutine('hydration')}
                style={[
                  styles.routineCard,
                  routines.hydration && [
                    styles.routineCardActive,
                    { backgroundColor: `${teamPrimary}18`, borderColor: teamPrimary },
                  ],
                ]}
              >
                {routines.hydration && (
                  <View style={[styles.routineCheckPill, { backgroundColor: teamPrimary }]}>
                    <Ionicons name="checkmark" size={11} color="#000000" />
                  </View>
                )}
                <View style={styles.routineIconHolder}>
                  <HydrationNutritionIcon size={36} color={routines.hydration ? teamPrimary : '#8B8B9A'} />
                </View>
                <ProDayText
                  style={[
                    styles.routineCardLabel,
                    routines.hydration && { color: '#FFFFFF', fontWeight: '800' },
                  ]}
                  numberOfLines={1}
                >
                  Hydratation
                </ProDayText>
              </TouchableOpacity>
            </View>

            {/* BARRE D'INTERACTION DIRECTE AVEC LE PRÉPARATEUR */}
            <View style={styles.quickPromptBar}>
              <Ionicons name="chatbubble-ellipses-outline" size={16} color="#8B8B9A" />
              <TextInput
                style={styles.promptInput}
                placeholder="Pose une question à ton préparateur..."
                placeholderTextColor="#8B8B9A"
                value={promptInput}
                onChangeText={setPromptInput}
                onSubmitEditing={() => handleAskAiCoach()}
                returnKeyType="send"
              />
              <TouchableOpacity
                style={[
                  styles.sendPromptBtn,
                  { backgroundColor: promptInput.trim() ? teamPrimary : '#22222E' },
                ]}
                onPress={() => handleAskAiCoach()}
                disabled={!promptInput.trim()}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="arrow-up"
                  size={15}
                  color={promptInput.trim() ? '#000000' : '#8B8B9A'}
                />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      ) : (
        /* 4. ONGLET MES OBJECTIFS */
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: TAB_BAR_CONTENT_INSET + 36 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={teamPrimary}
              colors={[teamPrimary]}
            />
          }
        >
          {/* STATS DU JOUEUR */}
          <View style={styles.statCardsRow}>
            {/* NIVEAU */}
            <PressableSpring
              onPress={() => {
                prodayHaptics.press();
                Alert.alert(
                  `Niveau ${levelNumber}`,
                  `Progression : ${xpIntoLevel}/${xpForNext} XP. Complétez vos quêtes pour débloquer de nouveaux paliers.`,
                );
              }}
              scaleTo={0.96}
              style={[styles.statBadgeCard, { borderColor: `${teamPrimary}33` }]}
            >
              <ProDayText style={styles.statBadgeKicker}>Niveau</ProDayText>
              <ProDayText style={[styles.statBadgeValue, { color: teamPrimary }]}>{levelNumber}</ProDayText>
              <ProDayText style={styles.statBadgeSub}>Progression</ProDayText>
            </PressableSpring>

            {/* SÉRIE DE JOURS */}
            <PressableSpring
              onPress={() => {
                prodayHaptics.press();
                Alert.alert(
                  'Série d’activité',
                  `Vous êtes actif depuis ${streak} jour(s) consécutif(s). Revenez chaque jour pour maintenir votre dynamique !`,
                );
              }}
              scaleTo={0.96}
              style={[styles.statBadgeCard, { borderColor: `${teamPrimary}33` }]}
            >
              <ProDayText style={styles.statBadgeKicker}>Série</ProDayText>
              <View style={styles.streakRow}>
                <Ionicons name="flame" size={18} color={teamPrimary} />
                <ProDayText style={[styles.statBadgeValue, { color: teamPrimary }]}>{streak}</ProDayText>
              </View>
              <ProDayText style={styles.statBadgeSub}>Jours actifs</ProDayText>
            </PressableSpring>

            {/* ACTIVITÉS ENREGISTRÉES */}
            <PressableSpring
              onPress={() => {
                prodayHaptics.press();
                nav.setActiveTab('matchs');
              }}
              scaleTo={0.96}
              style={[styles.statBadgeCard, { borderColor: `${teamPrimary}33` }]}
            >
              <ProDayText style={styles.statBadgeKicker}>Activités</ProDayText>
              <ProDayText style={[styles.statBadgeValue, { color: teamPrimary }]}>
                {activitiesCount || 2}
              </ProDayText>
              <ProDayText style={styles.statBadgeSub}>Voir matchs ›</ProDayText>
            </PressableSpring>
          </View>

          {/* CARTE : PROGRESSION XP SAISON */}
          <View style={styles.cardShell}>
            <View style={styles.sectionHeaderRow}>
              <ProDayText style={styles.cardTitle}>XP Saison</ProDayText>
              <ProDayText style={[styles.xpCountLabel, { color: teamPrimary }]}>
                {`${xpIntoLevel} / ${xpForNext} XP`}
              </ProDayText>
            </View>

            <View style={styles.xpBigProgressTrack}>
              <LinearGradient
                colors={teamGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.xpBigProgressFill,
                  { width: `${Math.min(100, Math.round((xpIntoLevel / xpForNext) * 100))}%` },
                ]}
              />
            </View>

            <ProDayText style={styles.xpMotivationText}>
              {`Plus que ${Math.max(0, xpForNext - xpIntoLevel)} XP pour atteindre le Niveau ${levelNumber + 1} !`}
            </ProDayText>
          </View>

          {/* CARTE : QUÊTES DU JOUR */}
          <View style={styles.cardShell}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <ProDayText style={[styles.kicker, { color: teamPrimary }]}>OBJECTIFS DU JOUR</ProDayText>
                <ProDayText style={styles.cardTitle}>Quêtes du jour</ProDayText>
              </View>
              <View style={[styles.xpRewardPill, { backgroundColor: `${teamPrimary}18` }]}>
                <ProDayText style={[styles.xpRewardPillText, { color: teamPrimary }]}>+80 XP max</ProDayText>
              </View>
            </View>

            <View style={styles.questsList}>
              {dailyQuests.map((q) => {
                const isClaimed = dailyDone.has(q.id);
                const isAutoDone =
                  (q.id === 'daily-login' && streak > 0) ||
                  (q.id === 'daily-checkin' && isValidatedToday);
                const isCompleted = isClaimed || isAutoDone;

                return (
                  <PressableSpring
                    key={q.id}
                    onPress={() => {
                      prodayHaptics.press();
                      if (isClaimed) {
                        Alert.alert(q.title, 'Quête déjà complétée et récompensée aujourd’hui !');
                      } else if (isAutoDone) {
                        void handleClaimQuest(q.id, q.xp, q.stars);
                      } else if (q.id === 'daily-checkin') {
                        setSegment('forme');
                      } else if (q.tabHint === 'matchs' || q.id.includes('match')) {
                        nav.setActiveTab('matchs');
                      } else if (q.tabHint === 'profil' || q.id.includes('card')) {
                        nav.setActiveTab('profil');
                      } else {
                        Alert.alert(q.title, q.body);
                      }
                    }}
                    scaleTo={0.98}
                    style={[
                      styles.questItemCard,
                      isCompleted && [
                        styles.questItemCardCompleted,
                        { borderColor: `${teamPrimary}44` },
                      ],
                    ]}
                  >
                    <View style={styles.questItemLeft}>
                      <View
                        style={[
                          styles.questIconHolder,
                          {
                            backgroundColor: isCompleted ? `${teamPrimary}20` : '#181924',
                            borderColor: isCompleted ? teamPrimary : '#22222E',
                          },
                        ]}
                      >
                        <Ionicons
                          name={
                            isCompleted
                              ? 'checkmark-circle'
                              : q.id === 'daily-checkin'
                                ? 'fitness'
                                : q.id.includes('train')
                                  ? 'football'
                                  : q.id.includes('match')
                                    ? 'trophy'
                                    : 'flash'
                          }
                          size={18}
                          color={isCompleted ? teamPrimary : '#8B8B9A'}
                        />
                      </View>
                      <View style={styles.questCopyWrap}>
                        <ProDayText style={styles.questTitle}>{q.title}</ProDayText>
                        <ProDayText style={styles.questBody}>{q.body}</ProDayText>
                        <View style={styles.questProgressTrack}>
                          <View
                            style={[
                              styles.questProgressFill,
                              {
                                width: isCompleted ? '100%' : '20%',
                                backgroundColor: isCompleted ? teamPrimary : 'rgba(255,255,255,0.15)',
                              },
                            ]}
                          />
                        </View>
                      </View>
                    </View>

                    <View style={styles.questItemRight}>
                      {isClaimed ? (
                        <View style={[styles.claimedBadge, { backgroundColor: `${teamPrimary}18` }]}>
                          <Ionicons name="checkmark" size={13} color={teamPrimary} />
                          <ProDayText style={[styles.claimedText, { color: teamPrimary }]}>Fait</ProDayText>
                        </View>
                      ) : isAutoDone ? (
                        <PressableSpring
                          onPress={() => void handleClaimQuest(q.id, q.xp, q.stars)}
                          scaleTo={0.94}
                          style={styles.claimButtonShell}
                        >
                          <LinearGradient colors={teamGradient} style={styles.claimButtonGradient}>
                            <ProDayText style={styles.claimButtonText}>{`+${q.xp} XP`}</ProDayText>
                          </LinearGradient>
                        </PressableSpring>
                      ) : (
                        <View style={styles.xpPendingBadge}>
                          <ProDayText style={styles.xpPendingText}>{`+${q.xp} XP`}</ProDayText>
                        </View>
                      )}
                    </View>
                  </PressableSpring>
                );
              })}
            </View>
          </View>

          {/* CARTE : DÉFIS DE SAISON */}
          <View style={styles.cardShell}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <ProDayText style={[styles.kicker, { color: teamPrimary }]}>{teamName.toUpperCase()}</ProDayText>
                <ProDayText style={styles.cardTitle}>Défis de Saison</ProDayText>
              </View>
              <Ionicons name="trophy-outline" size={22} color={teamPrimary} />
            </View>

            <View style={styles.seasonObjectivesList}>
              {JOUEUR_SEASON_OBJECTIVES.map((obj) => {
                let current = 0;
                let target = 1;
                if (obj.id === 'season-streak-3') {
                  current = Math.min(streak, 3);
                  target = 3;
                } else if (obj.id === 'season-ovr-70') {
                  current = Math.min(ovrScore, 70);
                  target = 70;
                } else if (obj.id === 'season-train-3') {
                  current = Math.min(activitiesCount || 2, 3);
                  target = 3;
                }
                const isClaimed = seasonDone.has(obj.id);
                const isReadyToClaim = !isClaimed && current >= target;
                const ratio = Math.min(100, Math.round((current / target) * 100));

                return (
                  <PressableSpring
                    key={obj.id}
                    onPress={() => {
                      prodayHaptics.press();
                      if (isClaimed) {
                        Alert.alert(obj.title, 'Ce défi majeur a déjà été validé et récompensé cette saison !');
                      } else if (isReadyToClaim) {
                        void handleClaimChallenge(obj.id, obj.stars, obj.xp);
                      } else {
                        Alert.alert(
                          obj.title,
                          `${obj.body}\nProgression actuelle : ${current}/${target} (${ratio}%)`,
                        );
                      }
                    }}
                    scaleTo={0.98}
                    style={[
                      styles.seasonObjCard,
                      isClaimed && { borderColor: `${teamPrimary}44` },
                    ]}
                  >
                    <View style={styles.seasonObjHeader}>
                      <ProDayText style={styles.seasonObjTitle}>{obj.title}</ProDayText>
                      <ProDayText
                        style={[
                          styles.seasonObjRatio,
                          { color: isClaimed || isReadyToClaim ? teamPrimary : '#8B8B9A' },
                        ]}
                      >
                        {`${current}/${target}`}
                      </ProDayText>
                    </View>
                    <ProDayText style={styles.seasonObjBody}>{obj.body}</ProDayText>

                    <View style={styles.seasonObjProgressTrack}>
                      <LinearGradient
                        colors={teamGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.seasonObjProgressFill, { width: `${ratio}%` }]}
                      />
                    </View>

                    <View style={styles.seasonObjFooter}>
                      <View style={styles.rewardRow}>
                        <Ionicons name="star" size={13} color={teamPrimary} />
                        <ProDayText style={[styles.seasonObjReward, { color: teamPrimary }]}>
                          {`+${obj.xp} XP · ${obj.stars} ${obj.stars > 1 ? 'étoiles' : 'étoile'}`}
                        </ProDayText>
                      </View>
                      {isClaimed ? (
                        <View style={styles.seasonObjDoneTag}>
                          <Ionicons name="checkmark-circle" size={14} color={teamPrimary} />
                          <ProDayText style={[styles.seasonObjDoneText, { color: teamPrimary }]}>Validé</ProDayText>
                        </View>
                      ) : isReadyToClaim ? (
                        <PressableSpring
                          onPress={() => void handleClaimChallenge(obj.id, obj.stars, obj.xp)}
                          scaleTo={0.94}
                          style={styles.claimButtonShell}
                        >
                          <LinearGradient colors={teamGradient} style={styles.claimButtonGradient}>
                            <ProDayText style={styles.claimButtonText}>Réclamer</ProDayText>
                          </LinearGradient>
                        </PressableSpring>
                      ) : (
                        <ProDayText style={styles.inProgressLabel}>En cours</ProDayText>
                      )}
                    </View>
                  </PressableSpring>
                );
              })}
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000000',
    position: 'relative',
  },

  /* GRAND BLASON EN ARRIÈRE-PLAN */
  backgroundTeamWatermark: {
    position: 'absolute',
    top: 90,
    alignSelf: 'center',
    zIndex: 0,
    opacity: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backgroundClubImage: {
    width: 280,
    height: 320,
    opacity: 0.16,
  },

  /* 1. HERO */
  heroWrap: {
    position: 'relative',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 12,
    overflow: 'hidden',
    zIndex: 1,
  },
  watermarkLeft: {
    position: 'absolute',
    left: -10,
    top: 0,
    opacity: 0.5,
  },
  watermarkRight: {
    position: 'absolute',
    right: 12,
    top: 4,
    opacity: 1,
  },
  heroClubLogo: {
    width: 88,
    height: 100,
    opacity: 0.28,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
  },
  avatarHolder: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 2,
    overflow: 'hidden',
    backgroundColor: '#141418',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  heroMeta: {
    flex: 1,
    justifyContent: 'center',
  },
  playerName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  donutContainer: {
    width: 62,
    height: 62,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutTextWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutLevelLabel: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  ovrContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginLeft: 18,
  },
  ovrScore: {
    fontSize: 40,
    fontWeight: '900',
    lineHeight: 44,
    letterSpacing: -0.8,
  },
  ovrMax: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B8B9A',
    paddingBottom: 5,
    marginLeft: 2,
  },

  /* 2. SÉLECTEUR D'ONGLETS */
  tabCapsuleShell: {
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 14,
    height: 44,
    backgroundColor: '#121218',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    padding: 3,
    zIndex: 1,
  },
  tabButton: {
    flex: 1,
    borderRadius: 19,
    overflow: 'hidden',
  },
  tabButtonActiveGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
  },
  tabButtonInactive: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  tabTextActive: {
    color: '#000000',
    fontWeight: '800',
    fontSize: 13.5,
    letterSpacing: -0.2,
  },
  tabTextInactive: {
    color: '#8B8B9A',
    fontWeight: '600',
    fontSize: 13.5,
    letterSpacing: -0.2,
  },

  /* 3. CONTENU / CARTES */
  scrollView: {
    flex: 1,
    zIndex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  cardShell: {
    backgroundColor: '#141418',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    marginBottom: 12,
  },
  cardHeaderWithKicker: {
    marginBottom: 12,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },

  /* COPILOTE HEADER & READINESS */
  copilotHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  copilotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  copilotBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  readinessPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  readinessScoreText: {
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  aiBriefingContainer: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 12,
    marginBottom: 12,
  },
  aiBriefingText: {
    color: '#E5E7EB',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
  quickAiActionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  quickAiActionChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  quickAiActionText: {
    fontSize: 11,
    fontWeight: '700',
  },

  /* AUTO-ÉVALUATION */
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  metricCol: {
    flex: 1,
    alignItems: 'center',
  },
  metricHeaderPressable: {
    alignItems: 'center',
    width: '100%',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginTop: 6,
    marginBottom: 2,
  },
  currentValuePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 8,
  },
  currentValueText: {
    fontSize: 10.5,
    fontWeight: '800',
  },

  /* 3 CRANS DU CURSEUR */
  segmentedPillTrack: {
    flexDirection: 'row',
    width: '100%',
    height: 22,
    backgroundColor: '#1E1F2A',
    borderRadius: 11,
    overflow: 'hidden',
    padding: 2.5,
    gap: 3,
  },
  segmentPillItem: {
    flex: 1,
    borderRadius: 7,
  },
  segmentPillActive: {},
  segmentPillInactive: {
    backgroundColor: '#272834',
  },
  metricLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 6,
  },
  metricLabelsRowMuscles: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 6,
  },
  stepLabelPill: {
    paddingHorizontal: 2,
    paddingVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: {
    fontSize: 10,
    color: '#8B8B9A',
    fontWeight: '600',
  },
  stepLabelActive: {
    fontWeight: '800',
  },

  /* BOUTON VALIDATION */
  validateButtonShell: {
    height: 46,
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 4,
  },
  validateButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  validateButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },

  /* ROUTINES */
  kicker: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  routinesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  routinesTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  routinesCardsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  routineCard: {
    flex: 1,
    minHeight: 104,
    backgroundColor: '#181820',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
  },
  routineCardActive: {
    borderWidth: 1.5,
  },
  routineCheckPill: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routineIconHolder: {
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  routineCardLabel: {
    color: '#8B8B9A',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },

  /* QUICK PROMPT BAR */
  quickPromptBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181820',
    borderRadius: 12,
    paddingLeft: 12,
    paddingRight: 4,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  promptInput: {
    flex: 1,
    fontSize: 12.5,
    color: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  sendPromptBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* 4. OBJECTIFS */
  statCardsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statBadgeCard: {
    flex: 1,
    minHeight: 88,
    justifyContent: 'space-between',
    backgroundColor: '#141418',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 10,
    alignItems: 'center',
  },
  statBadgeKicker: {
    color: '#8B8B9A',
    fontSize: 10.5,
    fontWeight: '600',
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  statBadgeValue: {
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 26,
    letterSpacing: -0.5,
  },
  statBadgeSub: {
    color: '#8B8B9A',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  streakEmoji: {
    fontSize: 16,
  },

  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  xpCountLabel: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  xpBigProgressTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 2,
    marginBottom: 8,
  },
  xpBigProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  xpMotivationText: {
    color: '#8B8B9A',
    fontSize: 11.5,
    fontWeight: '500',
  },

  xpRewardPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  xpRewardPillText: {
    fontSize: 10.5,
    fontWeight: '800',
  },

  /* LISTE DES QUÊTES */
  questsList: {
    gap: 8,
  },
  questItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#181820',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 12,
  },
  questItemCardCompleted: {
    backgroundColor: '#16161E',
  },
  questItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  questIconHolder: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  questCopyWrap: {
    flex: 1,
  },
  questTitle: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  questBody: {
    color: '#8B8B9A',
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
  },
  questProgressTrack: {
    height: 3.5,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    overflow: 'hidden',
    width: '90%',
  },
  questProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  questItemRight: {
    alignItems: 'flex-end',
  },
  claimedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  claimedText: {
    fontSize: 11,
    fontWeight: '800',
  },
  claimButtonShell: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  claimButtonGradient: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  claimButtonText: {
    color: '#000000',
    fontSize: 11.5,
    fontWeight: '800',
  },
  xpPendingBadge: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  xpPendingText: {
    color: '#8B8B9A',
    fontSize: 11,
    fontWeight: '700',
  },

  /* DÉFIS DE SAISON */
  seasonObjectivesList: {
    gap: 10,
    marginTop: 4,
  },
  seasonObjCard: {
    backgroundColor: '#181820',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 12,
  },
  seasonObjHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  seasonObjTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  seasonObjRatio: {
    fontSize: 12,
    fontWeight: '800',
  },
  seasonObjBody: {
    color: '#8B8B9A',
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 8,
  },
  seasonObjProgressTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  seasonObjProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  seasonObjFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seasonObjReward: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  seasonObjDoneTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seasonObjDoneText: {
    fontSize: 11,
    fontWeight: '800',
  },
  inProgressLabel: {
    color: '#8B8B9A',
    fontSize: 10.5,
    fontWeight: '600',
  },
});

export default PlayerSaisonScreen;

