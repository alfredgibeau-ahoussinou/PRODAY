import React, { useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Icon, type IconName } from '../../components/ui/Icon';
import { SignupPhaseRail } from '../../components/signup/SignupPhaseRail';
import { SignupProgressRing } from '../../components/signup/SignupProgressRing';
import { SignupStepHero } from '../../components/signup/SignupStepHero';
import { useAuthStyles } from '../../components/auth/authStyles';
import { useAuthLayout } from '../../components/auth/useAuthLayout';
import type { SignupPhase } from './signupFlowConfig';
import { useSignupFlowTheme } from './SignupFlowContext';
import { brandForProductLine } from '../../models/ProductLine';
import { spacing, radius } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

interface SignupStepLayoutProps {
  stepIndex: number;
  stepTotal: number;
  stepName?: string;
  phases?: SignupPhase[];
  phaseIndex?: number;
  title: string;
  subtitle?: string;
  contentKey?: string;
  heroIcon?: IconName;
  onBack?: () => void;
  onClose?: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const ProgressSegment: React.FC<{
  done: boolean;
  active: boolean;
  accent: string;
  track: string;
}> = ({ done, active, accent, track }) => (
  <View
    style={[
      { flex: 1, height: active ? 3 : 2, borderRadius: radius.pill, backgroundColor: track },
      (active || done) && { backgroundColor: accent },
    ]}
  />
);

export const SignupStepLayout: React.FC<SignupStepLayoutProps> = ({
  stepIndex,
  stepTotal,
  stepName,
  phases,
  phaseIndex = 0,
  title,
  subtitle,
  heroIcon,
  onBack,
  onClose,
  children,
  footer,
}) => {
  const { compact, headerTopPad, contentMaxWidth, tabBarScrollInset: tabInset } =
    useAuthLayout();
  const scrollBottomPad = tabInset({ guestMode: true, stickyFooter: Boolean(footer) });
  const footerBottomPad = tabInset({ guestMode: true });
  const { productLine, colors } = useSignupFlowTheme();
  const authStyles = useAuthStyles();
  const brandName = brandForProductLine(productLine).name;
  const styles = useMemo(() => createStyles(colors, contentMaxWidth), [colors, contentMaxWidth]);

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: headerTopPad }]}>
        <View style={styles.headerRow}>
          {onBack ? (
            <Pressable onPress={onBack} style={authStyles.backBtn} hitSlop={8} accessibilityLabel="Retour">
              <Icon name="arrow-back" size={20} color={colors.ink} />
            </Pressable>
          ) : (
            <View style={styles.headerSideSpacer} />
          )}
          <View style={styles.headerCenter}>
            <Text style={styles.headerEyebrow}>
              {brandName}
            </Text>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {stepName ?? `Étape ${stepIndex + 1}`}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <SignupProgressRing stepIndex={stepIndex} stepTotal={stepTotal} accentColor={colors.accent} />
            {onClose ? (
              <Pressable onPress={onClose} style={authStyles.backBtn} hitSlop={8} accessibilityLabel="Fermer">
                <Icon name="close" size={20} color={colors.ink} />
              </Pressable>
            ) : (
              <View style={styles.headerSideSpacer} />
            )}
          </View>
        </View>
      </View>

      {phases && phases.length > 1 ? (
        <SignupPhaseRail phases={phases} phaseIndex={phaseIndex} compact={compact} accentColor={colors.accent} />
      ) : (
        <View style={styles.progressRow}>
          {Array.from({ length: stepTotal }).map((_, i) => (
            <ProgressSegment
              key={i}
              done={i < stepIndex}
              active={i === stepIndex}
              accent={colors.accent}
              track={colors.surfaceMuted}
            />
          ))}
        </View>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPad }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        <View style={styles.contentColumn}>
          <View style={styles.intro}>
            <View style={styles.titleRow}>
              {heroIcon ? (
                <SignupStepHero icon={heroIcon} accentColor={colors.accentSoft} iconColor={colors.accent} />
              ) : null}
              <View style={styles.titleBlock}>
                <Text style={[authStyles.title, compact && authStyles.titleCompact, { color: colors.text }]}>
                  {title}
                </Text>
                {subtitle ? (
                  <Text style={[authStyles.sub, styles.subtitle, { color: colors.textSecondary }]}>
                    {subtitle}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>

          <View style={styles.body}>{children}</View>
        </View>
      </ScrollView>

      {footer ? (
        <View style={[styles.footer, { paddingBottom: footerBottomPad }]}>
          <View style={styles.footerInner}>{footer}</View>
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
};

const createStyles = (colors: AppColors, contentMaxWidth: number) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      backgroundColor: colors.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
      zIndex: 2,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    headerSideSpacer: {
      width: 88,
      height: 40,
    },
    headerCenter: {
      flex: 1,
      alignItems: 'center',
      paddingHorizontal: spacing.xs,
    },
    headerEyebrow: {
      fontSize: 9,
      fontWeight: '700',
      letterSpacing: 2,
      textTransform: 'uppercase',
      color: colors.textMuted,
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    headerTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.text,
      marginTop: 2,
      textAlign: 'center',
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    progressRow: {
      flexDirection: 'row',
      gap: 4,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm + 2,
      backgroundColor: colors.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    scroll: { flex: 1 },
    scrollContent: {
      flexGrow: 1,
      alignItems: 'center',
      width: '100%',
    },
    contentColumn: {
      width: '100%',
      maxWidth: contentMaxWidth,
      alignSelf: 'center',
    },
    intro: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      alignItems: 'center',
      width: '100%',
    },
    titleRow: {
      flexDirection: 'column',
      alignItems: 'center',
      width: '100%',
    },
    titleBlock: {
      width: '100%',
      alignItems: 'center',
    },
    subtitle: {
      alignSelf: 'stretch',
      marginBottom: spacing.sm,
    },
    body: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      width: '100%',
      alignItems: 'stretch',
    },
    footer: {
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      backgroundColor: colors.surface,
    },
    footerInner: {
      width: '100%',
      maxWidth: contentMaxWidth,
    },
  });
