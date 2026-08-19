import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { User } from '../../models/User';
import type { HealthSnapshot } from '../../core/types/health';
import { PlayerCardReveal } from '../joueur/PlayerCardReveal';
import { userToProDayCard } from '../../utils/prodayFutCard';
import { resolveJoueurAgeGroup, resolveJoueurGenderVisual } from '../../utils/joueurExperienceTheme';
import { resolveJoueurPageIdentity, JOUEUR_SITE } from '../../content/joueurPageIdentity';
import { JoueurIdentityProvider, JoueurLevelBadge, JoueurXpBar } from './joueurPortalUi';
import { JoueurWorldScene } from '../../features/joueur/JoueurWorldScene';
import { JoueurArcadeShell } from '../../features/joueur/JoueurGameFx';
import { JoueurPricingStrip } from '../../features/joueur/JoueurPricingStrip';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import { useSubscriptionOptional } from '../../context/SubscriptionContext';
import { useJoueurProgress } from '../../context/JoueurProgressContext';
import { ProDayText } from '../ui/ProDayText';
import { PressableSpring } from '../motion';
import { joueurGamePress } from '../../features/joueur/joueurSfx';
import { FORM_BAND_LABELS, formatFormScore, playerFormFromHealthSnapshot } from '../../utils/formAnalysis';
import { PLAYER_DARK } from '../../theme/playerDarkPremium';
import { spacing } from '../../theme/designTokens';

type Props = {
  profile: User;
  health: HealthSnapshot;
  gateAge?: number | null;
  gateGender?: string | null;
  gateAgeGroup?: 'youth' | 'teen' | 'adult' | null;
  onEdit?: () => void;
  onPreferences?: () => void;
};

export const JoueurProfileHub: React.FC<Props> = ({
  profile,
  health,
  gateAge,
  gateGender,
  gateAgeGroup,
  onEdit,
  onPreferences,
}) => {
  const nav = useTabNavigationActions();
  const subscription = useSubscriptionOptional();
  const progressApi = useJoueurProgress();

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

  const sceneKind =
    ageGroup === 'youth' ? 'pitch_playful' : ageGroup === 'teen' ? 'pitch_dynamic' : 'pitch_data';

  const position = profile.profile.position || '—';
  const club = profile.profile.club_id ? 'Club lié' : 'Sans club';

  const openPass = () => {
    joueurGamePress();
    if (subscription?.openPlansScreen) subscription.openPlansScreen();
    else nav.openDashboard('train');
  };

  const openCoach = () => {
    joueurGamePress();
    nav.openDashboard('train');
  };

  return (
    <JoueurIdentityProvider identity={identity}>
      <JoueurArcadeShell identity={identity} liveLabel="CARTE" bootSound={false}>
        <View style={styles.stack}>
          <View style={styles.heroShell}>
            <JoueurWorldScene identity={identity} kind={sceneKind} height={186} compact showBanner={false} />
            <LinearGradient
              colors={['transparent', 'rgba(7,11,20,0.70)', 'rgba(7,11,20,0.95)']}
              style={styles.heroFade}
              pointerEvents="none"
            />
            <View style={styles.heroOverlay}>
              <View style={styles.heroTop}>
                <View style={styles.heroTopLeft}>
                  <ProDayText variant="caption" style={[styles.heroKicker, { color: identity.accent }]}>
                    {identity.hudLabel}
                  </ProDayText>
                  <View style={[styles.verifiedPill, { borderColor: `${identity.accent}88` }]}>
                    <ProDayText variant="caption" style={[styles.verifiedText, { color: identity.accent }]}>
                      JOUEUR VÉRIFIÉ
                    </ProDayText>
                  </View>
                </View>
                <JoueurLevelBadge level={progressApi?.level.level ?? 1} label="NIV" />
              </View>
              <ProDayText variant="title" numberOfLines={1} style={styles.heroName}>
                {profile.display_name}
              </ProDayText>
              <ProDayText variant="caption" numberOfLines={1} style={styles.heroMeta}>
                {position} · {club} · {profile.email ?? 'profil@proday.app'}
              </ProDayText>
            </View>
          </View>

          <View style={styles.metricRow}>
            {(
              [
                { label: 'NOTE', value: String(progressApi?.ovr ?? card.overall) },
                { label: 'NIV', value: String(progressApi?.level.level ?? 1) },
                { label: 'ÉTOILES', value: String(progressApi?.progress.stars ?? 0) },
                { label: 'SÉRIE', value: `${progressApi?.progress.streakDays ?? 0}j` },
              ] as const
            ).map((m) => (
              <View key={m.label} style={styles.metricCard}>
                <ProDayText variant="caption" style={styles.metricLabel}>
                  {m.label}
                </ProDayText>
                <ProDayText variant="section" style={styles.metricValue}>
                  {m.value}
                </ProDayText>
              </View>
            ))}
          </View>

          <View style={styles.futCardBlock}>
            <LinearGradient
              colors={[`${identity.accent}22`, 'transparent']}
              style={styles.futTopShine}
              pointerEvents="none"
            />
            <View style={styles.futCardWrap}>
              <PlayerCardReveal
                card={card}
                width={240}
                onPress={() => nav.setActiveTab('profil')}
              />
            </View>
            <View style={styles.actionsGrid}>
              {(
                [
                  { label: 'ENTRAÎNER', run: () => nav.openDashboard('train') },
                  { label: 'TERRAIN', run: () => nav.openMatchs() },
                  { label: 'MESSAGES', run: () => nav.setActiveTab('messages') },
                  { label: 'MERCATO', run: () => nav.openMercato('home') },
                ] as const
              ).map((a) => (
                <PressableSpring
                  key={a.label}
                  onPress={() => {
                    joueurGamePress();
                    a.run();
                  }}
                  scaleTo={0.98}
                  haptic
                  style={[
                    styles.actionBtn,
                    { borderColor: `${identity.accent}66`, backgroundColor: 'rgba(8,14,24,0.52)' },
                  ]}
                >
                  <ProDayText variant="caption" style={styles.actionText}>
                    {a.label}
                  </ProDayText>
                </PressableSpring>
              ))}
            </View>
          </View>

          <View style={styles.panel}>
            <View style={styles.panelHead}>
              <ProDayText variant="caption" style={[styles.panelKicker, { color: identity.accent }]}>
                PERFORMANCE
              </ProDayText>
              <ProDayText variant="title" style={[styles.formScore, { color: identity.accentBright }]}>
                {formatFormScore(form.formScore)}
              </ProDayText>
            </View>
            <ProDayText variant="caption" style={styles.formBand}>
              {FORM_BAND_LABELS[form.band]}
            </ProDayText>
            <JoueurXpBar label="Récupération" value={Math.round(health.recoveryScore)} color={identity.accent} />
            <JoueurXpBar label="Charge" value={Math.round(health.trainingLoad)} color={JOUEUR_SITE.warn} />
            <JoueurXpBar
              label="XP vers prochain niveau"
              value={progressApi?.level.xpIntoLevel ?? 0}
              max={progressApi?.level.xpForNext ?? 100}
              color={identity.accent}
            />
          </View>

          <View style={styles.panel}>
            <ProDayText variant="caption" style={[styles.panelKicker, { color: identity.accent }]}>
              PROGRESSION
            </ProDayText>
            <ProDayText variant="section" style={styles.boostTitle}>
              Passe IA + Coach terrain
            </ProDayText>
            <ProDayText variant="caption" style={styles.boostBody}>
              Construis une routine complète entre séances IA, feedback humain et plan de montée.
            </ProDayText>
            <View style={styles.boostActions}>
              <PressableSpring
                onPress={openPass}
                scaleTo={0.98}
                haptic
                style={[styles.primaryCta, { backgroundColor: identity.accent }]}
              >
                <ProDayText variant="caption" style={styles.primaryCtaText}>
                  Activer Pass IA
                </ProDayText>
              </PressableSpring>
              <PressableSpring onPress={openCoach} scaleTo={0.98} style={styles.secondaryCta}>
                <ProDayText variant="caption" style={styles.secondaryCtaText}>
                  Coach {JOUEUR_SITE.coachPriceEur}€
                </ProDayText>
              </PressableSpring>
            </View>
          </View>

          <JoueurPricingStrip
            accent={identity.accent}
            onOpenPass={openPass}
            onOpenCoach={openCoach}
            onOpenFree={() => nav.setActiveTab('home')}
          />

          {(onEdit || onPreferences) && (
            <View style={styles.footerLinks}>
              {onEdit ? (
                <PressableSpring onPress={onEdit} scaleTo={0.98} style={styles.footerLink}>
                  <ProDayText variant="caption" style={styles.footerText}>
                    Modifier profil
                  </ProDayText>
                </PressableSpring>
              ) : null}
              {onPreferences ? (
                <PressableSpring onPress={onPreferences} scaleTo={0.98} style={styles.footerLink}>
                  <ProDayText variant="caption" style={styles.footerText}>
                    Préférences
                  </ProDayText>
                </PressableSpring>
              ) : null}
            </View>
          )}
        </View>
      </JoueurArcadeShell>
    </JoueurIdentityProvider>
  );
};

const styles = StyleSheet.create({
  stack: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  heroShell: {
    borderRadius: 22,
    overflow: 'hidden',
    minHeight: 186,
  },
  heroFade: {
    ...StyleSheet.absoluteFillObject,
  },
  heroOverlay: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
    gap: 4,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTopLeft: {
    gap: 6,
  },
  heroKicker: {
    fontWeight: '900',
    letterSpacing: 2,
    fontSize: 10,
  },
  verifiedPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(8,14,24,0.75)',
  },
  verifiedText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  heroName: {
    color: JOUEUR_SITE.foreground,
    fontWeight: '800',
    fontSize: 31,
    letterSpacing: -0.7,
  },
  heroMeta: {
    color: JOUEUR_SITE.muted,
    fontWeight: '600',
  },
  metricRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metricCard: {
    width: '23%',
    minWidth: 72,
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
    borderRadius: 14,
    padding: spacing.sm,
    backgroundColor: PLAYER_DARK.surface,
  },
  metricLabel: {
    color: JOUEUR_SITE.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  metricValue: {
    color: JOUEUR_SITE.foreground,
    marginTop: 2,
    fontWeight: '800',
  },
  futCardBlock: {
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
    borderRadius: 20,
    padding: spacing.md,
    backgroundColor: PLAYER_DARK.surface,
    gap: spacing.md,
    overflow: 'hidden',
  },
  futTopShine: {
    ...StyleSheet.absoluteFillObject,
    bottom: '70%',
  },
  futCardWrap: { alignItems: 'center' },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actionBtn: {
    width: '47%',
    flexGrow: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(8,14,24,0.72)',
  },
  actionText: {
    color: JOUEUR_SITE.foreground,
    fontWeight: '700',
    fontSize: 12,
  },
  panel: {
    borderWidth: 1,
    borderRadius: 18,
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: PLAYER_DARK.surfaceRaised,
    borderColor: PLAYER_DARK.border,
  },
  panelHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  panelKicker: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
  formBand: { color: JOUEUR_SITE.muted, marginTop: 2 },
  formScore: { fontWeight: '800', fontSize: 32, letterSpacing: -1 },
  boostTitle: {
    color: JOUEUR_SITE.foreground,
    fontWeight: '700',
  },
  boostBody: {
    color: JOUEUR_SITE.muted,
    lineHeight: 18,
  },
  boostActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  primaryCta: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryCtaText: {
    color: '#070b14',
    fontWeight: '800',
  },
  secondaryCta: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderColor: JOUEUR_SITE.border,
  },
  secondaryCtaText: {
    color: JOUEUR_SITE.foreground,
    fontWeight: '800',
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingTop: spacing.xs,
  },
  footerLink: { paddingVertical: 6 },
  footerText: {
    color: JOUEUR_SITE.muted,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
