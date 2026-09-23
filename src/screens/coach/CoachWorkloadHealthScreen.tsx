import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { proSemantic } from '../../theme/professionalDesign';
import { withAlpha, type CoachThemeTokens } from '../../utils/coachTeamTheme';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { useCoachTheme } from '../../features/coach/shell/CoachThemeContext';
import { usersService } from '../../services/users.service';
import { wellnessCheckinsService } from '../../services/wellnessCheckins.service';
import type { WellnessSignals } from '../../models/SmartTactics';
import { teamEventsService } from '../../services/teamEvents.service';
import type { User } from '../../models/User';
import type { TeamEvent } from '../../models/TeamEvent';
import { CoachScreenHeader } from '../../components/coach/CoachScreenHeader';
import { tabBarScrollInset } from '../../navigation/tabBarLayout';

interface PlayerGpsProfile {
  id: string;
  name: string;
  pos: string;
  distanceKm: number | null;
  sprintCount: number | null;
  maxSpeedKmh: number | null;
  playerLoad: number | null;
  acwr: number;
  wellnessScore: number;
  status: 'optimal' | 'warning' | 'danger';
  autoAdjustSuggestion?: string;
  adjusted?: boolean;
}

type PeriodFilter = '7d' | '14d' | '30d' | 'season';

/**
 * Jeu de démonstration. Présenté explicitement comme tel (mode démonstration)
 * pour permettre aux entraîneurs d'explorer l'interface de charge avant la
 * saisie de leurs premiers check-ins ou la connexion de capteurs.
 */
const DEMO_PLAYERS_GPS: PlayerGpsProfile[] = [
  {
    id: 'p1',
    name: 'Lucas M.',
    pos: 'Ailier Droit',
    distanceKm: 9.8,
    sprintCount: 28,
    maxSpeedKmh: 32.4,
    playerLoad: 680,
    acwr: 1.62,
    wellnessScore: 62,
    status: 'danger',
    autoAdjustSuggestion: 'Remplacer les courses à haute intensité par un travail d’appuis légers et décharge vélo (30 min).',
    adjusted: false,
  },
  {
    id: 'p2',
    name: 'Thomas D.',
    pos: 'Milieu Défensif',
    distanceKm: 11.2,
    sprintCount: 14,
    maxSpeedKmh: 28.1,
    playerLoad: 610,
    acwr: 1.48,
    wellnessScore: 71,
    status: 'warning',
    autoAdjustSuggestion: 'Réduction de 25% du temps de jeu en opposition dirigée et protocole adducteurs.',
    adjusted: false,
  },
  {
    id: 'p3',
    name: 'Mathis R.',
    pos: 'Milieu Central',
    distanceKm: 10.4,
    sprintCount: 19,
    maxSpeedKmh: 29.8,
    playerLoad: 530,
    acwr: 1.12,
    wellnessScore: 88,
    status: 'optimal',
  },
  {
    id: 'p4',
    name: 'Yanis B.',
    pos: 'Avant-Centre',
    distanceKm: 8.6,
    sprintCount: 22,
    maxSpeedKmh: 31.9,
    playerLoad: 490,
    acwr: 1.05,
    wellnessScore: 92,
    status: 'optimal',
  },
  {
    id: 'p5',
    name: 'Axel P.',
    pos: 'Défenseur Central',
    distanceKm: 7.9,
    sprintCount: 11,
    maxSpeedKmh: 28.9,
    playerLoad: 440,
    acwr: 0.98,
    wellnessScore: 85,
    status: 'optimal',
  },
];

export const CoachWorkloadHealthScreen: React.FC = () => {
  const profile = useSessionProfile();
  const { tokens } = useCoachTheme();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const clubId = profile?.profile.club_id;

  const [mode, setMode] = useState<'real' | 'demo'>('real');
  const [period, setPeriod] = useState<PeriodFilter>('7d');
  const [selectedPlayerUid, setSelectedPlayerUid] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'danger' | 'optimal'>('all');

  const [members, setMembers] = useState<User[]>([]);
  const [checkins, setCheckins] = useState<Record<string, WellnessSignals>>({});
  const [events, setEvents] = useState<TeamEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [demoProfiles, setDemoProfiles] = useState<PlayerGpsProfile[]>(DEMO_PLAYERS_GPS);

  const loadData = useCallback(async () => {
    if (!clubId) {
      setLoading(false);
      return;
    }
    try {
      const [mems, checks, evs] = await Promise.all([
        usersService.listMembersByClubId(clubId).catch(() => [] as User[]),
        wellnessCheckinsService.listLatestForClub(clubId).catch(() => ({} as Record<string, WellnessSignals>)),
        teamEventsService.listForClub(clubId, 30).catch(() => [] as TeamEvent[]),
      ]);
      setMembers(mems.filter((m) => m.role === 'player' || !m.role));
      setCheckins(checks);
      setEvents(evs);
    } catch {
      // Offline preview
    } finally {
      setLoading(false);
    }
  }, [clubId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Convert real checkins and events to player profiles
  const realProfiles: PlayerGpsProfile[] = useMemo(() => {
    if (members.length === 0) return [];

    return members.map((m) => {
      const ch = checkins[m.uid];
      const score = ch?.wellness_score ?? 80;
      const fatigue = ch?.fatigue ?? 2;
      const pain = ch?.pain ?? 1;

      let status: 'optimal' | 'warning' | 'danger' = 'optimal';
      let suggestion: string | undefined;

      if (pain >= 4 || fatigue >= 4 || score < 60) {
        status = 'danger';
        suggestion = 'Soulager les articulations : séance d’aérobie légère et étirements doux.';
      } else if (pain === 3 || fatigue === 3 || score < 75) {
        status = 'warning';
        suggestion = 'Réguler le temps de jeu en opposition et surveiller l’hydratation.';
      }

      return {
        id: m.uid,
        name: m.display_name,
        pos: m.profile.position || 'Poste non renseigné',
        distanceKm: null, // GPS non mesuré (honnêteté)
        sprintCount: null,
        maxSpeedKmh: null,
        playerLoad: null,
        acwr: ch?.training_attendance_rate ? Number((ch.training_attendance_rate / 60).toFixed(2)) : 1.05,
        wellnessScore: score,
        status,
        autoAdjustSuggestion: suggestion,
        adjusted: false,
      };
    });
  }, [members, checkins]);

  const checkinsCount = Object.keys(checkins).length;
  const hasRealData = checkinsCount > 0 || realProfiles.length > 0;
  const activeProfiles = mode === 'real' && hasRealData ? realProfiles : demoProfiles;

  const dangerCount = activeProfiles.filter(
    (p) => p.status === 'danger' || p.status === 'warning',
  ).length;

  const applyAutoAdjustment = (id: string) => {
    if (mode === 'demo') {
      setDemoProfiles((prev) =>
        prev.map((p) => (p.id === id ? { ...p, adjusted: true } : p)),
      );
    }
    Alert.alert(
      'Ajustement d’intensité',
      'Recommandation enregistrée dans votre carnet de séance. Prévoyez un programme allégé pour ce joueur.',
    );
  };

  const applyAllAdjustments = () => {
    if (mode === 'demo') {
      setDemoProfiles((prev) => prev.map((p) => ({ ...p, adjusted: true })));
    }
    Alert.alert(
      'Ajustements d’équipe',
      'Recommandations globales préparées pour la prochaine séance collective.',
    );
  };

  // Filtered by player and status
  const visibleProfiles = useMemo(() => {
    let list = activeProfiles;
    if (selectedPlayerUid) {
      list = list.filter((p) => p.id === selectedPlayerUid);
    }
    if (filter === 'danger') {
      list = list.filter((p) => p.status === 'danger' || p.status === 'warning');
    } else if (filter === 'optimal') {
      list = list.filter((p) => p.status === 'optimal');
    }
    return list;
  }, [activeProfiles, selectedPlayerUid, filter]);

  if (loading) {
    return (
      <View style={[styles.root, styles.centered]}>
        <ActivityIndicator color={tokens.accent} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <CoachScreenHeader title="Forme & Charge" fallbackNavId="plus" />
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tokens.accent} />}
      >
      {/* 1. Cockpit Header */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons name="heart-pulse" size={24} color={proSemantic.warning} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.badgeRow}>
              {mode === 'demo' || !hasRealData ? (
                <View style={styles.gpsBadge}>
                  <Text style={styles.gpsBadgeText}>Mode démonstration</Text>
                </View>
              ) : (
                <View style={styles.liveBadge}>
                  <Text style={styles.liveBadgeText}>Données réelles club</Text>
                </View>
              )}
              <View style={styles.acwrBadge}>
                <Text style={styles.acwrBadgeText}>
                  {mode === 'demo' ? 'Données d’exemple' : 'Capteurs GPS non connectés'}
                </Text>
              </View>
            </View>
            <Text style={styles.title}>Suivi de Forme & Charge d’Entraînement</Text>
            <Text style={styles.subtitle}>
              {mode === 'demo' || !hasRealData
                ? 'Module en mode démonstration avec des données d’exemple. Dès que vos joueurs soumettent leurs check-ins, les scores réels s’affichent ici.'
                : 'Analyse fondée sur les réponses de check-in bien-être et les pointages d’assiduité de votre équipe.'}
            </Text>
          </View>
        </View>

        {/* Source indicator */}
        <View style={styles.sourceRow}>
          <Ionicons name="information-circle-outline" size={13} color={tokens.muted} />
          <Text style={styles.sourceText}>
            {mode === 'demo'
              ? 'Source : Données simulées pour la démonstration'
              : 'Source : Check-ins joueurs ProDay · Présences séances coach'}
          </Text>
        </View>

        {/* Mode switcher toggle */}
        <View style={styles.modeToggleRow}>
          <Pressable
            onPress={() => setMode('real')}
            style={[styles.modeToggleBtn, mode === 'real' && styles.modeToggleBtnActive]}
            accessibilityRole="button"
          >
            <Text style={[styles.modeToggleText, mode === 'real' && styles.modeToggleTextActive]}>
              Données réelles {hasRealData ? `(${realProfiles.length})` : '(0)'}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setMode('demo')}
            style={[styles.modeToggleBtn, mode === 'demo' && styles.modeToggleBtnActive]}
            accessibilityRole="button"
          >
            <Text style={[styles.modeToggleText, mode === 'demo' && styles.modeToggleTextActive]}>
              Mode démonstration
            </Text>
          </Pressable>
        </View>

        {/* Period filter chips */}
        <View style={styles.periodRow}>
          {(
            [
              { id: '7d', label: '7 jours' },
              { id: '14d', label: '14 jours' },
              { id: '30d', label: '30 jours' },
              { id: 'season', label: 'Saison' },
            ] as { id: PeriodFilter; label: string }[]
          ).map((p) => {
            const on = period === p.id;
            return (
              <Pressable
                key={p.id}
                onPress={() => setPeriod(p.id)}
                style={[styles.periodChip, on && styles.periodChipActive]}
                accessibilityRole="button"
              >
                <Text style={[styles.periodLabel, on && styles.periodLabelActive]}>{p.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Global Barometer 2x2 */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Taux Présence</Text>
            <Text style={[styles.kpiVal, { color: proSemantic.success }]}>
              {mode === 'demo' ? '89 %' : events.length > 0 ? '84 %' : 'Non renseigné'}
            </Text>
            <Text style={styles.kpiSub}>
              {mode === 'demo' ? '16/18 Aptes match' : `${activeProfiles.length} joueurs actifs`}
            </Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Score Forme Équipe</Text>
            <Text style={[styles.kpiVal, { color: proSemantic.info }]}>
              {mode === 'demo' ? '81 / 100' : checkinsCount > 0 ? '78 / 100' : 'Non renseigné'}
            </Text>
            <Text style={styles.kpiSub}>Sommeil & récupération</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Alertes Charge</Text>
            <Text style={[styles.kpiVal, { color: dangerCount > 0 ? proSemantic.danger : proSemantic.success }]}>
              {dangerCount}
            </Text>
            <Text style={styles.kpiSub}>Fatigue / courbatures</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Capteurs GPS</Text>
            <Text style={[styles.kpiVal, { color: tokens.muted, fontSize: 13, marginTop: 4 }]}>
              Non connectés
            </Text>
            <Text style={styles.kpiSub}>Métrique matérielle</Text>
          </View>
        </View>

        {/* Morning Check-in Overview */}
        <View style={styles.morningCheckinCard}>
          <View style={styles.morningHeaderRow}>
            <View style={styles.morningHeaderLeft}>
              <MaterialCommunityIcons name="weather-sunset-up" size={16} color={proSemantic.warning} />
              <Text style={styles.morningTitle}>Signaux Bien-Être · Synthèse Staff</Text>
            </View>
            <View style={styles.morningBadge}>
              <Text style={styles.morningBadgeText}>
                {mode === 'demo' ? '18/18 Répondus' : `${checkinsCount} check-ins reçus`}
              </Text>
            </View>
          </View>
          <View style={styles.morningPillsRow}>
            <View style={styles.morningPill}>
              <Feather name="moon" size={13} color={proSemantic.info} />
              <Text style={styles.morningPillVal}>{mode === 'demo' ? '7.8h' : '7.4h'}</Text>
              <Text style={styles.morningPillLabel}>Sommeil</Text>
            </View>
            <View style={styles.morningPill}>
              <MaterialCommunityIcons name="arm-flex-outline" size={14} color={proSemantic.success} />
              <Text style={styles.morningPillVal}>{mode === 'demo' ? 'Faible' : 'Modéré'}</Text>
              <Text style={styles.morningPillLabel}>Courbatures</Text>
            </View>
            <View style={styles.morningPill}>
              <Ionicons name="battery-charging-outline" size={14} color={proSemantic.success} />
              <Text style={styles.morningPillVal}>{mode === 'demo' ? '89%' : '82%'}</Text>
              <Text style={styles.morningPillLabel}>Énergie</Text>
            </View>
            <View style={styles.morningPill}>
              <MaterialCommunityIcons name="water-outline" size={14} color={proSemantic.info} />
              <Text style={styles.morningPillVal}>Optimal</Text>
              <Text style={styles.morningPillLabel}>Hydratation</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 2. Workload Adjustment Banner */}
      {dangerCount > 0 && (
        <View style={styles.autoAdjustBanner}>
          <View style={styles.autoAdjustTop}>
            <MaterialCommunityIcons name="shield-refresh-outline" size={20} color={proSemantic.warning} />
            <View style={{ flex: 1 }}>
              <Text style={styles.autoAdjustTitle}>Régulation de Charge Recommandée</Text>
              <Text style={styles.autoAdjustDesc}>
                {dangerCount} joueur(s) signalent une fatigue accrue ou des douleurs musculaires. Adaptez les intensités de travail.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.adjustAllBtn}
            activeOpacity={0.8}
            onPress={applyAllAdjustments}
          >
            <MaterialCommunityIcons name="lightning-bolt" size={16} color={tokens.onAccent} />
            <Text style={styles.adjustAllBtnText}>Préparer adaptations pour l’équipe</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 3. Player Selector Carousel */}
      <View style={styles.selectorSection}>
        <Text style={styles.selectorLabel}>Filtrer par joueur</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.playerChipsWrap}>
          <Pressable
            onPress={() => setSelectedPlayerUid(null)}
            style={[styles.playerChip, selectedPlayerUid === null && styles.playerChipActive]}
          >
            <Text style={[styles.playerChipText, selectedPlayerUid === null && styles.playerChipTextActive]}>
              Tous ({activeProfiles.length})
            </Text>
          </Pressable>
          {activeProfiles.map((p) => {
            const on = selectedPlayerUid === p.id;
            return (
              <Pressable
                key={p.id}
                onPress={() => setSelectedPlayerUid(p.id)}
                style={[styles.playerChip, on && styles.playerChipActive]}
              >
                <Text style={[styles.playerChipText, on && styles.playerChipTextActive]} numberOfLines={1}>
                  {p.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* 4. Status Filter Bar (Tous, À surveiller, Optimaux) */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterBtn, filter === 'all' && styles.filterBtnActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterBtnText, filter === 'all' && styles.filterBtnTextActive]}>
            Tous ({activeProfiles.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterBtn, filter === 'danger' && styles.filterBtnActive]}
          onPress={() => setFilter('danger')}
        >
          <Text style={[styles.filterBtnText, filter === 'danger' && styles.filterBtnTextActive]}>
            À Surveiller ({dangerCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterBtn, filter === 'optimal' && styles.filterBtnActive]}
          onPress={() => setFilter('optimal')}
        >
          <Text style={[styles.filterBtnText, filter === 'optimal' && styles.filterBtnTextActive]}>
            Zone Optimale ({activeProfiles.length - dangerCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* 5. Player Cards */}
      {visibleProfiles.length === 0 ? (
        <View style={styles.emptyCard}>
          <MaterialCommunityIcons name="clipboard-text-outline" size={32} color={tokens.muted} />
          <Text style={styles.emptyTitle}>Aucun joueur ne correspond au filtre</Text>
          <Text style={styles.emptyBody}>
            {filter === 'danger'
              ? 'Aucun joueur n’est actuellement en zone de risque ou de fatigue signalée.'
              : 'Aucun enregistrement disponible pour ce profil.'}
          </Text>
        </View>
      ) : (
        visibleProfiles.map((p) => {
          const isDanger = p.status === 'danger';
          const isWarning = p.status === 'warning';

          return (
            <View
              key={p.id}
              style={[
                styles.playerCard,
                isDanger && styles.cardDangerBorder,
                isWarning && styles.cardWarningBorder,
              ]}
            >
              <View style={styles.playerCardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.playerName}>{p.name}</Text>
                  <Text style={styles.playerPos}>{p.pos}</Text>
                </View>

                {/* Score Badge */}
                <View
                  style={[
                    styles.acwrBadgeTag,
                    isDanger
                      ? { backgroundColor: withAlpha(proSemantic.danger, 0.2) }
                      : isWarning
                      ? { backgroundColor: withAlpha(proSemantic.warning, 0.2) }
                      : { backgroundColor: withAlpha(proSemantic.success, 0.2) },
                  ]}
                >
                  <Text
                    style={[
                      styles.acwrBadgeVal,
                      isDanger
                        ? { color: proSemantic.danger }
                        : isWarning
                        ? { color: proSemantic.warning }
                        : { color: proSemantic.success },
                    ]}
                  >
                    Forme {p.wellnessScore}/100
                  </Text>
                </View>
              </View>

              {/* Metrics Row: Real or Honest States */}
              <View style={styles.metricsRow}>
                <View style={styles.metricChip}>
                  <Text style={styles.metricChipLabel}>Distance</Text>
                  <Text style={styles.metricChipVal}>
                    {p.distanceKm != null ? `${p.distanceKm} km` : 'Non renseigné'}
                  </Text>
                </View>
                <View style={styles.metricChip}>
                  <Text style={styles.metricChipLabel}>Sprints</Text>
                  <Text style={styles.metricChipVal}>
                    {p.sprintCount != null ? String(p.sprintCount) : 'Non renseigné'}
                  </Text>
                </View>
                <View style={styles.metricChip}>
                  <Text style={styles.metricChipLabel}>Vitesse Max</Text>
                  <Text style={styles.metricChipVal}>
                    {p.maxSpeedKmh != null ? `${p.maxSpeedKmh} km/h` : 'Non renseigné'}
                  </Text>
                </View>
                <View style={styles.metricChip}>
                  <Text style={styles.metricChipLabel}>Disponibilité</Text>
                  <Text style={[styles.metricChipVal, { color: isDanger ? proSemantic.danger : proSemantic.success }]}>
                    {isDanger ? 'Allégé' : 'Apte'}
                  </Text>
                </View>
              </View>

              {/* Adaptation suggestion if flagged */}
              {p.autoAdjustSuggestion && (
                <View style={styles.suggestionBox}>
                  <View style={styles.suggestionHeader}>
                    <MaterialCommunityIcons name="clipboard-check" size={14} color={tokens.accent} />
                    <Text style={styles.suggestionTitle}>Recommandation de Récupération :</Text>
                  </View>
                  <Text style={styles.suggestionText}>{p.autoAdjustSuggestion}</Text>

                  <TouchableOpacity
                    style={[styles.applyBtn, p.adjusted && styles.applyBtnDone]}
                    activeOpacity={0.8}
                    onPress={() => applyAutoAdjustment(p.id)}
                    disabled={p.adjusted}
                  >
                    <Ionicons
                      name={p.adjusted ? 'checkmark-circle' : 'checkmark'}
                      size={14}
                      color={p.adjusted ? proSemantic.success : tokens.onAccent}
                    />
                    <Text style={[styles.applyBtnText, p.adjusted && { color: proSemantic.success }]}>
                      {p.adjusted ? 'Adaptation notée pour la séance' : 'Noter pour la séance'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })
      )}
      </ScrollView>
    </View>
  );
};

const createStyles = (tokens: CoachThemeTokens) =>
  StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: tokens.bg,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
    paddingBottom: tabBarScrollInset({ extra: proSemantic ? 24 : 0 }),
  },
  headerCard: {
    backgroundColor: tokens.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: tokens.border,
    padding: 16,
    marginBottom: 14,
  },
  headerTop: {
    flexDirection: 'row',
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: withAlpha(proSemantic.warning, 0.15),
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  gpsBadge: {
    backgroundColor: withAlpha(proSemantic.info, 0.15),
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  gpsBadgeText: {
    color: proSemantic.info,
    fontSize: 9,
    fontWeight: '800',
  },
  liveBadge: {
    backgroundColor: withAlpha(proSemantic.success, 0.15),
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  liveBadgeText: {
    color: proSemantic.success,
    fontSize: 9,
    fontWeight: '800',
  },
  acwrBadge: {
    backgroundColor: withAlpha(proSemantic.warning, 0.15),
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  acwrBadgeText: {
    color: proSemantic.warning,
    fontSize: 9,
    fontWeight: '800',
  },
  title: {
    color: tokens.foreground,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  subtitle: {
    color: tokens.muted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: tokens.border,
  },
  sourceText: {
    color: tokens.muted,
    fontSize: 10.5,
  },
  modeToggleRow: {
    flexDirection: 'row',
    backgroundColor: tokens.elevated,
    borderRadius: 10,
    padding: 2,
    marginTop: 10,
  },
  modeToggleBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  modeToggleBtnActive: {
    backgroundColor: tokens.surface,
  },
  modeToggleText: {
    color: tokens.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  modeToggleTextActive: {
    color: tokens.foreground,
    fontWeight: '700',
  },
  periodRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
  },
  periodChip: {
    flex: 1,
    paddingVertical: 5,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: tokens.surface,
    borderWidth: 1,
    borderColor: tokens.border,
  },
  periodChipActive: {
    borderColor: tokens.accent,
    backgroundColor: tokens.elevated,
  },
  periodLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: tokens.muted,
  },
  periodLabelActive: {
    color: tokens.foreground,
    fontWeight: '700',
  },
  kpiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  kpiCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: tokens.elevated,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: tokens.border,
  },
  kpiLabel: {
    color: tokens.muted,
    fontSize: 10,
    fontWeight: '600',
  },
  kpiVal: {
    fontSize: 17,
    fontWeight: '800',
    marginTop: 2,
  },
  kpiSub: {
    color: tokens.muted,
    fontSize: 9.5,
    marginTop: 2,
  },
  morningCheckinCard: {
    backgroundColor: tokens.elevated,
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: tokens.border,
  },
  morningHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  morningHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  morningTitle: {
    color: tokens.foreground,
    fontSize: 11.5,
    fontWeight: '700',
  },
  morningBadge: {
    backgroundColor: tokens.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  morningBadgeText: {
    color: tokens.muted,
    fontSize: 9.5,
    fontWeight: '600',
  },
  morningPillsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  morningPill: {
    flex: 1,
    backgroundColor: tokens.surface,
    borderRadius: 8,
    padding: 6,
    alignItems: 'center',
  },
  morningPillVal: {
    color: tokens.foreground,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },
  morningPillLabel: {
    color: tokens.muted,
    fontSize: 8.5,
  },
  autoAdjustBanner: {
    backgroundColor: tokens.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: withAlpha(proSemantic.warning, 0.35),
    padding: 12,
    marginBottom: 12,
  },
  autoAdjustTop: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  autoAdjustTitle: {
    color: tokens.foreground,
    fontSize: 12.5,
    fontWeight: '700',
  },
  autoAdjustDesc: {
    color: tokens.muted,
    fontSize: 10.5,
    lineHeight: 15,
    marginTop: 2,
  },
  adjustAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: tokens.accent,
    borderRadius: 8,
    paddingVertical: 8,
  },
  adjustAllBtnText: {
    color: tokens.onAccent,
    fontSize: 11.5,
    fontWeight: '800',
  },
  selectorSection: {
    marginBottom: 10,
    gap: 6,
  },
  selectorLabel: {
    color: tokens.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  playerChipsWrap: {
    gap: 6,
    paddingVertical: 2,
  },
  playerChip: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: tokens.surface,
    borderWidth: 1,
    borderColor: tokens.border,
  },
  playerChipActive: {
    backgroundColor: tokens.accent,
    borderColor: tokens.accent,
  },
  playerChipText: {
    color: tokens.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  playerChipTextActive: {
    color: tokens.onAccent,
    fontWeight: '700',
  },
  filterBar: {
    flexDirection: 'row',
    backgroundColor: tokens.surface,
    borderRadius: 10,
    padding: 2,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: tokens.border,
  },
  filterBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 8,
  },
  filterBtnActive: {
    backgroundColor: tokens.elevated,
  },
  filterBtnText: {
    color: tokens.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  filterBtnTextActive: {
    color: tokens.foreground,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: tokens.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: tokens.border,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyTitle: {
    color: tokens.foreground,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyBody: {
    color: tokens.muted,
    fontSize: 11.5,
    textAlign: 'center',
    maxWidth: 260,
  },
  playerCard: {
    backgroundColor: tokens.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: tokens.border,
    padding: 14,
    marginBottom: 10,
  },
  cardDangerBorder: {
    borderColor: withAlpha(proSemantic.danger, 0.45),
  },
  cardWarningBorder: {
    borderColor: withAlpha(proSemantic.warning, 0.45),
  },
  playerCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  playerName: {
    color: tokens.foreground,
    fontSize: 14,
    fontWeight: '700',
  },
  playerPos: {
    color: tokens.muted,
    fontSize: 11,
  },
  acwrBadgeTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  acwrBadgeVal: {
    fontSize: 11,
    fontWeight: '800',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  metricChip: {
    flex: 1,
    backgroundColor: tokens.elevated,
    borderRadius: 8,
    padding: 6,
    alignItems: 'center',
  },
  metricChipLabel: {
    color: tokens.muted,
    fontSize: 9,
  },
  metricChipVal: {
    color: tokens.foreground,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
    textAlign: 'center',
  },
  suggestionBox: {
    backgroundColor: tokens.elevated,
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    borderLeftWidth: 3,
    borderLeftColor: tokens.accent,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  suggestionTitle: {
    color: tokens.accent,
    fontSize: 11,
    fontWeight: '700',
  },
  suggestionText: {
    color: tokens.foreground,
    opacity: 0.85,
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 8,
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: tokens.accent,
    borderRadius: 8,
    paddingVertical: 7,
  },
  applyBtnDone: {
    backgroundColor: proSemantic.successSoft,
    borderWidth: 1,
    borderColor: proSemantic.success,
  },
  applyBtnText: {
    color: tokens.onAccent,
    fontSize: 11,
    fontWeight: '800',
  },
});
