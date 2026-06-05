import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  Pressable,
} from 'react-native';
import { ShowcaseImageBackground } from '../../components/ui/ShowcaseImageBackground';
import { Icon, type IconName } from '../../components/ui/Icon';
import { ROLE_OPTIONS } from '../../components/auth/AuthRolePicker';
import { SignupStepLayout } from './SignupStepLayout';
import { SignupFooterButton } from './SignupFooterButton';
import type { SignupForm } from './useSignupForm';
import { getRoleLabel } from './signupFlowConfig';
import { getWomanWelcomeCopy, WOMAN_PLAYER_PREVIEW_STEPS } from './signupWomanConfig';
import { getManWelcomeCopy, MAN_PLAYER_PREVIEW_STEPS } from './signupManConfig';
import { getProWelcomeCopy, PRO_ROLE_PREVIEW } from './signupProConfig';
import { getSignupRoleGroups } from '../../content/poleExperience';
import { useSignupFlowTheme } from './SignupFlowContext';
import { SignupSegmentTabs } from '../../components/signup/SignupSegmentTabs';
import { useAuthLayout } from '../../components/auth/useAuthLayout';
import { colors, spacing, radius } from '../../theme/designTokens';
import { PRODAY_WOMAN_BRAND, PRODAY_PRO_BRAND, PRODAY_HOMME_BRAND } from '../../models/ProductLine';
import { WOMAN_SHOWCASE_IMAGES } from '../../content/womanShowcaseAssets';
import { SHOWCASE_IMAGES } from '../../content/showcaseAssets';
import type { UserRole } from '../../models/User';

interface SignupWelcomeStepProps {
  form: SignupForm;
  stepIndex: number;
  stepTotal: number;
  stepName?: string;
  phases?: SignupForm['phases'];
  phaseIndex?: number;
  onClose: () => void;
}

const ROLE_META = Object.fromEntries(
  ROLE_OPTIONS.map((r) => [r.value, { icon: r.icon, description: r.description }])
) as Record<UserRole, { icon: IconName; description: string }>;

const PreviewStepsCard: React.FC<{
  steps: readonly string[];
  accent: string;
  accentInverse: string;
  borderColor: string;
  surface: string;
  surfaceMuted: string;
  text: string;
  textMuted: string;
}> = ({ steps, accent, accentInverse, borderColor, surface, surfaceMuted, text, textMuted }) => (
  <View style={[styles.previewCard, { borderColor, backgroundColor: surface }]}>
    <Text style={[styles.previewEyebrow, { color: textMuted }]}>Votre parcours</Text>
    <View style={styles.previewSteps}>
      {steps.map((s, i) => (
        <View
          key={s}
          style={[styles.previewStep, { borderColor, backgroundColor: surfaceMuted }]}
        >
          <Text
            style={[
              styles.previewStepNum,
              { backgroundColor: accent, color: accentInverse },
            ]}
          >
            {i + 1}
          </Text>
          <Text style={[styles.previewStepLabel, { color: text }]}>{s}</Text>
        </View>
      ))}
    </View>
  </View>
);

const PlayerWelcomeHero: React.FC<{
  source: number;
  overlayColor: string;
  badgeIcon: IconName;
  badgeText: string;
  title: string;
  subtitle: string;
  accentInverse: string;
}> = ({ source, overlayColor, badgeIcon, badgeText, title, subtitle, accentInverse }) => (
  <ShowcaseImageBackground
    source={source}
    variant="hero"
    style={styles.playerHero}
    imageStyle={styles.playerHeroImage}
  >
    <View style={[styles.playerHeroOverlay, { backgroundColor: overlayColor }]} />
    <View style={styles.playerBadge}>
      <Icon name={badgeIcon} size={16} color={accentInverse} variant="filled" />
      <Text style={[styles.playerBadgeText, { color: accentInverse }]}>{badgeText}</Text>
    </View>
    <Text style={styles.playerHeroTitle}>{title}</Text>
    <Text style={styles.playerHeroSub}>{subtitle}</Text>
  </ShowcaseImageBackground>
);

const WomanWelcomeBody: React.FC<{ form: SignupForm }> = ({ form }) => {
  const { colors } = useSignupFlowTheme();

  useEffect(() => {
    if (form.draftRole !== 'player') form.setDraftRole('player');
  }, [form]);

  return (
    <>
      <PlayerWelcomeHero
        source={WOMAN_SHOWCASE_IMAGES.discoverHero}
        overlayColor="rgba(131, 24, 67, 0.58)"
        badgeIcon="heart"
        badgeText={PRODAY_WOMAN_BRAND.entryCta}
        title="Profil joueuse"
        subtitle="Mercato filtré foot féminin, stats et visibilité auprès des clubs F."
        accentInverse={colors.brandInverse}
      />
      <PreviewStepsCard
        steps={WOMAN_PLAYER_PREVIEW_STEPS}
        accent={colors.accent}
        accentInverse={colors.brandInverse}
        borderColor={colors.border}
        surface={colors.surface}
        surfaceMuted={colors.surfaceMuted}
        text={colors.text}
        textMuted={colors.textMuted}
      />
    </>
  );
};

const ManWelcomeBody: React.FC<{ form: SignupForm }> = ({ form }) => {
  const { colors } = useSignupFlowTheme();

  useEffect(() => {
    if (form.draftRole !== 'player') form.setDraftRole('player');
  }, [form]);

  return (
    <>
      <PlayerWelcomeHero
        source={SHOWCASE_IMAGES.discoverHero}
        overlayColor="rgba(12, 12, 14, 0.62)"
        badgeIcon="football"
        badgeText={PRODAY_HOMME_BRAND.entryCta}
        title="Profil joueur"
        subtitle="CV en ligne, Mercato M, matchs et visibilité auprès des clubs."
        accentInverse={colors.brandInverse}
      />
      <PreviewStepsCard
        steps={MAN_PLAYER_PREVIEW_STEPS}
        accent={colors.ink}
        accentInverse={colors.brandInverse}
        borderColor={colors.border}
        surface={colors.surface}
        surfaceMuted={colors.surfaceMuted}
        text={colors.text}
        textMuted={colors.textMuted}
      />
    </>
  );
};

const ProRoleCard: React.FC<{
  role: UserRole;
  active: boolean;
  onSelect: () => void;
  accent: string;
  accentInverse: string;
  surface: string;
  border: string;
  text: string;
  textMuted: string;
  width: number;
}> = ({
  role,
  active,
  onSelect,
  accent,
  accentInverse,
  surface,
  border,
  text,
  textMuted,
  width,
}) => (
  <Pressable
    style={[
      styles.proRoleCard,
      { width, backgroundColor: surface, borderColor: border },
      active && { backgroundColor: accent, borderColor: accent },
    ]}
    onPress={onSelect}
  >
    <View
      style={[
        styles.proRoleIcon,
        { backgroundColor: active ? 'rgba(255,255,255,0.14)' : colors.surfaceMuted },
      ]}
    >
      <Icon
        name={ROLE_META[role].icon}
        size={22}
        color={active ? accentInverse : accent}
        variant={active ? 'filled' : 'outline'}
      />
    </View>
    <Text style={[styles.proRoleTitle, { color: active ? accentInverse : text }]}>
      {getRoleLabel(role)}
    </Text>
    <Text
      style={[styles.proRoleDesc, active && styles.proRoleDescActive]}
      numberOfLines={2}
    >
      {ROLE_META[role].description}
    </Text>
    {active ? (
      <View style={styles.proSelectedMark}>
        <Icon name="checkmark-circle" size={14} color={accentInverse} />
      </View>
    ) : null}
  </Pressable>
);

const ProWelcomeBody: React.FC<{ form: SignupForm }> = ({ form }) => {
  const { width: screenWidth } = useWindowDimensions();
  const { compact, contentMaxWidth } = useAuthLayout();
  const { colors } = useSignupFlowTheme();
  const roleGroups = useMemo(() => getSignupRoleGroups('pro'), []);
  const [groupIndex, setGroupIndex] = useState(0);
  const activeGroup = roleGroups[groupIndex] ?? roleGroups[0];
  const rolesInGroup = activeGroup?.roles ?? [];
  const previewSteps = PRO_ROLE_PREVIEW[form.draftRole] ?? ['Profil métier', 'Identité', 'Accès'];

  const gridWidth = Math.min(screenWidth - spacing.lg * 2, contentMaxWidth);
  const cardGap = spacing.sm;
  const cardWidth = (gridWidth - cardGap) / 2;

  return (
    <>
      <ShowcaseImageBackground
        source={SHOWCASE_IMAGES.coachFounder}
        variant="hero"
        style={styles.proHero}
        imageStyle={styles.proHeroImage}
      >
        <View style={styles.proHeroOverlay} />
        <View style={styles.proHeroBadge}>
          <Icon name="school" size={15} color="#FFFFFF" variant="filled" />
          <Text style={styles.proHeroBadgeText}>{PRODAY_PRO_BRAND.entryCta}</Text>
        </View>
        <Text style={styles.proHeroTitle}>Votre métier</Text>
        <Text style={styles.proHeroSub}>
          Coach, club, agent, pôle santé, organisateur ou partenaire — un parcours dédié.
        </Text>
      </ShowcaseImageBackground>

      <View style={styles.proPickerSection}>
        <SignupSegmentTabs
          tabs={roleGroups.map((g) => ({ id: g.id, label: g.label }))}
          active={activeGroup.id}
          compact={compact}
          onSelect={(id) => {
            const idx = roleGroups.findIndex((g) => g.id === id);
            if (idx >= 0) setGroupIndex(idx);
          }}
        />
        <Text style={[styles.proGroupHint, { color: colors.textSecondary }]}>
          {activeGroup.hint}
        </Text>

        <View style={[styles.proRoleGrid, { width: gridWidth, gap: cardGap }]}>
          {rolesInGroup.map((role) => (
            <ProRoleCard
              key={role}
              role={role}
              active={form.draftRole === role}
              onSelect={() => form.setDraftRole(role)}
              accent={colors.accent}
              accentInverse={colors.brandInverse}
              surface={colors.surface}
              border={colors.border}
              text={colors.text}
              textMuted={colors.textMuted}
              width={cardWidth}
            />
          ))}
        </View>
      </View>

      <View style={[styles.proPreviewCard, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <Text style={[styles.previewEyebrow, { color: colors.textMuted }]}>Parcours {getRoleLabel(form.draftRole)}</Text>
        <Text style={[styles.proPreviewDesc, { color: colors.textSecondary }]}>
          {ROLE_META[form.draftRole].description}
        </Text>
        <View style={styles.previewSteps}>
          {previewSteps.map((s, i) => (
            <View
              key={s}
              style={[
                styles.previewStep,
                { borderColor: colors.border, backgroundColor: colors.surfaceMuted },
              ]}
            >
              <Text
                style={[
                  styles.previewStepNum,
                  { backgroundColor: colors.accent, color: colors.brandInverse },
                ]}
              >
                {i + 1}
              </Text>
              <Text style={[styles.previewStepLabel, { color: colors.text }]}>{s}</Text>
            </View>
          ))}
        </View>
      </View>
    </>
  );
};

export const SignupWelcomeStep: React.FC<SignupWelcomeStepProps> = ({
  form,
  stepIndex,
  stepTotal,
  stepName,
  phases,
  phaseIndex,
  onClose,
}) => {
  if (form.isWomanProduct) {
    const welcome = getWomanWelcomeCopy();
    return (
      <SignupStepLayout
        stepIndex={stepIndex}
        stepTotal={stepTotal}
        stepName={stepName ?? PRODAY_WOMAN_BRAND.name}
        phases={phases}
        phaseIndex={phaseIndex}
        title={welcome.title}
        subtitle={welcome.subtitle}
        heroIcon="heart"
        onClose={onClose}
        footer={
          <SignupFooterButton
            label="Commencer mon inscription Woman"
            onPress={form.confirmRoleAndContinue}
          />
        }
      >
        <WomanWelcomeBody form={form} />
      </SignupStepLayout>
    );
  }

  if (form.isProProduct) {
    const welcome = getProWelcomeCopy(getRoleLabel(form.draftRole));
    return (
      <SignupStepLayout
        stepIndex={stepIndex}
        stepTotal={stepTotal}
        stepName={stepName ?? PRODAY_PRO_BRAND.name}
        phases={phases}
        phaseIndex={phaseIndex}
        title={welcome.title}
        subtitle={welcome.subtitle}
        heroIcon="school"
        onClose={onClose}
        footer={
          <SignupFooterButton
            label="Continuer sur Pro Day Pro"
            onPress={form.confirmRoleAndContinue}
          />
        }
      >
        <ProWelcomeBody form={form} />
      </SignupStepLayout>
    );
  }

  const welcome = getManWelcomeCopy();
  return (
    <SignupStepLayout
      stepIndex={stepIndex}
      stepTotal={stepTotal}
      stepName={stepName ?? PRODAY_HOMME_BRAND.name}
      phases={phases}
      phaseIndex={phaseIndex}
      title={welcome.title}
      subtitle={welcome.subtitle}
      heroIcon="football"
      onClose={onClose}
      footer={
        <SignupFooterButton
          label={`Commencer sur ${PRODAY_HOMME_BRAND.name}`}
          onPress={form.confirmRoleAndContinue}
        />
      }
    >
      <ManWelcomeBody form={form} />
    </SignupStepLayout>
  );
};

const styles = StyleSheet.create({
  playerHero: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    minHeight: 160,
    justifyContent: 'flex-end',
    width: '100%',
  },
  playerHeroImage: { borderRadius: radius.xl },
  playerHeroOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.xl,
  },
  playerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    marginBottom: spacing.md,
  },
  playerBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  playerHeroTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  playerHeroSub: {
    marginTop: spacing.sm,
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.92)',
    fontWeight: '600',
  },
  previewCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    alignItems: 'center',
  },
  previewEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  previewSteps: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  previewStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  previewStepNum: {
    width: 20,
    height: 20,
    borderRadius: 10,
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 20,
    overflow: 'hidden',
  },
  previewStepLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  proHero: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    minHeight: 148,
    justifyContent: 'flex-end',
    width: '100%',
  },
  proHeroImage: { borderRadius: radius.xl },
  proHeroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(30, 58, 138, 0.62)',
    borderRadius: radius.xl,
  },
  proHeroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    marginBottom: spacing.md,
  },
  proHeroBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  proHeroTitle: {
    fontSize: 21,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  proHeroSub: {
    marginTop: spacing.sm,
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  proPickerSection: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  proGroupHint: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 19,
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
  },
  proRoleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  proRoleCard: {
    borderRadius: radius.lg,
    borderWidth: 1.5,
    padding: spacing.md,
    minHeight: 118,
    position: 'relative',
  },
  proRoleIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  proRoleTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  proRoleDesc: {
    fontSize: 11,
    lineHeight: 15,
    color: colors.textSecondary,
    marginTop: 3,
  },
  proRoleDescActive: {
    color: 'rgba(255,255,255,0.78)',
  },
  proSelectedMark: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
  proPreviewCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    alignItems: 'center',
  },
  proPreviewDesc: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
});
