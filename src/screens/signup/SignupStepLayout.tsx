import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Icon } from '../../components/ui/Icon';
import { PressableSpring } from '../../components/motion';
import { ProDayText } from '../../components/ui/ProDayText';
import { useAuthLayout } from '../../components/auth/useAuthLayout';
import type { SignupPhase } from './signupFlowConfig';
import { AuthProgress } from '../../features/auth/experience';
import { useSignupFlowTheme } from './SignupFlowContext';

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
 * Layout inscription — même famille visuelle que login (noir, accent pôle, typo claire).
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
  const { colors } = useSignupFlowTheme();
  // Accent pôle — blanc joueur illisible en barre → or master
  const rawAccent = colors.accent || '#C5A059';
  const accent = rawAccent.toUpperCase() === '#FFFFFF' ? '#C5A059' : rawAccent;
  const scrollBottomPad = tabInset({ stickyFooter: Boolean(footer) });
  const footerBottomPad = tabInset();
  const styles = useMemo(() => createStyles(contentMaxWidth, accent), [contentMaxWidth, accent]);

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
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
              <Icon name={onBack ? 'arrow-back' : 'close'} size={18} color="#FFFFFF" />
            </PressableSpring>
          ) : (
            <View style={styles.headerSideSpacer} />
          )}
          <View style={styles.progressWrap}>
            <AuthProgress
              stepIndex={stepIndex}
              stepTotal={Math.min(stepTotal, 8)}
              accent={accent}
            />
          </View>
          <View style={styles.stepCountWrap}>
            <ProDayText variant="caption" style={styles.stepCount}>
              {stepIndex + 1}/{Math.min(stepTotal, 8)}
            </ProDayText>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: scrollBottomPad }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {stepName ? (
          <ProDayText variant="eyebrow" style={styles.stepKicker}>
            {stepName}
          </ProDayText>
        ) : null}
        <View style={[styles.titleAccent, { backgroundColor: accent }]} />
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

function createStyles(contentMaxWidth: number, accent: string) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: '#000000',
    },
    header: {
      paddingHorizontal: 16,
      paddingBottom: 4,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    headerSideSpacer: { width: 38 },
    progressWrap: {
      flex: 1,
      justifyContent: 'center',
    },
    stepCountWrap: {
      minWidth: 38,
      alignItems: 'flex-end',
    },
    stepCount: {
      color: 'rgba(255,255,255,0.4)',
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 0.3,
    },
    iconBtn: {
      width: 38,
      height: 38,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 19,
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
    scroll: {
      paddingHorizontal: 24,
      paddingTop: 12,
      maxWidth: contentMaxWidth + 40,
      width: '100%',
      alignSelf: 'center',
    },
    stepKicker: {
      color: accent,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1.3,
      textTransform: 'uppercase',
      marginBottom: 10,
    },
    titleAccent: {
      width: 28,
      height: 3,
      borderRadius: 2,
      marginBottom: 12,
    },
    title: {
      color: '#FFFFFF',
      fontSize: 28,
      fontWeight: '800',
      letterSpacing: -0.6,
      marginBottom: 8,
      lineHeight: 34,
    },
    subtitle: {
      color: 'rgba(255, 255, 255, 0.55)',
      fontSize: 15,
      lineHeight: 22,
      fontWeight: '400',
      marginBottom: 24,
    },
    body: {
      gap: 14,
    },
    footer: {
      paddingHorizontal: 24,
      paddingTop: 12,
      backgroundColor: '#000000',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: 'rgba(255,255,255,0.06)',
    },
  });
}
