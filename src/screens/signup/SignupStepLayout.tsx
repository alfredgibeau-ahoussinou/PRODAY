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
import { AuthProgress, AUTH_XP } from '../../features/auth/experience';

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
 * Layout inscription — DA Experience luxueuse (fond vert nuit, barres or segmentées, typographie haute définition).
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
  const scrollBottomPad = tabInset({ stickyFooter: Boolean(footer) });
  const footerBottomPad = tabInset();
  const styles = useMemo(() => createStyles(contentMaxWidth), [contentMaxWidth]);

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Background subtil */}
      <LinearGradient
        colors={['rgba(245, 208, 74, 0.04)', '#07100C', '#050807']}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.header, { paddingTop: headerTopPad }]}>
        <View style={styles.headerRow}>
          {onBack || onClose ? (
            <PressableSpring
              onPress={onBack ?? onClose}
              style={styles.iconBtn}
              hitSlop={12}
              scaleTo={0.94}
              haptic
              accessibilityRole="button"
              accessibilityLabel={onBack ? 'Retour' : 'Fermer'}
            >
              <Icon name={onBack ? 'arrow-back' : 'close'} size={18} color={AUTH_XP.white} />
            </PressableSpring>
          ) : (
            <View style={styles.headerSideSpacer} />
          )}
          <View style={styles.progressWrap}>
            <AuthProgress stepIndex={stepIndex} stepTotal={Math.min(stepTotal, 8)} />
          </View>
          <View style={styles.headerSideSpacer} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: scrollBottomPad }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {stepName ? (
          <View style={styles.stepKickerWrap}>
            <ProDayText variant="eyebrow" style={styles.stepKicker}>
              ÉTAPE {stepIndex + 1} · {stepName.toUpperCase()}
            </ProDayText>
          </View>
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

function createStyles(contentMaxWidth: number) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: AUTH_XP.black,
    },
    header: {
      paddingHorizontal: 16,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerSideSpacer: { width: 42 },
    progressWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconBtn: {
      width: 42,
      height: 42,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.15)',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    scroll: {
      paddingHorizontal: 20,
      paddingTop: 24,
      maxWidth: contentMaxWidth + 40,
      width: '100%',
      alignSelf: 'center',
    },
    stepKickerWrap: {
      marginBottom: 6,
    },
    stepKicker: {
      color: '#F5D04A',
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.5,
    },
    title: {
      color: '#FFFFFF',
      fontSize: 28,
      fontWeight: '900',
      letterSpacing: -0.5,
      marginBottom: 8,
    },
    subtitle: {
      color: 'rgba(255, 255, 255, 0.65)',
      fontSize: 15,
      lineHeight: 22,
      fontWeight: '500',
      marginBottom: 24,
    },
    body: {
      gap: 14,
    },
    footer: {
      paddingHorizontal: 20,
      paddingTop: 14,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255, 255, 255, 0.08)',
      backgroundColor: '#07100C',
    },
  });
}
