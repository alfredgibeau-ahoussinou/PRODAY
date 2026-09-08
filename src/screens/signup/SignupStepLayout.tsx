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
  onBack?: () => void;
  onClose?: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/**
 * Layout inscription — look shell authentifié :
 * wash pôle, badge pôle, progress fine, typo Inter, surfaces charcoal.
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
  const scrollBottomPad = tabInset({ stickyFooter: Boolean(footer) });
  const footerBottomPad = tabInset();
  const styles = useMemo(() => createStyles(contentMaxWidth, visual), [contentMaxWidth, visual]);

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient
        colors={[visual.washTop, visual.washMid, visual.washTransparent]}
        locations={[0, 0.35, 1]}
        style={styles.wash}
        pointerEvents="none"
      />

      <View style={[styles.header, { paddingTop: headerTopPad }]}>
        <View style={styles.headerRow}>
          {onBack || onClose ? (
            <PressableSpring
              onPress={onBack ?? onClose}
              style={styles.iconBtn}
              hitSlop={14}
              scaleTo={0.92}
              haptic
              accessibilityRole="button"
              accessibilityLabel={onBack ? 'Retour' : 'Fermer'}
            >
              <Icon name={onBack ? 'arrow-back' : 'close'} size={18} color={visual.text} />
            </PressableSpring>
          ) : (
            <View style={styles.headerSideSpacer} />
          )}

          <View style={[styles.poleBadge, { borderColor: visual.accentSoft }]}>
            <View style={[styles.poleDot, { backgroundColor: visual.accent }]} />
            <ProDayText variant="caption" style={[styles.poleLabel, { color: visual.focus }]}>
              {visual.poleLabel}
            </ProDayText>
          </View>

          <ProDayText variant="caption" style={styles.stepCount}>
            {active + 1}/{total}
          </ProDayText>
        </View>

        <View
          style={styles.progressTrack}
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: total, now: active + 1 }}
        >
          {Array.from({ length: total }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.progressSeg,
                {
                  backgroundColor:
                    i < active
                      ? visual.accentSoft
                      : i === active
                        ? visual.accent
                        : 'rgba(255,255,255,0.12)',
                },
              ]}
            />
          ))}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: scrollBottomPad }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {stepName ? (
          <ProDayText variant="eyebrow" style={[styles.stepKicker, { color: visual.focus }]}>
            {stepName}
          </ProDayText>
        ) : null}
        <ProDayText variant="title" style={styles.title}>
          {title}
        </ProDayText>
        {subtitle ? (
          <ProDayText variant="body" style={styles.subtitle}>
            {subtitle}
          </ProDayText>
        ) : null}
        <View style={styles.body}>{children}</View>
      </ScrollView>

      {footer ? (
        <View style={[styles.footer, { paddingBottom: footerBottomPad }]}>{footer}</View>
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
    wash: {
      ...StyleSheet.absoluteFillObject,
      height: 280,
    },
    header: {
      paddingHorizontal: 18,
      paddingBottom: 10,
      zIndex: 2,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 14,
    },
    headerSideSpacer: { width: 40 },
    iconBtn: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      backgroundColor: v.elevated,
      borderWidth: 1,
      borderColor: v.border,
    },
    poleBadge: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      alignSelf: 'center',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 12,
      backgroundColor: v.surface,
      borderWidth: 1,
    },
    poleDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    poleLabel: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1.6,
    },
    stepCount: {
      minWidth: 40,
      textAlign: 'right',
      color: v.textFaint,
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 0.3,
    },
    progressTrack: {
      flexDirection: 'row',
      gap: 5,
    },
    progressSeg: {
      flex: 1,
      height: 3,
      borderRadius: 2,
    },
    scroll: {
      paddingHorizontal: 22,
      paddingTop: 8,
      maxWidth: contentMaxWidth + 40,
      width: '100%',
      alignSelf: 'center',
      zIndex: 1,
    },
    stepKicker: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1.4,
      textTransform: 'uppercase',
      marginBottom: 10,
    },
    title: {
      color: v.text,
      fontSize: 30,
      fontWeight: '800',
      letterSpacing: -0.7,
      marginBottom: 8,
      lineHeight: 36,
    },
    subtitle: {
      color: v.textMuted,
      fontSize: 15,
      lineHeight: 22,
      fontWeight: '400',
      marginBottom: 22,
    },
    body: {
      gap: 14,
    },
    footer: {
      paddingHorizontal: 22,
      paddingTop: 12,
      backgroundColor: v.bg,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: v.border,
      zIndex: 2,
    },
  });
}
