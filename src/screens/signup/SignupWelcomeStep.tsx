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
import { getRolePreviewSteps, getRoleWelcomeCopy } from './signupRoleExperience';
import { getProWelcomeCopy, PRO_ROLE_PREVIEW } from './signupProConfig';
import { getProPlayerWelcomeCopy } from './signupProPlayerConfig';
import { getAmateurWelcomeCopy, AMATEUR_COACH_PREVIEW, AMATEUR_PLAYER_PREVIEW } from './signupAmateurConfig';
import { getSupporterWelcomeCopy, SUPPORTER_PREVIEW } from './signupSupporterConfig';
import { getSanteWelcomeCopy, SANTE_PHYSIO_PREVIEW } from './signupSanteConfig';
import { getSignupRoleGroups } from '../../content/poleExperience';
import { useProductLine } from '../../context/ProductLineContext';
import { useSignupFlowTheme } from './SignupFlowContext';
import { useTranslation } from '../../context/LocaleContext';
import { SignupSegmentTabs } from '../../components/signup/SignupSegmentTabs';
import { useAuthLayout } from '../../components/auth/useAuthLayout';
import { spacing, radius } from '../../theme/designTokens';
import {
  PRODAY_PRO_BRAND,
  PRODAY_PRO_PLAYER_BRAND,
  PRODAY_AMATEUR_BRAND,
  PRODAY_SUPPORTER_BRAND,
  PRODAY_SANTE_BRAND,
  PRODAY_SPONSOR_BRAND,
} from '../../models/ProductLine';
import { SHOWCASE_IMAGES } from '../../content/showcaseAssets';
import { SponsorLogo } from '../../components/SponsorLogo';
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
  eyebrow: string;
  accent: string;
  accentInverse: string;
  borderColor: string;
  surface: string;
  surfaceMuted: string;
  text: string;
  textMuted: string;
}> = ({ steps, eyebrow, accent, accentInverse, borderColor, surface, surfaceMuted, text, textMuted }) => (
  <View style={[styles.previewCard, { borderColor, backgroundColor: surface }]}>
    <Text style={[styles.previewEyebrow, { color: textMuted }]}>{eyebrow}</Text>
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

const ProRoleCard: React.FC<{
  role: UserRole;
  active: boolean;
  onSelect: () => void;
  accent: string;
  accentInverse: string;
  surface: string;
  surfaceMuted: string;
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
  surfaceMuted,
  border,
  text,
  textMuted,
  width,
}) => {
  const { t } = useTranslation();
  return (
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
        { backgroundColor: active ? 'rgba(255,255,255,0.14)' : surfaceMuted },
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
      {getRoleLabel(role, t)}
    </Text>
    <Text
      style={[
        styles.proRoleDesc,
        { color: active ? 'rgba(255,255,255,0.78)' : textMuted },
      ]}
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
};

const AmateurWelcomeBody: React.FC<{ form: SignupForm }> = ({ form }) => {
  const { width: screenWidth } = useWindowDimensions();
  const { compact, contentMaxWidth } = useAuthLayout();
  const { colors } = useSignupFlowTheme();
  const { t } = useTranslation();
  const roleGroups = useMemo(() => getSignupRoleGroups('amateur'), []);
  const [groupIndex, setGroupIndex] = useState(0);
  const activeGroup = roleGroups[groupIndex] ?? roleGroups[0];
  const rolesInGroup = activeGroup?.roles ?? [];
  const isPlayer = form.draftRole === 'player';
  const previewSteps = isPlayer ? AMATEUR_PLAYER_PREVIEW : AMATEUR_COACH_PREVIEW;

  const gridWidth = Math.min(screenWidth - spacing.lg * 2, contentMaxWidth);
  const cardGap = spacing.sm;
  const cardWidth = (gridWidth - cardGap) / 2;

  return (
    <>
      <ShowcaseImageBackground
        source={isPlayer ? SHOWCASE_IMAGES.playerProfile : SHOWCASE_IMAGES.coachFounder}
        variant="hero"
        style={styles.proHero}
        imageStyle={styles.proHeroImage}
      >
        <View style={[styles.proHeroOverlay, { backgroundColor: 'rgba(154, 52, 18, 0.62)' }]} />
        <View style={styles.proHeroBadge}>
          <Icon
            name={isPlayer ? 'football' : 'school'}
            size={15}
            color="#FFFFFF"
            variant="filled"
          />
          <Text style={styles.proHeroBadgeText}>{PRODAY_AMATEUR_BRAND.entryCta}</Text>
        </View>
        <Text style={styles.proHeroTitle}>
          {isPlayer
            ? t('signup.welcome.playerAmateur.title')
            : t('signup.welcome.coachAmateur.title')}
        </Text>
        <Text style={styles.proHeroSub}>
          {isPlayer
            ? t('signup.welcome.playerAmateur.subtitle')
            : t('signup.welcome.coachAmateur.subtitle')}
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
            const group = roleGroups.find((g) => g.id === id);
            if (group?.roles[0]) form.setDraftRole(group.roles[0]);
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
              surfaceMuted={colors.surfaceMuted}
              border={colors.border}
              text={colors.text}
              textMuted={colors.textMuted}
              width={cardWidth}
            />
          ))}
        </View>
      </View>

      <PreviewStepsCard
        eyebrow={t('signup.welcome.journey')}
        steps={previewSteps}
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

const SupporterWelcomeBody: React.FC<{ form: SignupForm }> = ({ form }) => {
  const { colors } = useSignupFlowTheme();
  const { t } = useTranslation();

  useEffect(() => {
    if (form.draftRole !== 'supporter') form.setDraftRole('supporter');
  }, [form]);

  return (
    <>
      <PlayerWelcomeHero
        source={SHOWCASE_IMAGES.friendlyMatch}
        overlayColor="rgba(91, 33, 182, 0.62)"
        badgeIcon="star-four-points"
        badgeText={PRODAY_SUPPORTER_BRAND.entryCta}
        title={getSupporterWelcomeCopy(t).title}
        subtitle={getSupporterWelcomeCopy(t).subtitle}
        accentInverse={colors.brandInverse}
      />
      <PreviewStepsCard
        eyebrow={t('signup.welcome.journey')}
        steps={SUPPORTER_PREVIEW}
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

const SanteWelcomeBody: React.FC<{ form: SignupForm }> = ({ form }) => {
  const { colors } = useSignupFlowTheme();
  const { t } = useTranslation();

  useEffect(() => {
    if (form.draftRole !== 'physio') form.setDraftRole('physio');
  }, [form]);

  return (
    <>
      <PlayerWelcomeHero
        source={SHOWCASE_IMAGES.coachFounder}
        overlayColor="rgba(15, 118, 110, 0.62)"
        badgeIcon="heart"
        badgeText={PRODAY_SANTE_BRAND.entryCta}
        title={t('signup.welcome.practitioner.title')}
        subtitle={t('signup.welcome.practitioner.subtitle')}
        accentInverse={colors.brandInverse}
      />
      <PreviewStepsCard
        eyebrow={t('signup.welcome.journey')}
        steps={SANTE_PHYSIO_PREVIEW}
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

const SponsorWelcomeBody: React.FC<{ form: SignupForm }> = ({ form }) => {
  const { colors } = useSignupFlowTheme();
  const previewSteps = getRolePreviewSteps('sponsor');

  useEffect(() => {
    if (form.draftRole !== 'sponsor') form.setDraftRole('sponsor');
  }, [form]);

  return (
    <>
      <View style={styles.sponsorLogoWrap}>
        <SponsorLogo width={168} background="dark" centered />
      </View>
      <PlayerWelcomeHero
        source={SHOWCASE_IMAGES.expSponsors}
        overlayColor="rgba(7, 6, 5, 0.72)"
        badgeIcon="star-four-points"
        badgeText={PRODAY_SPONSOR_BRAND.entryCta}
        title={PRODAY_SPONSOR_BRAND.tagline}
        subtitle={PRODAY_SPONSOR_BRAND.shortTagline}
        accentInverse={colors.brandInverse}
      />
      <PreviewStepsCard
        eyebrow="Parcours sponsor"
        steps={previewSteps}
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

const ProWelcomeBody: React.FC<{ form: SignupForm }> = ({ form }) => {
  const { width: screenWidth } = useWindowDimensions();
  const { compact, contentMaxWidth } = useAuthLayout();
  const { colors } = useSignupFlowTheme();
  const { productLine, proSignupPresetRole } = useProductLine();
  const { t } = useTranslation();
  const roleGroups = useMemo(
    () => getSignupRoleGroups(productLine === 'pro' ? 'pro_staff' : productLine, proSignupPresetRole),
    [productLine, proSignupPresetRole],
  );
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
          Coach, club, agent, recruteur, organisateur ou sponsor. Un parcours dédié.
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
              surfaceMuted={colors.surfaceMuted}
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
  const { t } = useTranslation();

  if (form.isSanteProduct) {
    const welcome = getSanteWelcomeCopy(t);
    return (
      <SignupStepLayout
        stepIndex={stepIndex}
        stepTotal={stepTotal}
        stepName={stepName ?? PRODAY_SANTE_BRAND.name}
        phases={phases}
        phaseIndex={phaseIndex}
        title={welcome.title}
        subtitle={welcome.subtitle}
        heroIcon="heart"
        onClose={onClose}
        footer={
          <SignupFooterButton
            label={t('signup.welcome.ctaSante')}
            onPress={form.confirmRoleAndContinue}
          />
        }
      >
        <SanteWelcomeBody form={form} />
      </SignupStepLayout>
    );
  }

  if (form.isSupporterProduct) {
    const welcome = getSupporterWelcomeCopy(t);
    return (
      <SignupStepLayout
        stepIndex={stepIndex}
        stepTotal={stepTotal}
        stepName={stepName ?? PRODAY_SUPPORTER_BRAND.name}
        phases={phases}
        phaseIndex={phaseIndex}
        title={welcome.title}
        subtitle={welcome.subtitle}
        heroIcon="star-four-points"
        onClose={onClose}
        footer={
          <SignupFooterButton
            label={t('signup.welcome.ctaSupporter')}
            onPress={form.confirmRoleAndContinue}
          />
        }
      >
        <SupporterWelcomeBody form={form} />
      </SignupStepLayout>
    );
  }

  if (form.isAmateurProduct) {
    const welcome = getAmateurWelcomeCopy(t);
    return (
      <SignupStepLayout
        stepIndex={stepIndex}
        stepTotal={stepTotal}
        stepName={stepName ?? PRODAY_AMATEUR_BRAND.name}
        phases={phases}
        phaseIndex={phaseIndex}
        title={welcome.title}
        subtitle={welcome.subtitle}
        heroIcon="school"
        onClose={onClose}
        footer={
          <SignupFooterButton
            label={t('signup.welcome.ctaAmateur')}
            onPress={form.confirmRoleAndContinue}
          />
        }
      >
        <AmateurWelcomeBody form={form} />
      </SignupStepLayout>
    );
  }

  if (form.isProPlayerSignup) {
    const welcome = getProPlayerWelcomeCopy(t);
    return (
      <SignupStepLayout
        stepIndex={stepIndex}
        stepTotal={stepTotal}
        stepName={stepName ?? PRODAY_PRO_PLAYER_BRAND.name}
        phases={phases}
        phaseIndex={phaseIndex}
        title={welcome.title}
        subtitle={welcome.subtitle}
        heroIcon="briefcase"
        onClose={onClose}
        footer={
          <SignupFooterButton
            label={t('signup.welcome.ctaProPlayer', { brand: PRODAY_PRO_PLAYER_BRAND.name })}
            onPress={form.confirmRoleAndContinue}
          />
        }
      >
        <AmateurWelcomeBody form={form} />
      </SignupStepLayout>
    );
  }

  if (form.isSponsorSignup) {
    const welcome = getRoleWelcomeCopy('sponsor', t);
    return (
      <SignupStepLayout
        stepIndex={stepIndex}
        stepTotal={stepTotal}
        stepName={stepName ?? PRODAY_SPONSOR_BRAND.name}
        phases={phases}
        phaseIndex={phaseIndex}
        title={welcome.title}
        subtitle={welcome.subtitle}
        heroIcon="star-four-points"
        onClose={onClose}
        footer={
          <SignupFooterButton
            label="Commencer l'inscription sponsor"
            onPress={form.confirmRoleAndContinue}
          />
        }
      >
        <SponsorWelcomeBody form={form} />
      </SignupStepLayout>
    );
  }

  if (form.isProProduct) {
    const welcome = getProWelcomeCopy(getRoleLabel(form.draftRole, t), t);
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
            label={t('signup.welcome.ctaPro')}
            onPress={form.confirmRoleAndContinue}
          />
        }
      >
        <ProWelcomeBody form={form} />
      </SignupStepLayout>
    );
  }

  const welcome = getAmateurWelcomeCopy(t);
  return (
    <SignupStepLayout
      stepIndex={stepIndex}
      stepTotal={stepTotal}
      stepName={stepName ?? PRODAY_AMATEUR_BRAND.name}
      phases={phases}
      phaseIndex={phaseIndex}
      title={welcome.title}
      subtitle={welcome.subtitle}
      heroIcon="school"
      onClose={onClose}
      footer={
        <SignupFooterButton
          label={t('signup.welcome.ctaAmateur')}
          onPress={form.confirmRoleAndContinue}
        />
      }
    >
      <AmateurWelcomeBody form={form} />
    </SignupStepLayout>
  );
};

const styles = StyleSheet.create({
  sponsorLogoWrap: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.xl,
    backgroundColor: 'rgba(7, 6, 5, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.28)',
  },
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
