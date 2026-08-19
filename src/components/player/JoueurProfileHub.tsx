import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import type { User } from '../../models/User';
import type { HealthSnapshot } from '../../core/types/health';
import { ProDayFutCard } from '../cards/ProDayFutCard';
import { userToProDayCard } from '../../utils/prodayFutCard';
import { resolveJoueurAgeGroup, resolveJoueurGenderVisual } from '../../utils/joueurExperienceTheme';
import { resolveJoueurPageIdentity, JOUEUR_SITE } from '../../content/joueurPageIdentity';
import { JoueurIdentityProvider, JoueurXpBar } from './joueurPortalUi';
import { JoueurArcadeShell } from '../../features/joueur/JoueurGameFx';
import { JoueurPricingStrip } from '../../features/joueur/JoueurPricingStrip';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import { useSubscriptionOptional } from '../../context/SubscriptionContext';
import { useJoueurProgress } from '../../context/JoueurProgressContext';
import { ProDayText } from '../ui/ProDayText';
import { PressableSpring } from '../motion';
import { joueurGamePress } from '../../features/joueur/joueurSfx';
import { FORM_BAND_LABELS, formatFormScore, playerFormFromHealthSnapshot } from '../../utils/formAnalysis';
import { spacing, radius } from '../../theme/designTokens';

const PITCH = '#16A34A';
const LIGHT = {
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  border: 'rgba(15, 23, 42, 0.08)',
  ink: '#0F172A',
  muted: '#64748B',
};

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

  const position = profile.profile.position || '—';
  const club = profile.profile.club_id ? 'Club lié' : 'Sans club';
  const ovr = progressApi?.ovr ?? card.overall;
  const level = progressApi?.level.level ?? 1;

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
      <JoueurArcadeShell identity={identity} liveLabel="Profil" bootSound={false}>
        <View style={styles.stack}>
          <View style={styles.header}>
            <ProDayText variant="title" numberOfLines={1} style={styles.heroName}>
              {profile.display_name}
            </ProDayText>
            <ProDayText variant="caption" numberOfLines={1} style={styles.heroMeta}>
              {position} · {club}
            </ProDayText>
            <View style={styles.inlineStats}>
              <TextStat label="Note" value={String(ovr)} />
              <TextStat label="Niveau" value={String(level)} />
            </View>
          </View>

          <View style={styles.futCardWrap}>
            <ProDayFutCard
              card={card}
              width={220}
              onAction={(action) => {
                if (action === 'message') nav.setActiveTab('messages');
                if (action === 'view_club' || action === 'recruit') nav.openMercato('home');
                if (action === 'invite') nav.openMatchs();
              }}
            />
          </View>

          <View style={styles.actionsRow}>
            {(
              [
                { label: 'Entraîner', run: () => nav.openDashboard('train') },
                { label: 'Matchs', run: () => nav.openMatchs() },
                { label: 'Messages', run: () => nav.setActiveTab('messages') },
                { label: 'Mercato', run: () => nav.openMercato('home') },
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
                style={styles.actionBtn}
              >
                <ProDayText variant="caption" style={styles.actionText}>
                  {a.label}
                </ProDayText>
              </PressableSpring>
            ))}
          </View>

          <View style={styles.panel}>
            <View style={styles.panelHead}>
              <ProDayText variant="caption" style={styles.panelKicker}>
                Forme
              </ProDayText>
              <ProDayText variant="section" style={styles.formScore}>
                {formatFormScore(form.formScore)}
              </ProDayText>
            </View>
            <ProDayText variant="caption" style={styles.formBand}>
              {FORM_BAND_LABELS[form.band]}
            </ProDayText>
            <JoueurXpBar label="Récupération" value={Math.round(health.recoveryScore)} color={PITCH} />
            <JoueurXpBar label="Charge" value={Math.round(health.trainingLoad)} color={LIGHT.muted} />
          </View>

          <View style={styles.panel}>
            <ProDayText variant="section" style={styles.boostTitle}>
              Passe IA + Coach terrain
            </ProDayText>
            <ProDayText variant="caption" style={styles.boostBody}>
              Routine complète entre séances IA, feedback humain et plan de montée.
            </ProDayText>
            <View style={styles.boostActions}>
              <PressableSpring
                onPress={openPass}
                scaleTo={0.98}
                haptic
                style={styles.primaryCta}
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
            accent={PITCH}
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

const TextStat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.textStat}>
    <ProDayText variant="caption" style={styles.textStatLabel}>
      {label}
    </ProDayText>
    <ProDayText variant="section" style={styles.textStatValue}>
      {value}
    </ProDayText>
  </View>
);

const styles = StyleSheet.create({
  stack: {
    gap: spacing.lg,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  header: {
    gap: 4,
    paddingTop: spacing.sm,
  },
  heroName: {
    color: LIGHT.ink,
    fontWeight: '700',
    fontSize: 26,
    letterSpacing: -0.4,
  },
  heroMeta: {
    color: LIGHT.muted,
    fontWeight: '500',
  },
  inlineStats: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.sm,
  },
  textStat: { gap: 2 },
  textStatLabel: { color: LIGHT.muted, fontSize: 11, fontWeight: '600' },
  textStatValue: { color: PITCH, fontWeight: '800', fontSize: 18 },
  futCardWrap: { alignItems: 'center', paddingVertical: spacing.xs },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actionBtn: {
    width: '47%',
    flexGrow: 1,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: LIGHT.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: LIGHT.border,
  },
  actionText: {
    color: LIGHT.ink,
    fontWeight: '600',
    fontSize: 12,
  },
  panel: {
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: LIGHT.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: LIGHT.border,
  },
  panelHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  panelKicker: {
    fontSize: 11,
    fontWeight: '600',
    color: LIGHT.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  formBand: { color: LIGHT.muted },
  formScore: { fontWeight: '800', fontSize: 28, letterSpacing: -0.5, color: PITCH },
  boostTitle: {
    color: LIGHT.ink,
    fontWeight: '700',
  },
  boostBody: {
    color: LIGHT.muted,
    lineHeight: 18,
  },
  boostActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  primaryCta: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: PITCH,
  },
  primaryCtaText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  secondaryCta: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: LIGHT.border,
    backgroundColor: LIGHT.bg,
  },
  secondaryCtaText: {
    color: LIGHT.ink,
    fontWeight: '700',
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingTop: spacing.xs,
  },
  footerLink: { paddingVertical: 6 },
  footerText: {
    color: LIGHT.muted,
    fontWeight: '600',
  },
});
