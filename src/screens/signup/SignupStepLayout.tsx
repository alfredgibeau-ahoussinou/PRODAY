import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from '../../components/ui/Icon';
import { PressableSpring } from '../../components/motion';
import { ProDayText } from '../../components/ui/ProDayText';
import { useAuthLayout } from '../../components/auth/useAuthLayout';
import type { SignupPhase } from './signupFlowConfig';
import { useSignupFlowTheme } from './SignupFlowContext';
import type { SignupVisualChrome } from './signupVisualSystem';

interface SignupStepLayoutProps {
  stepIndex: number;
  stepTotal: number;
  stepName?: string;
  phases?: SignupPhase[];
  phaseIndex?: number;
  title: string;
  subtitle?: string;
  contentKey?: string;
  heroIcon?: string;
  /** Étape précédente, ou fermer si étape 1. */
  onBack?: () => void;
  /** Toujours disponible — quitte l’inscription (gate). */
  onClose?: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/**
 * Chrome inscription — direction shells ProDay :
 * wash plein, header back + barre + close, typo éditoriale, zero clutter.
 */
export const SignupStepLayout: React.FC<SignupStepLayoutProps> = ({
  stepIndex,
  stepTotal,
  stepName,
  title,
  subtitle,
  onBack,
  onClose,
  children,
  footer,
}) => {
  const { headerTopPad, contentMaxWidth, tabBarScrollInset: tabInset } = useAuthLayout();
  const { visual } = useSignupFlowTheme();
  const total = Math.max(1, Math.min(stepTotal, 8));
  const active = Math.min(Math.max(stepIndex, 0), total - 1);
  const progress = (active + 1) / total;
  const canNavigateBack = Boolean(onBack);
  const canClose = Boolean(onClose);
  const scrollBottomPad = tabInset({ stickyFooter: Boolean(footer) });
  const footerBottomPad = tabInset();
  const styles = useMemo(() => createStyles(contentMaxWidth, visual), [contentMaxWidth, visual]);

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient
        colors={[visual.washTop, visual.washMid, visual.bg]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View style={[styles.header, { paddingTop: headerTopPad }]}>
        <View style={styles.headerRow}>
          {canNavigateBack ? (
            <PressableSpring
              onPress={onBack}
              style={styles.iconBtn}
              hitSlop={16}
              scaleTo={0.92}
              haptic
              accessibilityRole="button"
              accessibilityLabel="Retour"
              testID="signup-back"
            >
              <Icon name="arrow-back" size={20} color={visual.text} />
            </PressableSpring>
          ) : (
            <View style={styles.iconSpacer} />
          )}

          <View style={styles.progressWrap}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.round(progress * 100)}%`,
                    backgroundColor: visual.accent,
                  },
                ]}
              />
            </View>
            <ProDayText variant="caption" style={styles.stepCount}>
              {active + 1} / {total}
            </ProDayText>
          </View>

          {canClose ? (
            <PressableSpring
              onPress={onClose}
              style={styles.iconBtn}
              hitSlop={16}
              scaleTo={0.92}
              haptic
              accessibilityRole="button"
              accessibilityLabel="Fermer l’inscription"
              testID="signup-close"
            >
              <Icon name="close" size={20} color={visual.text} />
            </PressableSpring>
          ) : (
            <View style={styles.iconSpacer} />
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: scrollBottomPad }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ProDayText variant="eyebrow" style={[styles.poleKicker, { color: visual.focus }]}>
          {visual.poleLabel}
          {stepName ? `  ·  ${stepName}` : ''}
        </ProDayText>

        <ProDayText variant="title" style={styles.title}>
          {title}
        </ProDayText>
        {subtitle ? (
          <ProDayText variant="body" style={styles.subtitle}>
            {subtitle}
          </ProDayText>
        ) : null}

        <View style={[styles.panel, { borderColor: visual.border, backgroundColor: visual.elevated }]}>
          <View style={[styles.panelRail, { backgroundColor: visual.accent }]} />
          <View style={styles.panelBody}>{children}</View>
        </View>
      </ScrollView>

      {footer ? (
        <View style={[styles.footer, { paddingBottom: footerBottomPad, borderTopColor: visual.border }]}>
          {footer}
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
};

function createStyles(contentMaxWidth: number, v: SignupVisualChrome) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: v.bg,
    },
    header: {
      paddingHorizontal: 16,
      paddingBottom: 8,
      zIndex: 2,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    iconBtn: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 14,
      backgroundColor: 'rgba(255,255,255,0.06)',
      borderWidth: 1,
      borderColor: v.border,
    },
    iconSpacer: { width: 44, height: 44 },
    progressWrap: {
      flex: 1,
      gap: 6,
      justifyContent: 'center',
    },
    progressTrack: {
      height: 4,
      borderRadius: 2,
      backgroundColor: 'rgba(255,255,255,0.12)',
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 2,
    },
    stepCount: {
      color: v.textFaint,
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 0.4,
      textAlign: 'center',
    },
    scroll: {
      paddingHorizontal: 20,
      paddingTop: 18,
      maxWidth: contentMaxWidth + 36,
      width: '100%',
      alignSelf: 'center',
    },
    poleKicker: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1.8,
      textTransform: 'uppercase',
      marginBottom: 12,
    },
    title: {
      color: v.text,
      fontSize: 32,
      fontWeight: '800',
      letterSpacing: -0.8,
      marginBottom: 10,
      lineHeight: 38,
    },
    subtitle: {
      color: v.textMuted,
      fontSize: 15,
      lineHeight: 22,
      fontWeight: '400',
      marginBottom: 20,
    },
    panel: {
      borderRadius: 18,
      borderWidth: 1,
      overflow: 'hidden',
      flexDirection: 'row',
      minHeight: 120,
    },
    panelRail: {
      width: 3,
    },
    panelBody: {
      flex: 1,
      padding: 18,
      gap: 14,
    },
    footer: {
      paddingHorizontal: 20,
      paddingTop: 14,
      backgroundColor: 'rgba(0,0,0,0.72)',
      borderTopWidth: StyleSheet.hairlineWidth,
      zIndex: 2,
    },
  });
}
