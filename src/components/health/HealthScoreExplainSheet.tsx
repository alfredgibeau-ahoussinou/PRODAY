import React, { useMemo, useEffect } from 'react';
import { View, Modal, ScrollView, StyleSheet, Pressable, Platform } from 'react-native';
import type { HealthEngineInput, HealthSnapshot } from '../../core/types/health';
import { explainHealthScores } from '../../features/v3/engines/healthExplain.engine';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius } from '../../theme/designTokens';

type HealthScoreExplainSheetProps = {
  visible: boolean;
  onClose: () => void;
  health: HealthSnapshot;
  input: HealthEngineInput;
};

export const HealthScoreExplainSheet: React.FC<HealthScoreExplainSheetProps> = ({
  visible,
  onClose,
  health,
  input,
}) => {
  const { colors } = useAppTheme();
  const explanation = useMemo(() => explainHealthScores(input, health), [input, health]);

  useEffect(() => {
    if (Platform.OS !== 'web' || !visible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, onClose]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <ProDayText variant="section" style={styles.headerTitle}>Pourquoi ce score ?</ProDayText>
            <Pressable
              onPress={onClose}
              style={styles.headerCloseBtn}
              accessibilityRole="button"
              accessibilityLabel="Fermer"
              hitSlop={8}
            >
              <Icon name="close" size={20} color={colors.text} />
            </Pressable>
          </View>
          <ProDayText variant="body" muted style={styles.summary}>
            {explanation.summary}
          </ProDayText>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            <ProDayText variant="eyebrow" accent style={styles.section}>
              Fatigue ({health.fatigueScore})
            </ProDayText>
            {explanation.fatigueFactors.length === 0 ? (
              <ProDayText variant="caption" muted>
                Peu de facteurs de charge détectés.
              </ProDayText>
            ) : (
              explanation.fatigueFactors.map((f) => (
                <FactorRow key={f.id} label={f.label} detail={f.detail} impact={f.impact} />
              ))
            )}

            <ProDayText variant="eyebrow" accent style={styles.section}>
              Récupération ({health.recoveryScore})
            </ProDayText>
            {explanation.recoveryFactors.map((f) => (
              <FactorRow key={f.id} label={f.label} detail={f.detail} impact={f.impact} />
            ))}
          </ScrollView>

          <Pressable style={[styles.closeBtn, { backgroundColor: colors.accentSoft }]} onPress={onClose}>
            <ProDayText variant="caption" accent style={styles.closeText}>
              Compris
            </ProDayText>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const FactorRow: React.FC<{
  label: string;
  detail: string;
  impact: 'positive' | 'negative' | 'neutral';
}> = ({ label, detail, impact }) => {
  const { colors } = useAppTheme();
  const icon =
    impact === 'positive' ? 'checkmark-circle' : impact === 'negative' ? 'alert-circle' : 'alert-circle';
  const color =
    impact === 'positive' ? colors.success : impact === 'negative' ? colors.warning : colors.textMuted;

  return (
    <View style={styles.factor}>
      <Icon name={icon} size={16} color={color} />
      <View style={styles.factorCopy}>
        <ProDayText variant="caption" style={styles.factorLabel}>
          {label}
        </ProDayText>
        <ProDayText variant="caption" muted>
          {detail}
        </ProDayText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '78%',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(128,128,128,0.35)',
    marginBottom: spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    flex: 1,
  },
  headerCloseBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summary: { lineHeight: 20 },
  scroll: { maxHeight: 360 },
  section: { marginTop: spacing.md, marginBottom: spacing.xs },
  factor: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  factorCopy: { flex: 1 },
  factorLabel: { fontWeight: '700' },
  closeBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    marginTop: spacing.sm,
  },
  closeText: { fontWeight: '800' },
});
