import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Pressable,
} from 'react-native';
import { ShowcaseImageBackground } from '../../components/ui/ShowcaseImageBackground';
import { Icon, type IconName } from '../../components/ui/Icon';
import { ROLE_OPTIONS } from '../../components/auth/AuthRolePicker';
import { SignupStepLayout } from './SignupStepLayout';
import { SignupFooterButton } from './SignupFooterButton';
import type { SignupForm } from './useSignupForm';
import { ROLE_GROUPS, getRoleLabel, getWelcomeCopy } from './signupFlowConfig';
import { getRolePreviewSteps } from './signupRoleExperience';
import { getWomanWelcomeCopy, WOMAN_PLAYER_PREVIEW_STEPS } from './signupWomanConfig';
import { useSignupFlowTheme } from './SignupFlowContext';
import { SignupSegmentTabs } from '../../components/signup/SignupSegmentTabs';
import { useAuthLayout } from '../../components/auth/useAuthLayout';
import { signupTheme } from './signupTheme';
import { colors, spacing, radius } from '../../theme/designTokens';
import { PRODAY_WOMAN_BRAND } from '../../models/ProductLine';
import { WOMAN_SHOWCASE_IMAGES } from '../../content/womanShowcaseAssets';
import type { UserRole } from '../../models/User';

const CARD_WIDTH_RATIO = 0.78;
const CARD_WIDTH_MAX = 300;
const CARD_GAP = spacing.md;

const CarouselDots: React.FC<{ count: number; activeIndex: number; accent: string }> = ({
  count,
  activeIndex,
  accent,
}) => (
  <View style={styles.dotsRow}>
    {Array.from({ length: count }).map((_, i) => (
      <View key={i} style={[styles.dot, i === activeIndex && { width: 20, backgroundColor: accent }]} />
    ))}
  </View>
);

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

const RoleCarouselCard: React.FC<{
  role: UserRole;
  active: boolean;
  onSelect: () => void;
  accentInk: string;
  accentInverse: string;
  cardWidth: number;
}> = ({ role, active, onSelect, accentInk, accentInverse, cardWidth }) => (
  <Pressable
    style={[
      styles.carouselCard,
      { width: cardWidth },
      active && { backgroundColor: accentInk, borderColor: accentInk },
    ]}
    onPress={onSelect}
  >
    <View style={[styles.roleIconWrap, active && { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
      <Icon name={ROLE_META[role].icon} size={26} color={active ? accentInverse : colors.ink} />
    </View>
    <Text style={[styles.roleCardTitle, active && { color: accentInverse }]}>
      {getRoleLabel(role)}
    </Text>
    <Text style={[styles.roleCardDesc, active && { color: 'rgba(255,255,255,0.75)' }]}>
      {ROLE_META[role].description}
    </Text>
    {active ? (
      <View style={[styles.selectedBadge, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
        <Icon name="checkmark-circle" size={14} color={accentInverse} />
        <Text style={[styles.selectedBadgeText, { color: accentInverse }]}>Choisi</Text>
      </View>
    ) : null}
  </Pressable>
);

const WomanWelcomeBody: React.FC<{ form: SignupForm; onContinue: () => void }> = ({
  form,
  onContinue,
}) => {
  const { colors } = useSignupFlowTheme();

  useEffect(() => {
    if (form.draftRole !== 'player') form.setDraftRole('player');
  }, [form]);

  return (
    <>
      <ShowcaseImageBackground
        source={WOMAN_SHOWCASE_IMAGES.discoverHero}
        variant="hero"
        style={styles.womanHero}
        imageStyle={styles.womanHeroImage}
      >
        <View style={styles.womanHeroOverlay} />
        <View style={styles.womanBadge}>
          <Icon name="heart" size={16} color={colors.brandInverse} variant="filled" />
          <Text style={styles.womanBadgeText}>{PRODAY_WOMAN_BRAND.entryCta}</Text>
        </View>
        <Text style={styles.womanHeroTitle}>Profil joueuse</Text>
        <Text style={styles.womanHeroSub}>
          Mercato filtré foot féminin, stats et visibilité auprès des clubs F.
        </Text>
      </ShowcaseImageBackground>

      <View style={[styles.previewCard, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <Text style={[styles.previewEyebrow, { color: colors.textMuted }]}>Votre parcours</Text>
        <View style={styles.previewSteps}>
          {WOMAN_PLAYER_PREVIEW_STEPS.map((s, i) => (
            <View
              key={s}
              style={[styles.previewStep, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}
            >
              <Text style={[styles.previewStepNum, { backgroundColor: colors.accent, color: colors.brandInverse }]}>
                {i + 1}
              </Text>
              <Text style={[styles.previewStepLabel, { color: colors.text }]}>{s}</Text>
            </View>
          ))}
        </View>
      </View>

      <SignupFooterButton label="Commencer mon inscription Woman" onPress={onContinue} />
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
  const { width: screenWidth } = useWindowDimensions();
  const { compact } = useAuthLayout();
  const { colors: themeColors, isWomanSignup } = useSignupFlowTheme();
  const cardWidth = Math.min(screenWidth * CARD_WIDTH_RATIO, CARD_WIDTH_MAX);
  const snap = cardWidth + CARD_GAP;
  const carouselSidePad = Math.max(0, (screenWidth - cardWidth) / 2 - spacing.lg);
  const welcome = form.isWomanProduct ? getWomanWelcomeCopy() : getWelcomeCopy(form.draftRole);

  if (form.isWomanProduct) {
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
      >
        <WomanWelcomeBody form={form} onContinue={form.confirmRoleAndContinue} />
      </SignupStepLayout>
    );
  }

  const roleGroups = ROLE_GROUPS;
  const [groupIndex, setGroupIndex] = useState(0);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const activeGroup = roleGroups[groupIndex] ?? roleGroups[0];
  const rolesInGroup = useMemo(() => activeGroup.roles, [activeGroup]);

  const onCarouselScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      const idx = Math.round(x / snap);
      if (idx !== carouselIndex && idx >= 0 && idx < rolesInGroup.length) {
        setCarouselIndex(idx);
      }
    },
    [carouselIndex, rolesInGroup.length, snap]
  );

  useEffect(() => {
    setCarouselIndex(0);
  }, [groupIndex]);

  const previewSteps = getRolePreviewSteps(form.draftRole);

  const accentInk = themeColors.ink;

  return (
    <SignupStepLayout
      stepIndex={stepIndex}
      stepTotal={stepTotal}
      stepName={stepName}
      phases={phases}
      phaseIndex={phaseIndex}
      title={welcome.title}
      subtitle="Sélectionnez votre profil. Le parcours s’adapte automatiquement."
      heroIcon="star-four-points"
      onClose={onClose}
      footer={
        <SignupFooterButton label="Continuer avec ce profil" onPress={form.confirmRoleAndContinue} />
      }
    >
      <View style={styles.roleSection}>
        <SignupSegmentTabs
          tabs={roleGroups.map((g) => ({ id: g.id, label: g.label }))}
          active={activeGroup.id}
          compact={compact}
          onSelect={(id) => {
            const idx = roleGroups.findIndex((g) => g.id === id);
            if (idx >= 0) setGroupIndex(idx);
          }}
        />

        <Text style={styles.groupHint}>{activeGroup.hint}</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={snap}
          onScroll={onCarouselScroll}
          scrollEventThrottle={16}
          contentContainerStyle={[
            styles.carouselContent,
            { paddingLeft: carouselSidePad, paddingRight: carouselSidePad },
          ]}
        >
          {rolesInGroup.map((role) => (
            <RoleCarouselCard
              key={role}
              role={role}
              active={form.draftRole === role}
              accentInk={accentInk}
              accentInverse={themeColors.brandInverse}
              cardWidth={cardWidth}
              onSelect={() => form.setDraftRole(role)}
            />
          ))}
        </ScrollView>
        {rolesInGroup.length > 1 ? (
          <CarouselDots count={rolesInGroup.length} activeIndex={carouselIndex} accent={accentInk} />
        ) : null}
      </View>

      <View style={styles.previewCardClassic}>
        <Text style={styles.previewEyebrowClassic}>Votre parcours</Text>
        <Text style={styles.previewTitleClassic}>{getRoleLabel(form.draftRole)}</Text>
        <Text style={styles.previewDescClassic}>{ROLE_META[form.draftRole].description}</Text>
        <View style={styles.previewStepsClassic}>
          {previewSteps.map((s, i) => (
            <View key={s} style={styles.previewStepClassic}>
              <Text style={styles.previewStepNumClassic}>{i + 1}</Text>
              <Text style={styles.previewStepLabelClassic}>{s}</Text>
            </View>
          ))}
        </View>
      </View>
    </SignupStepLayout>
  );
};

const styles = StyleSheet.create({
  roleSection: {
    width: '100%',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  groupHint: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
    lineHeight: 19,
    textAlign: 'center',
    paddingHorizontal: spacing.xs,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  carouselContent: {
    gap: CARD_GAP,
    alignItems: 'stretch',
  },
  carouselCard: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    minHeight: 188,
  },
  roleIconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  roleCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  roleCardDesc: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    flex: 1,
  },
  selectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.md,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  selectedBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  womanHero: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    minHeight: 168,
    justifyContent: 'flex-end',
    width: '100%',
    alignSelf: 'center',
  },
  womanHeroImage: { borderRadius: radius.xl },
  womanHeroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(131, 24, 67, 0.55)',
    borderRadius: radius.xl,
  },
  womanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    marginBottom: spacing.md,
  },
  womanBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  womanHeroTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  womanHeroSub: {
    marginTop: spacing.sm,
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  previewCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.lg,
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
  previewCardClassic: {
    ...signupTheme.card,
    marginTop: spacing.lg,
    marginBottom: 0,
    alignItems: 'center',
  },
  previewEyebrowClassic: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  previewTitleClassic: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.xs,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  previewDescClassic: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 19,
    textAlign: 'center',
  },
  previewStepsClassic: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
    justifyContent: 'center',
  },
  previewStepClassic: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewStepNumClassic: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.ink,
    color: colors.brandInverse,
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 20,
    overflow: 'hidden',
  },
  previewStepLabelClassic: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
});
