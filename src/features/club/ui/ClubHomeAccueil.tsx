/**
 * Composition visuelle Accueil Club — Cockpit exécutif, moderne et épuré.
 * Design System Obsidian Glass avec 0 émoji unicode.
 */
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PressableSpring, AnimatedEntrance } from '../../../components/motion';
import { Icon } from '../../../components/ui/Icon';
import type { IconName } from '../../../components/ui/iconNames';
import type { TeamEvent } from '../../../models/TeamEvent';
import { useClubTheme } from '../shell/ClubThemeContext';
import { ClubStatusPill } from './clubUi';
import { ProDayText } from '../../../components/ui/ProDayText';
import {
  DEFAULT_STADIUM_INFO,
  type StadiumFacilityInfo,
  type PitchOccupancyStatus,
  type CoachActivityItem,
  type PlayerEngagementMetrics,
} from './clubFacilitiesModel';

function formatKickoffDay(d: Date): string {
  return d.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function formatClock(d: Date): string {
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export type ClubHomePriority =
  | { kind: 'match'; event: TeamEvent }
  | { kind: 'training'; event: TeamEvent }
  | { kind: 'calm' };

export type ClubHomeTodayChip = {
  id: string;
  kind: 'match' | 'training';
  label: string;
  time?: string;
  onPress: () => void;
};

export type ClubHomeTeamCard = {
  id?: string;
  teamId?: string;
  name: string;
  metaPrimary: string;
  metaSecondary: string;
  hasCoach: boolean;
  coachesLabel: string;
  onPress: () => void;
};

export type ClubHomeTodoItem = {
  id: string;
  icon: IconName;
  label: string;
  hint: string;
  onPress: () => void;
};

/** 1. Header Exécutif Club : Blason, Identité et Santé du Club */
export function ClubHomeIdentityHeader({
  greeting,
  clubName,
  statusLabel,
  statusTone,
  metaLine,
  onPressCrest,
  crestUploading,
  playersCount = 0,
  coachesCount = 0,
  teamsCount = 0,
  onPlayersPress,
  onCoachesPress,
  onTeamsPress,
}: {
  greeting: string;
  clubName: string;
  statusLabel: string;
  statusTone: 'ok' | 'warn' | 'alert';
  metaLine?: string;
  onPressCrest?: () => void;
  crestUploading?: boolean;
  playersCount?: number;
  coachesCount?: number;
  teamsCount?: number;
  onPlayersPress?: () => void;
  onCoachesPress?: () => void;
  onTeamsPress?: () => void;
}) {
  const { tokens, logoUrl } = useClubTheme();
  const crestLetter = (clubName.trim().charAt(0) || 'C').toUpperCase();
  const accent = tokens.accent;

  const crestInner = logoUrl ? (
    <Image source={{ uri: logoUrl }} style={styles.crestImg} resizeMode="cover" />
  ) : (
    <LinearGradient
      colors={['#1E222D', '#11131A']}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={styles.crestPh}
    >
      <ProDayText variant="title" style={[styles.crestLetter, { color: accent }]}>
        {crestLetter}
      </ProDayText>
    </LinearGradient>
  );

  return (
    <View style={styles.headerCard}>
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.04)', 'rgba(255, 255, 255, 0.01)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={styles.headerTop}>
        <PressableSpring
          onPress={onPressCrest}
          disabled={!onPressCrest || crestUploading}
          scaleTo={0.94}
          haptic={Boolean(onPressCrest)}
          style={[styles.crestWrap, { borderColor: `${accent}40` }]}
          accessibilityRole={onPressCrest ? 'button' : undefined}
          accessibilityLabel={logoUrl ? 'Changer le logo du club' : 'Ajouter le logo du club'}
        >
          {crestUploading ? (
            <View style={[styles.crestPh, { backgroundColor: '#181822' }]}>
              <ProDayText variant="caption" style={{ color: '#8E8E9F' }}>
                ...
              </ProDayText>
            </View>
          ) : (
            crestInner
          )}
          {onPressCrest && !crestUploading ? (
            <View style={[styles.crestCameraBadge, { backgroundColor: accent }]}>
              <Icon name="camera" size={10} color="#000000" />
            </View>
          ) : null}
        </PressableSpring>

        <View style={styles.headerInfo}>
          <View style={styles.statusRow}>
            <ClubStatusPill label={statusLabel} tone={statusTone} />
            <View style={styles.badgePill}>
              <Icon name="shield" size={10} color={accent} />
              <ProDayText variant="caption" style={[styles.badgePillText, { color: accent }]}>
                BALL CLUB
              </ProDayText>
            </View>
          </View>

          <ProDayText variant="title" numberOfLines={1} style={styles.clubTitle}>
            {clubName}
          </ProDayText>

          <ProDayText variant="caption" style={styles.greetingSub}>
            {greeting} · Saison 2026/2027
          </ProDayText>
        </View>
      </View>

      {/* Bandeau KPI Santé du Club */}
      <View style={styles.kpiBar}>
        <PressableSpring onPress={onPlayersPress} scaleTo={0.96} haptic style={styles.kpiCell}>
          <View style={styles.kpiLabelRow}>
            <Icon name="people" size={12} color={accent} />
            <ProDayText variant="caption" style={styles.kpiLabel}>
              Licenciés
            </ProDayText>
          </View>
          <ProDayText variant="section" style={styles.kpiValue}>
            {playersCount}
          </ProDayText>
        </PressableSpring>

        <View style={styles.kpiDivider} />

        <PressableSpring onPress={onTeamsPress} scaleTo={0.96} haptic style={styles.kpiCell}>
          <View style={styles.kpiLabelRow}>
            <Icon name="football" size={12} color="#3B82F6" />
            <ProDayText variant="caption" style={styles.kpiLabel}>
              Équipes
            </ProDayText>
          </View>
          <ProDayText variant="section" style={styles.kpiValue}>
            {teamsCount}
          </ProDayText>
        </PressableSpring>

        <View style={styles.kpiDivider} />

        <PressableSpring onPress={onCoachesPress} scaleTo={0.96} haptic style={styles.kpiCell}>
          <View style={styles.kpiLabelRow}>
            <Icon name="school" size={12} color="#10B981" />
            <ProDayText variant="caption" style={styles.kpiLabel}>
              Staff Coachs
            </ProDayText>
          </View>
          <ProDayText variant="section" style={styles.kpiValue}>
            {coachesCount}
          </ProDayText>
        </PressableSpring>
      </View>
    </View>
  );
}

/** 2. Carte Hero Match Center / Prochain Rendez-Vous */
export function ClubHomeNextEventRow({
  priority,
  teamLabel,
  locationLabel,
  onOpen,
  onConvocations,
  onPlan,
}: {
  priority: ClubHomePriority;
  teamLabel?: string;
  locationLabel?: string;
  onOpen: () => void;
  onConvocations?: () => void;
  onPlan?: () => void;
}) {
  const { tokens } = useClubTheme();

  if (priority.kind === 'calm') {
    return (
      <AnimatedEntrance kind="fadeUp" index={1} delayStep={30}>
        <View style={styles.calmBox}>
          <View style={styles.calmTop}>
            <View style={styles.calmIcon}>
              <Icon name="calendar" size={18} color="#10B981" />
            </View>
            <View style={styles.calmTextWrap}>
              <ProDayText variant="section" style={styles.calmHeading}>
                Terrain libre aujourd'hui
              </ProDayText>
              <ProDayText variant="caption" style={styles.calmSub}>
                Aucun match ni séance programmée dans les prochaines heures.
              </ProDayText>
            </View>
          </View>

          <View style={styles.calmButtons}>
            <PressableSpring onPress={onOpen} scaleTo={0.96} haptic style={styles.btnCalmOutline}>
              <Icon name="calendar" size={13} color="#FFFFFF" />
              <ProDayText variant="caption" style={styles.btnCalmOutlineText}>
                Calendrier club
              </ProDayText>
            </PressableSpring>
            {onPlan ? (
              <PressableSpring onPress={onPlan} scaleTo={0.96} haptic style={styles.btnCalmSolid}>
                <Icon name="add" size={14} color="#000000" />
                <ProDayText variant="caption" style={styles.btnCalmSolidText}>
                  Planifier
                </ProDayText>
              </PressableSpring>
            ) : null}
          </View>
        </View>
      </AnimatedEntrance>
    );
  }

  const isMatch = priority.kind === 'match';
  const event = priority.event;
  const starts = event.starts_at ? new Date(event.starts_at) : null;
  const clock = starts ? formatClock(starts) : null;
  const dayLabel = starts ? formatKickoffDay(starts) : null;
  const title = event.title?.trim() || (isMatch ? 'Prochain match' : 'Prochaine séance');
  const accentColor = isMatch ? '#3B82F6' : '#10B981';
  const metaBits = [teamLabel?.trim(), dayLabel, locationLabel?.trim()].filter(Boolean);

  return (
    <AnimatedEntrance kind="fadeUp" index={1} delayStep={30}>
      <View style={[styles.eventCard, { borderColor: `${accentColor}35` }]}>
        <LinearGradient
          colors={[`${accentColor}15`, 'rgba(12, 12, 18, 0.95)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        <View style={styles.eventHeaderRow}>
          <View style={[styles.eventBadge, { backgroundColor: `${accentColor}20`, borderColor: `${accentColor}50` }]}>
            <Icon name={isMatch ? 'trophy' : 'football'} size={11} color={accentColor} />
            <ProDayText variant="caption" style={[styles.eventBadgeText, { color: accentColor }]}>
              {isMatch ? 'MATCH OFFICIEL' : 'SÉANCE ENTRAÎNEMENT'}
            </ProDayText>
          </View>

          {clock ? (
            <View style={styles.clockPill}>
              <Icon name="time" size={11} color="#FFFFFF" />
              <ProDayText variant="caption" style={styles.clockPillText}>
                {clock}
              </ProDayText>
            </View>
          ) : null}
        </View>

        <ProDayText variant="section" numberOfLines={2} style={styles.eventMainTitle}>
          {title}
        </ProDayText>

        {metaBits.length > 0 ? (
          <View style={styles.eventLocationRow}>
            <Icon name="location" size={13} color="#8E8E9F" />
            <ProDayText variant="caption" numberOfLines={1} style={styles.eventLocationText}>
              {metaBits.join(' · ')}
            </ProDayText>
          </View>
        ) : null}

        <View style={styles.eventActionRow}>
          <PressableSpring onPress={onOpen} scaleTo={0.96} haptic style={styles.btnActionPrimary}>
            <ProDayText variant="caption" style={styles.btnActionPrimaryText}>
              {isMatch ? 'Feuille de match & Direct' : 'Détails de la séance'}
            </ProDayText>
            <Icon name="chevron-forward" size={12} color="#FFFFFF" />
          </PressableSpring>

          {onConvocations ? (
            <PressableSpring onPress={onConvocations} scaleTo={0.96} haptic style={styles.btnActionWarn}>
              <Icon name="people" size={12} color="#F59E0B" />
              <ProDayText variant="caption" style={styles.btnActionWarnText}>
                Convocations
              </ProDayText>
            </PressableSpring>
          ) : null}
        </View>
      </View>
    </AnimatedEntrance>
  );
}

/** 3. Section Équipes du Club : Catégories et Effectif */
export function ClubHomeTeamsRail({
  teams,
  onSeeAll,
  onCreateTeam,
}: {
  teams: ClubHomeTeamCard[];
  onSeeAll?: () => void;
  onCreateTeam?: () => void;
}) {
  const { tokens } = useClubTheme();

  return (
    <AnimatedEntrance kind="fadeUp" index={2} delayStep={30}>
      <View style={styles.blockSection}>
        <View style={styles.blockHead}>
          <View style={styles.blockHeadTitleRow}>
            <Icon name="football" size={15} color={tokens.accent} />
            <ProDayText variant="section" style={styles.blockTitle}>
              Équipes du Club
            </ProDayText>
          </View>
          {onSeeAll ? (
            <PressableSpring onPress={onSeeAll} scaleTo={0.96} haptic style={styles.linkRow}>
              <ProDayText variant="caption" style={[styles.linkText, { color: tokens.accent }]}>
                Voir tout ({teams.length})
              </ProDayText>
              <Icon name="chevron-forward" size={12} color={tokens.accent} />
            </PressableSpring>
          ) : null}
        </View>

        {teams.length === 0 ? (
          <View style={styles.emptyCard}>
            <Icon name="football" size={24} color="#6B6B7F" />
            <ProDayText variant="body" style={styles.emptyTitle}>
              Aucune équipe enregistrée
            </ProDayText>
            {onCreateTeam ? (
              <PressableSpring onPress={onCreateTeam} scaleTo={0.96} haptic style={styles.btnCalmSolid}>
                <Icon name="add" size={13} color="#000000" />
                <ProDayText variant="caption" style={styles.btnCalmSolidText}>
                  Créer la 1ère équipe
                </ProDayText>
              </PressableSpring>
            ) : null}
          </View>
        ) : (
          <View style={styles.teamGrid}>
            {teams.map((t) => (
              <PressableSpring
                key={t.id ?? t.teamId ?? t.name}
                onPress={t.onPress}
                scaleTo={0.97}
                haptic
                style={styles.teamTile}
              >
                <View style={styles.teamTileTop}>
                  <View style={styles.categoryPill}>
                    <ProDayText variant="caption" style={styles.categoryText}>
                      {t.metaPrimary}
                    </ProDayText>
                  </View>
                  <ProDayText variant="caption" style={styles.licCount}>
                    {t.metaSecondary}
                  </ProDayText>
                </View>

                <ProDayText variant="section" numberOfLines={1} style={styles.teamTileName}>
                  {t.name}
                </ProDayText>

                <View style={styles.teamTileBottom}>
                  <View style={styles.coachRow}>
                    <Icon
                      name="school"
                      size={11}
                      color={t.hasCoach ? '#10B981' : '#F59E0B'}
                    />
                    <ProDayText
                      variant="caption"
                      numberOfLines={1}
                      style={[
                        styles.coachName,
                        { color: t.hasCoach ? '#8E8E9F' : '#F59E0B' },
                      ]}
                    >
                      {t.coachesLabel}
                    </ProDayText>
                  </View>
                  <Icon name="chevron-forward" size={12} color="#6B6B7F" />
                </View>
              </PressableSpring>
            ))}
          </View>
        )}
      </View>
    </AnimatedEntrance>
  );
}

/** 4. Cockpit Alertes & À Traiter */
export function ClubHomeTodoSection({
  items,
  showSuccessWhenEmpty,
}: {
  items: ClubHomeTodoItem[];
  showSuccessWhenEmpty?: boolean;
}) {
  const { tokens } = useClubTheme();

  if (items.length === 0 && !showSuccessWhenEmpty) return null;

  return (
    <AnimatedEntrance kind="fadeUp" index={3} delayStep={30}>
      <View style={styles.blockSection}>
        <View style={styles.blockHead}>
          <View style={styles.blockHeadTitleRow}>
            <Icon name="checkmark-circle" size={15} color="#10B981" />
            <ProDayText variant="section" style={styles.blockTitle}>
              Alertes & Opérations
            </ProDayText>
          </View>
        </View>

        {items.length === 0 ? (
          <View style={styles.successCard}>
            <Icon name="checkmark-circle" size={16} color="#10B981" />
            <ProDayText variant="caption" style={styles.successText}>
              Toutes les opérations du club sont à jour.
            </ProDayText>
          </View>
        ) : (
          <View style={styles.todoBox}>
            {items.map((item) => (
              <PressableSpring
                key={item.id}
                onPress={item.onPress}
                scaleTo={0.98}
                haptic
                style={styles.todoRow}
              >
                <View style={styles.todoIconWrap}>
                  <Icon name={item.icon} size={15} color={tokens.accent} />
                </View>
                <View style={styles.todoTextCol}>
                  <ProDayText variant="body" numberOfLines={1} style={styles.todoTitle}>
                    {item.label}
                  </ProDayText>
                  <ProDayText variant="caption" numberOfLines={1} style={styles.todoSub}>
                    {item.hint}
                  </ProDayText>
                </View>
                <Icon name="chevron-forward" size={13} color="#8E8E9F" />
              </PressableSpring>
            ))}
          </View>
        )}
      </View>
    </AnimatedEntrance>
  );
}

/** 5. Widget Copilote IA Club */
export function ClubHomeAiBriefingCard({
  onOpenCopilot,
}: {
  onOpenCopilot?: () => void;
}) {
  return (
    <AnimatedEntrance kind="fadeUp" index={4} delayStep={30}>
      <PressableSpring
        onPress={onOpenCopilot}
        scaleTo={0.98}
        haptic
        style={styles.aiCard}
      >
        <LinearGradient
          colors={['rgba(139, 92, 246, 0.12)', 'rgba(12, 12, 18, 0.95)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={styles.aiHead}>
          <View style={styles.aiIcon}>
            <Icon name="star-four-points" size={15} color="#A78BFA" />
          </View>
          <View style={styles.aiTextCol}>
            <ProDayText variant="caption" style={styles.aiKicker}>
              COPILOTE IA DU CLUB
            </ProDayText>
            <ProDayText variant="section" style={styles.aiTitle}>
              Briefing Tactique & Opérations
            </ProDayText>
          </View>
          <Icon name="chevron-forward" size={14} color="#A78BFA" />
        </View>
        <ProDayText variant="caption" style={styles.aiBody}>
          Posez une question sur vos effectifs, la charge des séances ou demandez une analyse du week-end.
        </ProDayText>
      </PressableSpring>
    </AnimatedEntrance>
  );
}

/** 6. Section Installations & Occupation Terrains */
export function ClubHomeStadiumPitchSection({
  stadium = DEFAULT_STADIUM_INFO,
  occupancies = [],
  onOpenFacilities,
}: {
  stadium?: StadiumFacilityInfo;
  occupancies?: PitchOccupancyStatus[];
  onOpenFacilities?: () => void;
}) {
  const { tokens } = useClubTheme();

  return (
    <AnimatedEntrance kind="fadeUp" index={5} delayStep={30}>
      <View style={styles.blockSection}>
        <View style={styles.blockHead}>
          <View style={styles.blockHeadTitleRow}>
            <Icon name="location" size={15} color={tokens.accent} />
            <ProDayText variant="section" style={styles.blockTitle}>
              Stade & Terrains du Club
            </ProDayText>
          </View>
          {onOpenFacilities ? (
            <PressableSpring onPress={onOpenFacilities} scaleTo={0.96} haptic style={styles.linkRow}>
              <ProDayText variant="caption" style={[styles.linkText, { color: tokens.accent }]}>
                Planning terrains
              </ProDayText>
              <Icon name="chevron-forward" size={12} color={tokens.accent} />
            </PressableSpring>
          ) : null}
        </View>

        <View style={styles.stadiumCard}>
          <View style={styles.stadiumHeader}>
            <View style={styles.stadiumBadgeIcon}>
              <Icon name="trophy" size={16} color={tokens.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <ProDayText variant="section" style={styles.stadiumTitle}>
                {stadium.name}
              </ProDayText>
              <ProDayText variant="caption" style={styles.stadiumSub}>
                {stadium.city} · {stadium.turfLabel}
              </ProDayText>
            </View>
          </View>

          <View style={styles.stadiumMetricsRow}>
            <View style={styles.stadiumPill}>
              <Icon name="star" size={11} color="#F59E0B" />
              <ProDayText variant="caption" style={styles.stadiumPillText}>
                {stadium.lightingLabel}
              </ProDayText>
            </View>
            <View style={styles.stadiumPill}>
              <Icon name="people" size={11} color="#3B82F6" />
              <ProDayText variant="caption" style={styles.stadiumPillText}>
                {stadium.capacityLabel}
              </ProDayText>
            </View>
          </View>

          {occupancies.length > 0 ? (
            <View style={styles.pitchList}>
              {occupancies.map((p) => {
                const isActive = p.status === 'active';
                const isUpcoming = p.status === 'upcoming';
                const statusColor = isActive ? '#10B981' : isUpcoming ? '#F59E0B' : '#8E8E9F';

                return (
                  <View key={p.pitchId} style={styles.pitchRow}>
                    <View style={[styles.pitchDot, { backgroundColor: statusColor }]} />
                    <View style={{ flex: 1 }}>
                      <ProDayText variant="body" style={styles.pitchName}>
                        {p.pitchName}
                      </ProDayText>
                      <ProDayText variant="caption" numberOfLines={1} style={styles.pitchSub}>
                        {p.currentEventTitle} · {p.timeSlot}
                      </ProDayText>
                    </View>
                    <View style={[styles.statusTag, { backgroundColor: `${statusColor}18`, borderColor: `${statusColor}40` }]}>
                      <ProDayText variant="caption" style={[styles.statusTagText, { color: statusColor }]}>
                        {p.statusLabel}
                      </ProDayText>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : null}
        </View>
      </View>
    </AnimatedEntrance>
  );
}

/** 7. Fil d'Activité Récente du Staff Coachs */
export function ClubHomeCoachActivitySection({
  activities = [],
}: {
  activities?: CoachActivityItem[];
}) {
  const { tokens } = useClubTheme();
  if (activities.length === 0) return null;

  return (
    <AnimatedEntrance kind="fadeUp" index={6} delayStep={30}>
      <View style={styles.blockSection}>
        <View style={styles.blockHead}>
          <View style={styles.blockHeadTitleRow}>
            <Icon name="school" size={15} color="#10B981" />
            <ProDayText variant="section" style={styles.blockTitle}>
              Activité Staff Coachs
            </ProDayText>
          </View>
        </View>

        <View style={styles.activityBox}>
          {activities.map((act) => (
            <View key={act.id} style={styles.activityRow}>
              <View style={styles.activityIconWrap}>
                <Icon name={act.icon} size={14} color="#10B981" />
              </View>
              <View style={{ flex: 1 }}>
                <ProDayText variant="body" numberOfLines={1} style={styles.activityCoachName}>
                  {act.coachName}
                </ProDayText>
                <ProDayText variant="caption" numberOfLines={1} style={styles.activityActionTitle}>
                  {act.actionTitle}
                </ProDayText>
              </View>
              <ProDayText variant="caption" style={styles.activityTime}>
                {act.timestampLabel}
              </ProDayText>
            </View>
          ))}
        </View>
      </View>
    </AnimatedEntrance>
  );
}

/** 8. Métriques Engagement & Assiduité Joueurs */
export function ClubHomePlayerEngagementCard({
  metrics,
  onPress,
}: {
  metrics: PlayerEngagementMetrics;
  onPress?: () => void;
}) {
  const { tokens } = useClubTheme();

  return (
    <AnimatedEntrance kind="fadeUp" index={7} delayStep={30}>
      <PressableSpring onPress={onPress} scaleTo={0.98} haptic disabled={!onPress} style={styles.engagementCard}>
        <LinearGradient
          colors={['rgba(16, 185, 129, 0.10)', 'rgba(12, 12, 18, 0.95)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={styles.engagementHead}>
          <Icon name="stats-chart" size={16} color="#10B981" />
          <ProDayText variant="section" style={styles.engagementTitle}>
            Assiduité & Santé Opérationnelle
          </ProDayText>
          <View style={styles.engagementBadge}>
            <ProDayText variant="caption" style={styles.engagementBadgeText}>
              {metrics.weeklyAttendancePct}% Présence
            </ProDayText>
          </View>
        </View>

        <View style={styles.engagementMetricsRow}>
          <View style={styles.engagementCell}>
            <ProDayText variant="section" style={styles.engagementVal}>
              {metrics.confirmedRsvpsCount} / {metrics.totalConvocationsCount}
            </ProDayText>
            <ProDayText variant="caption" style={styles.engagementLbl}>
              RSVPs Confirmées
            </ProDayText>
          </View>

          <View style={styles.engagementDivider} />

          <View style={styles.engagementCell}>
            <ProDayText variant="section" style={styles.engagementVal}>
              {metrics.activePlayersCount}
            </ProDayText>
            <ProDayText variant="caption" style={styles.engagementLbl}>
              Joueurs Actifs
            </ProDayText>
          </View>
        </View>
      </PressableSpring>
    </AnimatedEntrance>
  );
}

// Compatibilité
export function ClubHomeMiniStats(props: any) {
  return null;
}
export function ClubHomeQuickActions(props: any) {
  return null;
}
export function ClubHomeInsightLine(props: any) {
  return null;
}
export function ClubHomeTodayPeek(props: any) {
  return null;
}
export function ClubHomeShortcutsGrid(props: any) {
  return null;
}

const styles = StyleSheet.create({
  headerCard: {
    backgroundColor: '#141418',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    gap: 14,
    overflow: 'hidden',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  crestWrap: {
    width: 54,
    height: 54,
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
    position: 'relative',
  },
  crestImg: {
    width: '100%',
    height: '100%',
  },
  crestPh: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  crestLetter: {
    fontSize: 22,
    fontWeight: '900',
  },
  crestCameraBadge: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 17,
    height: 17,
    borderRadius: 8.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    gap: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  badgePillText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  clubTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  greetingSub: {
    color: '#8B8B9A',
    fontSize: 12,
  },
  kpiBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  kpiCell: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  kpiLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  kpiLabel: {
    color: '#8B8B9A',
    fontSize: 10,
    fontWeight: '700',
  },
  kpiValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  kpiDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  calmBox: {
    backgroundColor: '#141418',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
    gap: 10,
  },
  calmTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  calmIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calmTextWrap: {
    flex: 1,
    gap: 2,
  },
  calmHeading: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  calmSub: {
    color: '#8B8B9A',
    fontSize: 11,
    lineHeight: 15,
  },
  calmButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  btnCalmOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#181820',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  btnCalmOutlineText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  btnCalmSolid: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  btnCalmSolidText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '800',
  },
  eventCard: {
    backgroundColor: '#141418',
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    gap: 10,
    overflow: 'hidden',
  },
  eventHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eventBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  eventBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  clockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  clockPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  eventMainTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  eventLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  eventLocationText: {
    color: '#8B8B9A',
    fontSize: 12,
  },
  eventActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  btnActionPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#181820',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9,
  },
  btnActionPrimaryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  btnActionWarn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9,
  },
  btnActionWarnText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '800',
  },
  blockSection: {
    gap: 10,
  },
  blockHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  blockHeadTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  blockTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  linkText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: '#141418',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    color: '#8B8B9A',
    fontSize: 13,
  },
  teamGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  teamTile: {
    width: '48.5%',
    backgroundColor: '#141418',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
    gap: 8,
  },
  teamTileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  licCount: {
    color: '#8B8B9A',
    fontSize: 10,
  },
  teamTileName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  teamTileBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  coachRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  coachName: {
    fontSize: 11,
    flex: 1,
  },
  successCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    padding: 12,
  },
  successText: {
    color: '#A7F3D0',
    fontSize: 12,
    flex: 1,
  },
  todoBox: {
    backgroundColor: '#141418',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  todoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  todoIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  todoTextCol: {
    flex: 1,
    gap: 2,
  },
  todoTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  todoSub: {
    color: '#7D7D92',
    fontSize: 11,
  },
  aiCard: {
    backgroundColor: '#101018',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    padding: 14,
    gap: 8,
    overflow: 'hidden',
  },
  aiHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  aiIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiTextCol: {
    flex: 1,
    gap: 1,
  },
  aiKicker: {
    color: '#A78BFA',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  aiTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  aiBody: {
    color: '#9CA3AF',
    fontSize: 12,
    lineHeight: 16,
  },
  stadiumCard: {
    backgroundColor: '#141418',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
    gap: 12,
  },
  stadiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stadiumBadgeIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stadiumTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  stadiumSub: {
    color: '#8E8E9F',
    fontSize: 11,
  },
  stadiumMetricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stadiumPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#181820',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  stadiumPillText: {
    color: '#D1D5DB',
    fontSize: 10,
    fontWeight: '600',
  },
  pitchList: {
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 10,
  },
  pitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#181820',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  pitchDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pitchName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  pitchSub: {
    color: '#8E8E9F',
    fontSize: 11,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: '800',
  },
  activityBox: {
    backgroundColor: '#141418',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
    gap: 10,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 2,
  },
  activityIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityCoachName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  activityActionTitle: {
    color: '#8E8E9F',
    fontSize: 11,
  },
  activityTime: {
    color: '#6B6B7F',
    fontSize: 10,
  },
  engagementCard: {
    backgroundColor: '#141418',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    padding: 14,
    gap: 12,
    overflow: 'hidden',
  },
  engagementHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  engagementTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    flex: 1,
  },
  engagementBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderColor: '#10B981',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  engagementBadgeText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '900',
  },
  engagementMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181820',
    borderRadius: 12,
    padding: 10,
  },
  engagementCell: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  engagementVal: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  engagementLbl: {
    color: '#8E8E9F',
    fontSize: 11,
  },
  engagementDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
});
