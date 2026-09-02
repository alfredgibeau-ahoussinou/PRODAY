import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View, Share } from 'react-native';
import type { User } from '../../models/User';
import type { HealthSnapshot } from '../../core/types/health';
import { PlayerCardReveal } from '../joueur/PlayerCardReveal';
import { userToProDayCard } from '../../utils/prodayFutCard';
import { resolveJoueurAgeGroup, resolveJoueurGenderVisual } from '../../utils/joueurExperienceTheme';
import { resolveJoueurPageIdentity } from '../../content/joueurPageIdentity';
import { JoueurIdentityProvider } from './joueurPortalUi';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import { useJoueurProgress } from '../../context/JoueurProgressContext';
import { ProDayText } from '../ui/ProDayText';
import { PressableSpring } from '../motion';
import { joueurGamePress } from '../../features/joueur/joueurSfx';
import { FORM_BAND_LABELS, formatFormScore, playerFormFromHealthSnapshot } from '../../utils/formAnalysis';
import { usePlayerThemeColors } from '../../context/PlayerThemeContext';
import { PLAYER_DARK, PLAYER_DARK_RADIUS } from '../../theme/playerDarkPremium';
import { spacing } from '../../theme/designTokens';
import { Icon, type IconName } from '../ui/Icon';
import { getProfileCompletion } from '../../utils/profileCompletion';
import { resolvePlayerShieldWidth } from '../../utils/playerShieldLayout';

type Props = {
  profile: User;
  health: HealthSnapshot;
  gateAge?: number | null;
  gateGender?: string | null;
  gateAgeGroup?: 'youth' | 'teen' | 'adult' | null;
  onEdit?: () => void;
  onOpenThemeSettings?: () => void;
};

function SocialStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.socialStat}>
      <ProDayText variant="section" style={styles.socialValue}>
        {value}
      </ProDayText>
      <ProDayText variant="caption" style={styles.socialLabel}>
        {label}
      </ProDayText>
    </View>
  );
}

function SectionCard({
  kicker,
  title,
  children,
  actionLabel,
  onAction,
  accent,
  accentAlt,
  accentSoft,
}: {
  kicker: string;
  title: string;
  children: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  accent: string;
  accentAlt: string;
  accentSoft: string;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <View style={styles.sectionTitles}>
          <ProDayText variant="caption" style={[styles.sectionKicker, { color: accent }]}>
            {kicker}
          </ProDayText>
          <ProDayText variant="section" style={styles.sectionTitle}>
            {title}
          </ProDayText>
        </View>
        {actionLabel && onAction ? (
          <PressableSpring
            onPress={onAction}
            scaleTo={0.98}
            haptic
            style={[
              styles.sectionAction,
              {
                borderColor: `${accent}66`,
                backgroundColor: accentSoft,
              },
            ]}
          >
            <ProDayText variant="caption" style={[styles.sectionActionText, { color: accentAlt }]}>
              {actionLabel}
            </ProDayText>
          </PressableSpring>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function GoalRow({
  icon,
  label,
  value,
  hint,
  onPress,
  accentAlt,
  accentSoft,
}: {
  icon: IconName;
  label: string;
  value: string;
  hint?: string;
  onPress?: () => void;
  accentAlt: string;
  accentSoft: string;
}) {
  return (
    <PressableSpring
      onPress={onPress}
      scaleTo={0.98}
      haptic={Boolean(onPress)}
      disabled={!onPress}
      style={styles.goalRow}
    >
      <View style={[styles.goalIcon, { backgroundColor: accentSoft }]}>
        <Icon name={icon} size={18} color={accentAlt} variant="outline" />
      </View>
      <View style={styles.goalCopy}>
        <ProDayText variant="caption" style={styles.goalLabel}>
          {label}
        </ProDayText>
        <ProDayText variant="section" style={styles.goalValue}>
          {value}
        </ProDayText>
        {hint ? (
          <ProDayText variant="caption" style={styles.goalHint}>
            {hint}
          </ProDayText>
        ) : null}
      </View>
      {onPress ? (
        <Icon name="chevron-forward" size={16} color={PLAYER_DARK.textMuted} variant="outline" />
      ) : null}
    </PressableSpring>
  );
}

export const JoueurProfileHub: React.FC<Props> = ({
  profile,
  health,
  gateAge,
  gateGender,
  gateAgeGroup,
  onEdit,
  onOpenThemeSettings,
}) => {
  const nav = useTabNavigationActions();
  const progressApi = useJoueurProgress();
  const playerTheme = usePlayerThemeColors();

  useEffect(() => {
    if (!progressApi?.ready) return;
    void progressApi.claimDaily('daily-card', 20, 1);
  }, [progressApi?.ready]);

  const ageGroup = useMemo(() => {
    if (gateAgeGroup) return gateAgeGroup;
    return resolveJoueurAgeGroup({
      age: gateAge ?? profile.profile.age,
      gender: gateGender ?? profile.profile.gender,
      birthDate: profile.profile.birth_date,
    });
  }, [gateAgeGroup, gateAge, gateGender, profile.profile.age, profile.profile.gender, profile.profile.birth_date]);

  const gender = useMemo(
    () => resolveJoueurGenderVisual(gateGender ?? profile.profile.gender),
    [gateGender, profile.profile.gender],
  );

  const identity = useMemo(
    () =>
      resolveJoueurPageIdentity({
        ageGroup,
        gender,
        displayName: profile.display_name,
      }),
    [ageGroup, gender, profile.display_name],
  );

  const card = useMemo(() => {
    const base = userToProDayCard(profile);
    const ovr = progressApi?.ovr;
    if (!ovr) return base;
    return { ...base, overall: ovr };
  }, [profile, progressApi?.ovr]);

  const form = useMemo(
    () => playerFormFromHealthSnapshot(profile.uid, profile.display_name, health),
    [profile.uid, profile.display_name, health],
  );

  const completion = useMemo(() => getProfileCompletion(profile), [profile]);
  const seasonStats = profile.profile.season_stats;
  const matchCount = seasonStats?.matches ?? card.matches ?? 0;
  const level = progressApi?.level.level ?? 1;
  const ovr = progressApi?.ovr ?? card.overall ?? 0;
  const stars = progressApi?.progress.stars ?? 0;
  const streak = progressApi?.progress.streakDays ?? 0;
  const clubLabel = profile.profile.club_id ? 'Club lié' : 'Sans club';
  const cardWidth = resolvePlayerShieldWidth();

  const press = (run: () => void) => {
    joueurGamePress();
    run();
  };

  return (
    <JoueurIdentityProvider identity={identity}>
      <View style={styles.root}>
        <View style={styles.heroBlock}>
          <PlayerCardReveal card={card} width={cardWidth} onPress={onEdit} />
          <View style={styles.socialRow}>
            <SocialStat label="Matchs" value={String(matchCount)} />
            <View style={styles.socialDivider} />
            <SocialStat label="Niveau" value={String(level)} />
            <View style={styles.socialDivider} />
            <SocialStat label="OVR" value={ovr > 0 ? String(ovr) : '—'} />
            <View style={styles.socialDivider} />
            <SocialStat label="Série" value={`${streak}j`} />
          </View>
        </View>

        <SectionCard
          kicker="Stats"
          title="Performance"
          actionLabel="Saison"
          onAction={() => press(() => nav.setActiveTab('feed'))}
          accent={playerTheme.accent}
          accentAlt={playerTheme.accentAlt}
          accentSoft={playerTheme.accentSoft}
        >
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <ProDayText variant="caption" style={styles.statLabel}>
                Forme
              </ProDayText>
              <ProDayText variant="title" style={styles.statValue}>
                {formatFormScore(form.formScore)}
              </ProDayText>
              <ProDayText variant="caption" style={styles.statHint}>
                {FORM_BAND_LABELS[form.band]}
              </ProDayText>
            </View>
            <View style={styles.statBox}>
              <ProDayText variant="caption" style={styles.statLabel}>
                Récup.
              </ProDayText>
              <ProDayText variant="title" style={styles.statValue}>
                {Math.round(health.recoveryScore)}%
              </ProDayText>
              <ProDayText variant="caption" style={styles.statHint}>
                Bien-être
              </ProDayText>
            </View>
            <View style={styles.statBox}>
              <ProDayText variant="caption" style={styles.statLabel}>
                Charge
              </ProDayText>
              <ProDayText variant="title" style={styles.statValue}>
                {Math.round(health.trainingLoad)}%
              </ProDayText>
              <ProDayText variant="caption" style={styles.statHint}>
                Entraînement
              </ProDayText>
            </View>
          </View>
        </SectionCard>

        <SectionCard
          kicker="Objectifs"
          title="Prochaines actions"
          accent={playerTheme.accent}
          accentAlt={playerTheme.accentAlt}
          accentSoft={playerTheme.accentSoft}
        >
          <GoalRow
            icon="football"
            label="Entraînement IA"
            value="Programme du jour"
            hint="Coach personnalisé"
            onPress={() => press(() => nav.openDashboard('train_ai'))}
            accentAlt={playerTheme.accentAlt}
            accentSoft={playerTheme.accentSoft}
          />
          <GoalRow
            icon="trophy"
            label="Matchs"
            value="Calendrier & convocations"
            onPress={() => press(() => nav.setActiveTab('matchs'))}
            accentAlt={playerTheme.accentAlt}
            accentSoft={playerTheme.accentSoft}
          />
          <GoalRow
            icon="stats-chart"
            label="Progression XP"
            value={`Niv. ${level} · ${progressApi?.level.xpIntoLevel ?? 0}/${progressApi?.level.xpForNext ?? 100} XP`}
            onPress={() => press(() => nav.setActiveTab('feed'))}
            accentAlt={playerTheme.accentAlt}
            accentSoft={playerTheme.accentSoft}
          />
        </SectionCard>

        <View style={styles.ctaRow}>
          {onEdit ? (
            <PressableSpring
              onPress={() => press(onEdit)}
              scaleTo={0.98}
              haptic
              style={[styles.editCta, { backgroundColor: playerTheme.accent }]}
            >
              <Icon name="person" size={18} color={PLAYER_DARK.bg} variant="filled" />
              <ProDayText variant="caption" style={styles.editCtaText}>
                Modifier profil
              </ProDayText>
            </PressableSpring>
          ) : null}

          <PressableSpring
            onPress={() => {
              joueurGamePress();
              void Share.share({
                title: `Carte FUT ProDay - ${profile.display_name}`,
                message: `⚽ Découvre ma Carte Joueur ProDay (Note OVR : ${ovr || 75}, Niveau : ${level}) ! Rejoins mon équipe sur ProDay : https://proday.app/joueur/${profile.uid}`,
              });
            }}
            scaleTo={0.98}
            haptic
            style={[
              styles.shareCta,
              {
                borderColor: `${playerTheme.accent}66`,
                backgroundColor: playerTheme.accentSoft,
              },
            ]}
          >
            <Icon name="share" size={18} color={playerTheme.accentAlt} variant="outline" />
            <ProDayText variant="caption" style={[styles.shareCtaText, { color: playerTheme.accentAlt }]}>
              Partager ma Carte
            </ProDayText>
          </PressableSpring>
        </View>

        {onOpenThemeSettings ? (
          <PressableSpring
            onPress={() => press(onOpenThemeSettings)}
            scaleTo={0.98}
            haptic
            style={[
              styles.themeShortcut,
              {
                borderColor: `${playerTheme.accent}55`,
                backgroundColor: playerTheme.accentSoft,
              },
            ]}
          >
            <Icon name="tune" size={18} color={playerTheme.accentAlt} variant="outline" />
            <View style={styles.themeShortcutCopy}>
              <ProDayText variant="section" style={styles.themeShortcutTitle}>
                Personnaliser mes couleurs
              </ProDayText>
              <ProDayText variant="caption" style={styles.themeShortcutSub}>
                ProDay, club ou palette perso
              </ProDayText>
            </View>
            <Icon name="chevron-forward" size={16} color={PLAYER_DARK.textMuted} variant="outline" />
          </PressableSpring>
        ) : null}

        <View style={styles.metaChips}>
          <View
            style={[
              styles.chip,
              {
                backgroundColor: playerTheme.accentSoft,
                borderColor: `${playerTheme.accent}44`,
              },
            ]}
          >
            <ProDayText variant="caption" style={[styles.chipText, { color: playerTheme.accentAlt }]}>
              {stars} étoiles
            </ProDayText>
          </View>
          <View
            style={[
              styles.chip,
              {
                backgroundColor: playerTheme.accentSoft,
                borderColor: `${playerTheme.accent}44`,
              },
            ]}
          >
            <ProDayText variant="caption" style={[styles.chipText, { color: playerTheme.accentAlt }]}>
              Profil {completion.percent}%
            </ProDayText>
          </View>
          <View
            style={[
              styles.chip,
              {
                backgroundColor: playerTheme.accentSoft,
                borderColor: `${playerTheme.accent}44`,
              },
            ]}
          >
            <ProDayText variant="caption" style={[styles.chipText, { color: playerTheme.accentAlt }]}>
              {clubLabel}
            </ProDayText>
          </View>
        </View>
      </View>
    </JoueurIdentityProvider>
  );
};

const styles = StyleSheet.create({
  root: {
    gap: spacing.md,
    paddingBottom: spacing.xl + spacing.lg,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    backgroundColor: PLAYER_DARK.bg,
  },
  heroBlock: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
    borderRadius: PLAYER_DARK_RADIUS.card,
    backgroundColor: PLAYER_DARK.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    width: '100%',
  },
  socialStat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  socialValue: {
    color: PLAYER_DARK.text,
    fontWeight: '800',
    fontSize: 18,
  },
  socialLabel: {
    color: PLAYER_DARK.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  socialDivider: {
    width: 1,
    height: 28,
    backgroundColor: PLAYER_DARK.border,
  },
  section: {
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
    borderRadius: PLAYER_DARK_RADIUS.card,
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: PLAYER_DARK.surfaceRaised,
  },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  sectionTitles: { flex: 1, gap: 2 },
  sectionKicker: {
    fontWeight: '800',
    letterSpacing: 1.6,
    fontSize: 10,
  },
  sectionTitle: {
    color: PLAYER_DARK.text,
    fontWeight: '800',
  },
  sectionAction: {
    borderWidth: 1,
    borderRadius: PLAYER_DARK_RADIUS.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  sectionActionText: {
    fontWeight: '800',
    fontSize: 11,
  },
  cardPreview: { alignItems: 'center', paddingVertical: spacing.xs },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    borderRadius: PLAYER_DARK_RADIUS.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
  },
  chipText: {
    fontWeight: '700',
    fontSize: 11,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statBox: {
    flex: 1,
    minWidth: 0,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
    backgroundColor: PLAYER_DARK.surface,
    padding: spacing.sm,
    gap: 2,
  },
  statLabel: {
    color: PLAYER_DARK.textMuted,
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  statValue: {
    color: PLAYER_DARK.text,
    fontWeight: '800',
    fontSize: 24,
    letterSpacing: -0.5,
  },
  statHint: {
    color: PLAYER_DARK.textDim,
    fontSize: 10,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
    backgroundColor: PLAYER_DARK.surface,
    padding: spacing.sm,
  },
  goalIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalCopy: { flex: 1, gap: 1, minWidth: 0 },
  goalLabel: {
    color: PLAYER_DARK.textMuted,
    fontWeight: '700',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  goalValue: {
    color: PLAYER_DARK.text,
    fontWeight: '800',
    fontSize: 14,
  },
  goalHint: {
    color: PLAYER_DARK.textDim,
    fontSize: 10,
  },
  ctaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  editCta: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: PLAYER_DARK_RADIUS.pill,
    paddingVertical: 14,
  },
  editCtaText: {
    color: PLAYER_DARK.bg,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  shareCta: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: PLAYER_DARK_RADIUS.pill,
    borderWidth: 1,
    paddingVertical: 14,
  },
  shareCtaText: {
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  themeShortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: PLAYER_DARK_RADIUS.card,
    padding: spacing.md,
  },
  themeShortcutCopy: {
    flex: 1,
    gap: 2,
  },
  themeShortcutTitle: {
    color: PLAYER_DARK.text,
    fontWeight: '800',
  },
  themeShortcutSub: {
    color: PLAYER_DARK.textMuted,
    fontSize: 11,
  },
  metaChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
});
