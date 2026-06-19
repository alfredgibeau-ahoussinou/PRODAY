import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import type { User } from '../../models/User';
import { getMercatoVisibilityChecklist } from '../../utils/mercatoVisibilityChecklist';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius } from '../../theme/designTokens';

interface MercatoVisibilityChecklistProps {
  profile: User;
}

export const MercatoVisibilityChecklist: React.FC<MercatoVisibilityChecklistProps> = ({
  profile,
}) => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const { steps, percent, isVisibleReady } = getMercatoVisibilityChecklist(profile);

  return (
    <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <ProDayText variant="section">Visible sur le Mercato</ProDayText>
          <ProDayText variant="caption" muted>
            {isVisibleReady
              ? 'Ton profil est prêt à être découvert'
              : '5 étapes pour maximiser ta visibilité'}
          </ProDayText>
        </View>
        <View style={[styles.ring, { borderColor: c.brand }]}>
          <ProDayText variant="caption" accent style={styles.pct}>
            {percent}%
          </ProDayText>
        </View>
      </View>

      {steps.map((step) => (
        <View key={step.id} style={styles.row}>
          <Icon
            name={step.done ? 'checkmark-circle' : 'alert-circle'}
            size={18}
            color={step.done ? c.brand : c.textMuted}
          />
          <View style={styles.rowCopy}>
            <ProDayText variant="body" style={{ fontWeight: '700' }}>
              {step.label}
            </ProDayText>
            {!step.done ? (
              <ProDayText variant="caption" muted>
                {step.hint}
              </ProDayText>
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
};

function createStyles(c: { border: string }) {
  return StyleSheet.create({
    card: {
      borderRadius: radius.lg,
      borderWidth: 1,
      padding: spacing.md,
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginBottom: spacing.xs,
    },
    headerCopy: { flex: 1, gap: 2 },
    ring: {
      width: 48,
      height: 48,
      borderRadius: 24,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pct: { fontWeight: '900', fontSize: 12 },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      paddingVertical: 4,
    },
    rowCopy: { flex: 1, gap: 1 },
  });
}
