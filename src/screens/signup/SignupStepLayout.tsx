import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../../components/ui/Icon';
import { TAB_BAR_CONTENT_INSET } from '../../components/navigation/BottomTabBar';
import type { SignupPhase } from './signupFlowConfig';
import { colors, spacing, radius } from '../../theme/designTokens';

interface SignupStepLayoutProps {
  stepIndex: number;
  stepTotal: number;
  stepName?: string;
  phases?: SignupPhase[];
  phaseIndex?: number;
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onClose?: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const SignupStepLayout: React.FC<SignupStepLayoutProps> = ({
  stepIndex,
  stepTotal,
  stepName,
  phases,
  phaseIndex = 0,
  title,
  subtitle,
  onBack,
  onClose,
  children,
  footer,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.iconBtn} hitSlop={12}>
            <Icon name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconBtn} />
        )}
        <View style={styles.topCenter}>
          <Text style={styles.stepLabel} numberOfLines={1}>
            Inscription
            {stepName ? ` · ${stepName}` : ''}
          </Text>
          {phases && phases.length > 1 ? (
            <Text style={styles.stepCount}>{stepName ?? `Étape ${stepIndex + 1}`}</Text>
          ) : (
            <Text style={styles.stepCount}>
              Étape {stepIndex + 1} sur {stepTotal}
            </Text>
          )}
        </View>
        {onClose ? (
          <TouchableOpacity onPress={onClose} style={styles.iconBtn} hitSlop={12}>
            <Icon name="close" size={22} color={colors.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconBtn} />
        )}
      </View>

      {phases && phases.length > 1 ? (
        <View style={styles.phaseRow}>
          {phases.map((phase, i) => {
            const done = i < phaseIndex;
            const active = i === phaseIndex;
            return (
              <View key={phase.id} style={styles.phaseItem}>
                <View
                  style={[
                    styles.phaseDot,
                    done && styles.phaseDotDone,
                    active && styles.phaseDotActive,
                  ]}
                >
                  {done ? (
                    <Icon name="checkmark-circle" size={12} color={colors.brandInverse} />
                  ) : (
                    <Text style={[styles.phaseNum, active && styles.phaseNumActive]}>
                      {i + 1}
                    </Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.phaseLabel,
                    active && styles.phaseLabelActive,
                    done && styles.phaseLabelDone,
                  ]}
                  numberOfLines={1}
                >
                  {phase.label}
                </Text>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={styles.progressRow}>
          {Array.from({ length: stepTotal }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.progressSeg,
                i <= stepIndex && styles.progressSegActive,
                i < stepIndex && styles.progressSegDone,
              ]}
            />
          ))}
        </View>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        {children}
      </ScrollView>

      {footer ? (
        <View
          style={[
            styles.footer,
            { paddingBottom: Math.max(insets.bottom, spacing.md) + TAB_BAR_CONTENT_INSET * 0.25 },
          ]}
        >
          {footer}
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  topCenter: { flex: 1, alignItems: 'center' },
  stepLabel: { fontSize: 13, fontWeight: '900', color: colors.text },
  stepCount: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  phaseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  phaseItem: { flex: 1, alignItems: 'center', gap: 4 },
  phaseDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  phaseDotActive: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  phaseDotDone: { borderColor: colors.accent, backgroundColor: colors.accent },
  phaseNum: { fontSize: 10, fontWeight: '900', color: colors.textMuted },
  phaseNumActive: { color: colors.accent },
  phaseLabel: { fontSize: 9, fontWeight: '700', color: colors.textMuted, textAlign: 'center' },
  phaseLabelActive: { color: colors.text, fontWeight: '900' },
  phaseLabelDone: { color: colors.accent },
  progressRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  progressSeg: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surfaceMuted,
  },
  progressSegActive: { backgroundColor: colors.accentSoft },
  progressSegDone: { backgroundColor: colors.accent },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 2,
    borderTopColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
});
